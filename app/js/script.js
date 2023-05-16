'use strict'

const connectionList = []
const plugList = []
let mousePosX = 0
let mousePosY = 0

// create grid
let gridHeight = (document.body.offsetHeight - document.getElementById('top-bar').offsetHeight) / 2
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
let isScrollingLeft = false
let isScrollingRight = false
grid.on('dragstart', () => {
  isDragging = true
})
grid.on('dragstop', () => {
  isDragging = false

  // temporary
  connectionList.forEach(conn => {
    conn.update()
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

// load modules
let consoleData

const xhr = new XMLHttpRequest()
xhr.overrideMimeType('application/json')
xhr.open('GET', '../app/moduleConfig.json', true)
xhr.onreadystatechange = function () {
  // eslint-disable-next-line eqeqeq
  if (xhr.readyState == 4 && xhr.status == '200') {
    consoleData = JSON.parse(xhr.responseText)
    loadModule(0)
    loadModule(1)
    loadModule(0)
    loadModule(1)
  }
}
xhr.send(null)

function loadModule (index) {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', '../app/html/' + consoleData.modules[index].name + '.html', false)
  xhr.onreadystatechange = function () {
    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
      const newWidget = grid.addWidget({ w: consoleData.modules[index].width, h: 1, noResize: true, content: '<div class="module">' + xhr.responseText + '</div>' })
      const plugs = newWidget.getElementsByClassName('plug-button')
      for (let i = 0; i < plugs.length; i++) {
        plugs[i].addEventListener('mousedown', (e) => {
          if (e.button === 0) {
            let alreadyUsed = false
            if (e.shiftKey === false || plugs[i].getAttribute('type') === 'in') {
              for (let j = connectionList.length - 1; j >= 0; j--) {
                if (connectionList[j].startElem === plugs[i] || connectionList[j].endElem === plugs[i]) {
                  alreadyUsed = true

                  if (connectionList[j].endElem === plugs[i]) {
                    connectionList[j].endElem = null
                  } else {
                    connectionList[j].startElem = connectionList[j].endElem
                    connectionList[j].endElem = null
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
              // eslint-disable-next-line no-undef
              connectionList.push(new Connection(canvas, plugs[i], null))

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
    }
  }
  xhr.send()
}

// on resize-event
const style = document.createElement('style')
document.head.appendChild(style)

addEventListener('resize', (event) => {
  gridHeight = (document.body.offsetHeight - document.getElementById('top-bar').offsetHeight) / 2
  document.getElementsByClassName('grid-stack')[0].style.width = '' + gridHeight * 6 + 'px'
  canvas.style.width = '' + gridHeight * 6 + 'px'

  style.innerHTML = '.grid-stack{ height: ' + 2 * gridHeight + 'px !important; min-height: ' + 2 * gridHeight + 'px !important; }' +
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
    // temporary
    connectionList.forEach(conn => {
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

            connectionList[index].endElem = plug
            connectionList[index].update()

            if (plug.getAttribute('type') === 'in') {
              let removeIndex = -1
              for (let i = 0; i < connectionList.length; i++) {
                if ((connectionList[i].endElem === plug || connectionList[i].startElem === plug) && i !== index) {
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
