/**
 * @fileoverview UI Module
 * @description This module handles the user interface interactions for the application.
 */

const DEFAULT_ALERT_DURATION = 3000;

/**
 * @class UI - Handles the user interface of the application.
 */
class UI {
  /**
   * @constructor
   */
  constructor() {
    this.notifications = new Map();
  }

  /**
   * @method alert - Displays an alert message at the top-left corner of the page.
   * @param {string} message - The message to display.
   * @param {string} status - The status of the alert (e.g., "success", "info", "warning", "error").
   * @param {number} duration - The duration in milliseconds for which the alert should be visible.
   */
  alert(message, status = 'info', duration = DEFAULT_ALERT_DURATION) {
    const FADE_IN_DELAY = 10;
    const FADE_OUT_DURATION = 500;

    const COLOR_CLASSES = {
      success: 'text-green-800 border-green-300 bg-green-50',
      info: 'text-blue-800 border-blue-300 bg-blue-50',
      warning: 'text-yellow-800 border-yellow-300 bg-yellow-50',
      error: 'text-red-800 border-red-300 bg-red-50',
      default: 'text-gray-800 border-gray-300 bg-gray-50',
    };

    const alertBox = document.createElement('div');
    const colorClasses = COLOR_CLASSES[status] || COLOR_CLASSES.default;

    alertBox.className = `fixed right-4 top-4 z-50 p-4 text-sm ${colorClasses} border rounded-lg opacity-0 transition-opacity duration-500`;
    alertBox.role = 'alert';
    alertBox.innerHTML = `
      <div class="flex items-center">
        <span>${message}</span>
      </div>`;

    document.body.appendChild(alertBox);

    setTimeout(() => {
      alertBox.classList.add('opacity-100');
    }, FADE_IN_DELAY);

    setTimeout(() => {
      alertBox.classList.remove('opacity-100');
      alertBox.classList.add('opacity-0');

      setTimeout(() => {
        alertBox.remove();
      }, FADE_OUT_DURATION);
    }, duration);
  }

  /**
   * @method notification - Displays a notification message in an element.
   * @param {string} type - The type of notification.
   * @param {string | string[]} message - The message to display.
   * @param {string} status - The status of the notification.
   * @param {HTMLElement} parentElement - The parent element to append the notification to.
   * @param {string} messageGroup - The message group, auto-removes when a new message is added to the group.
   * @returns {HTMLElement} - The notification element.
   */
  notification(
    type = 'alert',
    message,
    status = 'info',
    parentElement,
    messageGroup,
  ) {
    const alert = document.createElement('div');

    let colorClasses = '';
    switch (status) {
      case 'success':
        colorClasses = 'text-green-800 border-green-300 bg-green-50';
        break;
      case 'info':
        colorClasses = 'text-gray-800 border-gray-300 bg-gray-50';
        break;
      case 'warning':
        colorClasses = 'text-yellow-800 border-yellow-300 bg-yellow-50';
        break;
      case 'error':
        colorClasses = 'text-red-800 border-red-300 bg-red-50';
        break;
      default:
        colorClasses = 'text-gray-800 border-gray-300 bg-gray-50';
        break;
    }

    if (type === 'alert') {
      alert.className = `flex items-center p-4 mt-2 mb-4 text-sm ${colorClasses} border rounded-lg`;
      alert.role = 'alert';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'flex-shrink-0 inline w-4 h-4 me-3');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('fill', 'currentColor');
      svg.setAttribute('viewBox', '0 0 20 20');

      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
      );
      path.setAttribute(
        'd',
        'M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 1 1 1 1v4h1a1 1 0 0 1 0 2Z',
      );
      svg.appendChild(path);

      const srOnly = document.createElement('span');
      srOnly.setAttribute('class', 'sr-only');
      srOnly.textContent = 'Info';

      const div = document.createElement('div');
      const fontMedium = document.createElement('span');
      fontMedium.setAttribute('class', 'font-medium');
      fontMedium.textContent = message;

      div.appendChild(fontMedium);

      alert.appendChild(svg);
      alert.appendChild(srOnly);
      alert.appendChild(div);
    } else if (type === 'list') {
      const messageAfterOne = message.slice(1);
      const list = messageAfterOne.map((item) => `<li>${item}</li>`).join('');

      alert.className = `flex p-4 mt-2 mb-4 text-sm ${colorClasses} rounded-lg`;
      alert.role = 'alert';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'flex-shrink-0 inline w-4 h-4 me-3 mt-[2px]');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('fill', 'currentColor');
      svg.setAttribute('viewBox', '0 0 20 20');

      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
      );
      path.setAttribute(
        'd',
        'M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 1 1 1 1v4h1a1 1 0 0 1 0 2Z',
      );
      svg.appendChild(path);

      const srOnly = document.createElement('span');
      srOnly.setAttribute('class', 'sr-only');
      srOnly.textContent = message[0];

      const div = document.createElement('div');

      const fontMedium = document.createElement('span');
      fontMedium.setAttribute('class', 'font-medium');
      fontMedium.textContent = 'Ensure that these requirements are met:';

      const ul = document.createElement('ul');
      ul.setAttribute('class', 'mt-1.5 list-disc list-inside');

      messageAfterOne.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      });

      div.appendChild(fontMedium);
      div.appendChild(ul);

      alert.appendChild(svg);
      alert.appendChild(srOnly);
      alert.appendChild(div);
    }

    parentElement.appendChild(alert);

    if (messageGroup) {
      if (this.notifications.has(messageGroup)) {
        this.notifications.get(messageGroup).remove();
      }

      this.notifications.set(messageGroup, alert);
    }

    return alert;
  }
}

module.exports = UI;
