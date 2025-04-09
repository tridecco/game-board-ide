/**
 * @fileoverview URL Data Transcoder Module
 * @description This module handles the encoding, and decoding of data for URL transmission.
 */

/**
 * @class URLDataTranscoder - Handles the encoding and decoding of data for URL transmission.
 */
class URLDataTranscoder {
  /**
   * @method compile - Encodes the data into a URL-friendly string.
   * @param {Object} data - The data to be encoded.
   * @returns {string|null} - The URL-safe encoded data string, or null on error.
   */
  static compile(data) {
    try {
      const jsonString = JSON.stringify(data); // Convert object to JSON string
      const base64String = btoa(jsonString); // Convert JSON string to Base64
      const encodedString = encodeURIComponent(base64String); // URL-encode the Base64 string
      return encodedString;
    } catch (error) {
      console.error('Error compiling data:', error);
      return null;
    }
  }

  /**
   * @method decompile - Decodes the data from a URL-friendly string.
   * @param {string} encodedString - The URL-safe encoded data string.
   * @returns {Object|null} - The original data object, or null on error.
   */
  static decompile(encodedString) {
    if (typeof encodedString !== 'string' || encodedString.length === 0) {
      console.error('Error decompiling data: Input is not a valid string.');
      return null;
    }
    try {
      const base64String = decodeURIComponent(encodedString); // Decode the URL-encoded string
      const jsonString = atob(base64String); // Convert Base64 string back to JSON string
      const originalData = JSON.parse(jsonString); // Convert JSON string to JavaScript object
      return originalData;
    } catch (error) {
      console.error('Error decompiling data:', error);
      return null;
    }
  }
}

module.exports = URLDataTranscoder;
