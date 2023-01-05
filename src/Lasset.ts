import { HashMap } from './HashMap.js'
import { HashSet } from './HashSet.js'

import hashObject from 'object-hash'

export type Address = { type: string } & Record<string, any>
export type Loader = (address: Address) => Promise<any>
export type Builder = (address: Address, load: Loader) => Promise<any>

class AddressSet extends HashSet<Address> {
  constructor() {
    super(hashObject)
  }
}
class AddressMap<V = any> extends HashMap<Address, V> {
  constructor() {
    super(hashObject)
  }
}

interface CacheValue {
  value: Promise<any>
  address: Address
  deps: AddressSet
  expires?: number
}

export interface Logger {
  debug(message: string, ...args: any[]): void
}

export type LassetOptions = Partial<{
  logger: Logger
}>

const silentLogger = {
  debug() {}
}
export class Lasset {
  private _factories: Map<string, Builder>
  private _cache: AddressMap<CacheValue>
  private _logger: Logger

  constructor(
    factories: Record<string, Builder> = {},
    options: LassetOptions = {}
  ) {
    this._factories = new Map(Object.entries(factories))
    this._factories.set('touch', async () => true)
    this._cache = new AddressMap()
    this._logger = options.logger ?? silentLogger
  }

  load(address: Address): Promise<any> {
    if (this._cache.has(address)) {
      const cached = this._cache.get(address)
      if (!cached.expires || cached.expires > Date.now()) {
        return cached.value
      }
    }

    if (!this._factories.has(address.type))
      throw new Error('no loader defined for type: ' + address.type)

    const resolver = this._factories.get(address.type)

    const resolved = resolver(address, (depAddress: Address) => {
      let cached = this._cache.get(depAddress)
      if (!cached) {
        this.load(depAddress)
        cached = this._cache.get(depAddress)
      }

      cached.deps.add(address)

      return cached.value
    })

    this._cache.set(address, {
      value: resolved,
      address,
      deps: new AddressSet()
    })

    return resolved
  }

  invalidate(fn: (address: Address) => boolean): void
  invalidate(address: Address): void
  invalidate(addresses: Iterable<Address>): void
  invalidate(target: any): void {
    this._invalidate(target, new AddressSet())
  }

  // Private invalidate that keeps cycles from happening
  private _invalidate(
    fn: (address: Address) => boolean,
    invalidated: AddressSet
  ): void
  private _invalidate(address: Address, invalidated: AddressSet): void
  private _invalidate(
    addresses: Iterable<Address>,
    invalidated: AddressSet
  ): void
  private _invalidate(target: any, invalidated: AddressSet): void {
    if (typeof target === 'function') {
      for (const [key, cached] of this._cache.entries()) {
        if (target(key) && !invalidated.has(key)) {
          this._logger.debug('invalidated: %o', key)
          this._cache.delete(key)
          invalidated.add(key)
          this._invalidate(cached.deps, invalidated)
        }
      }
    } else if (target[Symbol.iterator]) {
      for (const t of target) {
        this._invalidate(t, invalidated)
      }
      return
    }

    const cached = this._cache.get(target)
    if (cached) {
      if (!invalidated.has(target)) {
        this._logger.debug('invalidated: %o', target)
        this._cache.delete(target)
        invalidated.add(target)
      }
      this._invalidate(cached.deps, invalidated)
    }
  }
}
