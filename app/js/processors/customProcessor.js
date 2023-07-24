'use strict'

class CustomProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors () {
    return [{
      name: 'gain',
      defaultValue: 1,
      minValue: 0,
      maxValue: 1,
      automationRate: 'a-rate'
    }]
  }

  constructor () {
    super()
    this.running = true
    this.ioAssignment = null
    this.numberOfInputs = 0
    this.numberOfOutputs = 0

    this.processFunction = null

    this.port.onmessage = (e) => {
      if (e.data === 'killProzess') {
        this.running = false
      } else if (e.data instanceof Array) {
        if (e.data.length === 2) {
          if (this.ioAssignment === null) {
            this.ioAssignment = e.data
            this.numberOfInputs = this.ioAssignment[0].length
            this.numberOfOutputs = this.ioAssignment[1].length
          } else {
            this.ioAssignment = e.data
          }
        }
      } else {
        // eslint-disable-next-line no-new-func
        this.processFunction = Function('inputs', 'outputs', 'parameters', String(e.data))
      }
    }
  }

  process (inputs, outputs, parameters) {
    if (this.running === false) {
      return false
    }

    let noIO = true
    for (let i = 0; i < this.numberOfInputs; i++) {
      if (this.ioAssignment[0][i] === true) {
        noIO = false
      }
    }
    for (let i = 0; i < this.numberOfOutputs; i++) {
      if (this.ioAssignment[1][i] === true) {
        noIO = false
      }
    }

    if (noIO) {
      return true
    }
    if (this.processFunction === null) {
      return true
    }

    const preparedInputs = []
    for (let i = 0; i < this.numberOfInputs; i++) {
      preparedInputs.push(inputs[i][0])
    }
    const preparedOutputs = []
    for (let i = 0; i < this.numberOfOutputs; i++) {
      preparedOutputs.push(outputs[i][0])
    }

    const processFunctionOutputs = this.processFunction(preparedInputs, preparedOutputs, parameters)

    for (let i = 0; i < this.numberOfOutputs; i++) {
      outputs[i][0].set(processFunctionOutputs[i])
    }
    return true
  }
}

registerProcessor('customProcessor', CustomProcessor)
