/**
 * @fileoverview Index File
 * @description This is the main entry point for the JavaScript.
 */

const UI = require('./ui');

/**
 * @class App - A class for indexing the application.
 */
class App {
  /**
   * @constructor
   */
  constructor() {
    this.ui = new UI(this);
  }
}

const appInstance = new App();

Object.defineProperty(window, 'app', {
  value: appInstance,
  writable: false,
  configurable: false,
  enumerable: true,
});
