/**
 * @fileoverview Is Mobile Device Detection Utility
 * @description This utility checks if the current device is a mobile device based on user agent.
 */

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

module.exports = isMobileDevice;
