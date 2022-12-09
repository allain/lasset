import { expect } from 'chai'

import { Lasset } from '../src/Lasset.js'

describe('Lasset', () => {
  it('can be created', () => {
    const l = new Lasset()

    expect(l).to.be.instanceof(Lasset)
  })

  it('can define offers in constructor', async () => {
    const l = new Lasset({
      async lower(name) {
        return `${name}`
      }
    })

    const lowerA = await l.load('lower', 'a')
    expect(lowerA).to.equal('a')
  })

  it('can offer asset types', async () => {
    const l = new Lasset()
    l.offer('lower', async (name) => `${name}`)

    const lowerA = await l.load('lower', 'a')
    expect(lowerA).to.equal('a')
  })

  it('can load using cacheKey', async () => {
    const l = new Lasset()
    l.offer('lower', async (name) => `${name}`)

    const lowerA = await l.load('lower/a')
    expect(lowerA).to.equal('a')
  })

  it('reuses cache values', async () => {
    const l = new Lasset()
    l.offer('time', async (name) => `${name} + ${Date.now()}`)

    const aTime1 = await l.load('time', 'a')
    const aTime2 = await l.load('time', 'a')
    expect(aTime1).to.equal(aTime2)
  })

  it('can load assets from resolvers', async () => {
    const l = new Lasset()
    l.offer('lower', async (name) => name.toLowerCase())
    l.offer('upper', async (name, load) => {
      const lower = await load('lower', name)
      return lower.toUpperCase()
    })

    const lower = await l.load('lower', 'a')
    const upper = await l.load('upper', 'a')
    expect(upper).to.equal(lower.toUpperCase())
  })

  it('can invalidate keys in cache', async () => {
    const l = new Lasset()
    l.offer('random', async (name) => Math.random())

    const time1 = await l.load('random', 'a')
    l.invalidate('random', 'a')
    const time2 = await l.load('random', 'a')
    expect(time1).not.to.equal(time2)
  })

  it('cascades invalidations', async () => {
    const l = new Lasset()
    l.offer('lower', async (name) => `${name.toLowerCase()} ${Math.random()}`)
    l.offer('upper', async (name, load) => {
      const lower = await load('lower', name)
      return lower.toUpperCase()
    })

    const lower1 = await l.load('lower', 'a')
    const upper = await l.load('upper', 'a')
    expect(upper).to.equal(lower1.toUpperCase())

    // This should not affect upper a
    l.invalidate('upper', 'a')
    expect(await l.load('upper', 'a')).to.equal(lower1.toUpperCase())

    // This should not affect upper a
    l.invalidate('lower', 'a')
    expect(await l.load('upper', 'a')).not.to.equal(lower1.toUpperCase())
  })

  it('supports example from README.md', async () => {
    const assets = new Lasset()

    assets.offer('brick', async (brickName) => `[${brickName}]`)
    assets.offer('wall', async (wallName, load) => {
      const brickA = await load('brick', 'a')
      const brickB = await load('brick', 'b')
      return `${wallName} ${brickA} ${brickB}`
    })

    const wall = await assets.load('wall', 'WALL')
    expect(wall).to.equal('WALL [a] [b]')
  })
})
