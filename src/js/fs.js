/**
 * @fileoverview File System Module
 * @description This module provides file system utilities for the application.
 */

const UNIQUE_ID_BASE = 36;
const UNIQUE_ID_START_INDEX = 2;
const UNIQUE_ID_LENGTH = 9;

/**
 * @class FileSystem - Supports file system operations such as reading and writing files.
 */
class FileSystem {
  /**
   * @constructor
   * @param {string} [storageName='IDEStorage'] - The name of the storage for the file system.
   */
  constructor(storageName = 'IDEStorage') {
    this.storageKeyPrefix = storageName;
  }

  /**
   * @method _generateUniqueId - Generates a unique identifier for a file.
   */
  _generateUniqueId() {
    return `${Date.now()}_${Math.random().toString(UNIQUE_ID_BASE).substr(UNIQUE_ID_START_INDEX, UNIQUE_ID_LENGTH)}`;
  }

  /**
   * @method _getStorageKey - Constructs the storage key for a given file ID.
   * @param {string} fileId - The unique identifier for the file.
   * @returns {string} - The storage key for the file.
   */
  _getStorageKey(fileId) {
    return this.storageKeyPrefix + fileId;
  }

  /**
   * @method createFile - Creates a new file in the file system.
   * @param {string} name - The name of the file.
   * @param {string} content - The content of the file.
   * @param {number} boardVersion - The version of the board associated with the file.
   * @returns {string} - The unique identifier of the created file.
   */
  createFile(name, content, boardVersion) {
    const fileId = this._generateUniqueId();
    const timestamp = Date.now();
    const fileData = {
      id: fileId,
      name: name,
      content: content,
      boardVersion: boardVersion,
      metadata: {
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    };
    localStorage.setItem(this._getStorageKey(fileId), JSON.stringify(fileData));
    return fileId;
  }

  /**
   * @method updateFile - Updates an existing file in the file system.
   * @param {string} fileId - The unique identifier of the file to update.
   * @param {string} [newContent] - The new content for the file. If undefined, the existing content is retained.
   * @param {number} [newBoardVersion] - The new board version for the file. If undefined, the existing version is retained.
   * @param {Object} [additionalMetadata] - Additional metadata to update in the file.
   * @throws {Error} - If the file with the given ID does not exist.
   */
  updateFile(fileId, newContent, newBoardVersion, additionalMetadata = {}) {
    const key = this._getStorageKey(fileId);
    const stored = localStorage.getItem(key);
    if (!stored) {
      throw new Error(`File with ID ${fileId} does not exist.`);
    }
    const fileData = JSON.parse(stored);
    fileData.content = newContent !== undefined ? newContent : fileData.content;
    fileData.boardVersion = newBoardVersion || fileData.boardVersion;
    fileData.metadata = {
      ...fileData.metadata,
      ...additionalMetadata,
      updatedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(fileData));
  }

  /**
   * @method loadFile - Loads a file from the file system.
   * @param {string} fileId - The unique identifier of the file to load.
   * @returns {Object} - The file data object containing the file's details.
   * @throws {Error} - If the file with the given ID does not exist.
   */
  loadFile(fileId) {
    const key = this._getStorageKey(fileId);
    const stored = localStorage.getItem(key);
    if (!stored) {
      throw new Error(`File with ID ${fileId} not found.`);
    }
    return JSON.parse(stored);
  }

  /**
   * @method deleteFile - Deletes a file from the file system.
   * @param {string} fileId - The unique identifier of the file to delete.
   */
  deleteFile(fileId) {
    const key = this._getStorageKey(fileId);
    localStorage.removeItem(key);
  }

  /**
   * @method exportFile - Exports a file to the user's computer.
   * @param {string} fileId - The unique identifier of the file to export.
   */
  exportFile(fileId) {
    const fileData = this.loadFile(fileId);
    const blob = new Blob([fileData.content], {
      type: 'application/javascript',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileData.name.endsWith('.js')
      ? fileData.name
      : fileData.name + '.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * @method listFiles - Lists all files in the file system.
   * @returns {Array<Object>} - An array of file objects, each containing id, name, boardVersion, and metadata.
   */
  listFiles() {
    const files = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.storageKeyPrefix)) {
        const fileData = JSON.parse(localStorage.getItem(key));
        const { id, name, boardVersion, metadata } = fileData;
        files.push({ id, name, boardVersion, metadata });
      }
    }
    return files;
  }
}

module.exports = FileSystem;
