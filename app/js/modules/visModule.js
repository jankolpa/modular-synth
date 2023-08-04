'use strict'

import Module from './module.js'

export default class VisModule extends Module {
  constructor (audioContext, moduleElement, widget) {
    super(moduleElement, widget)

    this.numberOfInputs = 1
    this.numberOfOutputs = 0
    this.ioAssignment = [[false], []]

    this.analyser = audioContext.createAnalyser()
    this.fftSizes = [32, 64, 128, 256, 512, 1024, 2048]
    this.analyser.fftSize = this.fftSizes[3]
    this.bufferLength = this.analyser.frequencyBinCount
    this.dataArray = new Uint8Array(this.bufferLength)

    this.canvas = this.moduleElement.getElementsByClassName('visualizer')[0]
    this.canvasContext = this.canvas.getContext('2d')

    this.zoomFactor = 1
    this.canvasIsCleared = false

    // Festlegen der Linienfarbe und -breite
    this.canvasContext.strokeStyle = 'rgb(255, 0, 0)'
    this.canvasContext.lineWidth = 1

    const drawWaveform = function () {
      requestAnimationFrame(drawWaveform)

      if (this.ioAssignment[0][0] === true) {
        this.analyser.getByteTimeDomainData(this.dataArray)

        this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.canvasContext.fillStyle = 'rgb(200, 200, 200)'
        this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height)
        this.canvasContext.beginPath()

        const sliceWidth = this.canvas.width * 1.0 / (this.bufferLength - 1)
        let x = 0

        for (let i = 0; i < this.bufferLength; i++) {
          let v = (256 - this.dataArray[i]) / 128.0
          v = (v - 1) * this.zoomFactor + 1
          const y = v * this.canvas.height / 2

          if (i === 0) {
            this.canvasContext.moveTo(x, y)
          } else {
            this.canvasContext.lineTo(x, y)
          }

          x += sliceWidth
        }

        this.canvasContext.lineTo(this.canvas.width, this.canvas.height / 2)
        this.canvasContext.stroke()

        this.canvasIsCleared = false
      } else {
        if (this.canvasIsCleared === false) {
          this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height)
          this.canvasContext.fillStyle = 'rgb(200, 200, 200)'
          this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height)
          this.canvasContext.beginPath()
          this.canvasContext.moveTo(0, this.canvas.height / 2)
          this.canvasContext.lineTo(this.canvas.width, this.canvas.height / 2)
          this.canvasContext.stroke()
          this.canvasIsCleared = true
        }
      }
    }.bind(this)

    drawWaveform()

    this.slider_0.value = 50
    this.slider_1.value = 0
  }

  initModule () {
    this.slider_0 = this.moduleElement.getElementsByClassName('input-knob')[0]
    this.slider_0.oninput = function () {
      const value = this.slider_0.value
      let newfftId = 6
      if (value < 14) { newfftId = 0 } else if (value < 28) { newfftId = 1 } else if (value < 42) { newfftId = 2 } else if (value < 56) { newfftId = 3 } else if (value < 70) { newfftId = 4 } else if (value < 84) { newfftId = 5 }
      this.analyser.fftSize = this.fftSizes[newfftId]
      this.bufferLength = this.analyser.frequencyBinCount
      this.dataArray = new Uint8Array(this.bufferLength)
    }.bind(this)

    this.slider_1 = this.moduleElement.getElementsByClassName('input-knob')[1]
    this.slider_1.oninput = function () {
      this.zoomFactor = 1 + this.slider_1.value / 100 * 4
    }.bind(this)
  }

  getNodeFromInput () {
    return this.analyser
  }

  connectInput (endInput) {
    this.ioAssignment[0][endInput] = true
  }

  disconnectInput (endInput) {
    this.ioAssignment[0][endInput] = false
  }

  deleteNode () {
    this.wnNode = null
  }
}
