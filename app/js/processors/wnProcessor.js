'use strict'

class WnProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors () {
    return []
  }

  constructor (aContext) {
    super()
    this.running = true
    this.ioAssignment = [[], [false]]

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
    if (this.ioAssignment[1][0] === false) {
      return true
    }

    const output1 = outputs[0]
    const output1Channel = output1[0]

    for (let i = 0; i < output1Channel.length; ++i) {
      output1Channel[i] = Math.random() * 1.0 - 0.5
    }

    return true
  }
}

registerProcessor('wnProcessor', WnProcessor)
