# Lasset

Lasset exists because cache invalidation is hard especially when cache entries are interdependent.

## Usage

```javascript
import {Lasset} from 'lasset'

// Create lasset that supports two asset factories brick and wall
const assets = new Lasset({
  // offer a brick asset type that builds a single brick
  async brick({ name }) {
    return `[${name}]`
  },
  // load a wall (and build needed bricks for it)
  async wall({ name }, load) {
    const brickA = await load({ type: 'brick', name: 'a' })
    const brickB = await load({ type: 'brick', name: 'b' })
    return `${name} ${brickA} ${brickB}`
  }
})

// load a wall (and build needed bricks for it)
const wall = await assets.load({ type: 'wall', name: 'WALL' })
// or equivalently
const wall2 = await assets.loaders.wall({ name: 'WALL' })

console.log(wall) //  Outputs WALL [a] [b]
console.log(wall2) // Outputs WALL [a] [b] too since

// invalidate the wall asset using its cache key
assets.invalidate({type: 'wall', name: 'WALL'}) 
await assets.load({type: 'wall', name: 'WALL'}) // causes wall/WALL to be rebuilt but not brick/a or brick/b

assets.invalidate({type: 'brick', name: 'a'}) 
await assets.load({type: 'wall', name: 'WALL'}) // causes brick/a and wall/WALL to be rebuilt but not brick/b

```
