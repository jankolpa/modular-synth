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

// AudioContext für die nutzung von Audio im Browser
const audioContext = new (window.AudioContext || window.webkitAudioContext)()

// AudioContext muss einmal freigegeben werde. audioContextAllowed (Boolean) speichert, ob das schon passiert ist
let audioContextAllowed = false

// modulArray speichert alle eingefügten Module als Module-Objekt
const moduleArray = []

// connectionArray speichert alle Cable-Verbinungen als Connection-Objekt
// (auch das Cable, das der Nutzer gerade zieht)
const connectionArray = []

// plugArray speichert alle plug-<button> aller Module als DOM-Element
const plugArray = []

// dieser Index wird durch jedes neue Cable hochgezählt und ändert damit die Farbe des neuen Cables
let connectionColorIndex = 0
// Anzahl an gespeicherten Farben für Cables
const connectionColorAmount = 4

// aktuelle x-Position der Maus, wird im mouseMove-EventListener aktuell gehalten
let currentMousePosX = 0
// aktuelle y-Position der Maus, wird im mouseMove-EventListener aktuell gehalten
let currentMousePosY = 0

// nachdem die moduleConfig.json eingelesen wurde, wird sie in der moduleConfigData gespeichert
let moduleConfigData

// gridResizeStyle ist ein style-Element, dass die Größenwerte des Gridstack-Stylings bei Resizing überschreibt
const gridResizeStyle = document.createElement('style')
document.head.appendChild(gridResizeStyle)

// ------------- INIT GRID --------------------------------------------------------------------------------------------
// gridHeight wird aus der Bildschirmhöhe berechnet und gibt die Grundlage für alle propotionale Darstellung innerhalb eines Modules
let gridHeight = (document.body.offsetHeight - document.getElementById('top-bar').offsetHeight) / 2 + 3

// mainGrid ist das grundlegende Objekt für eine GridStack-grid
// eslint-disable-next-line no-undef
const mainGrid = GridStack.init({
  cellHeight: gridHeight,
  minRow: 2,
  maxRow: 2,
  margin: 0,
  column: 50,
  float: true,
  disableOneColumnMode: true,
  animate: false
})
document.getElementsByClassName('grid-stack')[0].style.width = '' + gridHeight * 6 + 'px'

// ------------- DRAGGING AND SCREEN-MOVING ---------------------------------------------------------------------------
// isDraggingModule speichert ob ein Modul gerade gedragged wird
let isDraggingModule = false
// isDraggingCable speichert ob ein Cable gerade gedragged wird
let isDraggingCable = false
// isScrollingLeft speichert ob der Bildschirm gerade nach links scrollt
let isScrollingLeft = false
// isScrollingRight speichert ob der Bildschirm gerade nach links scrollt
let isScrollingRight = false

// durch das dragstart Event des mainGrid wird der isDraggingModule-Boolean aktualisiert
mainGrid.on('dragstart', (e) => {
  isDraggingModule = true
})
// durch das dragstop Event des mainGrid wird der isDraggingModule-Boolean aktualisiert
mainGrid.on('dragstop', (e) => {
  isDraggingModule = false

  // Wenn ein Modul abgesetzt wurde und ins Grid springt, werden alle beteidigten Cable aktualisiert
  connectionArray.forEach(conn => {
    if ((conn.startModule.moduleElement === e.target.getElementsByClassName('module')[0]) || (conn.endModule.moduleElement === e.target.getElementsByClassName('module')[0])) {
      conn.update()
    }
  })
})

// scrollingID ist die ID für den ScrollInterval
let scrollingID
// startScrollLeft startet das Scrollen nach links
function startScrollLeft () {
  isScrollingLeft = true
  scrollingID = setInterval(() => {
    window.scrollBy(-15, 0)
  }, 15)
};
// startScrollLeft beendet das Scrollen nach links
function stopScrollLeft () {
  isScrollingLeft = false
  clearInterval(scrollingID)
};
// startScrollLeft startet das Scrollen nach rechts
function startScrollRight () {
  isScrollingRight = true
  scrollingID = setInterval(() => {
    window.scrollBy(15, 0)
  }, 15)
};
// startScrollLeft beendet das Scrollen nach rechts
function stopScrollRight () {
  isScrollingRight = false
  clearInterval(scrollingID)
};

