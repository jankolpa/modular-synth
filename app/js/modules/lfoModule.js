'use strict'

import Module from './module.js'

export default class LfoModule extends Module {
  constructor (audioContext, moduleElement, widget) {
    super(moduleElement, widget)

    this.numberOfInputs = 1
    this.numberOfOutputs = 4
    this.ioAssignment = [[false], [false, false, false, false]]
    this.baseFrequency = 2

    this.oscSine = audioContext.createOscillator()
    this.oscSine.type = 'sine'
    this.oscSine.start()
    this.oscSine.frequency.value = this.baseFrequency
    this.toPosNode0 = new AudioWorkletNode(audioContext, 'helperToPosProcessor', {
      numberOfInputs: 1,
      inputChannelCount: [1],
      numberOfOutputs: 1,
      outputChannelCount: [1]
    })
    this.oscSine.connect(this.toPosNode0)

    this.oscSquare = audioContext.createOscillator()
    this.oscSquare.type = 'square'
    this.oscSquare.start()
    this.oscSquare.frequency.value = this.baseFrequency
    this.toPosNode1 = new AudioWorkletNode(audioContext, 'helperToPosProcessor', {
      numberOfInputs: 1,
      inputChannelCount: [1],
      numberOfOutputs: 1,
      outputChannelCount: [1]
    })
    this.oscSquare.connect(this.toPosNode1)

    this.oscSaw = audioContext.createOscillator()
    this.oscSaw.type = 'sawtooth'
    this.oscSaw.start()
    this.oscSaw.frequency.value = this.baseFrequency
    this.toPosNode2 = new AudioWorkletNode(audioContext, 'helperToPosProcessor', {
      numberOfInputs: 1,
      inputChannelCount: [1],
      numberOfOutputs: 1,
      outputChannelCount: [1]
    })
    this.oscSaw.connect(this.toPosNode2)

    this.oscTri = audioContext.createOscillator()
    this.oscTri.type = 'triangle'
    this.oscTri.start()
    this.oscTri.frequency.value = this.baseFrequency
    this.toPosNode3 = new AudioWorkletNode(audioContext, 'helperToPosProcessor', {
      numberOfInputs: 1,
      inputChannelCount: [1],
      numberOfOutputs: 1,
      outputChannelCount: [1]
    })
    this.oscTri.connect(this.toPosNode3)

    this.adjustFreqNode = audioContext.createGain()
    this.analyserNode = audioContext.createAnalyser()
    this.analyserNode.fftSize = 32
    this.adjustFreqNode.connect(this.analyserNode)
    this.adjustFreqValue = 0

    setInterval(() => {
      if (this.ioAssignment[0][0] === false) {
        return
      }
      const bufferLength = this.analyserNode.frequencyBinCount
      const dataArray = new Float32Array(bufferLength)
      this.analyserNode.getFloatTimeDomainData(dataArray)
      const currentValue = dataArray[0] * this.adjustFreqValue
      this.updateFrequency(this.baseFrequency, currentValue)
    }, 15)

    this.slider_0.value = this.mapValueToSlider('log', this.oscSine.frequency.value, 0.1, 800)
    this.slider_1.value = 50
  }

  initModule () {
    this.slider_0 = this.moduleElement.getElementsByClassName('input-knob')[0]
    this.slider_1 = this.moduleElement.getElementsByClassName('input-knob')[1]

    this.slider_0.oninput = function () {
      const value = this.mapSliderToValue('log', this.slider_0.value, 0.1, 1000)
      this.baseFrequency = value

      if (this.ioAssignment[0][0] === false) {
        this.updateFrequency(this.baseFrequency, 0)
      }
    }.bind(this)

    this.slider_1.oninput = function () {
      const posSliderValue = (this.slider_1.value - 50) * 2
      if (posSliderValue >= 0) {
        this.adjustFreqValue = this.mapSliderToValue('lin', posSliderValue, 0, 1)
      } else {
        this.adjustFreqValue = (-1) * this.mapSliderToValue('lin', (-1) * posSliderValue, 0, 1)
      }
    }.bind(this)
  }

  updateFrequency (baseFrequency, currentAdjustValue) {
    let newFrequency = baseFrequency

    if (currentAdjustValue >= 0) {
      newFrequency = newFrequency * (1 + 3 * currentAdjustValue)
    } else {
      newFrequency = newFrequency / (1 + 3 * Math.abs(currentAdjustValue))
    }

    this.oscSine.frequency.value = newFrequency
    this.oscSquare.frequency.value = newFrequency
    this.oscSaw.frequency.value = newFrequency
    this.oscTri.frequency.value = newFrequency
  }

  getNodeFromInput () {
    return this.adjustFreqNode
  }

  connectInput (endInput) {
    this.ioAssignment[0][endInput] = true
  }

  disconnectInput (endInput) {
    this.ioAssignment[0][endInput] = false
  }

  connectOutput (endModule, startOutput, endInput) {
    switch (startOutput) {
      case 0:
        this.toPosNode0.port.postMessage('isUsed')
        this.toPosNode0.connect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
        break
      case 1:
        this.toPosNode1.port.postMessage('isUsed')
        this.toPosNode1.connect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
        break
      case 2:
        this.toPosNode2.port.postMessage('isUsed')
        this.toPosNode2.connect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
        break
      case 3:
        this.toPosNode3.port.postMessage('isUsed')
        this.toPosNode3.connect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
        break
      default:
        break
    }
    this.ioAssignment[1][startOutput] = true
  }

  disconnectOutput (endModule, startOutput, endInput) {
    switch (startOutput) {
      case 0:
        this.toPosNode0.port.postMessage('isNotUsed')
        this.toPosNode0.disconnect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
        break
      case 1:
        this.toPosNode1.port.postMessage('isNotUsed')
        this.toPosNode1.disconnect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
        break
      case 2:
        this.toPosNode2.port.postMessage('isNotUsed')
        this.toPosNode2.disconnect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
        break
      case 3:
        this.toPosNode3.port.postMessage('isNotUsed')
        this.toPosNode3.disconnect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
        break
      default:
        break
    }
    this.ioAssignment[1][startOutput] = false
  }

  deleteNode () {
    this.oscSine.stop()
    this.oscSine = null
    this.toPosNode0.port.postMessage('killProzess')

    this.oscSquare.stop()
    this.oscSquare = null
    this.toPosNode1.port.postMessage('killProzess')

    this.oscSaw.stop()
    this.oscSaw = null
    this.toPosNode2.port.postMessage('killProzess')

    this.oscTri.stop()
    this.oscTri = null
    this.toPosNode3.port.postMessage('killProzess')

    this.adjustFreqNode = null
  }
}
