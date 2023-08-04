'use strict'

import Module from './module.js'

export default class CustomModule extends Module {
  constructor (audioContext, moduleElement, moduleNumberOfInputs, moduleNumberOfOutputs, processFunction, parameters, id, widget) {
    super(moduleElement, widget, parameters)

    this.id = id
    this.audioContext = audioContext
    this.numberOfInputs = moduleNumberOfInputs
    this.numberOfOutputs = moduleNumberOfOutputs
    this.ioAssignment = [[], []]

    const preparedInputChannels = []
    for (let i = 0; i < moduleNumberOfInputs; i++) {
      this.ioAssignment[0].push(false)
      preparedInputChannels.push(1)
    }
    const preparedOutputChannels = []
    for (let i = 0; i < moduleNumberOfOutputs; i++) {
      this.ioAssignment[1].push(false)
      preparedOutputChannels.push(1)
    }

    this.customNode = new AudioWorkletNode(audioContext, 'customProcessor', {
      numberOfInputs: moduleNumberOfInputs,
      inputChannelCount: preparedInputChannels,
      numberOfOutputs: moduleNumberOfOutputs,
      outputChannelCount: preparedOutputChannels
    })

    for (let i = 0; i < this.parameters.length; i++) {
      this.customNode.port.postMessage(['initPara', this.parameters[i].name, this.parameters[i].value, this.parameters[i].minValue, this.parameters[i].maxValue])
    }

    this.customNode.port.postMessage(['io', this.ioAssignment])
    this.customNode.port.postMessage(['fn', processFunction])

    for (let i = 0; i < this.sliderArray.length; i++) {
      this.sliderArray[i].value = this.mapValueToSlider(this.parameters[i].type, this.parameters[i].value, this.parameters[i].minValue, this.parameters[i].maxValue)
    }

    this.customNode.port.onmessage = (e) => {
      alert(e.data)
    }
  }

  initModule () {
    this.sliderArray = []
    const inputKnobElements = this.moduleElement.getElementsByClassName('input-knob')
    for (let i = 0; i < inputKnobElements.length; i++) {
      this.sliderArray.push(inputKnobElements[i])

      this.sliderArray[i].oninput = function () {
        this.parameters[i].value = this.mapSliderToValue(this.parameters[i].type, this.sliderArray[i].value, this.parameters[i].minValue, this.parameters[i].maxValue)
        this.customNode.port.postMessage(['updatePara', this.parameters[i].name, this.parameters[i].value])
      }.bind(this)
    }
  }

  updateParamatersFromPrevious (oldParameters) {
    oldParameters.forEach(oldPara => {
      this.parameters.forEach(currentPara => {
        if (currentPara.name === oldPara.name) {
          currentPara.value = oldPara.value
          if (currentPara.value > currentPara.maxValue) {
            currentPara.value = currentPara.maxValue
          } else if (currentPara.value < currentPara.minValue) {
            currentPara.value = currentPara.minValue
          }
        }
      })
    })

    this.parameters.forEach(currentPara => {
      this.customNode.port.postMessage(['updatePara', currentPara.name, currentPara.value])
    })

    for (let i = 0; i < this.sliderArray.length; i++) {
      this.sliderArray[i].value = this.mapValueToSlider(this.parameters[i].type, this.parameters[i].value, this.parameters[i].minValue, this.parameters[i].maxValue)
    }
  }

  getNodeFromInput () {
    return this.customNode
  }

  connectInput (endInput) {
    this.ioAssignment[0][endInput] = true
    this.customNode.port.postMessage(['io', this.ioAssignment])
  }

  connectOutput (endModule, startOutput, endInput) {
    this.customNode.connect(endModule.getNodeFromInput(endInput), startOutput, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = true
    this.customNode.port.postMessage(['io', this.ioAssignment])
  }

  disconnectInput (endInput) {
    this.ioAssignment[0][endInput] = false
    this.customNode.port.postMessage(['io', this.ioAssignment])
  }

  disconnectOutput (endModule, startOutput, endInput) {
    this.customNode.disconnect(endModule.getNodeFromInput(endInput), startOutput, endModule.getInputNumber(endInput))
    this.ioAssignment[1][startOutput] = false
    this.customNode.port.postMessage(['io', this.ioAssignment])
  }

  deleteNode () {
    this.customNode.port.postMessage('killProzess')
    this.customNode = null
  }
}
