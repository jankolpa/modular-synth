var items = [
    { w: 1, h: 1, noResize: true, content: 'my first widget' },
    { w: 2, h: 1, noResize: true, content: 'another longer widget!' },
    { w: 1, h: 1, noResize: true, content: 'another longer widget!' },
    { w: 2, h: 1, noResize: true, content: 'another longer widget!' }
];

var gridHeight = (document.body.offsetHeight - document.getElementById('top-bar').offsetHeight) / 2;

document.getElementsByClassName('grid-stack')[0].style.width = '' + gridHeight * 6 + 'px';
var grid = GridStack.init({
    cellHeight: gridHeight,
    minRow: 2,
    maxRow: 2,
    margin: 0,
    column: 25,
    float: true,
    disableOneColumnMode: true
});
grid.load(items);

var style = document.createElement('style');
document.head.appendChild(style);

addEventListener("resize", (event) => {
    var gridHeight = (document.body.offsetHeight - document.getElementById('top-bar').offsetHeight) / 2;
    document.getElementsByClassName('grid-stack')[0].style.width = '' + gridHeight * 6 + 'px';

    style.innerHTML = '.grid-stack{ height: ' + 2 * gridHeight + 'px !important; min-height: ' + 2 * gridHeight + 'px !important; }' +
        '.grid-stack-item { height: ' + gridHeight + 'px !important; min-height: ' + gridHeight + 'px !important; }' +
        ' .grid-stack-item-content { height: ' + gridHeight + 'px !important; min-height: ' + gridHeight + 'px !important; }' +
        ' .grid-stack-item[gs-y="1"]:not(.ui-draggable-dragging) { top: ' + gridHeight + 'px !important; }';
});