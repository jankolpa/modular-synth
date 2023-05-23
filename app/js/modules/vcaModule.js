'use strict'

import Module from './module.js'

export default class VcaModule extends Module {
  constructor (audioContext, moduleElement) {
    super(moduleElement)

    this.audioContext = audioContext
    this.numberOfInputs = 1
    this.numberOfOutputs = 0
    this.ioAssignment = [[false], []]
    this.gainNodeMixer = audioContext.createGain()

    this.slider_0.value = this.mapValueToSlider('exp', this.gainNodeMixer.gain.value, 0, 1)
  }

  initModule () {
    this.slider_0 = this.moduleElement.getElementsByClassName('input-knob')[0]
    this.slider_0.oninput = function () {
      this.gainNodeMixer.gain.value = this.mapSliderToValue('exp', this.slider_0.value, 0, 1)
    }.bind(this)
  }

  getNodeFromInput () {
    return this.gainNodeMixer
  }

  connectOutput (endModule, startOutput, endInput) {
    this.gainNodeMixer.connect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = true
  }

  disconnectOutput (endModule, startOutput, endInput) {
    this.gainNodeMixer.disconnect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = false
  }

  connectInput (endInput) {
    this.ioAssignment[0][endInput] = true
  }

  disconnectInput (endInput) {
    this.ioAssignment[0][endInput] = false
  }

  deleteNode () {
    this.gainNodeMixer = null
  }
}
