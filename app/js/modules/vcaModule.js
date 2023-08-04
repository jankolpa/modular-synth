'use strict'

import Module from './module.js'

export default class VcaModule extends Module {
  constructor (audioContext, moduleElement, widget) {
    super(moduleElement, widget)

    this.audioContext = audioContext
    this.numberOfInputs = 2
    this.numberOfOutputs = 1
    this.ioAssignment = [[false, false], [false]]
    this.vcaNode = new AudioWorkletNode(audioContext, 'vcaProcessor', {
      numberOfInputs: 2,
      inputChannelCount: [1, 1],
      numberOfOutputs: 1,
      outputChannelCount: [1]
    })

    this.slider_0.value = this.mapValueToSlider('exp', this.vcaNode.parameters.get('gain').value, 0, 1)
  }

  initModule () {
    this.slider_0 = this.moduleElement.getElementsByClassName('input-knob')[0]
    this.slider_0.oninput = function () {
      this.vcaNode.parameters.get('gain').value = this.mapSliderToValue('exp', this.slider_0.value, 0, 1)
    }.bind(this)
  }

  getNodeFromInput () {
    return this.vcaNode
  }

  connectInput (endInput) {
    this.ioAssignment[0][endInput] = true
    this.vcaNode.port.postMessage(this.ioAssignment)
  }

  connectOutput (endModule, startOutput, endInput) {
    this.vcaNode.connect(endModule.getNodeFromInput(endInput), startOutput, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = true
    this.vcaNode.port.postMessage(this.ioAssignment)
  }

  disconnectInput (endInput) {
    this.ioAssignment[0][endInput] = false
    this.vcaNode.port.postMessage(this.ioAssignment)
  }

  disconnectOutput (endModule, startOutput, endInput) {
    this.vcaNode.disconnect(endModule.getNodeFromInput(endInput), startOutput, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = false
    this.vcaNode.port.postMessage(this.ioAssignment)
  }

  deleteNode () {
    this.vcaNode.port.postMessage('killProzess')
    this.vcaNode = null
  }
}
