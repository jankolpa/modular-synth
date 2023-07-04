'use strict'

export default class Module {
  constructor (moduleElement) {
    this.moduleElement = moduleElement
    this.initModule()
  }

  mapSliderToValue (type, sliderValue, min, max) {
    let returnValue = 0
    switch (type) {
      case 'lin':
        returnValue = (sliderValue / 100 * (max - min)) + min
        break
      case 'log': {
        const minv = Math.log(min + 1e-9)
        const maxv = Math.log(max + 1e-9)
        const scale = (maxv - minv) / 100
        const logValue = Math.exp(minv + scale * (sliderValue - 0))
        returnValue = (logValue - 1e-9) / (1 - 1e-9 * 2)
        break
      }
      case 'exp': {
        let faktor = Math.pow(50, 1.202 * (sliderValue / 100) - 1.2) - 0.009
        if (sliderValue === 0) { faktor = 0 }
        returnValue = (faktor * (max - min)) + min
        break
      }
      default:
        break
    }

    if (returnValue > max) returnValue = max
    if (returnValue < min) returnValue = min
    return returnValue.toFixed(2)
  }

  mapValueToSlider (type, value, min, max) {
    let returnValue = 0
    switch (type) {
      case 'lin':
        returnValue = ((value - min) / (max - min) * 100)
        break
      case 'log': {
        const minv = Math.log(min + 1e-9)
        const maxv = Math.log(max + 1e-9)
        const scale = 100 / (maxv - minv)
        const logValue = Math.log(value + 1e-9)
        const sliderValue = (logValue - minv) * scale
        returnValue = sliderValue
        break
      }
      case 'exp': {
        if (value === min) {
          return 0
        }
        const faktor = (value - min) / (max - min)
        const exponent = (Math.log10(faktor + 0.009) / Math.log10(50) + 1.2) / 1.202
        const sliderValue = exponent * 100
        returnValue = sliderValue
        break
      }
      default:
        break
    }

    if (returnValue > 100) returnValue = 100
    if (returnValue < 0) returnValue = 0
    return returnValue
  }

  initModule () {

  }

  // Number of Inputs of this module
  getNumberOfInputs () {
    return this.numberOfInputs
  }

  // Number of Outputs of this module
  getNumberOfOutputs () {
    return this.numberOfOutputs
  }

  // stores whether each Input/Output is connected
  getIOAssignment () {
    return this.ioAssignment
  }

  // return the node ti connect to for the input of the module
  getNodeFromInput (input) {
    return null
  }

  // maps which Input of the returned node should be use for the input of the module
  getInputNumber (input) {
    return input
  }

  // connect this module to another
  connectOutput (endModule, startOutput, endInput) {

  }

  // set this modules input to be connected
  connectInput (endInput) {

  }

  // disconnect this module from another
  disconnectOutput (endModule, startOutput, endInput) {

  }

  // set this modules input to be disconnected
  disconnectInput (endInput) {

  }

  // sets all nodes to null
  deleteNode () {

  }
}
