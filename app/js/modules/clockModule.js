'use strict'

import Module from './module.js'

export default class ClockModule extends Module {
  constructor (audioContext, moduleElement, widget) {
    super(moduleElement, widget)

    this.audioContext = audioContext
    this.numberOfInputs = 1
    this.numberOfOutputs = 3
    this.ioAssignment = [[false], [false, false, false]]
    this.clockNode = new AudioWorkletNode(audioContext, 'clockProcessor', {
      numberOfInputs: 1,
      inputChannelCount: [1],
      numberOfOutputs: 3,
      outputChannelCount: [1, 1, 1]
    })

    this.slider_0.value = this.mapValueToSlider('log', this.clockNode.parameters.get('bpm').value, 30, 300)
    this.slider_1.value = 50
  }

  initModule () {
    this.slider_0 = this.moduleElement.getElementsByClassName('input-knob')[0]
    this.slider_1 = this.moduleElement.getElementsByClassName('input-knob')[1]

    this.slider_0.oninput = function () {
      this.clockNode.parameters.get('bpm').value = this.mapSliderToValue('log', this.slider_0.value, 30, 300)
    }.bind(this)

    this.slider_1.oninput = function () {
      const posSliderValue = (this.slider_1.value - 50) * 2
      if (posSliderValue >= 0) {
        this.clockNode.parameters.get('bpmAdjust').value = this.mapSliderToValue('lin', posSliderValue, 0, 1)
      } else {
        this.clockNode.parameters.get('bpmAdjust').value = (-1) * this.mapSliderToValue('lin', (-1) * posSliderValue, 0, 1)
      }
    }.bind(this)
  }

  getNodeFromInput () {
    return this.clockNode
  }

  connectInput (endInput) {
    this.ioAssignment[0][endInput] = true
    this.clockNode.port.postMessage(this.ioAssignment)
  }

  connectOutput (endModule, startOutput, endInput) {
    this.clockNode.connect(endModule.getNodeFromInput(endInput), startOutput, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = true
    this.clockNode.port.postMessage(this.ioAssignment)
  }

  disconnectInput (endInput) {
    this.ioAssignment[0][endInput] = false
    this.clockNode.port.postMessage(this.ioAssignment)
  }

  disconnectOutput (endModule, startOutput, endInput) {
    this.clockNode.disconnect(endModule.getNodeFromInput(endInput), startOutput, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = false
    this.clockNode.port.postMessage(this.ioAssignment)
  }

  deleteNode () {
    this.clockNode.port.postMessage('killProzess')
    this.clockNode = null
  }
}
