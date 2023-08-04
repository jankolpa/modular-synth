'use strict'

import Module from './module.js'

export default class AudioModule extends Module {
  constructor (audioContext, moduleElement, widget) {
    super(moduleElement, widget)

    this.audioContext = audioContext
    this.numberOfInputs = 1
    this.numberOfOutputs = 0
    this.ioAssignment = [[false], []]
  }

  getNodeFromInput () {
    return this.audioContext.destination
  }

  connectInput (endInput) {
    this.ioAssignment[0][endInput] = true
  }

  disconnectInput (endInput) {
    this.ioAssignment[0][endInput] = false
  }
}
