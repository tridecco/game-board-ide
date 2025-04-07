/**
 * @fileoverview Page Scripts Entry Point
 * @description This script initializes all the page-specific JavaScript functionalities.
 */

const editorScript = require('./editor');
const filesScript = require('./files');

module.exports = function pageScripts({ pages, ui, fs }) {
  editorScript({ pages, ui, fs }); // Initialize the editor functionality
  filesScript({ pages, ui, fs }); // Initialize the files functionality
};
