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
import CustomModule from '../dist/modules/customModule.js'

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

// customModulesArray speicher alle costum-modules des Nutzer in einem Array mit Objekten
const customModulesArray = []
// temporary
customModulesArray.push({
  name: 'Custom Mixer',
  html: '<h1 style="top: 8%; left: 50%;">NEUES<br>MODULE</h1>\n\n<div class="rotary-knob" style="top: 20%; left: 31%;">\n\t<input type="range" class="input-knob" data-diameter="100px" data-src="./assets/knob_1.png" data-sprites="99" />\n\t<div><a class="input-text">GAIN</a></div>\n</div>\n\n<div class="rotary-knob" style="top: 20%; left: 69%;">\n\t<input type="range" class="input-knob" data-diameter="100px" data-src="./assets/knob_1.png" data-sprites="99" />\n\t<div><a class="input-text">MIX</a></div>\n</div>\n\n<div class="plug" style="top: 45%; left: 31%;">\n\t<button class="plug-button index-0" type="in"></button>\n\t<div><a class="plug-text">IN 1</a></div>\n</div>\n\n<div class="plug" style="top: 45%; left: 69%;">\n\t<button class="plug-button index-1" type="in"></button>\n\t<div><a class="plug-text">IN 2</a></div>\n</div>\n\n<div class="plug" style="top: 65%; left: 31%;">\n\t<button class="plug-button index-0" type="out"></button>\n\t<div><a class="plug-text">OUT 1</a></div>\n</div>\n\n<div class="plug" style="top: 65%; left: 69%;">\n\t<button class="plug-button index-1" type="out"></button>\n\t<div><a class="plug-text">OUT 2</a></div>\n</div>\n\n<div class="plug" style="top: 82%; left: 50%;">\n\t<button class="plug-button index-2" type="out"></button>\n\t<div><a class="plug-text">MIX</a></div>\n</div>',
  width: 3,
  numOfInputs: 2,
  numOfOutputs: 3,
  function: 'for (let i = 0; i < outputs[0].length; ++i) {\n\tif(inputs[0] === undefined && inputs[1] === undefined) {\n\t\toutputs[0][i] = 0;\n\t\toutputs[1][i] = 0;\n\t\toutputs[2][i] = 0;\n\t} else if (inputs[0] === undefined) {\n\t\toutputs[0][i] = 0;\n\t\toutputs[1][i] = inputs[1][i] * this.paramaterMap.get("gain").value;\n\t\toutputs[2][i] = inputs[1][i] * this.paramaterMap.get("gain").value;\n\t} else if (inputs[1] === undefined) {\n\t\toutputs[0][i] = inputs[0][i] * this.paramaterMap.get("gain").value;\n\t\toutputs[1][i] = 0;\n\t\toutputs[2][i] = inputs[0][i] * this.paramaterMap.get("gain").value;\n\t} else {\n\t\toutputs[0][i] = inputs[0][i] * this.paramaterMap.get("gain").value;\n\t\toutputs[1][i] = inputs[1][i] * this.paramaterMap.get("gain").value;\n\t\toutputs[2][i] = (inputs[0][i] * (1 - this.paramaterMap.get("mix").value) + inputs[1][i] * this.paramaterMap.get("mix").value) * this.paramaterMap.get("gain").value;\n\t}\n}\nreturn outputs;',
  parameters: [{ name: 'gain', value: 0.8, minValue: 0, maxValue: 1, type: 'exp' }, { name: 'mix', value: 0.5, minValue: 0, maxValue: 1, type: 'lin' }],
  id: 0
})
customModulesArray.push({
  name: 'Empty Module',
  html: '<h1 style="top: 8%; left: 50%;">EMPTY<br>MODULE</h1>\n\n<div class="plug" style="top: 34%; left: 50%;">\n\t<button class="plug-button index-0" type="in"></button>\n\t<div><a class="plug-text">IN</a></div>\n</div>\n\n<div class="plug" style="top: 55%; left: 50%;">\n\t<button class="plug-button index-0" type="out"></button>\n\t<div><a class="plug-text">OUT</a></div>\n</div>\n',
  width: 2,
  numOfInputs: 1,
  numOfOutputs: 1,
  function: 'for (let i = 0; i < outputs[0].length; ++i) {\n\tif(inputs[0] === undefined) {\n\t\toutputs[0][i] = 0;\n\t} else {\n\t\toutputs[0][i] = inputs[0][i];\n\t}\n}\nreturn outputs;',
  parameters: [],
  id: 1
})

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
document.getElementsByClassName('bg-bar-box')[0].style.height = '' + 2 * gridHeight + 'px'

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
// 5. für jedes Modul wird initModuleFunctions() aufgerufen, wo Funktionen für die Plugs und den Delete-Button hinzugefügt werden
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
    '../dist/processors/envProcessor.js',
    '../dist/processors/customProcessor.js'
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
      // die nächsten freien x-Positionen in den 2 Zeilen werden ermittelt
      const nextFreeSpaces = getNextFreeSpace(moduleConfigData.modules[i].width)

      if (nextFreeSpaces[0] <= nextFreeSpaces[1]) {
        // Das Modul wird geladen und auf den nächst-freien Platz mit y=0 gesetzt
        loadModule(i, nextFreeSpaces[0], 0)
      } else {
        // Das Modul wird geladen und auf den nächst-freien Platz mit y=1 gesetzt
        loadModule(i, nextFreeSpaces[1], 1)
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

  // falls schon costum-module im costumModuleArray sind, werden sie sofort ins Menü geladen
  updateCustomModulesMenu()
}

