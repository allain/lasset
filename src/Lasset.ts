type Loader = (typeName: string, target: String) => Promise<any>
type Resolver = (target: string, lasset: Loader) => Promise<any>

interface CacheValue {
  value: Promise<any>
  deps: Set<string>
  expires?: number
}

export class Lasset {
  _types: Map<string, Resolver>
  _cache: Map<string, CacheValue>

  constructor(offers: Record<string, Resolver> = {}) {
    this._types = new Map(Object.entries(offers))
    this._cache = new Map()
  }

  offer(typeName: string, handler: Resolver) {
    this._types.set(typeName, handler)
    return this
  }

  load(cacheKey): Promise<any>
  load(typeName: string, target: string): Promise<any>
  load(...args: string[]) {
    let cacheKey: string
    let typeName: string
    let target: string
    if (args.length === 1) {
      cacheKey = args[0]
      const parts = cacheKey.split('/', 2)
      typeName = parts[0]
      target = parts[1]
    } else {
      typeName = args[0]
      target = args[1]
      cacheKey = typeName + '/' + target
    }

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
    const resolved = resolver(target, (typeName: string, target: string) => {
      const depKey = typeName + '/' + target
      if (this._cache.has(depKey)) {
        this._cache.get(depKey).deps.add(cacheKey)
      }
      return this.load(typeName, target)
    })

    this._cache.set(cacheKey, {
      value: resolved,
      deps
    })

    return resolved
  }

  invalidate(cacheKey: string): void
  invalidate(typeName: string, target: String): void
  invalidate(...args: string[]): void {
    const cacheKey = args.length === 2 ? args[0] + '/' + args[1] : args[0]
    if (!this._cache.has(cacheKey)) return

    const cached = this._cache.get(cacheKey)
    this._cache.delete(cacheKey)

    for (const dep of cached.deps) {
      this.invalidate(dep)
    }
  }
}
