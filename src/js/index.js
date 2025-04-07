/**
 * @fileoverview Index File
 * @description This is the main entry point for the JavaScript.
 */

// Import modules
const FileSystem = require('./fs');
const UI = require('./ui');
const Editor = require('./editor');
const Console = require('./console');
const Pages = require('./pages');

// Import page scripts
const pageScripts = require('./scripts');

// Initialize the pages
const pages = new Pages([
  'home-container',
  'editor-container',
  'files-container',
  'not-supported-container',
]);
pages.switchTo('home-container'); // Default to home page

// Run the scripts
pageScripts();