// ------------- CABLE CONNECTIONS ------------------------------------------------------------------------------------
// cableCanvas ist das <svg>-DOM-Element, worauf die Cables gemalt werden
const cableCanvas = document.getElementById('line-canvas')
cableCanvas.style.width = document.getElementsByClassName('grid-stack')[0].style.width

// getPlugIDfromPlug ist eine Hilfsfunktion, die ein Plug als DOM-Element bekommt und durch aus einer class abließt, welchen index dieser Plug hat
// Bsp.: class="index-1" --> 1
function getPlugIDfromPlug (plug) {
  let plugID = -1
  plug.classList.forEach(element => {
    if (element.startsWith('index')) {
      plugID = parseInt(element.charAt(6))
    }
  })
  return plugID
}

// ------------- INIT MODULAR SYNTHESIZER -----------------------------------------------------------------------------
// die Initiation des Modularen Synthesizer funktioniert in diesen Schritten:
// 1. in der startModuleInit() werden Processoren geladen, danach wird dort der moduleConfigXHR ausgeführt und es wird die moduleConfigXHR eingelesen
// 2. wurde die moduleConfigXHR erfolgreich gelesen, wird initModuleMenu() ausgeführt
// 3. in der initModuleMenu() werden alle Module im Menü abgebildet und bekommen ein Click-EventListener, der loadModule() ausführt
// 4. in der loadModule() wird das jeweilige Module geladen und ins mainGrid gesetzt
startModuleInit()

// die function startModuleInit lädt zuerst alle AudioWorkletProcessors und ließt dann die moduleConfig.json
async function startModuleInit () {
  // processorPaths speichert die Pfade zu den AudioWorkletProcessor-Files
  const processorFilePaths = [
    '../dist/processors/wnProcessor.js',
    '../dist/processors/vcaProcessor.js',
    '../dist/processors/helperToPosProcessor.js',
    '../dist/processors/clockProcessor.js',
    '../dist/processors/gateProcessor.js',
    '../dist/processors/envProcessor.js'
  ]

  // Schleife über alle Processor-Pfade, um die Dateien zu laden
  for (let i = 0; i < processorFilePaths.length; i++) {
    await audioContext.audioWorklet.addModule(processorFilePaths[i])
  }

  // die moduleConfig.json wird eingelesen
  moduleConfigXHR.send(null)
}

// moduleConfigXHR ist der XHR, um die moduleConfig.json einzulesen
const moduleConfigXHR = new XMLHttpRequest()
moduleConfigXHR.overrideMimeType('application/json')
moduleConfigXHR.open('GET', '../app/moduleConfig.json', true)
moduleConfigXHR.onreadystatechange = function () {
  // eslint-disable-next-line eqeqeq
  if (moduleConfigXHR.readyState == 4 && moduleConfigXHR.status == '200') {
    moduleConfigData = JSON.parse(moduleConfigXHR.responseText)
    initModuleMenu() // alle Module werden im Menü abgebildet
    loadModule(1, 0, 0) // ein Modul wird direkt manuell geladen
  }
}

