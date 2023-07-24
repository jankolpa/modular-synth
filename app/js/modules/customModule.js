'use strict'

import Module from './module.js'

export default class CustomModule extends Module {
  constructor (audioContext, moduleElement, moduleNumberOfInputs, moduleNumberOfOutputs, processFunction) {
    super(moduleElement)

    this.audioContext = audioContext
    this.numberOfInputs = moduleNumberOfInputs
    this.numberOfOutputs = moduleNumberOfOutputs
    this.ioAssignment = [[], []]

    const preparedInputChannels = []
    for (let i = 0; i < moduleNumberOfInputs; i++) {
      this.ioAssignment[0].push(false)
      preparedInputChannels.push(1)
    }
    const preparedOutputChannels = []
    for (let i = 0; i < moduleNumberOfOutputs; i++) {
      this.ioAssignment[1].push(false)
      preparedOutputChannels.push(1)
    }

    this.customNode = new AudioWorkletNode(audioContext, 'customProcessor', {
      numberOfInputs: moduleNumberOfInputs,
      inputChannelCount: preparedInputChannels,
      numberOfOutputs: moduleNumberOfOutputs,
      outputChannelCount: preparedOutputChannels
    })

    this.customNode.port.postMessage(this.ioAssignment)
    this.customNode.port.postMessage(processFunction)
  }

  initModule () {
  }

  getNodeFromInput () {
    return this.customNode
  }

  connectInput (endInput) {
    this.ioAssignment[0][endInput] = true
    this.customNode.port.postMessage(this.ioAssignment)
  }

  connectOutput (endModule, startOutput, endInput) {
    this.customNode.connect(endModule.getNodeFromInput(endInput), startOutput, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = true
    this.customNode.port.postMessage(this.ioAssignment)
  }

  disconnectInput (endInput) {
    this.ioAssignment[0][endInput] = false
    this.customNode.port.postMessage(this.ioAssignment)
  }

  disconnectOutput (endModule, startOutput, endInput) {
    this.customNode.disconnect(endModule.getNodeFromInput(endInput), startOutput, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = false
    this.customNode.port.postMessage(this.ioAssignment)
  }

  deleteNode () {
    this.customNode.port.postMessage('killProzess')
    this.customNode = null
  }
}
