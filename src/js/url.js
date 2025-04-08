/**
 * @fileoverview URL Data Transcoder Module
 * @description This module handles the encoding, and decoding of data for URL transmission.
 */

/**
 * @class URLDataTranscoder - Handles the encoding and decoding of data for URL transmission.
 */
class URLDataTranscoder {
  /**
   * @method compile - Compresses and encodes the data into a URL-friendly format.
   * @param {Object} data - The data to be encoded.
   * @returns {string} - The encoded data.
   */
  static compile(data) {
    try {
      const jsonString = JSON.stringify(data); // Convert object to JSON string
      return jsonString;
    } catch (error) {
      console.error('Error compiling data:', error);
      return null; // Or throw an error, handle errors according to your needs
    }
  }

  /**
   * @method decompile - Decompresses and decodes the data from a URL-friendly format.
   * @param {string} jsonString - The JSON encoded data.
   * @returns {Object} - The original data object.
   */
  static decompile(jsonString) {
    try {
      const originalData = JSON.parse(jsonString); // Convert JSON string to JavaScript object
      return originalData;
    } catch (error) {
      console.error('Error decompiling data:', error);
      return null; // Or throw an error, handle errors according to your needs
    }
  }
}

module.exports = URLDataTranscoder;
