'use strict'

class VcaProcessor extends AudioWorkletProcessor {
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
    this.ioAssignment = [[false, false], [false]]

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
    if (this.ioAssignment[0][1] === false || this.ioAssignment[1][0] === false) {
      return true
    }

    const input1 = inputs[0]
    const input1Channel = input1[0]

    const input2 = inputs[1]
    const input2Channel = input2[0]

    const output1 = outputs[0]
    const output1Channel = output1[0]

    const gain = parameters.gain

    for (let i = 0; i < output1Channel.length; ++i) {
      if (this.ioAssignment[0][0] === false || input1Channel === undefined) {
        output1Channel[i] = input2Channel[i] * gain[0]
      } else {
        if (input1Channel[i] < 0.1) {
          output1Channel[i] = 0
        } else {
          output1Channel[i] = input2Channel[i] * input1Channel[i]
        }
      }
    }

    return true
  }
}

registerProcessor('vcaProcessor', VcaProcessor)
