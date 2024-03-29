'use strict'

import Module from './module.js'

export default class GateModule extends Module {
  constructor (audioContext, moduleElement, widget) {
    super(moduleElement, widget)

    this.audioContext = audioContext
    this.numberOfInputs = 2
    this.numberOfOutputs = 1
    this.ioAssignment = [[false, false], [false]]
    this.gateNode = new AudioWorkletNode(audioContext, 'gateProcessor', {
      numberOfInputs: 2,
      inputChannelCount: [1, 1],
      numberOfOutputs: 1,
      outputChannelCount: [1]
    })

    this.slider_0.value = this.mapValueToSlider('exp', this.gateNode.parameters.get('length').value, 1, 5000)
    this.slider_1.value = 50
  }

  initModule () {
    this.slider_0 = this.moduleElement.getElementsByClassName('input-knob')[0]
    this.slider_1 = this.moduleElement.getElementsByClassName('input-knob')[1]

    this.slider_0.oninput = function () {
      this.gateNode.parameters.get('length').value = this.mapSliderToValue('exp', this.slider_0.value, 1, 5000)
    }.bind(this)

    this.slider_1.oninput = function () {
      const posSliderValue = (this.slider_1.value - 50) * 2
      if (posSliderValue >= 0) {
        this.gateNode.parameters.get('lengthAdjust').value = this.mapSliderToValue('lin', posSliderValue, 0, 1)
      } else {
        this.gateNode.parameters.get('lengthAdjust').value = (-1) * this.mapSliderToValue('lin', (-1) * posSliderValue, 0, 1)
      }
    }.bind(this)
  }

  getNodeFromInput () {
    return this.gateNode
  }

  connectInput (endInput) {
    this.ioAssignment[0][endInput] = true
    this.gateNode.port.postMessage(this.ioAssignment)
  }

  connectOutput (endModule, startOutput, endInput) {
    this.gateNode.connect(endModule.getNodeFromInput(endInput), startOutput, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = true
    this.gateNode.port.postMessage(this.ioAssignment)
  }

  disconnectInput (endInput) {
    this.ioAssignment[0][endInput] = false
    this.gateNode.port.postMessage(this.ioAssignment)
  }

  disconnectOutput (endModule, startOutput, endInput) {
    this.gateNode.disconnect(endModule.getNodeFromInput(endInput), startOutput, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = false
    this.gateNode.port.postMessage(this.ioAssignment)
  }

  deleteNode () {
    this.gateNode.port.postMessage('killProzess')
    this.gateNode = null
  }
}
