/**
 * @fileoverview Index File
 * @description This is the main entry point for the JavaScript.
 */

// Import modules
const Pages = require('./pages');
const UI = require('./ui');
const FileSystem = require('./fs');

// Import utilities
const isMobileDevice = require('./utils/isMobileDevice');

// Import page scripts
const pageScripts = require('./scripts');

// Initialize the pages
const pages = new Pages([
  'home-container',
  'editor-container',
  'files-container',
  'not-supported-container',
]);

// Initialize the UI
const ui = new UI();

// Initialize the FileSystem
const fs = new FileSystem('EditorStorage');

// Initialize the pages
if (isMobileDevice()) {
  // If it's a mobile device, show the not-supported page
  pages.switchTo('not-supported-container');
} else {
  // Check if there is shared data in the URL
  const SHARE_PARAM_NAME = 'data';
  const LOAD_DELAY = 500;
  const urlParams = new URLSearchParams(window.location.search);
  const sharedDataEncoded = urlParams.get(SHARE_PARAM_NAME);
  if (sharedDataEncoded) {
    setTimeout(() => {
      pages.switchTo('editor-container');
    }, LOAD_DELAY);
  } else {
    pages.switchTo('home-container');
  }
}

// Run the scripts
pageScripts({ pages, ui, fs });