// die Funktion initModuleMenu() setzt alle Module als <a> ins Modul-Menü und gibt den <a>-Elementen Funktionalität
function initModuleMenu () {
  // addModuleMenuElement ist ein <div>-DOM-Element in das die Module als <a>-Elemente abgebildet werden
  const addModuleMenuElement = document.getElementsByClassName('add-module-menu')[0]
  // moduleMenuElementList speichert die neu-erstellten <a>-Elemente der einzelnen Module
  const moduleMenuElementList = []

  // eine Schleife, die über die Module der moduleConfig.json läuft
  for (let i = 0; i < moduleConfigData.modules.length; i++) {
    // moduleMenuElement ist das aktuelle <a>-Element für das aktuelle Modul
    const moduleMenuElement = document.createElement('a')
    moduleMenuElement.innerHTML = moduleConfigData.modules[i].name
    moduleMenuElement.setAttribute('class', 'dropdown-item')
    moduleMenuElement.setAttribute('href', '#')

    // dem aktuelle <a>-Element wird die Funktionalität hinzugefügt, dass er beim Click ein neues Modul hinzufügt
    moduleMenuElement.addEventListener('click', function () {
      // Dieser Algorithmus ermittelt den nächsten freien Platz im Grid
      let nextSpaceY0 = 0
      let nextSpaceY1 = 0
      mainGrid.engine.nodes.forEach(node => {
        console.log()
        if (node.y === 0 && (node.x - nextSpaceY0) < moduleConfigData.modules[i].width && (node.x + node.w) > nextSpaceY0) {
          nextSpaceY0 = node.x + node.w
        } else if (node.y === 1 && (node.x - nextSpaceY1) < moduleConfigData.modules[i].width && (node.x + node.w) > nextSpaceY1) {
          nextSpaceY1 = node.x + node.w
        }
      })

      if (nextSpaceY0 <= nextSpaceY1) {
        // Das Modul wird geladen und auf den nächst-freien Platz mit y=0 gesetzt
        loadModule(i, nextSpaceY0, 0)
      } else {
        // Das Modul wird geladen und auf den nächst-freien Platz mit y=1 gesetzt
        loadModule(i, nextSpaceY1, 1)
      }
    })

    // das aktuelle <a>-Element wird der moduleMenuElementList hinzugefügt
    moduleMenuElementList.push(moduleMenuElement)
  }

  // die moduleMenuElementList wird Alphabetisch nach dem Inhalt der <a>-Elemente sortiert
  moduleMenuElementList.sort(function (a, b) {
    if (a.innerHTML < b.innerHTML) {
      return -1
    }
    if (a.innerHTML > b.innerHTML) {
      return 1
    }
    return 0
  })

  // Eine Schleife über alle <a>-Elemente der moduleMenuElementList. Sie werden dem addModuleMenuElement-DOM-Element hinzugefügt
  for (let i = 0; i < moduleMenuElementList.length; i++) {
    addModuleMenuElement.appendChild(moduleMenuElementList[i])
  }
}

