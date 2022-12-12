import { HashMap } from './HashMap.js'
import { HashSet } from './HashSet.js'

import hashObject from 'object-hash'

export type Address = { type: string } & Record<string, any>
export type TypeLoader = (props: Record<any, string>) => Promise<any>
export type Builder = (
  address: Address,
  load: (address: Address) => Promise<any>
) => Promise<any>

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

export class Lasset {
  private _factories: Map<string, Builder>
  private _cache: AddressMap<CacheValue>
  private _loaders: Record<string, TypeLoader>

  constructor(factories: Record<string, Builder> = {}) {
    this._factories = new Map(Object.entries(factories))
    this._loaders = Object.fromEntries(
      Array.from(this._factories.keys()).map((name) => [
        name,
        (props: Record<string, any>) => this.load({ type: name, ...props })
      ])
    )
    this._cache = new AddressMap()
  }

  get loaders() {
    return this._loaders
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

    const deps = new AddressSet()
    const resolved = resolver(address, (depAddress: Address) => {
      if (this._cache.has(depAddress)) {
        this._cache.get(depAddress).deps.add(address)
      }
      return this.load(depAddress)
    })

    this._cache.set(address, {
      value: resolved,
      address,
      deps
    })

    return resolved
  }

  invalidate(fn: (address: Address) => boolean): void
  invalidate(address: Address): void
  invalidate(addresses: Iterable<Address>): void
  invalidate(target): void {
    if (typeof target === 'function') {
      for (const [key, cached] of this._cache.entries()) {
        if (target(cached.address)) {
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
      this._cache.delete(target)
      this.invalidate(cached.deps)
    }
  }
}
