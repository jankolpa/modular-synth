'use strict'
import Connection from '../dist/connection.js'
import VcoModule from '../dist/modules/vcoModule.js'
import VcaModule from '../dist/modules/vcaModule.js'
import AudioModule from '../dist/modules/audioModule.js'
import MixerModule from '../dist/modules/mixerModule.js'
import WnModule from '../dist/modules/wnModule.js'
import LfoModule from '../dist/modules/lfoModule.js'
import VisModule from '../dist/modules/visModule.js'
import ClockModule from '../dist/modules/clockModule.js'
import GateModule from '../dist/modules/gateModule.js'
import EnvModule from '../dist/modules/envModule.js'

const connectionList = []
const plugList = []
let mousePosX = 0
let mousePosY = 0

const audioContext = new (window.AudioContext || window.webkitAudioContext)()
let audioContextAllowed = false
const moduleArray = new Map()
let moduleIDCounter = 0
let connectionColorID = 0
const connectionColorAmount = 4

// create grid
let gridHeight = (document.body.offsetHeight - document.getElementById('top-bar').offsetHeight) / 2 + 3
document.getElementsByClassName('grid-stack')[0].style.width = '' + gridHeight * 6 + 'px'
// eslint-disable-next-line no-undef
const grid = GridStack.init({
  cellHeight: gridHeight,
  minRow: 2,
  maxRow: 2,
  margin: 0,
  column: 50,
  float: true,
  disableOneColumnMode: true,
  animate: false
})

// on event if user drags item to the left or right
let isDragging = false
let draggingElement = null
let isScrollingLeft = false
let isScrollingRight = false
grid.on('dragstart', (e) => {
  isDragging = true
  draggingElement = e.target
})
grid.on('dragstop', (e) => {
  isDragging = false
  draggingElement = null

  connectionList.forEach(conn => {
    if ((conn.startModule.moduleElement === e.target.getElementsByClassName('module')[0]) || (conn.endModule.moduleElement === e.target.getElementsByClassName('module')[0])) {
      conn.update()
    }
  })
})

let scrollInterval
function startScrollLeft () {
  isScrollingLeft = true
  scrollInterval = setInterval(() => {
    window.scrollBy(-15, 0)
  }, 15)
};
function stopScrollLeft () {
  isScrollingLeft = false
  clearInterval(scrollInterval)
};
function startScrollRight () {
  isScrollingRight = true
  scrollInterval = setInterval(() => {
    window.scrollBy(15, 0)
  }, 15)
};
function stopScrollRight () {
  isScrollingRight = false
  clearInterval(scrollInterval)
};

// handle connection
const canvas = document.getElementById('line-canvas')
canvas.style.width = document.getElementsByClassName('grid-stack')[0].style.width

function getPlugIDfromPlug (plug) {
  let plugID = -1
  plug.classList.forEach(element => {
    if (element.startsWith('index')) {
      plugID = parseInt(element.charAt(6))
    }
  })
  return plugID
}

// load modules
let consoleData

const xhr = new XMLHttpRequest()
xhr.overrideMimeType('application/json')
xhr.open('GET', '../app/moduleConfig.json', true)
xhr.onreadystatechange = function () {
  // eslint-disable-next-line eqeqeq
  if (xhr.readyState == 4 && xhr.status == '200') {
    consoleData = JSON.parse(xhr.responseText)
    initModuleMenu()
    loadModule(1, 0, 0)
    // loadModule(6, 3, 0)
    // loadModule(5, 8, 0)
    // loadModule(0, 11, 0)
    // loadModule(3, 14, 0)
    // loadModule(2, 0, 1)
    // loadModule(7, 2, 1)
    // loadModule(8, 4, 1)
    // loadModule(9, 6, 1)
    // loadModule(1, 9, 1)
    // loadModule(3, 11, 1)
    // loadModule(4, 14, 1)
    // loadModule(2, 16, 1)
    // loadModule(2, 18, 1)
  }
}