// die Funktion loadModule lädt das Modul mit einem index aus der moduleConfig.json und setzt es im grid an die Stelle placeX,placeY
function loadModule (index, placeX, placeY) {
  // moduleHtmlXHR ist der XHR, der die HTML-Datei des aktuellen Modules einließt
  const moduleHtmlXHR = new XMLHttpRequest()
  moduleHtmlXHR.open('GET', '../app/html/' + moduleConfigData.modules[index].id + '.html', false)

  moduleHtmlXHR.onreadystatechange = function () {
    if (moduleHtmlXHR.readyState === XMLHttpRequest.DONE && moduleHtmlXHR.status === 200) {
      // folgender Code wird ausgeführt, sobald die HTML-Datei des Modules  erfolgreich eingelesen wurde

      // newWidget ist das neue GridStack-Widget aus dem neuen Modul
      const newWidget = mainGrid.addWidget({
        w: moduleConfigData.modules[index].width,
        h: 1,
        x: placeX,
        y: placeY,
        noResize: true,
        // die geladene HTML-Datei wird als Inhalt des neuen Widget gesetzt und mit einem <div>-wrapper mit der Klasse "module" umhüllt
        content: '<div class="module">' + moduleHtmlXHR.responseText + '</div>'
      })

      // newModuleObject speichert das neue Modul als Object
      let newModuleObject = null
      // newModuleElement speichert das neue Modul als DOM-Element
      const newModuleElement = newWidget.getElementsByClassName('module')[0]

      // das newModuleObject wird je nach ID der moduleConfig.json-Datei erstellt
      switch (moduleConfigData.modules[index].id) {
        case 'vcoModule':
          newModuleObject = new VcoModule(audioContext, newModuleElement)
          break
        case 'audioModule':
          newModuleObject = new AudioModule(audioContext, newModuleElement)
          break
        case 'vcaModule':
          newModuleObject = new VcaModule(audioContext, newModuleElement)
          break
        case 'mixerModule':
          newModuleObject = new MixerModule(audioContext, newModuleElement)
          break
        case 'wnModule':
          newModuleObject = new WnModule(audioContext, newModuleElement)
          break
        case 'lfoModule':
          newModuleObject = new LfoModule(audioContext, newModuleElement)
          break
        case 'visModule':
          newModuleObject = new VisModule(audioContext, newModuleElement)
          break
        case 'clockModule':
          newModuleObject = new ClockModule(audioContext, newModuleElement)
          break
        case 'gateModule':
          newModuleObject = new GateModule(audioContext, newModuleElement)
          break
        case 'envModule':
          newModuleObject = new EnvModule(audioContext, newModuleElement)
          break
        default:
          break
      }

      // das neue newModuleObject wird in das moduleArray gesetzt
      moduleArray.push(newModuleObject)

      // newModulePlugList speichert alle Plugs des neuen Modules als DOM-Elemente
      const newModulePlugList = newWidget.getElementsByClassName('plug-button')

      // eine Schleife, die über alle Plugs des neuen Modules läuft
      for (let i = 0; i < newModulePlugList.length; i++) {
        // Dem Linksklick auf einen Plug wird Funktionalität hinzugefügt
        newModulePlugList[i].addEventListener('mousedown', (e) => {
          if (e.button === 0) {
            // plugAlreadyConnected speichert, ob das aktuelle Plug schon eine Connection hat
            let plugAlreadyConnected = false

            // Es wird überprüft ob der Nutzer einer Connection löst
            // Dies kann nur der Fall sein wenn der Nutzer 1) auf ein IN-Plug drückt oder 2) auf ein OUT-Plug ohne der Shift-Taste drückt
            if (newModulePlugList[i].getAttribute('type') === 'in' || e.shiftKey === false) {
              // eine Schleift, die über alle bestehenden Connections läuft
              for (let j = connectionArray.length - 1; j >= 0; j--) {
                // gibt es schon eine Connection, die das aktuelle Plug beinhaltet?
                if (connectionArray[j].startElem === newModulePlugList[i] || connectionArray[j].endElem === newModulePlugList[i]) {
                  plugAlreadyConnected = true
                  // die aktuelle Connection wird getrennt
                  connectionArray[j].disconnectModules()

                  // die aktuelle Connection führt jetzt vom alten Startelement zu null (zur Maus)
                  // (falls das alte Startelement getrennt wurde, muss das alte Endelement zum neuen Startelement werden)
                  if (connectionArray[j].endElem === newModulePlugList[i]) {
                    connectionArray[j].endElem = null
                    connectionArray[j].endModule = null
                    connectionArray[j].endInput = null
                  } else {
                    connectionArray[j].startElem = connectionArray[j].endElem
                    connectionArray[j].startModule = connectionArray[j].endModule
                    connectionArray[j].startOutput = connectionArray[j].endInput
                    connectionArray[j].endElem = null
                    connectionArray[j].endModule = null
                    connectionArray[j].endInput = null
                    connectionArray[j].rewriteLine()
                  }

                  connectionArray[j].updateEndCords(currentMousePosX, currentMousePosY)

                  // für CSS-Darstellung bekommt der grid eine Klasse, die asussagt, welchen Plugtypen der Nutzer sucht
                  if (connectionArray[j].startElem.getAttribute('type') === 'in') {
                    document.getElementsByClassName('grid-stack')[0].setAttribute('connect-to', 'out')
                  } else {
                    document.getElementsByClassName('grid-stack')[0].setAttribute('connect-to', 'in')
                  }

                  // für CSS-Darstellung bekommt das Startelement der aktuellen Connection eine Klasse, die aussagt, von wo die Connection kommt
                  connectionArray[j].startElem.setAttribute('selected', true)

                  // der Nutzer soll nur die oberste Connection trennen, auch wenn mehrer Connections diesen Plug betreffen,
                  // deshalb wird die Schleife über alle Connections verlassen
                  return
                }
              }
            }

            // wenn der Nutzer durch sein Klick keine bestehende Connection getrennt hat, (da der IN-Plug leer war oder er einen OUT-Plug mit Shift benutzt hat)
            // dann wird eine neue Connection erstellt
            if (plugAlreadyConnected === false) {
              // neue Connection wird erstellt, vom aktuellen Plug zu null mit dem aktullen FarbIndex
              connectionArray.push(new Connection(cableCanvas, newModulePlugList[i], null, newModuleObject, getPlugIDfromPlug(newModulePlugList[i]), connectionColorIndex))
              connectionColorIndex++
              connectionColorIndex = connectionColorIndex % connectionColorAmount

              // für CSS-Darstellung bekommt der grid eine Klasse, die asussagt, welchen Plugtypen der Nutzer sucht
              if (newModulePlugList[i].getAttribute('type') === 'in') {
                document.getElementsByClassName('grid-stack')[0].setAttribute('connect-to', 'out')
              } else {
                document.getElementsByClassName('grid-stack')[0].setAttribute('connect-to', 'in')
              }

              // für CSS-Darstellung bekommt das Startelement der aktuellen Connection eine Klasse, die aussagt, von wo die Connection kommt
              newModulePlugList[i].setAttribute('selected', true)
            }
          }
        })

        // das aktuelle Plug wird dem allgemeinen PlugArray hinzugefügt
        plugArray.push(newModulePlugList[i])
      }

      // newModuleDeleteElement speichert das DOM-Element des Delete-Buttons des neuen Modules
      const newModuleDeleteElement = newWidget.getElementsByClassName('delete-button')[0]
      // dem Delete-Button wird Funktionalität hinzugefügt
      newModuleDeleteElement.addEventListener('click', function () {
        // removeConnectionsArray werden Indexe für alle Connections gespeichert, die gelöscht werden müssen
        const removeConnectionsArray = []

        // eine Schleife, die über alle bestehenden Connections läuft
        for (let i = 0; i < connectionArray.length; i++) {
          // Wenn eine bestehende Connection das aktuelle (zu löschende) Modul betrifft, wird diese Verbindung getrennt und in das removeConnectionsArray hinzugefügt
          if (connectionArray[i].endModule === newModuleObject || connectionArray[i].startModule === newModuleObject) {
            connectionArray[i].disconnectModules()
            connectionArray[i].removeLine()
            removeConnectionsArray.push(i)
          }
        }

        if (removeConnectionsArray.length >= 0) {
          // eine Schleife, die Rückwerts über alle zu löschende Connection-Indexe läuft und sie aus dem connectionArray entfernt
          for (let i = removeConnectionsArray.length - 1; i >= 0; i--) {
            connectionArray.splice(removeConnectionsArray[i], 1)
          }
        }

        // das Modul-Objekt und Modul-DOM-Element werden gelöscht
        newModuleObject.deleteNode()
        let removeModuleIndex = -1
        // eine Schleife, die über das modulArray läuft, um das aktuelle Modul daraus zu löschen
        for (let i = 0; i < moduleArray.length; i++) {
          if (moduleArray[i] === newModuleObject) {
            removeModuleIndex = i
          }
        }
        moduleArray.splice(removeModuleIndex, 1)
        newWidget.remove()
        mainGrid.removeWidget(newWidget)
      })
    }
  }

  // die HTML-Datei des Modules wird tatsächlich geladen
  moduleHtmlXHR.send()
}

