import { expect } from 'chai'
import * as exports from '../src/index.js'

describe('exports', () => {
  it('exports builder ', () => {
    expect(exports.Lasset).to.be.a('function')
  })
})
