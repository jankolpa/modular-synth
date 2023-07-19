/* eslint-disable no-undef */
'use strict'

class EnvProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors () {
    return [{
      name: 'attack',
      defaultValue: 500,
      minValue: 1,
      maxValue: 5000,
      automationRate: 'k-rate'
    }, {
      name: 'decay',
      defaultValue: 500,
      minValue: 1,
      maxValue: 5000,
      automationRate: 'k-rate'
    }, {
      name: 'sustain',
      defaultValue: 0.8,
      minValue: 0,
      maxValue: 1,
      automationRate: 'k-rate'
    }, {
      name: 'release',
      defaultValue: 500,
      minValue: 1,
      maxValue: 5000,
      automationRate: 'k-rate'
    }]
  }

  constructor () {
    super()
    this.running = true
    this.ioAssignment = [[false], [false]]

    this.open = false
    this.lastOpen = 0
    this.lastClose = 0
    this.currentState = -1

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
    if (this.ioAssignment[1][0] === false || this.ioAssignment[0][0] === false) {
      return true
    }

    const input1 = inputs[0]
    const input1Channel = input1[0]

    const output1 = outputs[0]
    const output1Channel = output1[0]

    if (this.open === false && input1Channel[0] === 1) {
      this.open = true
      this.lastOpen = currentTime
    }
    if (this.open === true && input1Channel[0] === 0) {
      this.open = false
      this.lastClose = currentTime
    }

    if (this.open === true) {
      if (currentTime - this.lastOpen < parameters.attack / 1000) {
        // CurrentState 0 --> Attack
        this.currentState = 0
      } else if (currentTime - this.lastOpen < parameters.attack / 1000 + parameters.decay / 1000) {
        // CurrentState 1 --> Decay
        this.currentState = 1
      } else {
        // CurrentState 2 --> Sustain
        this.currentState = 2
      }
    } else {
      if (currentTime - this.lastClose < parameters.release / 1000) {
        // CurrentState 3 --> Release
        this.currentState = 3
      } else {
        // CurrentState -1 --> Idle-State
        this.currentState = -1
      }
    }

    for (let i = 0; i < output1Channel.length; ++i) {
      if (this.currentState === 0) {
        const realtiveTimeFactor = (currentTime - this.lastOpen) / (parameters.attack / 1000)
        output1Channel[i] = realtiveTimeFactor
      } else if (this.currentState === 1) {
        const realtiveTimeFactor = (currentTime - this.lastOpen - (parameters.attack / 1000)) / (parameters.decay / 1000)
        output1Channel[i] = 1 - realtiveTimeFactor * (1 - parameters.sustain)
      } else if (this.currentState === 2) {
        output1Channel[i] = parameters.sustain
      } else if (this.currentState === 3) {
        const realtiveTimeFactor = (currentTime - this.lastClose) / (parameters.release / 1000)
        output1Channel[i] = (1 - realtiveTimeFactor) * parameters.sustain
      } else {
        output1Channel[i] = 0
      }
    }

    return true
  }
}

registerProcessor('envProcessor', EnvProcessor)
