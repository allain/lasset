export class HashSet<V> implements Set<V> {
  _hash: (item: V) => string
  _map: Map<string, V>

  constructor(hash: (item: V) => string) {
    this._hash = hash
    this._map = new Map()
  }

  add(value: V): this {
    const hash = this._hash(value)
    if (!this._map.has(hash)) {
      this._map.set(hash, value)
    }
    return this
  }
  clear(): void {
    this._map.clear()
  }
  delete(value: V): boolean {
    const hash = this._hash(value)
    if (this._map.has(hash)) {
      this._map.delete(hash)
      return true
    }
    return false
  }
  forEach(
    callbackFn: (value: V, value2: V, set: Set<V>) => void,
    thisArg?: any
  ): void {
    const boundCallbackFn = callbackFn.bind(thisArg)
    this._map.forEach((value) => {
      boundCallbackFn(value, value, this)
    })
  }
  has(value: V): boolean {
    const hash = this._hash(value)
    return this._map.has(hash)
  }
  get size() {
    return this._map.size
  }
  *entries(): IterableIterator<[V, V]> {
    for (const value of this._map.values()) {
      yield [value, value]
    }
  }
  keys(): IterableIterator<V> {
    return this.values()
  }
  values(): IterableIterator<V> {
    return this._map.values()
  }
  [Symbol.iterator](): IterableIterator<V> {
    return this.values()
  }
  [Symbol.toStringTag]: 'HashSet'
}