// ------------- EVENTS -----------------------------------------------------------------------------------------------

// Resize-Event: das Grid muss abhängig vom Bildschirm eine neue Höhe und Breite bekommen bekommen
addEventListener('resize', (event) => {
  gridHeight = (document.body.offsetHeight - document.getElementById('top-bar').offsetHeight) / 2 + 3
  document.getElementsByClassName('grid-stack')[0].style.width = '' + gridHeight * 6 + 'px'
  cableCanvas.style.width = '' + gridHeight * 6 + 'px'

  // das gridResizeStyle wird aktualisiert, um die den GridElemente eine richtige Höhe zu geben
  gridResizeStyle.innerHTML = '.grid-stack{ height: ' + (2 * gridHeight + 3) + 'px !important; min-height: ' + 2 * gridHeight + 'px !important; }' +
        '.grid-stack-item { height: ' + gridHeight + 'px !important; min-height: ' + gridHeight + 'px !important; }' +
        ' .grid-stack-item-content { min-height: ' + gridHeight + 'px !important; }' +
        ' .grid-stack-item[gs-y="1"]:not(.ui-draggable-dragging) { top: ' + gridHeight + 'px !important; }'

  mainGrid.opts.cellHeight = gridHeight

  // beim Resizing werden alle Connections aktualisiert
  connectionArray.forEach(conn => {
    conn.update()
  })
})

