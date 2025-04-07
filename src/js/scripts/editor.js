/**
 * @fileoverview Editor Functionality
 * @description This script handles the editor's UI interactions, file operations, and autosave.
 */

const Editor = require('../editor');

const MIN_PANEL_WIDTH = 100;
const MIN_PANEL_HEIGHT = 50;
const AUTOSAVE_DELAY = 2000;
const DROPDOWN_HIDE_DELAY = 300;
const SELECTED_FILE_KEY = 'editorOpenFileId'; // Key for localStorage communication

module.exports = function script({ pages, ui, fs }) {
  const verticalResizer = document.getElementById('editor-vertical-resizer');
  const horizontalResizer = document.getElementById(
    'editor-horizontal-resizer',
  );
  const leftPanel = document.getElementById('editor-left-panel');
  const topSection = document.getElementById('editor-top-section');
  const bottomSection = document.getElementById('editor-bottom-section');
  const toolbar = document.getElementById('editor-toolbar');
  const saveStatusText = document.getElementById('editor-save-status-text');
  const fileInputComputer = document.getElementById('file-input-computer');
  const ideFileModal = document.getElementById('ide-file-modal');
  const ideFileList = document.getElementById('ide-file-list');
  const ideFileModalCancel = document.getElementById('ide-file-modal-cancel');
  const ideFileModalTitle = document.getElementById('ide-file-modal-title');

  let currentFileId = null;
  let currentFileName = 'Untitled';
  let isDirty = false;
  let autosaveTimeoutId = null;

  // Initialize the editor
  const editor = new Editor(document.getElementById('editor-editor'));

  function setupDropdowns() {
    const dropdownGroups = toolbar.querySelectorAll('[data-dropdown-group]');

    dropdownGroups.forEach((group) => {
      const menu = group.querySelector('[data-dropdown-menu]');
      let hideTimeoutId = null; // Use a specific timeout ID per group

      if (!menu) return;

      const showMenu = () => {
        clearTimeout(hideTimeoutId); // Clear any pending hide
        // Hide other menus first (optional, good practice)
        dropdownGroups.forEach((otherGroup) => {
          if (otherGroup !== group) {
            otherGroup
              .querySelector('[data-dropdown-menu]')
              ?.classList.add('hidden');
          }
        });
        menu.classList.remove('hidden');
      };

      const startHideTimer = () => {
        clearTimeout(hideTimeoutId); // Clear previous timer if mouse moves quickly
        hideTimeoutId = setTimeout(() => {
          menu.classList.add('hidden');
        }, DROPDOWN_HIDE_DELAY);
      };

      group.addEventListener('mouseenter', showMenu);
      group.addEventListener('mouseleave', startHideTimer);

      // Keep menu open when hovering over the menu itself
      menu.addEventListener('mouseenter', () => clearTimeout(hideTimeoutId));
      menu.addEventListener('mouseleave', startHideTimer); // Also start timer when leaving menu
    });

    // Close dropdown if clicking outside
    document.addEventListener('click', (event) => {
      const clickedInside = Array.from(dropdownGroups).some((group) =>
        group.contains(event.target),
      );
      if (!clickedInside) {
        dropdownGroups.forEach((group) => {
          group.querySelector('[data-dropdown-menu]')?.classList.add('hidden');
        });
      }
    });
  }

  verticalResizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    document.addEventListener('mousemove', resizeVertical);
    document.addEventListener('mouseup', stopResizeVertical);
  });

  function resizeVertical(e) {
    const containerWidth = document.body.clientWidth;
    const newWidth = Math.min(
      containerWidth - MIN_PANEL_WIDTH - verticalResizer.offsetWidth,
      Math.max(MIN_PANEL_WIDTH, e.clientX),
    );
    leftPanel.style.width = `${newWidth}px`;
  }

  function stopResizeVertical() {
    document.removeEventListener('mousemove', resizeVertical);
    document.removeEventListener('mouseup', stopResizeVertical);
  }

  horizontalResizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    document.addEventListener('mousemove', resizeHorizontal);
    document.addEventListener('mouseup', stopResizeHorizontal);
  });

  function resizeHorizontal(e) {
    const rightPanel = horizontalResizer.parentElement; // The right panel container
    if (!rightPanel) return;

    const containerRect = rightPanel.getBoundingClientRect();
    const resizerHeight = horizontalResizer.offsetHeight;
    let newHeight = e.clientY - containerRect.top; // Relative to the right panel top

    // Calculate available height within the right panel
    const totalHeight = rightPanel.clientHeight;

    // Apply constraints relative to the right panel's height
    const minHeight = MIN_PANEL_HEIGHT;
    // Ensure bottom section also has minimum height
    const maxHeight = totalHeight - MIN_PANEL_HEIGHT - resizerHeight;

    newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

    topSection.style.height = `${newHeight}px`;
    // Calculate bottom height dynamically to fill remaining space
    bottomSection.style.height = `calc(100% - ${newHeight}px - ${resizerHeight}px)`;
  }

  function stopResizeHorizontal() {
    document.removeEventListener('mousemove', resizeHorizontal);
    document.removeEventListener('mouseup', stopResizeHorizontal);
  }

  // State Management & Status Updates

  function updateSaveStatus(status = null) {
    clearTimeout(autosaveTimeoutId); // Clear pending autosave on status update
    autosaveTimeoutId = null;

    let text = `File: ${currentFileName}`;
    if (status) {
      text = status; // Use explicit status if provided (e.g., "Saving...", "Saved.")
    } else if (currentFileId) {
      text += isDirty ? ' (Unsaved)' : ' (Saved)';
    } else {
      text += ' (Not saved to IDE)';
    }
    saveStatusText.textContent = text;
    saveStatusText.className = isDirty ? 'text-yellow-400' : 'text-green-400'; // Use Tailwind classes
    if (!currentFileId && !isDirty) {
      saveStatusText.className = 'text-gray-400'; // Default state
    }
    if (status && status.includes('Saving')) {
      saveStatusText.className = 'text-blue-400';
    }
    if (status && status.includes('failed')) {
      saveStatusText.className = 'text-red-400';
    }
  }

  function resetEditorState(fileName = 'Untitled', content = '') {
    editor.setContent(content);
    currentFileId = null;
    currentFileName = fileName;
    isDirty = false;
    updateSaveStatus();
    if (fileInputComputer) {
      fileInputComputer.value = '';
    }
  }

  // File Loading and Saving

  function loadSpecificIdeFile(fileId) {
    console.log(`Attempting to load specified IDE file: ${fileId}`);
    try {
      const fileData = fs.loadFile(fileId);
      if (!fileData) {
        throw new Error(`File with ID ${fileId} not found in IDE storage.`);
      }
      editor.setContent(fileData.content);
      currentFileId = fileData.id;
      currentFileName = fileData.name;
      isDirty = false; // Loaded fresh from storage
      updateSaveStatus();
      ui.alert(`Loaded file "${fileData.name}" from IDE.`, 'success');
    } catch (error) {
      console.error('Error loading specific file from IDE:', error);
      ui.alert(`Failed to load requested file: ${error.message}`, 'error');
      resetEditorState(); // Reset to empty state on failure
    } finally {
      // Always clear the key after attempting to load
      try {
        localStorage.removeItem(SELECTED_FILE_KEY);
      } catch (e) {
        console.warn('Could not remove item from localStorage:', e);
      }
    }
  }

  function loadSelectedIdeFile(fileId) {
    hideIdeFileModal();
    if (isDirty) {
      if (
        !confirm(
          'You have unsaved changes. Are you sure you want to load this file?',
        )
      ) {
        return;
      }
    }
    // Call the dedicated function
    loadSpecificIdeFile(fileId);
  }

  function handleNewFile() {
    if (isDirty) {
      if (
        !confirm(
          'You have unsaved changes. Are you sure you want to create a new file?',
        )
      ) {
        return;
      }
    }
    resetEditorState();
    ui.alert('New empty file created.', 'success');
  }

  function handleLoadFromComputer() {
    fileInputComputer.click();
  }

  fileInputComputer.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      resetEditorState(file.name, content); // Reset state with new file info
      ui.alert(`File "${file.name}" loaded from computer.`, 'success');
    };
    reader.onerror = (e) => {
      console.error('File reading error:', e);
      ui.alert('Error reading file from computer.', 'error');
      resetEditorState(); // Reset to clean state on error
    };
    reader.readAsText(file);
  });

  function showIdeFileModal(mode = 'load') {
    ideFileList.innerHTML = ''; // Clear previous list

    // Set modal title based on mode
    ideFileModalTitle.textContent =
      mode === 'template' ? 'Select Template from IDE' : 'Select File from IDE';

    try {
      const files = fs.listFiles();
      if (files.length === 0) {
        const noFilesMsg = document.createElement('p');
        noFilesMsg.textContent = 'No files saved in the IDE yet.';
        noFilesMsg.className = 'text-gray-500 text-center p-4';
        ideFileList.appendChild(noFilesMsg);
      } else {
        files.forEach((file) => {
          const button = document.createElement('button');
          button.className =
            'block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded';
          button.textContent = `${file.name} (Saved: ${new Date(file.metadata.updatedAt).toLocaleString()})`;
          button.dataset.fileId = file.id;

          // Attach different click handler based on mode
          if (mode === 'template') {
            button.addEventListener('click', () =>
              loadSelectedFileAsTemplate(file.id),
            );
          } else {
            // Default 'load' mode
            button.addEventListener('click', () =>
              loadSelectedIdeFile(file.id),
            );
          }
          ideFileList.appendChild(button);
        });
      }
    } catch (error) {
      console.error('Error listing IDE files:', error);
      ui.alert('Could not list files from IDE.', 'error');
      const errorMsg = document.createElement('p');
      errorMsg.textContent = 'Error loading file list.';
      errorMsg.className = 'text-red-500 text-center p-4';
      ideFileList.appendChild(errorMsg);
    }

    ideFileModal.classList.remove('hidden');
  }

  function hideIdeFileModal() {
    ideFileModal.classList.add('hidden');
  }

  function loadSelectedIdeFile(fileId) {
    hideIdeFileModal();
    try {
      const fileData = fs.loadFile(fileId);
      if (!fileData) {
        throw new Error(`File with ID ${fileId} not found.`);
      }
      editor.setContent(fileData.content);
      currentFileId = fileData.id;
      currentFileName = fileData.name;
      isDirty = false;
      updateSaveStatus();
      ui.alert(`File "${fileData.name}" loaded from IDE.`, 'success');
    } catch (error) {
      console.error('Error loading file from IDE:', error);
      ui.alert(`Failed to load file: ${error.message}`, 'error');
      resetEditorState();
    }
  }

  function loadSelectedFileAsTemplate(templateFileId) {
    hideIdeFileModal();
    try {
      const templateData = fs.loadFile(templateFileId);
      if (!templateData) {
        throw new Error(`Template file with ID ${templateFileId} not found.`);
      }

      // Reset the editor state using the template's content but as a new, unsaved file
      const newFileName = `Untitled from ${templateData.name}`;
      resetEditorState(newFileName, templateData.content);

      ui.alert(
        `Created new file based on template "${templateData.name}".`,
        'success',
      );
    } catch (error) {
      console.error('Error loading file as template:', error);
      ui.alert(`Failed to use file as template: ${error.message}`, 'error');
    }
  }

  ideFileModalCancel.addEventListener('click', hideIdeFileModal);

  function handleSaveToComputer() {
    const content = editor.getContent();
    let suggestedName =
      currentFileName &&
      currentFileName !== 'Untitled' &&
      !currentFileName.startsWith('Untitled from')
        ? currentFileName
        : 'untitled.js';
    // Ensure .js extension
    if (!suggestedName.toLowerCase().endsWith('.js')) {
      suggestedName += '.js';
    }

    const fileName = prompt('Enter filename to save (.js):', suggestedName);

    if (!fileName) {
      return; // User cancelled
    }

    // Basic validation and ensure .js extension
    const finalFileName = fileName.toLowerCase().endsWith('.js')
      ? fileName
      : fileName + '.js';

    const blob = new Blob([content], {
      type: 'application/javascript;charset=utf-8',
    });

    try {
      // Use the download link method (similar to fs.exportFile but with current content)
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        ui.alert(`File "${finalFileName}" saved to computer.`, 'success');
      }, 0);
    } catch (error) {
      console.error('Error saving file to computer:', error);
      ui.alert('Failed to save file to computer.', 'error');
    }
  }

  function handleSaveToIDE() {
    const content = editor.getContent();
    // Suggest a better name if it's based on a template or untitled
    const suggestedName =
      currentFileName &&
      currentFileName !== 'Untitled' &&
      !currentFileName.startsWith('Untitled from')
        ? currentFileName
        : 'new_script.js';

    let fileName = prompt('Enter filename to save in IDE:', suggestedName);

    if (!fileName) {
      return; // User cancelled
    }

    if (!fileName.trim()) {
      ui.alert('Filename cannot be empty.', 'warning');
      return;
    }

    if (!fileName.endsWith('.js')) {
      fileName += '.js'; // Ensure .js extension
    }

    try {
      updateSaveStatus(`Saving "${fileName}" to IDE...`);
      // Always create a new file on "Save As", get new ID
      const newFileId = fs.createFile(
        fileName,
        content,
        null /* boardVersion TBD */,
      );
      currentFileId = newFileId; // Update state to the newly saved file
      currentFileName = fileName;
      isDirty = false; // Now it's saved
      updateSaveStatus(); // Update to "Saved" status
      ui.alert(`File "${fileName}" saved to IDE.`, 'success');
    } catch (error) {
      console.error('Error saving file to IDE:', error);
      ui.alert(`Failed to save to IDE: ${error.message}`, 'error');
      updateSaveStatus('Save failed!'); // Show failure status
    }
  }

  // Autosave functionality

  function triggerAutosave() {
    if (!currentFileId || !isDirty) {
      return; // Only autosave if loaded from IDE and dirty
    }

    clearTimeout(autosaveTimeoutId);
    updateSaveStatus(`File: ${currentFileName} (Saving...)`); // Indicate pending save

    autosaveTimeoutId = setTimeout(() => {
      performAutosave();
    }, AUTOSAVE_DELAY);
  }

  function performAutosave() {
    if (!currentFileId || !isDirty) {
      updateSaveStatus(); // Update status if state changed before save happened
      return;
    }

    const contentToSave = editor.getContent();
    console.log(`Autosaving file: ${currentFileName} (ID: ${currentFileId})`);
    try {
      fs.updateFile(currentFileId, { content: contentToSave });
      isDirty = false;
      const time = new Date().toLocaleTimeString();
      updateSaveStatus(`File: ${currentFileName} (Autosaved at ${time})`);
    } catch (error) {
      console.error('Autosave failed:', error);
      updateSaveStatus('Autosave failed!');
      ui.alert(`Autosave failed: ${error.message}`, 'error');
    }
    autosaveTimeoutId = null;
  }

  // Event Listeners

  editor.onContentChange(() => {
    if (!isDirty) {
      isDirty = true;
      updateSaveStatus(); // Update status immediately to "Unsaved"
    }
    if (currentFileId) {
      // Only schedule autosave if file is from IDE
      triggerAutosave();
    }
  });

  toolbar.addEventListener('click', (e) => {
    const target = e.target;
    const actionButton = target.closest('button[data-action]');

    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.action;

    // Action clicks should immediately hide the dropdown they came from
    const parentGroup = actionButton.closest('[data-dropdown-group]');
    parentGroup?.querySelector('[data-dropdown-menu')?.classList.add('hidden');

    // Check dirty state centrally for actions that load/replace content
    const isLoadAction = [
      'load-ide',
      'load-computer',
      'new-empty',
      'new-template',
      'exit',
    ];
    if (isDirty && isLoadAction.includes(action)) {
      let confirmationMessage =
        'You have unsaved changes. Are you sure you want to continue?';
      if (action === 'exit') {
        confirmationMessage =
          'You have unsaved changes that might not be autosaved. Are you sure you want to exit?';
      } else if (action === 'new-template') {
        confirmationMessage =
          'You have unsaved changes. Are you sure you want to create a new file from a template?';
      } else if (action === 'new-empty') {
        confirmationMessage =
          'You have unsaved changes. Are you sure you want to create a new empty file?';
      } else if (action.startsWith('load-')) {
        confirmationMessage =
          'You have unsaved changes. Are you sure you want to load a different file?';
      }

      if (!confirm(confirmationMessage)) {
        return; // Stop the action if user cancels
      }
    }

    switch (action) {
      case 'load-ide':
        showIdeFileModal('load');
        break;
      case 'load-computer':
        handleLoadFromComputer();
        break;
      case 'new-empty':
        handleNewFile();
        break;
      case 'new-template':
        showIdeFileModal('template');
        break;
      case 'save-ide':
        handleSaveToIDE();
        break;
      case 'save-computer':
        handleSaveToComputer();
        break;
      case 'share':
        // Placeholder for share functionality
        ui.alert('Share functionality not yet implemented.', 'info');
        console.log('Share clicked');
        break;
      case 'exit':
        console.log('Exit clicked');
        pages.switchTo('home-container'); // Switch to home page
        break;
      default:
        console.log('Unknown action clicked:', action);
        break;
    }
  });

  // Initial setup
  setupDropdowns(); // Setup dropdown hover logic

  // Check if we need to load a specific file (navigated from files page)
  const fileIdToOpen = localStorage.getItem(SELECTED_FILE_KEY);
  if (fileIdToOpen) {
    // Attempt to load the file, and remove the key afterwards (done inside the function)
    loadSpecificIdeFile(fileIdToOpen);
  } else {
    // Otherwise, start with a clean state
    resetEditorState();
  }
};
