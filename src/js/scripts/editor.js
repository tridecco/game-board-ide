/**
 * @fileoverview Editor Functionality
 * @description This script handles the editor's UI interactions, including resizing panels and toolbar functionality.
 */

module.exports = function script() {
  const MIN_PANEL_WIDTH = 100; // Minimum width for the left panel
  const MIN_PANEL_HEIGHT = 50; // Minimum height for the top section

  const verticalResizer = document.getElementById('editor-vertical-resizer');
  const horizontalResizer = document.getElementById(
    'editor-horizontal-resizer',
  );
  const leftPanel = document.getElementById('editor-left-panel');
  const topSection = document.getElementById('editor-top-section');
  const bottomSection = document.getElementById('editor-bottom-section');

  // Vertical Resizer (Left/Right)
  verticalResizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    document.addEventListener('mousemove', resizeVertical);
    document.addEventListener('mouseup', stopResizeVertical);
  });

  function resizeVertical(e) {
    const newWidth = Math.max(MIN_PANEL_WIDTH, e.clientX);
    leftPanel.style.width = `${newWidth}px`;
  }

  function stopResizeVertical() {
    document.removeEventListener('mousemove', resizeVertical);
    document.removeEventListener('mouseup', stopResizeVertical);
  }

  // Horizontal Resizer (Top/Bottom)
  horizontalResizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    document.addEventListener('mousemove', resizeHorizontal);
    document.addEventListener('mouseup', stopResizeHorizontal);
  });

  function resizeHorizontal(e) {
    const containerHeight = document.body.clientHeight;
    const offsetTop = topSection.parentElement.offsetTop;
    const newHeight = e.clientY - offsetTop;

    const minHeight = MIN_PANEL_HEIGHT;
    const maxHeight = containerHeight - MIN_PANEL_HEIGHT;

    topSection.style.height = `${Math.min(Math.max(newHeight, minHeight), maxHeight)}px`;
    bottomSection.style.height = `${containerHeight - topSection.offsetHeight - horizontalResizer.offsetHeight}px`;
  }

  function stopResizeHorizontal() {
    document.removeEventListener('mousemove', resizeHorizontal);
    document.removeEventListener('mouseup', stopResizeHorizontal);
  }

  // Toolbar functionality (placeholders)
  document.querySelector('#editor-toolbar').addEventListener('click', (e) => {
    const textContent = e.target.textContent.trim();

    switch (textContent) {
      case 'Open File':
        // Placeholder for open file functionality
        console.log('Open File clicked');
        break;
      case 'From IDE':
        // Placeholder for open file from IDE functionality
        console.log('Open File from IDE clicked');
        break;
      case 'From Computer':
        // Placeholder for open file from computer functionality
        console.log('Open File from Computer clicked');
        break;
      case 'New File':
        // Placeholder for new file functionality
        console.log('New File clicked');
        break;
      case 'Empty':
        // Placeholder for creating an empty new file
        console.log('New Empty File created');
        break;
      case 'From Template':
        // Placeholder for creating a new file from a template
        console.log('New File from Template created');
        break;
      case 'Save File':
        // Placeholder for save file functionality
        console.log('Save File clicked');
        break;
      case 'To IDE':
        // Placeholder for saving file to IDE functionality
        console.log('Save File to IDE clicked');
        break;
      case 'To Computer':
        // Placeholder for saving file to computer functionality
        console.log('Save File to Computer clicked');
        break;
      case 'Share':
        // Placeholder for share functionality
        console.log('Share clicked');
        break;
      case 'Exit':
        // Placeholder for exit functionality
        console.log('Exit clicked');
        // Optionally, you might want to close the editor or redirect to another page
        window.close(); // This will attempt to close the current window
        break;
      default:
        console.log('Unknown action clicked:', textContent);
        break;
    }
  });
};
