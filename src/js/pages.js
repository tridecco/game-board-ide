/**
 * @fileoverview Pages Module
 * @description This module to manage pages.
 */

/**
 * @class Pages - Handles the pages switching.
 */
class Pages {
  /**
   * @constructor
   * @param {Array<string>} pages - An array of page element IDs.
   */
  constructor(pages) {
    this.pages = new Set(pages);
    this.currentPage = null;
    this.listeners = new Array();
  }

  /**
   * @method switchTo - Switches to a specified page.
   * @param {string} pageId - The ID of the page to switch to.
   */
  switchTo(pageId) {
    if (!this.pages.has(pageId)) {
      console.error(`Page with ID "${pageId}" does not exist.`);
      return;
    }

    if (this.currentPage) {
      document.getElementById(this.currentPage).style.display = 'none';
    }

    this.currentPage = pageId;
    document.getElementById(this.currentPage).style.display = 'block';

    // Call the listeners
    this.listeners.forEach((listener) => {
      if (
        listener.pageId === pageId &&
        typeof listener.callback === 'function'
      ) {
        listener.callback();
      }
    });
  }

  /**
   * @method onShow - Sets a callback to be called when a page is shown.
   * @param {string} pageId - The ID of the page to attach the callback to.
   * @param {Function} callback - The function to call when the page is shown.
   */
  onShow(pageId, callback) {
    if (!this.pages.has(pageId)) {
      console.error(`Page with ID "${pageId}" does not exist.`);
      return;
    }

    if (typeof callback !== 'function') {
      console.error('Callback must be a function.');
      return;
    }

    this.listeners.push({
      pageId: pageId,
      callback: callback,
    });
  }
}

module.exports = Pages;
