"use strict";

var connectionList = [];
var plugList = [];

// create grid
var gridHeight = (document.body.offsetHeight - document.getElementById('top-bar').offsetHeight) / 2;
document.getElementsByClassName('grid-stack')[0].style.width = '' + gridHeight * 6 + 'px';
var grid = GridStack.init({
    cellHeight: gridHeight,
    minRow: 2,
    maxRow: 2,
    margin: 0,
    column: 50,
    float: true,
    disableOneColumnMode: true,
    animate: false
});



// on event if user drags item to the left or right
var isDragging = false;
var isScrollingLeft = false;
var isScrollingRight = false;
grid.on('dragstart', () => {
    isDragging = true;
});
grid.on('dragstop', () => {
    isDragging = false;

    //temporary
    connectionList.forEach(conn => {
        conn.update();
    });
});

let scrollInterval;
function startScrollLeft() {
    isScrollingLeft = true;
    scrollInterval = setInterval(() => {
        window.scrollBy(-15, 0);
    }, 15);
};
function stopScrollLeft() {
    isScrollingLeft = false;
    clearInterval(scrollInterval);
};
function startScrollRight() {
    isScrollingRight = true;
    scrollInterval = setInterval(() => {
        window.scrollBy(15, 0);
    }, 15);
};
function stopScrollRight() {
    isScrollingRight = false;
    clearInterval(scrollInterval);
};


// handle connection
let canvas = document.getElementById('line-canvas');
canvas.style.width = document.getElementsByClassName('grid-stack')[0].style.width;


// load modules
var consoleData;

var xhr = new XMLHttpRequest();
xhr.overrideMimeType("application/json");
xhr.open('GET', '../app/moduleConfig.json', true);
xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == "200") {
        consoleData = JSON.parse(xhr.responseText);
        loadModule(0);
        loadModule(1);
        loadModule(1);
        loadModule(0);
    }
};
xhr.send(null);

function loadModule(index) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", '../app/html/' + consoleData.modules[index].name + '.html', false);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            var newWidget = grid.addWidget({ w: consoleData.modules[index].width, h: 1, noResize: true, content: '<div class="module">' + xhr.responseText + '</div>' });
            var plugs = newWidget.getElementsByClassName('plug');
            for (let i = 0; i < plugs.length; i++) {


                plugs[i].addEventListener('mousedown', (e) => {
                    
                    var alreadyUsed = false;
                    if(e.shiftKey === false) {
                        for (let j = connectionList.length - 1; j >= 0; j--) {
                            if (connectionList[j].startElem === plugs[i] || connectionList[j].endElem === plugs[i]) {
                                alreadyUsed = true;
    
                                if (connectionList[j].endElem === plugs[i]) {
                                    connectionList[j].endElem = null;
                                } else {
                                    connectionList[j].startElem = connectionList[j].endElem;
                                    connectionList[j].endElem = null;
                                    connectionList[j].rewriteLine();
                                }
                                return;
                            }
                        }
                    }

                    if (alreadyUsed === false) {
                        connectionList.push(new Connection(canvas, plugs[i], null, 100, 100));
                    }
                });
                plugList.push(plugs[i]);

            }
        }
    }.bind(this);
    xhr.send();
}



// on resize-event
var style = document.createElement('style');
var zoomfactor;
zoomfactor = (gridHeight / 4).toFixed(2); // yet to use
document.head.appendChild(style);

addEventListener("resize", (event) => {
    gridHeight = (document.body.offsetHeight - document.getElementById('top-bar').offsetHeight) / 2;
    document.getElementsByClassName('grid-stack')[0].style.width = '' + gridHeight * 6 + 'px';
    canvas.style.width = '' + gridHeight * 6 + 'px';

    style.innerHTML = '.grid-stack{ height: ' + 2 * gridHeight + 'px !important; min-height: ' + 2 * gridHeight + 'px !important; }' +
        '.grid-stack-item { height: ' + gridHeight + 'px !important; min-height: ' + gridHeight + 'px !important; }' +
        ' .grid-stack-item-content { min-height: ' + gridHeight + 'px !important; }' +
        ' .grid-stack-item[gs-y="1"]:not(.ui-draggable-dragging) { top: ' + gridHeight + 'px !important; }';

    grid.opts.cellHeight = gridHeight;

    connectionList.forEach(conn => {
        conn.update();
    });
});

// on mouse move event
addEventListener("mousemove", (event) => {

    // move modules
    if (isDragging) {

        // temporary
        connectionList.forEach(conn => {
            conn.update();
        });

        var edgeSize = 80;
        var bodyWidth = document.body.offsetWidth
        if (event.clientX < edgeSize) {
            if (!isScrollingLeft)
                startScrollLeft();
        } else if (event.clientX > (bodyWidth - edgeSize)) {
            if (!isScrollingRight)
                startScrollRight();
        } else {
            if (isScrollingLeft) {
                stopScrollLeft();
            }
            if (isScrollingRight) {
                stopScrollRight();
            }
        }
    } else {
        if (isScrollingLeft) {
            stopScrollLeft();
        }
        if (isScrollingRight) {
            stopScrollRight();
        }
    }


    // move connection
    connectionList.forEach(conn => {
        if (conn.endElem === null) {
            conn.updateEndCords(event.pageX, event.pageY);
        }
    });
});


addEventListener("mouseup", (event) => {

    var hitPlug = false;
    for (let index = 0; index < connectionList.length; index++) {
        if (connectionList[index].endElem === null) {

            plugList.forEach(plug => {
                var box = plug.getBoundingClientRect();

                if (event.pageX > box.left + window.scrollX && event.pageX < box.left + window.scrollX + box.width
                    && event.pageY > box.top + window.scrollY && event.pageY < box.top + window.scrollY + box.height) {

                    if (connectionList[index].startElem === plug) {
                        return;
                    }

                    var existsAlready = false;
                    connectionList.forEach(conn => {
                        if (conn.startElem === connectionList[index].startElem && conn.endElem === plug
                            || conn.startElem === plug && conn.endElem === connectionList[index].startElem)
                            existsAlready = true;
                    });
                    if (existsAlready) {
                        return;
                    }

                    if (connectionList[index].startElem.getAttribute('type') === plug.getAttribute('type')) {
                        return;
                    }

                    connectionList[index].endElem = plug;
                    connectionList[index].updateEnd();
                }
            });
        }
    }

    if (hitPlug === false) {
        var removeIndex = -1;
        for (let index = 0; index < connectionList.length; index++) {
            if (connectionList[index].endElem === null) {
                connectionList[index].removeLine();
                removeIndex = index;
            }
        }
        if (removeIndex !== -1) {
            connectionList.splice(removeIndex, 1);
        }
    }
});