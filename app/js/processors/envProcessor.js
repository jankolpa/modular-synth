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
      name: 'attackAdjust',
      defaultValue: 0,
      minValue: -1,
      maxValue: 1,
      automationRate: 'a-rate'
    }, {
      name: 'decay',
      defaultValue: 500,
      minValue: 1,
      maxValue: 5000,
      automationRate: 'k-rate'
    }, {
      name: 'decayAdjust',
      defaultValue: 0,
      minValue: -1,
      maxValue: 1,
      automationRate: 'a-rate'
    }, {
      name: 'sustain',
      defaultValue: 0.8,
      minValue: 0,
      maxValue: 1,
      automationRate: 'k-rate'
    }, {
      name: 'sustainAdjust',
      defaultValue: 0,
      minValue: -1,
      maxValue: 1,
      automationRate: 'a-rate'
    }, {
      name: 'release',
      defaultValue: 500,
      minValue: 1,
      maxValue: 5000,
      automationRate: 'k-rate'
    }, {
      name: 'releaseAdjust',
      defaultValue: 0,
      minValue: -1,
      maxValue: 1,
      automationRate: 'a-rate'
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
    this.lastReachedVolume = 0

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
    if (this.ioAssignment[1][0] === false || this.ioAssignment[0][4] === false) {
      return true
    }

    const input1 = inputs[0]
    const input1Channel = input1[0]

    const input2 = inputs[1]
    const input2Channel = input2[0]

    const input3 = inputs[2]
    const input3Channel = input3[0]

    const input4 = inputs[3]
    const input4Channel = input4[0]

    const input5 = inputs[4]
    const input5Channel = input5[0]

    let currentAttack = parseFloat(parameters.attack)
    if (this.ioAssignment[0][0] === true) {
      const adjustValue = parseFloat(parameters.attackAdjust) * input1Channel[0]
      if (adjustValue >= 0) {
        currentAttack = currentAttack * (1 + 9 * adjustValue)
      } else {
        currentAttack = currentAttack / (1 + 9 * Math.abs(adjustValue))
      }
    }

    let currentDecay = parseFloat(parameters.decay)
    if (this.ioAssignment[0][1] === true) {
      const adjustValue = parseFloat(parameters.decayAdjust) * input2Channel[0]
      if (adjustValue >= 0) {
        currentDecay = currentDecay * (1 + 9 * adjustValue)
      } else {
        currentDecay = currentDecay / (1 + 9 * Math.abs(adjustValue))
      }
    }

    let currentSustain = parseFloat(parameters.sustain)
    if (this.ioAssignment[0][2] === true) {
      const adjustValue = parseFloat(parameters.sustainAdjust) * input3Channel[0]
      if (adjustValue >= 0) {
        currentSustain = currentSustain * (1 + 9 * adjustValue)
      } else {
        currentSustain = currentSustain / (1 + 9 * Math.abs(adjustValue))
      }
    }

    let currentRelease = parseFloat(parameters.release)
    if (this.ioAssignment[0][3] === true) {
      const adjustValue = parseFloat(parameters.releaseAdjust) * input4Channel[0]
      if (adjustValue >= 0) {
        currentRelease = currentRelease * (1 + 9 * adjustValue)
      } else {
        currentRelease = currentRelease / (1 + 9 * Math.abs(adjustValue))
      }
    }

    const output1 = outputs[0]
    const output1Channel = output1[0]

    if (this.open === false && input5Channel[0] > 0.85) {
      this.open = true
      this.lastOpen = currentTime
    }
    if (this.open === true && input5Channel[0] < 0.15) {
      this.open = false
      this.lastClose = currentTime
    }

    if (this.open === true) {
      if (currentTime - this.lastOpen < currentAttack / 1000) {
        // CurrentState 0 --> Attack
        this.currentState = 0
      } else if (currentTime - this.lastOpen < currentAttack / 1000 + currentDecay / 1000) {
        // CurrentState 1 --> Decay
        this.currentState = 1
      } else {
        // CurrentState 2 --> Sustain
        this.currentState = 2
      }
    } else {
      if (currentTime - this.lastClose < currentRelease / 1000) {
        // CurrentState 3 --> Release
        this.currentState = 3
      } else {
        // CurrentState -1 --> Idle-State
        this.currentState = -1
        this.lastReachedVolume = 0
      }
    }

    for (let i = 0; i < output1Channel.length; ++i) {
      if (this.currentState === 0) {
        const realtiveTimeFactor = (currentTime - this.lastOpen) / (currentAttack / 1000)
        output1Channel[i] = realtiveTimeFactor
        this.lastReachedVolume = output1Channel[i]
      } else if (this.currentState === 1) {
        const realtiveTimeFactor = (currentTime - this.lastOpen - (currentAttack / 1000)) / (currentDecay / 1000)
        output1Channel[i] = 1 - realtiveTimeFactor * (1 - currentSustain)
        this.lastReachedVolume = output1Channel[i]
      } else if (this.currentState === 2) {
        output1Channel[i] = currentSustain
        this.lastReachedVolume = output1Channel[i]
      } else if (this.currentState === 3) {
        const realtiveTimeFactor = (currentTime - this.lastClose) / (currentRelease / 1000)
        output1Channel[i] = (1 - realtiveTimeFactor) * this.lastReachedVolume
      } else {
        output1Channel[i] = 0
      }
    }

    return true
  }
}

registerProcessor('envProcessor', EnvProcessor)
