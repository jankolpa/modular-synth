'use strict'

import Module from './module.js'

export default class VcoModule extends Module {
  constructor (audioContext, moduleElement) {
    super(moduleElement)

    this.numberOfInputs = 0
    this.numberOfOutputs = 4
    this.ioAssignment = [[], [false, false, false, false]]

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

    // this.slider_0.value = this.mapValueToSlider('log', this.oscSine.frequency.value, 40, 6000)
  }

  getNodeFromInput () {
    return null
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
  }
}
