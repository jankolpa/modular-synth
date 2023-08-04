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

    this.paramaterMap = new Map()

    this.port.onmessage = (e) => {
      if (e.data === 'killProzess') {
        this.running = false
      } else if (e.data instanceof Array) {
        if (e.data[0] === 'io') {
          if (this.ioAssignment === null) {
            this.ioAssignment = e.data[1]
            this.numberOfInputs = this.ioAssignment[0].length
            this.numberOfOutputs = this.ioAssignment[1].length
          } else {
            this.ioAssignment = e.data[1]
          }
        } else if (e.data[0] === 'fn') {
          try {
            // eslint-disable-next-line no-new-func
            this.processFunction = Function('inputs', 'outputs', 'parameterMap', String(e.data[1]))
          } catch (error) {
            console.error('ERROR: process-Funktion konnte nicht als Funktion eingelesen werden.')
            console.error(error)
            this.port.postMessage('ERROR: process-Funktion konnte nicht als Funktion eingelesen werden.\n\n' + error)
          }
        } else if (e.data[0] === 'initPara') {
          // eslint-disable-next-line no-new-func
          this.paramaterMap.set(e.data[1], { value: e.data[2], minValue: e.data[3], maxValue: e.data[4] })
        } else if (e.data[0] === 'updatePara') {
          // eslint-disable-next-line no-new-func
          this.paramaterMap.get(e.data[1]).value = e.data[2]
          if (this.paramaterMap.get(e.data[1]).value < this.paramaterMap.get(e.data[1]).minValue) {
            this.paramaterMap.get(e.data[1]).value = this.paramaterMap.get(e.data[1]).minValue
          } else if ((this.paramaterMap.get(e.data[1]).value > this.paramaterMap.get(e.data[1]).maxValue)) {
            this.paramaterMap.get(e.data[1]).value = this.paramaterMap.get(e.data[1]).maxValue
          }
        }
      } else {
        console.log('no functionality for message:')
        console.log(e.data)
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

    let processFunctionOutputs = null
    try {
      processFunctionOutputs = this.processFunction(preparedInputs, preparedOutputs, this.paramaterMap)
    } catch (error) {
      console.error('ERROR: process-Funktion konnte nicht ausgeführt werden.')
      console.error(error)
      this.port.postMessage('ERROR: process-Funktion konnte nicht ausgeführt werden.\n\n' + error)
      return false
    }

    for (let i = 0; i < this.numberOfOutputs; i++) {
      if (processFunctionOutputs !== null) {
        outputs[i][0].set(processFunctionOutputs[i])
      }
    }
    return true
  }
}

registerProcessor('customProcessor', CustomProcessor)