loadSynth()
// loads all custom processors
async function loadSynth () {
  const modules = [
    '../dist/processors/wnProcessor.js',
    '../dist/processors/vcaProcessor.js',
    '../dist/processors/helperToPosProcessor.js',
    '../dist/processors/clockProcessor.js',
    '../dist/processors/gateProcessor.js',
    '../dist/processors/envProcessor.js'
  ]
  for (let i = 0; i < modules.length; i++) {
    await audioContext.audioWorklet.addModule(modules[i])
  }
  xhr.send(null)
}

function initModuleMenu () {
  const addModuleMenu = document.getElementsByClassName('add-module-menu')[0]
  for (let index = 0; index < consoleData.modules.length; index++) {
    const moduleMenuElement = document.createElement('a')
    moduleMenuElement.innerHTML = consoleData.modules[index].name
    moduleMenuElement.setAttribute('class', 'dropdown-item')
    moduleMenuElement.setAttribute('href', '#')

    moduleMenuElement.addEventListener('click', function () {
      let nextSpaceY0 = 0
      let nextSpaceY1 = 0
      grid.engine.nodes.forEach(node => {
        console.log()
        if (node.y === 0 && (node.x - nextSpaceY0) < consoleData.modules[index].width && (node.x + node.w) > nextSpaceY0) {
          nextSpaceY0 = node.x + node.w
        } else if (node.y === 1 && (node.x - nextSpaceY1) < consoleData.modules[index].width && (node.x + node.w) > nextSpaceY1) {
          nextSpaceY1 = node.x + node.w
        }
      })

      if (nextSpaceY0 <= nextSpaceY1) {
        loadModule(index, nextSpaceY0, 0)
      } else {
        loadModule(index, nextSpaceY1, 1)
      }
    })

    addModuleMenu.appendChild(moduleMenuElement)
  }
}

