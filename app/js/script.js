"use strict";

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
});

addEventListener("mousemove", (event) => {
    if (isDragging) {
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



// on resize-event
var style = document.createElement('style');
var zoomfactor;
zoomfactor = (gridHeight / 4).toFixed(2); // yet to use
document.head.appendChild(style);

addEventListener("resize", (event) => {
    gridHeight = (document.body.offsetHeight - document.getElementById('top-bar').offsetHeight) / 2;
    document.getElementsByClassName('grid-stack')[0].style.width = '' + gridHeight * 6 + 'px';

    style.innerHTML = '.grid-stack{ height: ' + 2 * gridHeight + 'px !important; min-height: ' + 2 * gridHeight + 'px !important; }' +
        '.grid-stack-item { height: ' + gridHeight + 'px !important; min-height: ' + gridHeight + 'px !important; }' +
        ' .grid-stack-item-content { min-height: ' + gridHeight + 'px !important; }' +
        ' .grid-stack-item[gs-y="1"]:not(.ui-draggable-dragging) { top: ' + gridHeight + 'px !important; }';

    grid.opts.cellHeight = gridHeight;
});



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
            grid.addWidget({ w: consoleData.modules[index].width, h: 1, noResize: true, content: '<div class="module">' + xhr.responseText + '</div>' });
        }
    }.bind(this);
    xhr.send();
}