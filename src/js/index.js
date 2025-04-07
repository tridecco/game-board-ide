/**
 * @fileoverview Index File
 * @description This is the main entry point for the JavaScript.
 */

// Import modules
const FileSystem = require('./fs');
const UI = require('./ui');
const Editor = require('./editor');
const Console = require('./console');

// Import page scripts
const pageScripts = require('./scripts');

// Run the scripts
pageScripts();
