/* eslint-disable semi */
'use strict';

// eslint-disable-next-line no-unused-vars
class Connection {
  constructor (canvas, startElem, endElem) {
    this.startElem = startElem;
    this.endElem = endElem;

    const startX = this.startElem.getBoundingClientRect().left + window.scrollX + this.startElem.getBoundingClientRect().width / 2;
    const startY = this.startElem.getBoundingClientRect().top + window.scrollY + this.startElem.getBoundingClientRect().height / 2;

    const colorArray = ['path-color-1', 'path-color-2', 'path-color-3', 'path-color-4'];
    const myColor = colorArray[Math.floor(Math.random() * colorArray.length)]; ;

    this.line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.line.setAttribute('d', 'M ' + startX + ' ' + startY + ' ' + startX + ' ' + startY);
    this.line.setAttribute('fill', 'none');
    this.line.classList.add(myColor);

    this.lineShadow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.lineShadow.setAttribute('d', 'M ' + startX + ' ' + startY + ' ' + startX + ' ' + startY);
    this.lineShadow.setAttribute('stroke', 'black');
    this.lineShadow.setAttribute('fill', 'none');
    this.lineShadow.classList.add('path-shadow');

    this.startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.startCircle.setAttribute('cx', startX);
    this.startCircle.setAttribute('cy', startY);
    this.startCircle.setAttribute('r', '1');
    this.startCircle.setAttribute('fill', 'none');
    this.startCircle.classList.add(myColor);

    this.endCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.endCircle.setAttribute('cx', startX);
    this.endCircle.setAttribute('cy', startY);
    this.endCircle.setAttribute('r', '1');
    this.endCircle.setAttribute('fill', 'none');
    this.endCircle.classList.add(myColor);

    canvas.appendChild(this.lineShadow);
    canvas.appendChild(this.line);
    canvas.appendChild(this.startCircle);
    canvas.appendChild(this.endCircle);
  }

  rewriteLine () {
    const startX = this.startElem.getBoundingClientRect().left + window.scrollX + this.startElem.getBoundingClientRect().width / 2;
    const startY = this.startElem.getBoundingClientRect().top + window.scrollY + this.startElem.getBoundingClientRect().height / 2;
    this.line.setAttribute('d', 'M ' + startX + ' ' + startY + ' ' + startX + ' ' + startY);
    this.lineShadow.setAttribute('d', 'M ' + startX + ' ' + startY + ' ' + startX + ' ' + startY);

    this.startCircle.setAttribute('cx', startX);
    this.startCircle.setAttribute('cy', startY);

    this.endCircle.setAttribute('cx', startX);
    this.endCircle.setAttribute('cy', startY);
  }

  update () {
    const startX = this.startElem.getBoundingClientRect().left + window.scrollX + this.startElem.getBoundingClientRect().width / 2;
    const startY = this.startElem.getBoundingClientRect().top + window.scrollY + this.startElem.getBoundingClientRect().height / 2;

    const endX = this.endElem.getBoundingClientRect().left + window.scrollX + this.startElem.getBoundingClientRect().width / 2;
    const endY = this.endElem.getBoundingClientRect().top + window.scrollY + this.startElem.getBoundingClientRect().height / 2;

    const length = Math.round(Math.sqrt((startX - endX) * (startX - endX) + (startY - endY) * (startY - endY)));
    this.line.setAttribute('d', 'M ' + startX + ' ' + startY + ' q ' + (endX - startX) / 2 + ' ' + ((endY - startY) / 2 + length / 4) + ' ' + (endX - startX) + ' ' + (endY - startY));
    this.lineShadow.setAttribute('d', 'M ' + startX + ' ' + startY + ' q ' + (endX - startX) / 2 + ' ' + ((endY - startY) / 2 + length / 3) + ' ' + (endX - startX) + ' ' + (endY - startY));

    this.startCircle.setAttribute('cx', startX);
    this.startCircle.setAttribute('cy', startY);

    this.endCircle.setAttribute('cx', endX);
    this.endCircle.setAttribute('cy', endY);
  }

  updateEnd () {
    const stringArray = this.line.getAttribute('d').split(/(\s+)/);
    const startX = parseInt(stringArray[2]);
    const startY = parseInt(stringArray[4]);

    const endX = this.endElem.getBoundingClientRect().left + window.scrollX + this.startElem.getBoundingClientRect().width / 2;
    const endY = this.endElem.getBoundingClientRect().top + window.scrollY + this.startElem.getBoundingClientRect().height / 2;

    const length = Math.round(Math.sqrt((startX - endX) * (startX - endX) + (startY - endY) * (startY - endY)));
    this.line.setAttribute('d', 'M ' + startX + ' ' + startY + ' q ' + (endX - startX) / 2 + ' ' + ((endY - startY) / 2 + length / 4) + ' ' + (endX - startX) + ' ' + (endY - startY));
    this.lineShadow.setAttribute('d', 'M ' + startX + ' ' + startY + ' q ' + (endX - startX) / 2 + ' ' + ((endY - startY) / 2 + length / 3) + ' ' + (endX - startX) + ' ' + (endY - startY));

    this.startCircle.setAttribute('cx', startX);
    this.startCircle.setAttribute('cy', startY);

    this.startCircle.setAttribute('cx', endX);
    this.startCircle.setAttribute('cy', endY);
  }

  updateEndCords (endX, endY) {
    const stringArray = this.line.getAttribute('d').split(/(\s+)/);
    const startX = parseInt(stringArray[2]);
    const startY = parseInt(stringArray[4]);

    const length = Math.round(Math.sqrt((startX - endX) * (startX - endX) + (startY - endY) * (startY - endY)));
    this.line.setAttribute('d', 'M ' + startX + ' ' + startY + ' q ' + (endX - startX) / 2 + ' ' + ((endY - startY) / 2 + length / 4) + ' ' + (endX - startX) + ' ' + (endY - startY));
    this.lineShadow.setAttribute('d', 'M ' + startX + ' ' + startY + ' q ' + (endX - startX) / 2 + ' ' + ((endY - startY) / 2 + length / 3) + ' ' + (endX - startX) + ' ' + (endY - startY));

    this.startCircle.setAttribute('cx', startX);
    this.startCircle.setAttribute('cy', startY);

    this.startCircle.setAttribute('cx', endX);
    this.startCircle.setAttribute('cy', endY);
  }

  removeLine () {
    this.line.remove();
    this.lineShadow.remove();
    this.startCircle.remove();
    this.endCircle.remove();
  }
}
