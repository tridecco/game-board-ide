/**
 * @fileoverview File System Module
 * @description This module provides file system utilities for the application using localStorage.
 */

const UNIQUE_ID_BASE = 36;
const UNIQUE_ID_START_INDEX = 2;
const UNIQUE_ID_LENGTH = 9;

/**
 * @class FileSystem - Supports file system operations such as reading and writing files using localStorage.
 */
class FileSystem {
  /**
   * @constructor
   * @param {string} [storageName='IDEStorage'] - The namespace prefix for localStorage keys.
   */
  constructor(storageName = 'IDEStorage') {
    if (!storageName) {
      throw new Error('Storage name cannot be empty.');
    }
    this.storageKeyPrefix = storageName + '_'; // Ensure separator
  }

  /**
   * @method _generateUniqueId - Generates a pseudo-unique identifier.
   * @returns {string} A unique identifier string.
   */
  _generateUniqueId() {
    const randomPart = Math.random()
      .toString(UNIQUE_ID_BASE)
      .substring(
        UNIQUE_ID_START_INDEX,
        UNIQUE_ID_START_INDEX + UNIQUE_ID_LENGTH,
      );
    return `${Date.now()}_${randomPart}`;
  }

  /**
   * @method _getStorageKey - Constructs the localStorage key for a given file ID.
   * @param {string} fileId - The unique identifier for the file.
   * @returns {string} - The storage key for the file.
   */
  _getStorageKey(fileId) {
    if (!fileId) {
      throw new Error('File ID cannot be empty.');
    }
    return `${this.storageKeyPrefix}${fileId}`;
  }