// MouseMove-Event: Connections, die der Maus folgen werden aktualisiert; wenn der Nutzer ein Modul oder eine Connection draggt wird evtl. der Bildschirm gescrollt
addEventListener('mousemove', (event) => {
  currentMousePosX = event.pageX
  currentMousePosY = event.pageY

  isDraggingCable = false
  // eine Schleife, die über alle Connections läuft und prüft, ob eine Connection kein EndElement hat (dann folgt es der Maus)
  for (let i = 0; i < connectionArray.length; i++) {
    if (connectionArray[i].endElem === null) {
      isDraggingCable = true
      connectionArray[i].updateEndCords(event.pageX, event.pageY)
      // Wenn eine Connection der Maus folgt und die Maus über einem Plug ist, wird diesem Plug die CSS-Klasse "hover" hinzugefügt (jedes Plug wird dafür überprüft)
      plugArray.forEach(plug => {
        const box = plug.getBoundingClientRect()
        if (currentMousePosX > box.left + window.scrollX && currentMousePosX < box.left + window.scrollX + box.width &&
          currentMousePosY > box.top + window.scrollY && currentMousePosY < box.top + window.scrollY + box.height) {
          plug.setAttribute('hover', true)
        } else {
          plug.setAttribute('hover', false)
        }
      })
    }
  }

  // Wenn die Maus bewegt wird und dabei ein Modul gedragged wird, sollen alle Connections aktualisiert werden
  if (isDraggingModule) {
    connectionArray.forEach(conn => {
      conn.update()
    })
  }

  // Wenn ein Modul oder ein Kabel gedragged wird, soll auf BildschirmScrolling überprüft werden
  if (isDraggingModule || isDraggingCable) {
    // edgeSize speichert, wie nah die Maus am Rand des Bildschirms sein muss, damit Scrolling beginnt
    const edgeSize = 80
    const bodyWidth = document.body.offsetWidth
    if (event.clientX < edgeSize && isScrollingLeft === false) {
      startScrollLeft()
    } else if (event.clientX > (bodyWidth - edgeSize) && isScrollingRight === false) {
      startScrollRight()
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
})

// MouseUp-Event: Wird der Mausklick beendet, wird überpüft ob eine neue Connection erstellt wird oder ob eine Connection (Plug->null) gelöscht wird
addEventListener('mouseup', (event) => {
  // wurde der AudioContext noch nicht freigegeben, wird es jetzt gemacht
  if (audioContextAllowed === false) {
    audioContext.resume()
    audioContextAllowed = true
  }

  // es wird nur auf Linksklick reagiert
  if (event.button === 0) {
    // openConnectionExists speichert, ob es eine Connection ohne EndPunkt gibt
    let openConnectionExists = false
    // openConnectionIndex speichert, an welchem Index die offene Verbindung ist
    let openConnectionIndex = -1
    // wasCableConnected speichtert, ob ein Cable (Plug->null) mit einem Plug verbunden wurde
    let wasCableConnected = false

    // eine Schleife, die alle Connections durchläuft und schaut, ob eine Plug->null Connection da ist (dann zieht sie der Nutzer)
    // --> die offene Connection wurde jetzt "abgelegt"
    for (let i = 0; i < connectionArray.length; i++) {
      if (connectionArray[i].endElem === null) {
        openConnectionExists = true
        openConnectionIndex = i

        // für CSS-Darstellung wird dem Grid die Klasse entfert, die aussagte, das der Nutze einen bestimmten Plug suchte
        document.getElementsByClassName('grid-stack')[0].setAttribute('connect-to', '')

        // eine Schleife, die über alle Plugs läuft
        plugArray.forEach(currentPlug => {
          // für CSS-Darstellung wird dem ausgehenden Plug (und auch allen), die entsprechende CSS-Klasse entfernt
          currentPlug.setAttribute('selected', false)
          const plugBoundingBox = currentPlug.getBoundingClientRect()

          // es wird überprüft, ob die Maus mit der offenen Connection über dem aktuellen Plug losgelassen wurd
          if (event.pageX > plugBoundingBox.left + window.scrollX && event.pageX < plugBoundingBox.left + window.scrollX + plugBoundingBox.width &&
                        event.pageY > plugBoundingBox.top + window.scrollY && event.pageY < plugBoundingBox.top + window.scrollY + plugBoundingBox.height) {
            // falls die Maus über dem Plug losgelassen wurde, von dem die offene Connection auch begann, passiert nichts
            if (connectionArray[i].startElem === currentPlug) {
              return
            }

            // falls die Maus über dem Plug losgelassen wurde, zu dem schon die gleiche Connection besteht, passiert nichts
            let existsAlready = false
            // eine Schleife, die alle Connections durchläuft und schaut, ob genau so eine Connection schon besteht --> dann wir existsAlready auf true gesetzt
            connectionArray.forEach(conn => {
              if ((conn.startElem === connectionArray[i].startElem && conn.endElem === currentPlug) ||
                                (conn.startElem === currentPlug && conn.endElem === connectionArray[i].startElem)) { existsAlready = true }
            })
            if (existsAlready) {
              return
            }

            // falls die Maus so losgelassen wird, dass die neue EndPlug vom selben Typ ist, wie der Startplug (IN & IN oder OUT & OUT), passiert nichts
            if (connectionArray[i].startElem.getAttribute('type') === currentPlug.getAttribute('type')) {
              return
            }

            // da der Code bis hierher gekommen ist, kann die offene Connection mit dem aktuelle Plug (über dem die Maus losgelassen wurde) verbunden werden
            wasCableConnected = true
            connectionArray[i].endElem = currentPlug
            connectionArray[i].update()

            // eine Schleife, die alle Module durchläuft, um herauszufinden zu welchem Modul das aktuelle Plug gehört und dieses Modul als EndModul der offenen Connection zu setzen
            moduleArray.forEach(module => {
              if (module.moduleElement === currentPlug.parentElement.parentElement) {
                connectionArray[i].endModule = module
              }
            })
            connectionArray[i].endInput = getPlugIDfromPlug(currentPlug)
            // Nachdem das Connection-Objekt richtig festgelegt wurde, können auch die dazugehörenden Module verbunden werden
            connectionArray[i].connectModules()

            // wenn der aktuelle Plug (neuer Endpunkt der offenen Connection) vom Typ IN ist (diese dürfen nur eine Connection haben),
            // wird überprüft ob eine alte Connection zu diesem Plug gelöscht werden muss
            if (currentPlug.getAttribute('type') === 'in') {
              let removeIndex = -1

              // eine Schleife, die über alle Connections läuft und überprüft, ob es eine alte Connection mit dem aktuellen Plug gibt
              for (let j = 0; j < connectionArray.length; j++) {
                if ((connectionArray[j].endElem === currentPlug || connectionArray[j].startElem === currentPlug) && j !== i) {
                  connectionArray[j].disconnectModules()
                  connectionArray[j].removeLine()
                  removeIndex = j
                }
              }
              // die alte Connection mit dem aktuellen Plug wird evtl. gelöscht
              if (removeIndex !== -1) {
                connectionArray.splice(removeIndex, 1)
              }
            }
          }
        })
      }
    }

    // Wenn es eine Connection ohne Endpunkt gibt und diese nicht mit einem Plug verbunden wurde, wird die offene Verbindung gelöscht
    if (openConnectionExists === true && wasCableConnected === false) {
      if (openConnectionIndex !== -1) {
        connectionArray[openConnectionIndex].removeLine()
        connectionArray.splice(openConnectionIndex, 1)
      }
    }
  }
})
