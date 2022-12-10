type Loader = (typeName: string, target: any) => Promise<any>
type Resolver = (target: any, lasset: Loader) => Promise<any>

interface CacheValue {
  value: Promise<any>
  target: string
  deps: Set<string>
  expires?: number
}

export class Lasset {
  _types: Map<string, Resolver>
  _cache: Map<any, CacheValue>

  constructor(offers: Record<string, Resolver> = {}) {
    this._types = new Map(Object.entries(offers))
    this._cache = new Map()
  }

  offer(typeName: string, handler: Resolver) {
    this._types.set(typeName, handler)
  }

  load(typeName: string, target: any): Promise<any> {
    let cacheKey: string
    cacheKey = typeName + '/' + JSON.stringify(target)

    if (!this._types.has(typeName))
      throw new Error('no loader defined for type: ' + typeName)

    if (this._cache.has(cacheKey)) {
      const cached = this._cache.get(cacheKey)
      if (!cached.expires || cached.expires > Date.now()) {
        return cached.value
      }
    }

    const resolver = this._types.get(typeName)

    const deps = new Set<string>()
    const resolved = resolver(target, (typeName: string, target: any) => {
      const depKey = typeName + '/' + JSON.stringify(target)
      if (this._cache.has(depKey)) {
        this._cache.get(depKey).deps.add(cacheKey)
      }
      return this.load(typeName, target)
    })

    this._cache.set(cacheKey, {
      value: resolved,
      target,
      deps
    })

    return resolved
  }

  invalidate(cacheKey: string): void
  invalidate(typeName: string, target: any): void
  invalidate(...args: string[]): void {
    const cacheKey =
      args.length === 2 ? args[0] + '/' + JSON.stringify(args[1]) : args[0]
    if (!this._cache.has(cacheKey)) return

    const cached = this._cache.get(cacheKey)
    this._cache.delete(cacheKey)

    for (const dep of cached.deps) {
      this.invalidate(dep)
    }
  }
}