function loadModule (index, placeX, placeY) {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', '../app/html/' + consoleData.modules[index].id + '.html', false)
  xhr.onreadystatechange = function () {
    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
      const newWidget = grid.addWidget({
        w: consoleData.modules[index].width,
        h: 1,
        x: placeX,
        y: placeY,
        noResize: true,
        content: '<div class="module">' + xhr.responseText + '</div>'
      })

      // create module
      let thisModule = null
      const currentModuleID = '' + moduleIDCounter + '-' + consoleData.modules[index].id
      const moduleElement = newWidget.getElementsByClassName('module')[0]

      // temporary
      if (consoleData.modules[index].id === 'vcoModule') {
        thisModule = new VcoModule(audioContext, moduleElement)
      } else if (consoleData.modules[index].id === 'audioModule') {
        thisModule = new AudioModule(audioContext, moduleElement)
      } else if (consoleData.modules[index].id === 'vcaModule') {
        thisModule = new VcaModule(audioContext, moduleElement)
      } else if (consoleData.modules[index].id === 'mixerModule') {
        thisModule = new MixerModule(audioContext, moduleElement)
      } else if (consoleData.modules[index].id === 'wnModule') {
        thisModule = new WnModule(audioContext, moduleElement)
      } else if (consoleData.modules[index].id === 'lfoModule') {
        thisModule = new LfoModule(audioContext, moduleElement)
      } else if (consoleData.modules[index].id === 'visModule') {
        thisModule = new VisModule(audioContext, moduleElement)
      } else if (consoleData.modules[index].id === 'clockModule') {
        thisModule = new ClockModule(audioContext, moduleElement)
      } else if (consoleData.modules[index].id === 'gateModule') {
        thisModule = new GateModule(audioContext, moduleElement)
      } else if (consoleData.modules[index].id === 'envModule') {
        thisModule = new EnvModule(audioContext, moduleElement)
      }

      moduleArray.set(currentModuleID, thisModule)
      moduleIDCounter++

      // add functionality to plugs
      const plugs = newWidget.getElementsByClassName('plug-button')
      for (let i = 0; i < plugs.length; i++) {
        plugs[i].addEventListener('mousedown', (e) => {
          if (e.button === 0) {
            let alreadyUsed = false
            if (e.shiftKey === false || plugs[i].getAttribute('type') === 'in') {
              for (let j = connectionList.length - 1; j >= 0; j--) {
                if (connectionList[j].startElem === plugs[i] || connectionList[j].endElem === plugs[i]) {
                  alreadyUsed = true
                  connectionList[j].disconnectModules()

                  if (connectionList[j].endElem === plugs[i]) {
                    connectionList[j].endElem = null
                    connectionList[j].endModule = null
                    connectionList[j].endInput = null
                  } else {
                    connectionList[j].startElem = connectionList[j].endElem
                    connectionList[j].startModule = connectionList[j].endModule
                    connectionList[j].startOutput = connectionList[j].endInput
                    connectionList[j].endElem = null
                    connectionList[j].endModule = null
                    connectionList[j].endInput = null
                    connectionList[j].rewriteLine()
                  }

                  connectionList[j].updateEndCords(mousePosX, mousePosY)

                  if (connectionList[j].startElem.getAttribute('type') === 'in') {
                    document.getElementsByClassName('grid-stack')[0].setAttribute('connect-to', 'out')
                  } else {
                    document.getElementsByClassName('grid-stack')[0].setAttribute('connect-to', 'in')
                  }

                  connectionList[j].startElem.setAttribute('selected', true)
                  return
                }
              }
            }

            if (alreadyUsed === false) {
              connectionList.push(new Connection(canvas, plugs[i], null, thisModule, getPlugIDfromPlug(plugs[i]), connectionColorID))
              connectionColorID++
              connectionColorID = connectionColorID % connectionColorAmount

              if (plugs[i].getAttribute('type') === 'in') {
                document.getElementsByClassName('grid-stack')[0].setAttribute('connect-to', 'out')
              } else {
                document.getElementsByClassName('grid-stack')[0].setAttribute('connect-to', 'in')
              }

              plugs[i].setAttribute('selected', true)
            }
          }
        })
        plugList.push(plugs[i])
      }

      // add functionality to delete-button
      const deleteButtonElement = newWidget.getElementsByClassName('delete-button')[0]
      deleteButtonElement.addEventListener('click', function () {
        // deleting a module
        const removeArray = []
        for (let index = 0; index < connectionList.length; index++) {
          if (connectionList[index].endModule === thisModule || connectionList[index].startModule === thisModule) {
            connectionList[index].disconnectModules()
            connectionList[index].removeLine()
            removeArray.push(index)
          }
        }
        if (removeArray.length >= 0) {
          for (let index = removeArray.length - 1; index >= 0; index--) {
            connectionList.splice(removeArray[index], 1)
          }
        }

        thisModule.deleteNode()
        newWidget.remove()
        grid.removeWidget(newWidget)
      })
    }
  }
  xhr.send()
}

// --- EVENTS ------------------------------------------------------------------------------------------------
const style = document.createElement('style')
document.head.appendChild(style)

addEventListener('resize', (event) => {
  gridHeight = (document.body.offsetHeight - document.getElementById('top-bar').offsetHeight) / 2 + 3
  document.getElementsByClassName('grid-stack')[0].style.width = '' + gridHeight * 6 + 'px'
  canvas.style.width = '' + gridHeight * 6 + 'px'

  style.innerHTML = '.grid-stack{ height: ' + (2 * gridHeight + 3) + 'px !important; min-height: ' + 2 * gridHeight + 'px !important; }' +
        '.grid-stack-item { height: ' + gridHeight + 'px !important; min-height: ' + gridHeight + 'px !important; }' +
        ' .grid-stack-item-content { min-height: ' + gridHeight + 'px !important; }' +
        ' .grid-stack-item[gs-y="1"]:not(.ui-draggable-dragging) { top: ' + gridHeight + 'px !important; }'

  grid.opts.cellHeight = gridHeight

  connectionList.forEach(conn => {
    conn.update()
  })
})

