/**
 * @fileoverview Index File
 * @description This is the main entry point for the JavaScript.
 */

// Import modules
const Pages = require('./pages');

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

// Initialize the pages
if (!isMobileDevice()) {
  pages.switchTo('home-container');
} else {
  // If it's a mobile device, show the not-supported page
  pages.switchTo('not-supported-container');
}

// Run the scripts
pageScripts();
