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
  }
}

module.exports = Pages;
