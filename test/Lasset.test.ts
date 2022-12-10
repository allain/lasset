import { expect } from 'chai'

import { Lasset } from '../src/Lasset.js'

describe('Lasset', () => {
  it('can be created', () => {
    const l = new Lasset()

    expect(l).to.be.instanceof(Lasset)
  })

  it('can define default factories in constructor', async () => {
    const l = new Lasset({
      async lower({ name }) {
        return name.toLowerCase()
      }
    })

    const lowerA = await l.load({ type: 'lower', name: 'a' })
    expect(lowerA).to.equal('a')
  })

  it('can offer asset types', async () => {
    const l = new Lasset({
      async lower({ name }) {
        return name.toLowerCase()
      }
    })

    const lowerA = await l.load({ type: 'lower', name: 'a' })
    expect(lowerA).to.equal('a')
  })

  it('can use complex targets', async () => {
    let count = 0
    const l = new Lasset({
      async fullName({ first, last }) {
        return first + ' ' + last + ++count
      }
    })

    expect(
      await l.load({ type: 'fullName', first: 'Allain', last: 'Lalonde' })
    ).to.equal('Allain Lalonde1')

    l.invalidate({ type: 'fullName', first: 'Allain', last: 'Lalonde' })
    expect(
      await l.load({ type: 'fullName', first: 'Allain', last: 'Lalonde' })
    ).to.equal('Allain Lalonde2')
  })

  it('can load using cacheKey', async () => {
    const l = new Lasset({
      async lower({ name }) {
        return `${name}`
      }
    })
    const lowerA = await l.load({ type: 'lower', name: 'a' })
    expect(lowerA).to.equal('a')
  })

  it('reuses cache values', async () => {
    const l = new Lasset({
      async time({ name }) {
        return `${name} ${Date.now()}`
      }
    })

    const aTime1 = await l.load({ type: 'time', name: 'a' })
    const aTime2 = await l.load({ type: 'time', name: 'a' })
    expect(aTime1).to.equal(aTime2)
  })

  it('can load assets from resolvers', async () => {
    const l = new Lasset({
      async lower({ name }) {
        return name.toLowerCase()
      },
      async upper({ name }, load) {
        const lower = await load({ type: 'lower', name })
        return lower.toUpperCase()
      }
    })
    const lower = await l.load({ type: 'lower', name: 'a' })
    const upper = await l.load({ type: 'upper', name: 'a' })
    expect(upper).to.equal(lower.toUpperCase())
  })

  it('can invalidate keys in cache', async () => {
    const l = new Lasset({
      async random() {
        return Math.random()
      }
    })

    const time1 = await l.load({ type: 'random', name: 'a' })
    l.invalidate({ type: 'random', name: 'a' })
    const time2 = await l.load({ type: 'random', name: 'a' })
    expect(time1).not.to.equal(time2)
  })

  it('cascades invalidations', async () => {
    const l = new Lasset({
      async lower({ name }) {
        return `${name.toLowerCase()} ${Math.random()}`
      },
      async upper({ name }, load) {
        const lower = await load({ type: 'lower', name })
        return lower.toUpperCase()
      }
    })

    const lower1 = await l.load({ type: 'lower', name: 'a' })
    const upper = await l.load({ type: 'upper', name: 'a' })
    expect(upper).to.equal(lower1.toUpperCase())

    // This should not affect upper a
    l.invalidate({ type: 'upper', name: 'a' })
    expect(await l.load({ type: 'upper', name: 'a' })).to.equal(
      lower1.toUpperCase()
    )

    // This should not affect upper a
    l.invalidate({ type: 'lower', name: 'a' })
    expect(await l.load({ type: 'upper', name: 'a' })).not.to.equal(
      lower1.toUpperCase()
    )
  })

  it('supports example from README.md', async () => {
    const assets = new Lasset({
      async brick({ name }) {
        return `[${name}]`
      },
      async wall({ name }, load) {
        const brickA = await load({ type: 'brick', name: 'a' })
        const brickB = await load({ type: 'brick', name: 'b' })
        return `${name} ${brickA} ${brickB}`
      }
    })

    const wall = await assets.load({ type: 'wall', name: 'WALL' })
    expect(wall).to.equal('WALL [a] [b]')
  })

  it('exposes loaders helper', async () => {
    const assets = new Lasset({
      async echo(address) {
        return address
      }
    })

    expect(assets.loaders.echo).to.be.a('function')
    expect(await assets.loaders.echo({ name: 'test' })).to.deep.equal({
      type: 'echo',
      name: 'test'
    })
  })
})
