/**
 * @fileoverview URL Data Transcoder Module
 * @description This module handles the encoding, compression, and decoding of data for URL transmission.
 */

const pako = require('pako');

class URLDataTranscoder {
  /**
   * @method compile - Compresses and encodes the data into a URL-friendly format.
   * @param {Object} data - The data to be encoded and compressed.
   * @returns {string} - The encoded and compressed data.
   */
  static compile(data) {
    try {
      const jsonString = JSON.stringify(data); // Convert object to JSON string
      const compressedString = pako.gzip(jsonString, { to: 'string' }); // Use pako for gzip compression and output string
      return compressedString;
    } catch (error) {
      console.error('Error compiling data:', error);
      return null; // Or throw an error, handle errors according to your needs
    }
  }

  /**
   * @method decompile - Decompresses and decodes the data from a URL-friendly format.
   * @param {string} compressedString - The compressed and encoded data.
   * @returns {Object} - The original data object.
   */
  static decompile(compressedString) {
    try {
      const jsonString = pako.ungzip(compressedString, { to: 'string' }); // Use pako for gzip decompression, get JSON string
      const originalData = JSON.parse(jsonString); // Convert JSON string to JavaScript object
      return originalData;
    } catch (error) {
      console.error('Error decompiling data:', error);
      return null; // Or throw an error, handle errors according to your needs
    }
  }
}

module.exports = URLDataTranscoder;
