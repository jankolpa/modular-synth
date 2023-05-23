'use strict'

class HelperToPosProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors () {
    return []
  }

  constructor () {
    super()
    this.running = true
    this.isUsed = false

    this.port.onmessage = (e) => {
      if (e.data === 'killProzess') {
        this.running = false
      } else if (e.data === 'isUsed') {
        this.isUsed = true
      } else if (e.data === 'isNotUsed') {
        this.isUsed = false
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
    if (this.isUsed === false) {
      return true
    }

    const input1 = inputs[0]
    const input1Channel = input1[0]

    const output1 = outputs[0]
    const output1Channel = output1[0]

    for (let i = 0; i < output1Channel.length; ++i) {
      output1Channel[i] = (input1Channel[i] + 1) / 2
    }

    return true
  }
}

registerProcessor('helperToPosProcessor', HelperToPosProcessor)
