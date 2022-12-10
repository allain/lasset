export class HashMap<K, V> implements Map<K, V> {
  _keyMap: Map<string, K>
  _map: Map<K, V>
  _hash: (item: K) => string

  constructor(hash: (item: K) => string) {
    this._keyMap = new Map()
    this._hash = hash
    this._map = new Map()
  }
  clear(): void {
    this._keyMap.clear()
    this._map.clear()
  }
  delete(key: K): boolean {
    const hash = this._hash(key)
    const hashKey = this._keyMap.get(hash)
    if (hashKey) {
      this._keyMap.delete(hash)
      this._map.delete(hashKey)
      return true
    }

    return false
  }
  forEach(cb: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
    this._map.forEach(cb, thisArg)
  }
  get(key: K): V {
    const hash = this._hash(key)
    const hashKey = this._keyMap.get(hash)
    return this._map.get(hashKey)
  }
  has(key: K): boolean {
    const hash = this._hash(key)
    return this._keyMap.has(hash)
  }
  set(key: K, value: V): this {
    const hash = this._hash(key)
    this._keyMap.set(hash, key)
    this._map.set(key, value)
    return this
  }
  get size() {
    return this._keyMap.size
  }
  keys(): IterableIterator<K> {
    return this._map.keys()
  }
  values(): IterableIterator<V> {
    return this._map.values()
  }
  entries() {
    return this._map.entries()
  }
  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this._map[Symbol.iterator]()
  }
  get [Symbol.toStringTag]() {
    return 'HashMap'
  }
}
