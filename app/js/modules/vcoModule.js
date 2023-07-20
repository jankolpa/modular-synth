'use strict'

import Module from './module.js'

export default class VcoModule extends Module {
  constructor (audioContext, moduleElement) {
    super(moduleElement)

    this.numberOfInputs = 1
    this.numberOfOutputs = 4
    this.ioAssignment = [[false], [false, false, false, false]]
    this.baseFrequency = 440

    this.oscSine = audioContext.createOscillator()
    this.oscSine.type = 'sine'
    this.oscSine.start()

    this.oscSquare = audioContext.createOscillator()
    this.oscSquare.type = 'square'
    this.oscSquare.start()

    this.oscSaw = audioContext.createOscillator()
    this.oscSaw.type = 'sawtooth'
    this.oscSaw.start()

    this.oscTri = audioContext.createOscillator()
    this.oscTri.type = 'triangle'
    this.oscTri.start()

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

    this.slider_0.value = this.mapValueToSlider('log', this.oscSine.frequency.value, 40, 6000)
    this.slider_1.value = 50
  }

  initModule () {
    this.slider_0 = this.moduleElement.getElementsByClassName('input-knob')[0]
    this.slider_1 = this.moduleElement.getElementsByClassName('input-knob')[1]

    this.slider_0.oninput = function () {
      const value = this.mapSliderToValue('log', this.slider_0.value, 40, 6000)
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
        this.oscSine.connect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
        break
      case 1:
        this.oscSquare.connect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
        break
      case 2:
        this.oscSaw.connect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
        break
      case 3:
        this.oscTri.connect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
        break
      default:
        break
    }
    this.ioAssignment[1][startOutput] = true
  }

  disconnectOutput (endModule, startOutput, endInput) {
    switch (startOutput) {
      case 0:
        this.oscSine.disconnect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
        break
      case 1:
        this.oscSquare.disconnect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
        break
      case 2:
        this.oscSaw.disconnect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
        break
      case 3:
        this.oscTri.disconnect(endModule.getNodeFromInput(endInput), 0, endModule.getInputNumber(endInput))
        break
      default:
        break
    }
    this.ioAssignment[1][startOutput] = false
  }

  deleteNode () {
    this.oscSine.stop()
    this.oscSine = null

    this.oscSquare.stop()
    this.oscSquare = null

    this.oscSaw.stop()
    this.oscSaw = null

    this.oscTri.stop()
    this.oscTri = null

    this.adjustFreqNode = null
  }
}
