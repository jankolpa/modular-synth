/* eslint-disable no-undef */
'use strict'

class GateProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors () {
    return [{
      name: 'length',
      defaultValue: 1000,
      minValue: 1,
      maxValue: 5000,
      automationRate: 'k-rate'
    }, {
      name: 'lengthAdjust',
      defaultValue: 0,
      minValue: -1,
      maxValue: 1,
      automationRate: 'a-rate'
    }]
  }

  constructor () {
    super()
    this.running = true
    this.ioAssignment = [[false, false], [false]]

    this.open = false
    this.lastClick = 0

    this.port.onmessage = (e) => {
      if (e.data === 'killProzess') {
        this.running = false
      } else if (e.data instanceof Array) {
        if (e.data.length === 2) {
          this.ioAssignment = e.data
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
    if (this.ioAssignment[1][0] === false || this.ioAssignment[0][1] === false) {
      return true
    }

    const input1 = inputs[0]
    const input1Channel = input1[0]

    const input2 = inputs[1]
    const input2Channel = input2[0]

    const output1 = outputs[0]
    const output1Channel = output1[0]

    let currentLength = parseFloat(parameters.length)
    if (this.ioAssignment[0][0] === true) {
      const adjustValue = parseFloat(parameters.lengthAdjust) * input1Channel[0]
      if (adjustValue >= 0) {
        currentLength = currentLength * (1 + 3 * adjustValue)
      } else {
        currentLength = currentLength / (1 + 3 * Math.abs(adjustValue))
      }
    }

    if (currentTime - this.lastClick < currentLength / 1000) {
      this.open = true
    } else {
      this.open = false
    }

    for (let i = 0; i < output1Channel.length; ++i) {
      if (this.ioAssignment[0][1] === false || input2Channel === undefined) {
        output1Channel[i] = 0
      } else {
        if (input2Channel[i] === 1) {
          this.lastClick = currentTime
        }

        if (this.open) {
          output1Channel[i] = 1
        } else {
          output1Channel[i] = 0
        }
      }
    }

    return true
  }
}

registerProcessor('gateProcessor', GateProcessor)
