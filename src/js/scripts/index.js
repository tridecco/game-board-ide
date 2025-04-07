/**
 * @fileoverview Page Scripts Entry Point
 * @description This script initializes all the page-specific JavaScript functionalities.
 */

const homeScript = require('./home');
const editorScript = require('./editor');
const filesScript = require('./files');

module.exports = function pageScripts({ pages, ui, fs }) {
  homeScript({ pages, ui, fs }); // Initialize the home page functionality
  editorScript({ pages, ui, fs }); // Initialize the editor functionality
  filesScript({ pages, ui, fs }); // Initialize the files functionality
};
