/* eslint-disable no-undef */
'use strict'

class ClockProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors () {
    return [{
      name: 'bpm',
      defaultValue: 120,
      minValue: 30,
      maxValue: 300,
      automationRate: 'k-rate'
    }]
  }

  constructor () {
    super()
    this.running = true
    this.ioAssignment = [[], [false, false, false]]

    this.lastClick = 0
    this.click = true
    this.counter = -1

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
    if (this.ioAssignment[1][0] === false && this.ioAssignment[1][1] === false && this.ioAssignment[1][2] === false) {
      return true
    }

    const timeDelay = 60 / (parameters.bpm * 4)
    if (currentTime - this.lastClick > timeDelay) {
      this.click = true
    }

    const output1 = outputs[0]
    const output1Channel = output1[0]

    const output2 = outputs[1]
    const output2Channel = output2[0]

    const output3 = outputs[2]
    const output3Channel = output3[0]

    for (let i = 0; i < output1Channel.length; ++i) {
      output1Channel[i] = 0
      output2Channel[i] = 0
      output3Channel[i] = 0

      if (this.click) {
        this.counter = (this.counter + 1) % 4

        output3Channel[i] = 1
        if (this.counter === 0 || this.counter === 2) {
          output2Channel[i] = 1
        }
        if (this.counter === 0) {
          output1Channel[i] = 1
        }
        this.click = false
        this.lastClick = currentTime
      }
    }

    return true
  }
}

registerProcessor('clockProcessor', ClockProcessor)
