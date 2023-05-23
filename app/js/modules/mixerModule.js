'use strict'

import Module from './module.js'

export default class MixerModule extends Module {
  constructor (audioContext, moduleElement) {
    super(moduleElement)

    this.numberOfInputs = 4
    this.numberOfOutputs = 1
    this.ioAssignment = [[false, false, false, false], [false]]

    this.gainNodeMixer = audioContext.createGain()
    this.gainNode0 = audioContext.createGain()
    this.gainNode0.connect(this.gainNodeMixer)
    this.gainNode1 = audioContext.createGain()
    this.gainNode1.connect(this.gainNodeMixer)
    this.gainNode2 = audioContext.createGain()
    this.gainNode2.connect(this.gainNodeMixer)
    this.gainNode3 = audioContext.createGain()
    this.gainNode3.connect(this.gainNodeMixer)

    this.slider_0.value = this.mapValueToSlider('exp', this.gainNode0.gain.value, 0, 1)
    this.slider_1.value = this.mapValueToSlider('exp', this.gainNode1.gain.value, 0, 1)
    this.slider_2.value = this.mapValueToSlider('exp', this.gainNode2.gain.value, 0, 1)
    this.slider_3.value = this.mapValueToSlider('exp', this.gainNode3.gain.value, 0, 1)
    this.slider_4.value = this.mapValueToSlider('exp', this.gainNodeMixer.gain.value, 0, 1)
  }

  initModule () {
    this.slider_0 = this.moduleElement.getElementsByClassName('input-knob')[0]
    this.slider_0.oninput = function () {
      this.gainNode0.gain.value = this.mapSliderToValue('exp', this.slider_0.value, 0, 1)
    }.bind(this)

    this.slider_1 = this.moduleElement.getElementsByClassName('input-knob')[1]
    this.slider_1.oninput = function () {
      this.gainNode1.gain.value = this.mapSliderToValue('exp', this.slider_1.value, 0, 1)
    }.bind(this)

    this.slider_2 = this.moduleElement.getElementsByClassName('input-knob')[2]
    this.slider_2.oninput = function () {
      this.gainNode2.gain.value = this.mapSliderToValue('exp', this.slider_2.value, 0, 1)
    }.bind(this)

    this.slider_3 = this.moduleElement.getElementsByClassName('input-knob')[3]
    this.slider_3.oninput = function () {
      this.gainNode3.gain.value = this.mapSliderToValue('exp', this.slider_3.value, 0, 1)
    }.bind(this)

    this.slider_4 = this.moduleElement.getElementsByClassName('input-knob')[4]
    this.slider_4.oninput = function () {
      this.gainNodeMixer.gain.value = this.mapSliderToValue('exp', this.slider_4.value, 0, 1)
    }.bind(this)
  }

  getNodeFromInput (input) {
    switch (input) {
      case 0:
        return this.gainNode0
      case 1:
        return this.gainNode1
      case 2:
        return this.gainNode2
      case 3:
        return this.gainNode3
      default:
        break
    }
    return null
  }

  getInputNumber (input) {
    return 0
  }

  connectOutput (endModule, startOutput, endInput) {
    this.gainNodeMixer.connect(endModule.getNodeFromInput(endInput), startOutput, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = true
  }

  disconnectOutput (endModule, startOutput, endInput) {
    this.gainNodeMixer.disconnect(endModule.getNodeFromInput(endInput), startOutput, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = false
  }

  connectInput (endInput) {
    this.ioAssignment[0][endInput] = true
  }

  disconnectInput (endInput) {
    this.ioAssignment[0][endInput] = false
  }

  deleteNode () {
    this.gainNode0 = null
    this.gainNode1 = null
    this.gainNode2 = null
    this.gainNode3 = null
    this.gainNodeMixer = null
  }
}
