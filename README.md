# Lasset Caching and Asset System

## Motivation

Lasset exists because a dependency graph of assets.

## Usage

```javascript
import {Lasset} from 'lasset'

const assets = new Lasset()
// offer a brick asset type that builds a single brick
assets.offer('brick', async brickName => (`[${brickName}]`))

// offer a wall asset type that builds a wall by loading brick assets and combining them
assets.offer('wall', async (wallName, load) => {
  const brickA = await load('brick/a')
  const brickB = await load('brick/b')
  return `${wallName} ${brickA} ${brickA}`
})

// load a wall (and build needed bricks for it)
const wall = await assets.load('wall/WALL')
console.log(wall) // Outputs WALL [a] [b]

// invalidate the wall asset using its cache key
assets.invalidate('wall/WALL') 
await assets.load('wall/WALL') // causes wall/WALL to be rebuilt but not brick/a or brick/b

assets.invalidate('brick/a') 
await assets.load('wall/WALL') // causes brick/a and wall/WALL to be rebuilt but not brick/b
```

## API

### `new Lasset(offers?: Record<string, Loader>)`

Constructs a Lasset instance that can be used to load offered asset types.

### `offer(typeName: string, loader: Loader): void`

Registers an asset type for loading later.

### `load(typeName: string, target: string) : Promise<any>`

Loads the targetted instance from the cache or builds it if missing.

### `invalidate(typeName: string, target: string) : void`

Invalidates the targetted record and any records that depend on it directly or indirectly.