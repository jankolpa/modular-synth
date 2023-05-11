"use strict";

// create grid
var items = [
    { w: 2, h: 1, noResize: true, content: '<div class="module">my first widget</div>' },
    { w: 4, h: 1, noResize: true, content: '<div class="module">another longer widget!</div>' },
    { w: 2, h: 1, noResize: true, content: '<div class="module">another longer widget!</div>' },
    { w: 3, h: 1, noResize: true, content: '<div class="module">another longer widget!</div>' }
];

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
grid.load(items);
console.log(grid);



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
zoomfactor = (gridHeight / 4).toFixed(2);
document.head.appendChild(style);
style.innerHTML = '.module{zoom: ' + zoomfactor + '%;}';

addEventListener("resize", (event) => {
    gridHeight = (document.body.offsetHeight - document.getElementById('top-bar').offsetHeight) / 2;
    document.getElementsByClassName('grid-stack')[0].style.width = '' + gridHeight * 6 + 'px';
    zoomfactor = (gridHeight / 4).toFixed(2);

    style.innerHTML = '.grid-stack{ height: ' + 2 * gridHeight + 'px !important; min-height: ' + 2 * gridHeight + 'px !important; }' +
        '.grid-stack-item { height: ' + gridHeight + 'px !important; min-height: ' + gridHeight + 'px !important; }' +
        ' .grid-stack-item-content { min-height: ' + gridHeight + 'px !important; }' +
        ' .grid-stack-item[gs-y="1"]:not(.ui-draggable-dragging) { top: ' + gridHeight + 'px !important; }' + 
        ' .module{zoom: ' + zoomfactor + '%;}';

    grid.opts.cellHeight = gridHeight;
});