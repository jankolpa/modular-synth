'use strict'

import Module from './module.js'

export default class EnvModule extends Module {
  constructor (audioContext, moduleElement) {
    super(moduleElement)

    this.audioContext = audioContext
    this.numberOfInputs = 5
    this.numberOfOutputs = 1
    this.ioAssignment = [[false, false, false, false, false], [false]]
    this.envNode = new AudioWorkletNode(audioContext, 'envProcessor', {
      numberOfInputs: 5,
      inputChannelCount: [1, 1, 1, 1, 1],
      numberOfOutputs: 1,
      outputChannelCount: [1]
    })

    this.slider_0.value = this.mapValueToSlider('exp', this.envNode.parameters.get('attack').value, 1, 5000)
    this.slider_1.value = this.mapValueToSlider('exp', this.envNode.parameters.get('decay').value, 1, 5000)
    this.slider_2.value = this.mapValueToSlider('exp', this.envNode.parameters.get('sustain').value, 0, 1)
    this.slider_3.value = this.mapValueToSlider('exp', this.envNode.parameters.get('release').value, 1, 5000)

    this.slider_4.value = 50
    this.slider_5.value = 50
    this.slider_6.value = 50
    this.slider_7.value = 50
  }

  initModule () {
    this.slider_0 = this.moduleElement.getElementsByClassName('input-knob')[0]
    this.slider_1 = this.moduleElement.getElementsByClassName('input-knob')[1]
    this.slider_2 = this.moduleElement.getElementsByClassName('input-knob')[2]
    this.slider_3 = this.moduleElement.getElementsByClassName('input-knob')[3]

    this.slider_4 = this.moduleElement.getElementsByClassName('input-knob')[4]
    this.slider_5 = this.moduleElement.getElementsByClassName('input-knob')[5]
    this.slider_6 = this.moduleElement.getElementsByClassName('input-knob')[6]
    this.slider_7 = this.moduleElement.getElementsByClassName('input-knob')[7]

    this.slider_0.oninput = function () {
      this.envNode.parameters.get('attack').value = this.mapSliderToValue('exp', this.slider_0.value, 1, 5000)
    }.bind(this)
    this.slider_1.oninput = function () {
      this.envNode.parameters.get('decay').value = this.mapSliderToValue('exp', this.slider_1.value, 1, 5000)
    }.bind(this)
    this.slider_2.oninput = function () {
      this.envNode.parameters.get('sustain').value = this.mapSliderToValue('exp', this.slider_2.value, 0, 1)
    }.bind(this)
    this.slider_3.oninput = function () {
      this.envNode.parameters.get('release').value = this.mapSliderToValue('exp', this.slider_3.value, 1, 5000)
    }.bind(this)

    this.slider_4.oninput = function () {
      const posSliderValue = (this.slider_4.value - 50) * 2
      if (posSliderValue >= 0) {
        this.envNode.parameters.get('attackAdjust').value = this.mapSliderToValue('lin', posSliderValue, 0, 1)
      } else {
        this.envNode.parameters.get('attackAdjust').value = (-1) * this.mapSliderToValue('lin', (-1) * posSliderValue, 0, 1)
      }
    }.bind(this)
    this.slider_5.oninput = function () {
      const posSliderValue = (this.slider_5.value - 50) * 2
      if (posSliderValue >= 0) {
        this.envNode.parameters.get('decayAdjust').value = this.mapSliderToValue('lin', posSliderValue, 0, 1)
      } else {
        this.envNode.parameters.get('decayAdjust').value = (-1) * this.mapSliderToValue('lin', (-1) * posSliderValue, 0, 1)
      }
    }.bind(this)
    this.slider_6.oninput = function () {
      const posSliderValue = (this.slider_6.value - 50) * 2
      if (posSliderValue >= 0) {
        this.envNode.parameters.get('sustainAdjust').value = this.mapSliderToValue('lin', posSliderValue, 0, 1)
      } else {
        this.envNode.parameters.get('sustainAdjust').value = (-1) * this.mapSliderToValue('lin', (-1) * posSliderValue, 0, 1)
      }
    }.bind(this)
    this.slider_7.oninput = function () {
      const posSliderValue = (this.slider_7.value - 50) * 2
      if (posSliderValue >= 0) {
        this.envNode.parameters.get('releaseAdjust').value = this.mapSliderToValue('lin', posSliderValue, 0, 1)
      } else {
        this.envNode.parameters.get('releaseAdjust').value = (-1) * this.mapSliderToValue('lin', (-1) * posSliderValue, 0, 1)
      }
    }.bind(this)
  }

  getNodeFromInput () {
    return this.envNode
  }

  connectInput (endInput) {
    this.ioAssignment[0][endInput] = true
    this.envNode.port.postMessage(this.ioAssignment)
  }

  connectOutput (endModule, startOutput, endInput) {
    this.envNode.connect(endModule.getNodeFromInput(endInput), startOutput, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = true
    this.envNode.port.postMessage(this.ioAssignment)
  }

  disconnectInput (endInput) {
    this.ioAssignment[0][endInput] = false
    this.envNode.port.postMessage(this.ioAssignment)
  }

  disconnectOutput (endModule, startOutput, endInput) {
    this.envNode.disconnect(endModule.getNodeFromInput(endInput), startOutput, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = false
    this.envNode.port.postMessage(this.ioAssignment)
  }

  deleteNode () {
    this.envNode.port.postMessage('killProzess')
    this.envNode = null
  }
}