// diese Funktion aktualisiert den unteren Teil des ModuleMenüs mit den custom modules
function updateCustomModulesMenu () {
  // addModuleMenuElement ist das DOM-Element für das module-menü
  const addModuleMenuElement = document.getElementsByClassName('add-module-menu')[0]

  // zuerst wird der costum-module Teil des Menüs gelöscht
  const deleteOldWrapper = document.getElementsByClassName('custom-modules-wrapper')
  if (deleteOldWrapper.length > 0) {
    deleteOldWrapper[0].remove()
  }

  // falls es customModules gibt, werden sie dem Menü hinzugefügt
  if (customModulesArray.length >= 0) {
    // customModulesWrapper ist ein DIV-Element, in dem die costom-module-menüpunkte sind
    const customModulesWrapper = document.createElement('div')
    customModulesWrapper.classList.add('custom-modules-wrapper')

    const dropDownDivider = document.createElement('div')
    dropDownDivider.classList.add('dropdown-divider')
    customModulesWrapper.appendChild(dropDownDivider)

    // moduleMenuElementList ist ein Array, in das die Menüpunkte vorerst hineingefügt werden
    const moduleMenuElementList = []

    // eine Schleife, die über alle customModules läuft und sie nacheinander ins Menü packt
    for (let i = 0; i < customModulesArray.length; i++) {
      // moduleMenuElement ist das <a> Element für den aktuellen Menüpunkt
      const moduleMenuElement = document.createElement('a')
      moduleMenuElement.innerHTML = customModulesArray[i].name
      moduleMenuElement.setAttribute('class', 'dropdown-item')
      moduleMenuElement.setAttribute('href', '#')

      // dem aktuelle <a>-Element wird die Funktionalität hinzugefügt, dass er beim Click ein neues Modul hinzufügt
      moduleMenuElement.addEventListener('click', function () {
      // die nächsten freien x-Positionen in den 2 Zeilen werden ermittelt
        const nextFreeSpaces = getNextFreeSpace(moduleConfigData.modules[i].width)

        if (nextFreeSpaces[0] <= nextFreeSpaces[1]) {
          // Das Modul wird geladen und auf den nächst-freien Platz mit y=0 gesetzt
          loadCustomModule(i, nextFreeSpaces[0], 0)
        } else {
          // Das Modul wird geladen und auf den nächst-freien Platz mit y=1 gesetzt
          loadCustomModule(i, nextFreeSpaces[1], 1)
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

    // Eine Schleife über alle <a>-Elemente der moduleMenuElementList. Sie werden dem customModulesWrapper-DOM-Element hinzugefügt
    for (let i = 0; i < moduleMenuElementList.length; i++) {
      customModulesWrapper.appendChild(moduleMenuElementList[i])
    }

    // der customModulesWrapper wird dem addModuleMenuElement hinzugefügt
    addModuleMenuElement.appendChild(customModulesWrapper)
  }
}

// die function getNextFreeSpace erhält die width des neuen moduls und gibt ein Array mit zwei Zahlen zurück
// die erste zahl ensprächt der nächsten freien x-Position auf y=0, die zweite zahl der nächsten freien x-Position auf y=1
function getNextFreeSpace (width) {
// Dieser Algorithmus ermittelt den nächsten freien Platz im Grid
  let nextSpaceY0 = 0
  let nextSpaceY1 = 0
  mainGrid.engine.nodes.forEach(node => {
    if (node.y === 0 && (node.x - nextSpaceY0) < width && (node.x + node.w) > nextSpaceY0) {
      nextSpaceY0 = node.x + node.w
    } else if (node.y === 1 && (node.x - nextSpaceY1) < width && (node.x + node.w) > nextSpaceY1) {
      nextSpaceY1 = node.x + node.w
    }
  })

  // nextFreeSpaces ist ein Array, das die zwei nächsten freien Plätze in einer Variable zurückgibt
  const nextFreeSpaces = [nextSpaceY0, nextSpaceY1]
  return nextFreeSpaces
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
          newModuleObject = new VcoModule(audioContext, newModuleElement, newWidget)
          break
        case 'audioModule':
          newModuleObject = new AudioModule(audioContext, newModuleElement, newWidget)
          break
        case 'vcaModule':
          newModuleObject = new VcaModule(audioContext, newModuleElement, newWidget)
          break
        case 'mixerModule':
          newModuleObject = new MixerModule(audioContext, newModuleElement, newWidget)
          break
        case 'wnModule':
          newModuleObject = new WnModule(audioContext, newModuleElement, newWidget)
          break
        case 'lfoModule':
          newModuleObject = new LfoModule(audioContext, newModuleElement, newWidget)
          break
        case 'visModule':
          newModuleObject = new VisModule(audioContext, newModuleElement, newWidget)
          break
        case 'clockModule':
          newModuleObject = new ClockModule(audioContext, newModuleElement, newWidget)
          break
        case 'gateModule':
          newModuleObject = new GateModule(audioContext, newModuleElement, newWidget)
          break
        case 'envModule':
          newModuleObject = new EnvModule(audioContext, newModuleElement, newWidget)
          break
        default:
          break
      }

      // das neue newModuleObject wird in das moduleArray gesetzt
      moduleArray.push(newModuleObject)

      // Plugs und der Delete-Button werden für das neue Modul initialisiert
      initModuleFunctions(newWidget, newModuleObject)
    }
  }

  // die HTML-Datei des Modules wird tatsächlich geladen
  moduleHtmlXHR.send()
}

// diese Funktion lädt eines der CustomModules in das Grid
function loadCustomModule (index, placeX, placeY) {
  // newWidget ist das neue GridStack-Widget aus dem neuen Modul
  const newWidget = mainGrid.addWidget({
    w: customModulesArray[index].width,
    h: 1,
    x: placeX,
    y: placeY,
    noResize: true,
    content: '<div class="module"><button class="delete-button"><span class="material-icons">delete</span></button>' + customModulesArray[index].html + '</div>'
  })

  // newModuleObject speichert das neue Modul als Object
  let newModuleObject = null
  // newModuleElement speichert das neue Modul als DOM-Element
  const newModuleElement = newWidget.getElementsByClassName('module')[0]

  // das newModuleObject wird als CustomModule erstellt
  newModuleObject = new CustomModule(audioContext, newModuleElement, customModulesArray[index].numOfInputs, customModulesArray[index].numOfOutputs, customModulesArray[index].function, customModulesArray[index].parameters, customModulesArray[index].id, newWidget)

  // das neue newModuleObject wird in das moduleArray gesetzt
  moduleArray.push(newModuleObject)

  // Plugs und der Delete-Button werden für das neue Modul initialisiert
  initModuleFunctions(newWidget, newModuleObject)
}

function initModuleFunctions (newWidget, newModuleObject) {
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
    deleteModule(newModuleObject, newWidget)
  })
}

