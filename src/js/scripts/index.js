/**
 * @fileoverview Page Scripts Entry Point
 * @description This script initializes all the page-specific JavaScript functionalities.
 */

const editorScript = require('./editor');

module.exports = function pageScripts() {
  editorScript(); // Initialize the editor functionality
};