// on mouse move event
addEventListener('mousemove', (event) => {
  for (let index = 0; index < connectionList.length; index++) {
    if (connectionList[index].endElem === null) {
      plugList.forEach(plug => {
        const box = plug.getBoundingClientRect()
        if (event.pageX > box.left + window.scrollX && event.pageX < box.left + window.scrollX + box.width &&
                    event.pageY > box.top + window.scrollY && event.pageY < box.top + window.scrollY + box.height) {
          plug.setAttribute('hover', true)
        } else {
          plug.setAttribute('hover', false)
        }
      })
    }
  }

  mousePosX = event.pageX
  mousePosY = event.pageY

  // move modules
  if (isDragging) {
    connectionList.forEach(conn => {
      // temporary
      // if ((conn.startModule.moduleElement === draggingElement.getElementsByClassName('module')[0]) || (conn.endModule.moduleElement === draggingElement.getElementsByClassName('module')[0])) {
      conn.update()
    })

    const edgeSize = 80
    const bodyWidth = document.body.offsetWidth
    if (event.clientX < edgeSize) {
      if (!isScrollingLeft) { startScrollLeft() }
    } else if (event.clientX > (bodyWidth - edgeSize)) {
      if (!isScrollingRight) { startScrollRight() }
    } else {
      if (isScrollingLeft) {
        stopScrollLeft()
      }
      if (isScrollingRight) {
        stopScrollRight()
      }
    }
  } else {
    if (isScrollingLeft) {
      stopScrollLeft()
    }
    if (isScrollingRight) {
      stopScrollRight()
    }
  }

  // move connection
  connectionList.forEach(conn => {
    if (conn.endElem === null) {
      conn.updateEndCords(event.pageX, event.pageY)
    }
  })
})

addEventListener('mouseup', (event) => {
  if (audioContextAllowed === false) {
    audioContext.resume()
    audioContextAllowed = true
  }

  if (event.button === 0) {
    const hitPlug = false
    for (let index = 0; index < connectionList.length; index++) {
      if (connectionList[index].endElem === null) {
        document.getElementsByClassName('grid-stack')[0].setAttribute('connect-to', '')
        plugList.forEach(plug => {
          plug.setAttribute('selected', false)
          const box = plug.getBoundingClientRect()

          if (event.pageX > box.left + window.scrollX && event.pageX < box.left + window.scrollX + box.width &&
                        event.pageY > box.top + window.scrollY && event.pageY < box.top + window.scrollY + box.height) {
            if (connectionList[index].startElem === plug) {
              return
            }

            let existsAlready = false
            connectionList.forEach(conn => {
              if ((conn.startElem === connectionList[index].startElem && conn.endElem === plug) ||
                                (conn.startElem === plug && conn.endElem === connectionList[index].startElem)) { existsAlready = true }
            })
            if (existsAlready) {
              return
            }

            if (connectionList[index].startElem.getAttribute('type') === plug.getAttribute('type')) {
              return
            }

            // New Connection-Endpoint
            connectionList[index].endElem = plug
            connectionList[index].update()
            moduleArray.forEach(module => {
              if (module.moduleElement === plug.parentElement.parentElement) {
                connectionList[index].endModule = module
              }
            })
            connectionList[index].endInput = getPlugIDfromPlug(plug)
            connectionList[index].connectModules()

            if (plug.getAttribute('type') === 'in') {
              let removeIndex = -1
              for (let i = 0; i < connectionList.length; i++) {
                if ((connectionList[i].endElem === plug || connectionList[i].startElem === plug) && i !== index) {
                  connectionList[i].disconnectModules()
                  connectionList[i].removeLine()
                  removeIndex = i
                }
              }
              if (removeIndex !== -1) {
                connectionList.splice(removeIndex, 1)
              }
            }
          }
        })
      }
    }

    if (hitPlug === false) {
      let removeIndex = -1
      for (let index = 0; index < connectionList.length; index++) {
        if (connectionList[index].endElem === null) {
          connectionList[index].removeLine()
          removeIndex = index
        }
      }
      if (removeIndex !== -1) {
        connectionList.splice(removeIndex, 1)
      }
    }
  }
})
