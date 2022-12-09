# Lasset Caching and Asset System

## Motivation

Lasset exists because invalidating caches with deep dependencies is hard.

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