  /**
   * @method _safeSetItem - Safely sets an item in localStorage, handling potential quota errors.
   * @param {string} key - The key to set.
   * @param {string} value - The value to set.
   * @throws {Error} - If localStorage quota is exceeded or another storage error occurs.
   */
  _safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        throw new Error(
          'Storage quota exceeded. Unable to save file. Please free up space.',
        );
      } else {
        throw new Error(`Failed to save file to localStorage: ${e.message}`);
      }
    }
  }

  /**
   * @method _safeParseJson - Safely parses a JSON string, handling potential syntax errors.
   * @param {string | null} jsonString - The JSON string to parse.
   * @param {string} contextId - An identifier (like fileId) for error context.
   * @returns {Object | null} - The parsed object, or null if input is null/undefined or parsing fails.
   * @throws {Error} - If JSON parsing fails for non-null input.
   */
  _safeParseJson(jsonString, contextId) {
    if (jsonString === null) {
      // Checks for both null and undefined
      return null;
    }
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error(`Failed to parse JSON for ID "${contextId}": ${e.message}`);
      throw new Error(`Corrupted data found for ID "${contextId}".`);
    }
  }

  /**
   * @method createFile - Creates a new file entry in localStorage.
   * @param {string} name - The name of the file.
   * @param {string} content - The content of the file.
   * @param {number} boardVersion - The version of the board associated with the file.
   * @returns {string} - The unique identifier of the created file.
   */
  createFile(name, content = '', boardVersion) {
    if (!name) {
      throw new Error('File name cannot be empty.');
    }
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
    const key = this._getStorageKey(fileId);
    this._safeSetItem(key, JSON.stringify(fileData));
    return fileId;
  }

  /**
   * @method updateFile - Updates an existing file in localStorage.
   * @param {string} fileId - The unique identifier of the file to update.
   * @param {object} updates - An object containing updates.
   * @param {string} [updates.content] - The new content for the file.
   * @param {number} [updates.boardVersion] - The new board version for the file.
   * @param {string} [updates.name] - The new name for the file.
   * @param {Object} [updates.metadata] - Additional metadata keys/values to merge into existing metadata.
   * @throws {Error} - If the file with the given ID does not exist or if data is corrupted.
   */
  updateFile(fileId, updates) {
    const key = this._getStorageKey(fileId);
    const stored = localStorage.getItem(key);
    if (stored === null) {
      // Explicitly check for null, as empty string is a valid value
      throw new Error(`File with ID ${fileId} does not exist.`);
    }

    const fileData = this._safeParseJson(stored, fileId);
    if (!fileData) {
      throw new Error(`Could not parse data for file ID ${fileId}.`);
    }

    let updated = false;

    if (updates.hasOwnProperty('content')) {
      fileData.content = updates.content;
      updated = true;
    }
    if (updates.hasOwnProperty('boardVersion')) {
      fileData.boardVersion = updates.boardVersion;
      updated = true;
    }
    if (updates.hasOwnProperty('name')) {
      if (!updates.name) {
        throw new Error('File name cannot be empty.');
      }
      fileData.name = updates.name;
      updated = true;
    }
    if (updates.metadata && typeof updates.metadata === 'object') {
      fileData.metadata = {
        ...fileData.metadata,
        ...updates.metadata, // Merge new metadata over existing
      };
      updated = true; // Metadata itself was updated
    }

    if (updated) {
      fileData.metadata.updatedAt = Date.now();
      this._safeSetItem(key, JSON.stringify(fileData));
    }
  }

  /**
   * @method loadFile - Loads a file from localStorage.
   * @param {string} fileId - The unique identifier of the file to load.
   * @returns {Object | null} - The file data object, or null if not found.
   * @throws {Error} - If the data associated with the ID is corrupted.
   */
  loadFile(fileId) {
    const key = this._getStorageKey(fileId);
    const stored = localStorage.getItem(key);
    if (stored === null) {
      return null; // Return null if file doesn't exist
    }
    // Will throw if JSON is invalid
    const fileData = this._safeParseJson(stored, fileId);
    return fileData;
  }

  /**
   * @method deleteFile - Deletes a file from localStorage.
   * @param {string} fileId - The unique identifier of the file to delete.
   */
  deleteFile(fileId) {
    const key = this._getStorageKey(fileId);
    localStorage.removeItem(key);
  }

  /**
   * @method exportFile - Exports a file's content to the user's computer as a download.
   * @param {string} fileId - The unique identifier of the file to export.
   * @throws {Error} - If the file cannot be loaded or data is corrupted.
   */
  exportFile(fileId) {
    const fileData = this.loadFile(fileId);
    if (!fileData) {
      throw new Error(`Cannot export: File with ID ${fileId} not found.`);
    }

    // Default to .js extension if not present, basic check
    const fileName = fileData.name.includes('.')
      ? fileData.name
      : `${fileData.name}.js`;
    const blob = new Blob([fileData.content], {
      type: 'application/javascript;charset=utf-8', // Be more specific with MIME type
    });

    // Use FileSaver.js approach for better compatibility if available, otherwise fallback
    if (
      typeof window !== 'undefined' &&
      window.navigator &&
      window.navigator.msSaveOrOpenBlob
    ) {
      // IE11
      window.navigator.msSaveOrOpenBlob(blob, fileName);
    } else if (typeof document !== 'undefined') {
      // Modern browsers
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      // Cleanup: Use timeout for Firefox compatibility
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 0);
    } else {
      console.warn('Export functionality requires a browser environment.');
    }
  }

  /**
   * @method listFiles - Lists all files managed by this instance in localStorage.
   * @returns {Array<Object>} - An array of file summary objects, each containing id, name, boardVersion, and metadata. Corrupted entries are skipped.
   */
  listFiles() {
    const files = [];
    const prefix = this.storageKeyPrefix;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const stored = localStorage.getItem(key);
        try {
          const fileData = this._safeParseJson(
            stored,
            key.substring(prefix.length),
          );
          if (fileData && fileData.id && fileData.name && fileData.metadata) {
            // Ensure essential fields exist after parsing
            const { id, name, boardVersion, metadata } = fileData;
            files.push({ id, name, boardVersion, metadata });
          } else if (fileData) {
            console.warn(
              `Skipping file entry with key "${key}" due to missing essential fields (id, name, metadata).`,
            );
          }
        } catch (e) {
          console.error(
            `Error processing storage key "${key}": ${e.message}. Skipping entry.`,
          );
        }
      }
    }
    // Sort files by createdAt timestamp in descending order
    files.sort((a, b) => b.metadata.createdAt - a.metadata.createdAt);
    return files;
  }

  /**
   * @method clearAll - Removes ALL files managed by this instance from localStorage. Use with caution.
   * @returns {number} - The number of items removed.
   */
  clearAll() {
    let removedCount = 0;
    const prefix = this.storageKeyPrefix;
    // Iterate backwards when removing items to avoid index issues
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        localStorage.removeItem(key);
        removedCount++;
      }
    }
    console.warn(`Cleared ${removedCount} items with prefix "${prefix}".`);
    return removedCount;
  }
}

module.exports = FileSystem;