function deleteModule (deleteModuleObject, deleteGridWidget) {
  // removeConnectionsArray werden Indexe für alle Connections gespeichert, die gelöscht werden müssen
  const removeConnectionsArray = []

  // eine Schleife, die über alle bestehenden Connections läuft
  for (let i = 0; i < connectionArray.length; i++) {
    // Wenn eine bestehende Connection das aktuelle (zu löschende) Modul betrifft, wird diese Verbindung getrennt und in das removeConnectionsArray hinzugefügt
    if (connectionArray[i].endModule === deleteModuleObject || connectionArray[i].startModule === deleteModuleObject) {
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
  deleteModuleObject.deleteNode()
  let removeModuleIndex = -1
  // eine Schleife, die über das modulArray läuft, um das aktuelle Modul daraus zu löschen
  for (let i = 0; i < moduleArray.length; i++) {
    if (moduleArray[i] === deleteModuleObject) {
      removeModuleIndex = i
    }
  }
  moduleArray.splice(removeModuleIndex, 1)
  deleteGridWidget.remove()
  mainGrid.removeWidget(deleteGridWidget)
}

document.getElementsByClassName('reset-synth')[0].addEventListener('click', function () {
  for (let i = moduleArray.length - 1; i >= 0; i--) {
    deleteModule(moduleArray[i], moduleArray[i].widget)
  }

  loadModule(1, 0, 0)
})

// ------------- CREATE MODULE ----------------------------------------------------------------------------------------

let moduleDropdownCurrent = -1
const moduleEditorElement = document.getElementsByClassName('module-editor')[0]
document.getElementsByClassName('create-module')[0].addEventListener('click', function () {
  moduleEditorElement.classList.add('move-up')
})

const moduleEditorCloseElement = document.getElementsByClassName('editor-close-button')[0]
moduleEditorCloseElement.addEventListener('click', function () {
  moduleEditorElement.classList.remove('move-up')
})

const codeAreaElements = document.getElementsByClassName('code-area')
for (let i = 0; i < codeAreaElements.length; i++) {
  codeAreaElements[i].addEventListener('keydown', (e) => {
    if (e.keyCode === 9) {
      e.preventDefault()

      codeAreaElements[i].setRangeText(
        '\t',
        codeAreaElements[i].selectionStart,
        codeAreaElements[i].selectionStart,
        'end'
      )
    }
  })
}

const moduleDropdownElement = document.getElementsByClassName('create-module-dropdown')[0]
moduleDropdownElement.addEventListener('change', (event) => {
  const moduleEditorButton = document.getElementsByClassName('create-module-button')[0]
  moduleEditorButton.value = 'Create Module'

  let newName = ''
  let newWidth = null
  let newInputs = null
  let newOutputs = null
  let newHTML = ''
  let newJS = ''
  moduleDropdownCurrent = -1

  const parameterListElement = document.getElementsByClassName('parameter-list')[0]
  parameterListElement.innerHTML = ''

  if (event.target.value !== '[create new]') {
    const index = parseInt(event.target.value.substring(0, 2)) - 1
    newName = customModulesArray[index].name
    newWidth = customModulesArray[index].width
    newInputs = customModulesArray[index].numOfInputs
    newOutputs = customModulesArray[index].numOfOutputs
    newHTML = customModulesArray[index].html
    newJS = customModulesArray[index].function

    moduleEditorButton.value = 'Update Module'
    moduleDropdownCurrent = index

    for (let i = 0; i < customModulesArray[index].parameters.length; i++) {
      const newParamaterLI = document.createElement('li')
      newParamaterLI.setAttribute('class', 'list-group-item form-inline p-2 w-1')
      newParamaterLI.innerHTML = 'Name: <input required type="text" class="form-control parameter-input-name mr-1 d-inline parameter-name" placeholder=""> Value: <input required type="number" step="0.001" class="form-control parameter-input-number mr-1 d-inline parameter-value" placeholder=""> Min: <input required type="number" step="0.001" class="form-control parameter-input-number mr-1 d-inline  parameter-min" placeholder=""> Max: <input required type="number" step="0.001" class="form-control parameter-input-number mr-1 d-inline parameter-max" placeholder=""> Type: <select required class="form-control mr-1 parameter-input-type d-inline"><option>lin</option><option>exp</option><option>log</option></select> <button class="btn btn-secondary pt-1 pl-1 pr-1 pb-0 align-middle float-right"><span class="material-icons">delete</span></button>'
      newParamaterLI.getElementsByTagName('button')[0].addEventListener('click', (e) => {
        if (e.button === 0) {
          e.target.parentElement.parentElement.remove()
        }
      })
      newParamaterLI.getElementsByClassName('parameter-name')[0].value = customModulesArray[index].parameters[i].name
      newParamaterLI.getElementsByClassName('parameter-value')[0].value = customModulesArray[index].parameters[i].value
      newParamaterLI.getElementsByClassName('parameter-min')[0].value = customModulesArray[index].parameters[i].minValue
      newParamaterLI.getElementsByClassName('parameter-max')[0].value = customModulesArray[index].parameters[i].maxValue
      newParamaterLI.getElementsByClassName('parameter-input-type')[0].value = customModulesArray[index].parameters[i].type
      parameterListElement.appendChild(newParamaterLI)
    }
  }

  document.getElementsByClassName('create-module-name')[0].value = newName
  document.getElementsByClassName('create-module-width')[0].value = newWidth
  document.getElementsByClassName('create-module-inputs')[0].value = newInputs
  document.getElementsByClassName('create-module-outputs')[0].value = newOutputs
  document.getElementsByClassName('create-module-html')[0].value = newHTML
  document.getElementsByClassName('create-module-js')[0].value = newJS
})

editModuleDropdownMenu()
function editModuleDropdownMenu () {
  moduleDropdownElement.innerHTML = ''
  const optionCreate = document.createElement('option')
  optionCreate.innerHTML = '[create new]'
  moduleDropdownElement.add(optionCreate)

  for (let i = 0; i < customModulesArray.length; i++) {
    const option = document.createElement('option')
    option.text = (i + 1).toString().padStart(2, '0') + ' - ' + customModulesArray[i].name
    moduleDropdownElement.add(option)
  }
}

// eslint-disable-next-line space-before-function-paren, no-unused-vars
document.getElementsByClassName('creator-form')[0].addEventListener('submit', (e) => {
  e.preventDefault()
  const parameterElements = document.getElementsByClassName('parameter-list')[0].children
  const newParameters = []
  for (let i = 0; i < parameterElements.length; i++) {
    newParameters.push({
      name: '' + parameterElements[i].getElementsByClassName('parameter-name')[0].value,
      value: parseFloat(parameterElements[i].getElementsByClassName('parameter-value')[0].value),
      minValue: parseFloat(parameterElements[i].getElementsByClassName('parameter-min')[0].value),
      maxValue: parseFloat(parameterElements[i].getElementsByClassName('parameter-max')[0].value),
      type: parameterElements[i].getElementsByClassName('parameter-input-type')[0].value
    })
  }

  if (moduleDropdownCurrent !== -1) {
    customModulesArray[moduleDropdownCurrent].name = '' + document.getElementsByClassName('create-module-name')[0].value
    customModulesArray[moduleDropdownCurrent].width = parseInt(document.getElementsByClassName('create-module-width')[0].value)
    customModulesArray[moduleDropdownCurrent].numOfInputs = parseInt(document.getElementsByClassName('create-module-inputs')[0].value)
    customModulesArray[moduleDropdownCurrent].numOfOutputs = parseInt(document.getElementsByClassName('create-module-outputs')[0].value)
    customModulesArray[moduleDropdownCurrent].html = '' + document.getElementsByClassName('create-module-html')[0].value
    customModulesArray[moduleDropdownCurrent].function = '' + document.getElementsByClassName('create-module-js')[0].value
    customModulesArray[moduleDropdownCurrent].parameters = newParameters

    editModuleDropdownMenu()
    updateCustomModulesMenu()
    moduleDropdownElement.value = (moduleDropdownCurrent + 1).toString().padStart(2, '0') + ' - ' + customModulesArray[moduleDropdownCurrent].name

    for (let i = moduleArray.length - 1; i >= 0; i--) {
      if (moduleArray[i] instanceof CustomModule) {
        if (moduleArray[i].id === moduleDropdownCurrent) {
          const saveConnectionsNumber = []

          for (let j = connectionArray.length - 1; j >= 0; j--) {
            if (connectionArray[j].endModule === moduleArray[i]) {
              connectionArray.push(new Connection(cableCanvas, connectionArray[j].startElem, null, connectionArray[j].startModule, connectionArray[j].startOutput, connectionArray[j].colorNr))
              saveConnectionsNumber.push([connectionArray[j].endInput, connectionArray[j].endElem.getAttribute('type')])
            } else if (connectionArray[j].startModule === moduleArray[i]) {
              connectionArray.push(new Connection(cableCanvas, connectionArray[j].endElem, null, connectionArray[j].endModule, connectionArray[j].endInput, connectionArray[j].colorNr))
              saveConnectionsNumber.push([connectionArray[j].startOutput, connectionArray[j].startElem.getAttribute('type')])
            }
          }

          const oldX = moduleArray[i].widget.getAttribute('gs-x')
          const oldY = moduleArray[i].widget.getAttribute('gs-y')
          const oldParameters = moduleArray[i].parameters
          deleteModule(moduleArray[i], moduleArray[i].widget)
          loadCustomModule(moduleDropdownCurrent, oldX, oldY)

          for (let j = 0; j < saveConnectionsNumber.length; j++) {
            connectionArray[connectionArray.length - 1 - j].endModule = moduleArray[moduleArray.length - 1]
            connectionArray[connectionArray.length - 1 - j].endInput = saveConnectionsNumber[saveConnectionsNumber.length - 1 - j][0]
            const newModulePlugList = moduleArray[moduleArray.length - 1].moduleElement.getElementsByClassName('plug-button')

            for (let k = 0; k < newModulePlugList.length; k++) {
              if (getPlugIDfromPlug(newModulePlugList[k]) === saveConnectionsNumber[saveConnectionsNumber.length - 1 - j][0] && newModulePlugList[k].getAttribute('type') === saveConnectionsNumber[saveConnectionsNumber.length - 1 - j][1]) {
                connectionArray[connectionArray.length - 1 - j].endElem = newModulePlugList[k]
              }
            }

            connectionArray[connectionArray.length - 1 - j].update()
            connectionArray[connectionArray.length - 1 - j].connectModules()
          }

          if (moduleArray[moduleArray.length - 1] instanceof CustomModule) {
            moduleArray[moduleArray.length - 1].updateParamatersFromPrevious(oldParameters)
          }
        }
      }
    }
  } else {
    const newID = customModulesArray.length
    customModulesArray.push({
      name: '' + document.getElementsByClassName('create-module-name')[0].value,
      html: '' + document.getElementsByClassName('create-module-html')[0].value,
      width: document.getElementsByClassName('create-module-width')[0].value,
      numOfInputs: document.getElementsByClassName('create-module-inputs')[0].value,
      numOfOutputs: document.getElementsByClassName('create-module-outputs')[0].value,
      function: '' + document.getElementsByClassName('create-module-js')[0].value,
      parameters: newParameters,
      id: newID
    })
    editModuleDropdownMenu()
    updateCustomModulesMenu()

    moduleDropdownElement.value = moduleDropdownElement.childNodes[moduleDropdownElement.childNodes.length - 1].value
    moduleDropdownCurrent = moduleDropdownElement.childNodes.length - 2
    document.getElementsByClassName('create-module-button')[0].value = 'Update Module'
  }
})

document.getElementsByClassName('create-module-parameter')[0].addEventListener('click', (e) => {
  if (e.button === 0) {
    const parameterListElement = document.getElementsByClassName('parameter-list')[0]
    const newParamaterLI = document.createElement('li')
    newParamaterLI.setAttribute('class', 'list-group-item form-inline p-2 w-1')
    newParamaterLI.innerHTML = 'Name: <input required type="text" class="form-control parameter-input-name mr-1 d-inline parameter-name" placeholder=""> Value: <input required type="number" step="0.001" class="form-control parameter-input-number mr-1 d-inline parameter-value" placeholder=""> Min: <input required type="number" step="0.001" class="form-control parameter-input-number mr-1 d-inline  parameter-min" placeholder=""> Max: <input required type="number" step="0.001" class="form-control parameter-input-number mr-1 d-inline parameter-max" placeholder=""> Type: <select required class="form-control mr-1 parameter-input-type d-inline"><option>lin</option><option>exp</option><option>log</option></select> <button class="btn btn-secondary pt-1 pl-1 pr-1 pb-0 align-middle float-right"><span class="material-icons">delete</span></button>'
    newParamaterLI.getElementsByTagName('button')[0].addEventListener('click', (e) => {
      if (e.button === 0) {
        e.target.parentElement.parentElement.remove()
      }
    })
    parameterListElement.appendChild(newParamaterLI)
  }
})

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
        ' .grid-stack-item[gs-y="1"]:not(.ui-draggable-dragging) { top: ' + gridHeight + 'px !important; }' +
        ' .bg-bar-box { height: ' + (gridHeight * 2) + 'px !important; } '

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

document.getElementsByClassName('grid-stack')[0].addEventListener('wheel', (e) => {
  e.preventDefault()
  window.scrollBy(e.deltaY / 3, 0)
})

// eslint-disable-next-line no-undef
$(function () {
  // eslint-disable-next-line no-undef
  $('[data-toggle="popover"]').popover()
})
