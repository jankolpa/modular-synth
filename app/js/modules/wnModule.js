'use strict'

import Module from './module.js'

export default class WnModule extends Module {
  constructor (audioContext, moduleElement, widget) {
    super(moduleElement, widget)

    this.numberOfInputs = 0
    this.numberOfOutputs = 1
    this.ioAssignment = [[], [false]]

    this.wnNode = new AudioWorkletNode(audioContext, 'wnProcessor', {
      numberOfInputs: 0,
      inputChannelCount: [],
      numberOfOutputs: 1,
      outputChannelCount: [1]
    })
  }

  getNodeFromInput () {
    return this.wnNode
  }

  connectOutput (endModule, startOutput, endInput) {
    this.wnNode.connect(endModule.getNodeFromInput(endInput), startOutput, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = true
    this.wnNode.port.postMessage(this.ioAssignment)
  }

  disconnectOutput (endModule, startOutput, endInput) {
    this.wnNode.disconnect(endModule.getNodeFromInput(endInput), startOutput, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = false
    this.wnNode.port.postMessage(this.ioAssignment)
  }

  deleteNode () {
    this.wnNode.port.postMessage('killProzess')
    this.wnNode = null
  }
}
