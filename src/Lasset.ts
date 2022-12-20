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
    if (typeof target === 'function') {
      for (const [key, cached] of this._cache.entries()) {
        if (target(key)) {
          this._logger.debug('invalidated: %o', target)
          this._cache.delete(key)
          this.invalidate(cached.deps)
        }
      }
    } else if (target[Symbol.iterator]) {
      for (const t of target) {
        this.invalidate(t)
      }
      return
    }

    const cached = this._cache.get(target)
    if (cached) {
      this._logger.debug('invalidated: %o', target)
      this._cache.delete(target)
      this.invalidate(cached.deps)
    }
  }
}
