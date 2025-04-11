/**
 * @fileoverview Editor Functionality
 * @description Handles editor UI, file ops, autosave, library version management, and code execution.
 */

const SUPPORTED_TRIDECCO_VERSIONS = [
  '0.3.1',
  '0.3.0',
  '0.2.3',
  '0.2.2',
  '0.2.1',
  '0.2.0',
  '0.1.1',
]; // Newest first

const Editor = require('../editor');
const URLDataTranscoder = require('../url');

const MIN_PANEL_WIDTH = 100;
const MIN_PANEL_HEIGHT = 50;
const AUTOSAVE_DELAY = 2000;
const TRIDECCO_BOARD_LODING_DELAY = 2000;
const TRIDECCO_BOARD_READY_DELAY = 1500;
const TRIDECCO_BOARD_FAILED_DELAY = 5000;
const SAVE_UNSUPPORTED_DELAY = 4000;
const DROPDOWN_HIDE_DELAY = 200;
const SHARE_GENERATE_INFO_DELAY = 1500;
const SHARE_GENERATE_CLIPBOARD_DELAY = 3000;
const SHARE_GENERATE_MANUAL_DELAY = 4000;

const SELECTED_FILE_KEY = 'editorOpenFileId'; // Key for localStorage communication
const LATEST_TRIDECCO_VERSION = SUPPORTED_TRIDECCO_VERSIONS[0];
const TRIDECCO_SCRIPT_ID = 'tridecco-board-script'; // ID for the script tag
const SHARE_PARAM_NAME = 'data';

const DEFAULT_EDITOR_CONTENT = `/*
 *******************************************************************************************
 * Import the Tridecco Board library using new Tridecco.<className> to initialize.         *
 * More details please go to: https://github.com/tridecco/game-board for more information. *
 *                                                                                         *
 * Please use 'CanvasContainer' to initialize Tridecco Board Renderer.                     *
 *******************************************************************************************
*/`;

module.exports = function script({ pages, ui, fs }) {
  const CanvasContainer = document.getElementById('editor-canvas-container'); // For editor usage

  const verticalResizer = document.getElementById('editor-vertical-resizer');
  const horizontalResizer = document.getElementById(
    'editor-horizontal-resizer',
  );
  const leftPanel = document.getElementById('editor-left-panel');
  const toolbar = document.getElementById('editor-toolbar');
  const saveStatusText = document.getElementById('editor-save-status-text');
  const fileInputComputer = document.getElementById('file-input-computer');
  const ideFileModal = document.getElementById('ide-file-modal');
  const ideFileList = document.getElementById('ide-file-list');
  const ideFileModalCancel = document.getElementById('ide-file-modal-cancel');
  const ideFileModalTitle = document.getElementById('ide-file-modal-title');
  const trideccoVersionSelector = document.getElementById(
    'tridecco-board-version-selector',
  );
  const canvasContainer = document.getElementById('editor-canvas-container');
  const consoleOutput = document.getElementById('editor-console-output');

  let currentFileId = null;
  let currentFileName = 'Untitled';
  let isDirty = false;
  let autosaveTimeoutId = null;
  let currentBoardVersion = null;
  let isBoardLoading = false;
  let originalConsoleLog = null; // To store original console.log
  let originalConsoleError = null; // To store original console.error

  // Initialize the editor
  const editor = new Editor(document.getElementById('editor-editor'));

  // Console output functions

  function clearConsoleOutput() {
    if (consoleOutput) consoleOutput.innerHTML = '';
  }

  function appendToConsole(message, type = 'log') {
    if (!consoleOutput) return;

    const entry = document.createElement('div');
    // Basic escaping, consider a more robust library for complex HTML injection prevention if needed
    const escapedMessage = String(message) // Ensure it's a string
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '\'')
      .replace(/\n/g, '<br>'); // Keep line breaks visible

    entry.innerHTML = escapedMessage;

    switch (type) {
      case 'error':
        entry.className = 'text-red-400';
        break;
      case 'warn':
        entry.className = 'text-yellow-400';
        break;
      case 'info':
        entry.className = 'text-blue-400';
        break;
      default:
        entry.className = 'text-gray-300'; // Default log color
    }

    consoleOutput.appendChild(entry);
    // Auto-scroll to the bottom
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }

  function overrideConsole() {
    if (originalConsoleLog) return; // Already overridden

    originalConsoleLog = console.log;
    originalConsoleError = console.error;

    console.log = function log(...args) {
      originalConsoleLog.apply(console, args); // Keep original behavior
      appendToConsole(args.map(String).join(' '), 'log'); // Basic joining
    };

    console.error = function error(...args) {
      originalConsoleError.apply(console, args); // Keep original behavior
      // Format error message slightly better
      const errorMessage = args
        .map((arg) =>
          arg instanceof Error ? arg.stack || arg.message : String(arg),
        )
        .join(' ');
      appendToConsole(errorMessage, 'error');
    };

    console.warn = function warn(...args) {
      appendToConsole(args.map(String).join(' '), 'warn');
    };

    console.info = function info(...args) {
      appendToConsole(args.map(String).join(' '), 'info');
    };
  }

  // Call overrideConsole to start capturing logs

  function cleanupBoardResources() {
    if (!canvasContainer) return;
    const existingCanvas = canvasContainer.querySelector('canvas');
    if (existingCanvas) {
      existingCanvas.remove();
      console.info('Previous canvas removed.');
    }

    // Reset placeholder text visibility (if you added one)
    const placeholder = canvasContainer.querySelector('.absolute');
    if (placeholder) placeholder.style.display = ''; // Show placeholder again
  }

  function runCurrentCode() {
    if (typeof window.Tridecco === 'undefined' || !window.Tridecco) {
      console.error(
        'Tridecco Board library is not available. Cannot run code.',
      );
      ui.alert(
        'Tridecco Board library not loaded. Try selecting a version or reloading.',
        'error',
      );
      return;
    }
    if (!canvasContainer) {
      console.error('Canvas container element not found. Cannot run code.');
      ui.alert('Required UI element (canvas container) missing.', 'error');
      return;
    }

    clearConsoleOutput();
    cleanupBoardResources(); // Clean up before running new code
    console.log('--- Running Code ---');
    const placeholder = canvasContainer.querySelector('.absolute');
    if (placeholder) placeholder.style.display = 'none'; // Hide placeholder

    const codeToRun = editor.getContent();

    try {
      eval(codeToRun);
    } catch (error) {
      console.error(error); // Log the error object to our custom console
    } finally {
      console.log('--- Code Execution Finished ---');
    }
  }

  async function initializeAndRunBoard() {
    if (!currentBoardVersion || isBoardLoading) {
      console.warn('Board not ready or still loading, skipping run.');
      return;
    }
    runCurrentCode();
  }

  // Tridecco Board Version Management

  function populateVersionSelector() {
    if (!trideccoVersionSelector) return;
    trideccoVersionSelector.innerHTML = ''; // Clear existing options
    SUPPORTED_TRIDECCO_VERSIONS.forEach((version) => {
      const option = document.createElement('option');
      option.value = version;
      option.textContent = version;
      trideccoVersionSelector.appendChild(option);
    });
  }

  function loadTrideccoVersion(version) {
    return new Promise((resolve, reject) => {
      if (isBoardLoading) {
        reject(new Error('Loading already in progress.'));
        return;
      }
      if (!SUPPORTED_TRIDECCO_VERSIONS.includes(version)) {
        reject(new Error(`Unsupported version: ${version}`));
        return;
      }

      console.log(`Attempting to load Tridecco Board version: ${version}`);
      isBoardLoading = true;
      trideccoVersionSelector.disabled = true;
      ui.alert(
        `Loading Tridecco Board v${version}...`,
        'info',
        TRIDECCO_BOARD_LODING_DELAY,
      );
      cleanupBoardResources(); // Clean up before loading new version

      const existingScript = document.getElementById(TRIDECCO_SCRIPT_ID);
      if (existingScript) existingScript.remove();

      const scriptTag = document.createElement('script');
      scriptTag.id = TRIDECCO_SCRIPT_ID;
      scriptTag.src = `https://cdn.jsdelivr.net/npm/tridecco-board@${version}/dist/tridecco-board.min.js`;
      scriptTag.async = true;

      scriptTag.onload = async () => {
        console.log(`Tridecco Board v${version} loaded successfully.`);
        currentBoardVersion = version;
        trideccoVersionSelector.value = version;
        isBoardLoading = false;
        trideccoVersionSelector.disabled = false;
        ui.alert(
          `Tridecco Board v${version} ready.`,
          'success',
          TRIDECCO_BOARD_READY_DELAY,
        );

        await initializeAndRunBoard();

        resolve();
      };

      scriptTag.onerror = (error) => {
        console.error(`Failed to load Tridecco Board v${version}:`, error);
        isBoardLoading = false;
        trideccoVersionSelector.disabled = false;
        if (currentBoardVersion) {
          trideccoVersionSelector.value = currentBoardVersion; // Revert selection
        }

        ui.alert(
          `Failed to load Tridecco Board v${version}.`,
          'error',
          TRIDECCO_BOARD_FAILED_DELAY,
        );
        reject(new Error(`Failed to load script for version ${version}`));
      };

      document.head.appendChild(scriptTag);
    });
  }

  async function handleVersionChange() {
    if (!trideccoVersionSelector || isBoardLoading) return;

    const selectedVersion = trideccoVersionSelector.value;
    if (selectedVersion === currentBoardVersion) {
      return; // No change needed
    }

    try {
      await loadTrideccoVersion(selectedVersion);
      // Mark file as dirty since the associated library version changed
      if (currentFileId) {
        // Only mark dirty if it's a saved file
        isDirty = true;
        updateSaveStatus();
        triggerAutosave(); // Trigger autosave for the version change
      } else {
        // For unsaved files, just update the potential version to save
        // No need to mark dirty as it wasn't saved yet anyway
        updateSaveStatus();
      }
    } catch (error) {
      // Error already handled and alerted in loadTrideccoVersion
      console.warn('Version change failed, UI selection potentially reverted.');
      // loadTrideccoVersion's onerror attempts to reset the selector
    }
  }

  // Dropdown Menu Setup
  function setupDropdowns() {
    const dropdownGroups = toolbar.querySelectorAll('[data-dropdown-group]');

    dropdownGroups.forEach((group) => {
      const menu = group.querySelector('[data-dropdown-menu]');
      let hideTimeoutId = null; // Use a specific timeout ID per group

      if (!menu) return;

      const showMenu = () => {
        clearTimeout(hideTimeoutId); // Clear any pending hide
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
    // Adjust resize logic for the new canvas/console panel IDs
    const rightPanel = horizontalResizer.parentElement;
    if (!rightPanel) return;
    const containerRect = rightPanel.getBoundingClientRect();
    const resizerHeight = horizontalResizer.offsetHeight;
    let newHeight = e.clientY - containerRect.top;
    const totalHeight = rightPanel.clientHeight;
    const minHeight = MIN_PANEL_HEIGHT;
    const maxHeight = totalHeight - MIN_PANEL_HEIGHT - resizerHeight;
    newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

    // Use the correct IDs for canvas/console panels
    const canvasPanel = document.getElementById('editor-canvas-panel');
    const consolePanel = document.getElementById('editor-console-panel');
    if (canvasPanel) canvasPanel.style.height = `${newHeight}px`;
    if (consolePanel) {
      consolePanel.style.height = `calc(100% - ${newHeight}px - ${resizerHeight}px)`;
    }
  }

  function stopResizeHorizontal() {
    document.removeEventListener('mousemove', resizeHorizontal);
    document.removeEventListener('mouseup', stopResizeHorizontal);
  }

  // State Management & Status Updates

  function updateSaveStatus(status = null) {
    clearTimeout(autosaveTimeoutId);
    autosaveTimeoutId = null;

    let text = `File: ${currentFileName}`;
    if (status) {
      text = status;
    } else if (currentFileId) {
      text += isDirty ? ' (Unsaved)' : ' (Saved)';
    } else {
      text += ' (Not saved to IDE)';
    }
    // Add board version info if available
    if (currentBoardVersion && !status) {
      // Don't overwrite explicit status messages
      text += ` [Board: v${currentBoardVersion}]`;
    } else if (!currentBoardVersion && !status && trideccoVersionSelector) {
      text += ` [Board: v${trideccoVersionSelector.value || '?'}]`; // Show selected even if not loaded
    }

    saveStatusText.textContent = text;
    saveStatusText.className = 'text-gray-400'; // Default
    if (currentFileId) {
      saveStatusText.className = isDirty ? 'text-yellow-400' : 'text-green-400';
    }
    if (status && status.includes('Saving')) {
      saveStatusText.className = 'text-blue-400';
    }
    if (status && status.includes('failed')) {
      saveStatusText.className = 'text-red-400';
    }
    if (status && status.includes('Autosaved')) {
      saveStatusText.className = 'text-green-400'; // Ensure autosaved shows green
    }
  }

  // Modified resetEditorState to handle board version
  function resetEditorState(
    fileName = 'Untitled',
    content = DEFAULT_EDITOR_CONTENT,
    boardVersion = LATEST_TRIDECCO_VERSION,
  ) {
    // Clear the open file request key immediately
    try {
      localStorage.removeItem(SELECTED_FILE_KEY);
    } catch (e) {
      console.warn('Could not remove item from localStorage:', e);
    }
    editor.setContent(content);
    currentFileId = null;
    currentFileName = fileName;
    isDirty = false; // Reset dirty state

    // Determine the version to load (default to latest for new files)
    const versionToLoad = SUPPORTED_TRIDECCO_VERSIONS.includes(boardVersion)
      ? boardVersion
      : LATEST_TRIDECCO_VERSION;

    // Set UI immediately, loadTrideccoVersion will handle the async load and run
    trideccoVersionSelector.value = versionToLoad;
    loadTrideccoVersion(versionToLoad).catch((err) => {
      console.error('Initial version load failed during reset:', err);
      // UI already alerted, selector should be reset by error handler in loadTrideccoVersion
    });

    updateSaveStatus(); // Update status after setting everything
    if (fileInputComputer) {
      fileInputComputer.value = '';
    }
    console.log(
      `Editor reset. State: ${fileName}, Board Version Target: ${versionToLoad}`,
    );
  }

  // File Operations

  // Modify loadSpecificIdeFile
  function loadSpecificIdeFile(fileId) {
    console.log(`Attempting to load specified IDE file: ${fileId}`);
    let versionToLoad = LATEST_TRIDECCO_VERSION;
    try {
      const fileData = fs.loadFile(fileId);
      if (!fileData) throw new Error(`File ID ${fileId} not found.`);

      editor.setContent(fileData.content); // Set content *before* running
      currentFileId = fileData.id;
      currentFileName = fileData.name;
      isDirty = false; // Loaded fresh from storage

      // Determine version from file data
      if (
        fileData.boardVersion &&
        SUPPORTED_TRIDECCO_VERSIONS.includes(fileData.boardVersion)
      ) {
        versionToLoad = fileData.boardVersion;
        console.log(`File specifies supported board version: ${versionToLoad}`);
      } else if (fileData.boardVersion) {
        console.warn(
          `File ${fileId} saved with unsupported version "${fileData.boardVersion}". Loading latest (${LATEST_TRIDECCO_VERSION}).`,
        );
        ui.alert(
          `File saved with unsupported version (${fileData.boardVersion}). Loading latest.`,
          'warning',
          SAVE_UNSUPPORTED_DELAY,
        );
        // versionToLoad remains LATEST_TRIDECCO_VERSION
      } else {
        console.log(
          `File ${fileId} does not specify a board version. Loading latest (${LATEST_TRIDECCO_VERSION}).`,
        );
      }
      // Set UI immediately, loadTrideccoVersion handles async load and run
      trideccoVersionSelector.value = versionToLoad;
      loadTrideccoVersion(versionToLoad).catch((err) =>
        console.error('Version load failed after loading file:', err),
      );

      updateSaveStatus();
    } catch (error) {
      console.error('Error loading specific file from IDE:', error);
      ui.alert(`Failed to load requested file: ${error.message}`, 'error');
      resetEditorState();
    } finally {
      try {
        localStorage.removeItem(SELECTED_FILE_KEY);
      } catch (e) {
        console.warn('Could not remove item from localStorage:', e);
      }
    }
  }

  // This is the correct version of loadSelectedIdeFile (handling the duplicate from original)
  function loadSelectedIdeFile(fileId) {
    hideIdeFileModal();
    // Add dirty check (was missing in the second definition in original)
    if (isDirty) {
      if (
        !confirm(
          'You have unsaved changes. Are you sure you want to load this file?',
        )
      ) {
        return;
      }
    }
    // Call the dedicated function which now handles versioning
    loadSpecificIdeFile(fileId);
  }

  function handleNewFile() {
    // Dirty check moved to central toolbar handler
    resetEditorState(); // Resets to untitled, empty content, and LATEST board version
    ui.alert('New empty file created.', 'success');
  }

  function handleLoadFromComputer() {
    // Dirty check moved to central toolbar handler
    fileInputComputer.click();
  }

  fileInputComputer.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      // Reset state with new file info, default to LATEST board version for local files
      resetEditorState(file.name, content, LATEST_TRIDECCO_VERSION);
      ui.alert(
        `File "${file.name}" loaded from computer. Using Board v${LATEST_TRIDECCO_VERSION}.`,
        'success',
      );
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
          // Include board version in display if available
          const versionText = file.boardVersion
            ? ` (v${file.boardVersion})`
            : '';
          button.textContent = `${file.name}${versionText} (Saved: ${new Date(file.metadata?.updatedAt || Date.now()).toLocaleString()})`;
          button.dataset.fileId = file.id;

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

  // Modified loadSelectedFileAsTemplate to always use LATEST version
  function loadSelectedFileAsTemplate(templateFileId) {
    hideIdeFileModal();
    // Dirty check moved to central toolbar handler

    try {
      const templateData = fs.loadFile(templateFileId);
      if (!templateData) {
        throw new Error(`Template file with ID ${templateFileId} not found.`);
      }

      // Reset state using template content but as a NEW unsaved file
      const newFileName = `Untitled from ${templateData.name}`;
      // New files from template always start with the LATEST board version
      resetEditorState(
        newFileName,
        templateData.content,
        LATEST_TRIDECCO_VERSION,
      );
      // resetEditorState handles loading the version and updating the selector

      ui.alert(
        `Created new file based on template "${templateData.name}". Using board v${LATEST_TRIDECCO_VERSION}.`,
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
    if (!suggestedName.endsWith('.js')) suggestedName += '.js';

    const fileName = prompt('Enter filename to save (.js):', suggestedName);
    if (!fileName) return; // User cancelled

    const finalFileName = fileName.endsWith('.js')
      ? fileName
      : fileName + '.js';

    const blob = new Blob([content], {
      type: 'application/javascript;charset=utf-8',
    });

    try {
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

  // Modified handleSaveToIDE to include current board version
  function handleSaveToIDE() {
    const content = editor.getContent();
    // Use the *currently selected* version from the dropdown for saving
    const versionToSave =
      trideccoVersionSelector?.value ||
      currentBoardVersion ||
      LATEST_TRIDECCO_VERSION;

    const suggestedName =
      currentFileName &&
      currentFileName !== 'Untitled' &&
      !currentFileName.startsWith('Untitled from')
        ? currentFileName
        : 'new_script.js';

    let fileName = prompt(
      `Enter filename to save in IDE (Board v${versionToSave}):`,
      suggestedName,
    );

    if (!fileName) return; // User cancelled

    if (!fileName.trim()) {
      ui.alert('Filename cannot be empty.', 'warning');
      return;
    }
    if (!fileName.endsWith('.js')) fileName += '.js'; // Ensure .js extension

    try {
      updateSaveStatus(`Saving "${fileName}" to IDE...`);

      const newFileId = fs.createFile(
        fileName,
        content,
        versionToSave, // Pass the selected board version
      );

      // Update state to reflect the saved file
      currentFileId = newFileId;
      currentFileName = fileName;
      currentBoardVersion = versionToSave; // Reflect the saved version state
      isDirty = false; // Now it's saved
      updateSaveStatus(); // Update status to "Saved" (will include version)
      if (trideccoVersionSelector) {
        trideccoVersionSelector.value = versionToSave; // Ensure UI matches saved state
      }

      ui.alert(
        `File "${fileName}" (Board v${versionToSave}) saved to IDE.`,
        'success',
      );
    } catch (error) {
      console.error('Error saving file to IDE:', error);
      ui.alert(`Failed to save to IDE: ${error.message}`, 'error');
      updateSaveStatus('Save failed!'); // Show failure status
    }
  }

  async function handleShare() {
    ui.alert('Generating share URL...', 'info', SHARE_GENERATE_INFO_DELAY);

    const content = editor.getContent();
    const version =
      trideccoVersionSelector.value ||
      currentBoardVersion ||
      LATEST_TRIDECCO_VERSION;

    const dataToEncode = { content, version };

    try {
      const encodedData = URLDataTranscoder.compile(dataToEncode);

      if (!encodedData) {
        throw new Error('Encoding resulted in null data.');
      }

      // Use encodeURIComponent on the compressed string
      const encodedParam = encodeURIComponent(encodedData);
      const baseUrl = window.location.origin + window.location.pathname;
      const shareUrl = `${baseUrl}?${SHARE_PARAM_NAME}=${encodedParam}`;

      // Attempt to copy to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        // Check for secure context
        await navigator.clipboard.writeText(shareUrl);
        ui.alert(
          'Share URL copied to clipboard!',
          'success',
          SHARE_GENERATE_CLIPBOARD_DELAY,
        );
      } else {
        // Fallback for insecure contexts or older browsers
        console.warn(
          'Clipboard API not available or context insecure. Showing prompt instead.',
        );
        prompt('Copy this shareable URL:', shareUrl);
        ui.alert(
          'URL generated. Please copy it manually.',
          'info',
          SHARE_GENERATE_MANUAL_DELAY,
        );
      }

      console.log(
        'Share URL:',
        '<a href="' + shareUrl + '">' + shareUrl + '</a>',
      );
    } catch (error) {
      console.error('Error generating share URL:', error);
      ui.alert(
        'Failed to generate share URL. See console for details.',
        'error',
      );
    }
  }

  // Autosave Functionality

  function triggerAutosave() {
    // Only autosave if loaded from IDE, dirty, and board library isn't currently loading
    if (!currentFileId || !isDirty || isBoardLoading) {
      return;
    }

    clearTimeout(autosaveTimeoutId);
    // Show specific saving status, then schedule the save
    updateSaveStatus(
      `File: ${currentFileName} (Saving...) [Board: v${trideccoVersionSelector?.value || '?'}]`,
    );

    autosaveTimeoutId = setTimeout(() => {
      performAutosave();
    }, AUTOSAVE_DELAY);
  }

  // Modified performAutosave to include current board version
  function performAutosave() {
    if (!currentFileId || !isDirty || isBoardLoading) {
      // Double check conditions before saving
      updateSaveStatus(); // Update status if state changed before save happened
      return;
    }

    const contentToSave = editor.getContent();
    // Get version from the selector UI as the source of truth for saving
    const versionToSave =
      trideccoVersionSelector?.value ||
      currentBoardVersion ||
      LATEST_TRIDECCO_VERSION;

    console.log(
      `Autosaving file: ${currentFileName} (ID: ${currentFileId}, Version: ${versionToSave})`,
    );
    try {
      // Update content AND boardVersion
      fs.updateFile(currentFileId, {
        content: contentToSave,
        boardVersion: versionToSave,
      });
      isDirty = false;
      currentBoardVersion = versionToSave; // Update state to match saved version
      const time = new Date().toLocaleTimeString();
      // Update status to show autosaved time and version
      updateSaveStatus(
        `File: ${currentFileName} (Autosaved at ${time}) [Board: v${versionToSave}]`,
      );
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
    // Trigger autosave if file is from IDE AND board isn't currently loading
    if (currentFileId && !isBoardLoading) {
      triggerAutosave();
    }
  });

  trideccoVersionSelector.addEventListener('change', handleVersionChange);

  // Add Run action to toolbar listener
  toolbar.addEventListener('click', (e) => {
    const target = e.target;
    const actionButton = target.closest('button[data-action]');
    if (!actionButton) return;
    const action = actionButton.dataset.action;

    // Hide dropdown if click was inside one
    const parentGroup = actionButton.closest('[data-dropdown-group]');
    parentGroup?.querySelector('[data-dropdown-menu')?.classList.add('hidden');

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
      // Customize messages for clarity
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
      // If confirmed, proceed (reset dirty state if needed, handled by load/new functions)
      isDirty = false; // Assume action will succeed or reset state
      updateSaveStatus(); // Update status immediately
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
        handleShare();
        break;
      case 'exit':
        console.log('Exit clicked');
        // Perform any final cleanup if needed before switching
        clearTimeout(autosaveTimeoutId); // Cancel pending autosave
        pages.switchTo('home-container');
        break;
      case 'run-code':
        if (isBoardLoading) {
          ui.alert('Board library is still loading, please wait.', 'info');
        } else {
          initializeAndRunBoard(); // Re-run with current code/version
        }
        break;
      default:
        console.log('Unknown action clicked:', action);
        break;
    }
  });

  // Initialization and Page Lifecycle

  // Function to run when the editor page is shown
  function editorPageOnOpen() {
    console.log('Editor page opening...');

    let loadedFromUrl = false;
    const urlParams = new URLSearchParams(window.location.search);
    const sharedDataEncoded = urlParams.get(SHARE_PARAM_NAME);

    if (sharedDataEncoded) {
      console.log('Found shared data in URL parameter.');
      try {
        // Decode the URL component first, then decompile
        const decompressedDataString = decodeURIComponent(sharedDataEncoded);
        const decodedData = URLDataTranscoder.decompile(decompressedDataString);

        if (
          decodedData &&
          typeof decodedData.content === 'string' &&
          typeof decodedData.version === 'string'
        ) {
          console.log('Successfully decompiled shared data:', decodedData);
          // Reset editor state using shared data
          resetEditorState(
            'Shared File',
            decodedData.content,
            decodedData.version,
          ); // Pass flag
          ui.alert('Loaded shared file content.', 'success');
          loadedFromUrl = true;

          // Clean the URL parameter after successful load
          try {
            const cleanUrl =
              window.location.origin +
              window.location.pathname +
              window.location.hash;
            history.replaceState(null, '', cleanUrl);
            console.log('Cleaned share data from URL.');
          } catch (e) {
            console.warn('Could not clean URL history state:', e);
          }
        } else {
          throw new Error('Decompiled data format is invalid.');
        }
      } catch (error) {
        console.error('Failed to load shared data from URL:', error);
        ui.alert(
          'Failed to load shared data from URL. It might be corrupted.',
          'error',
        );
        // Clean the URL parameter even if loading failed to prevent retry loops
        try {
          const cleanUrl =
            window.location.origin +
            window.location.pathname +
            window.location.hash;
          history.replaceState(null, '', cleanUrl);
        } catch (e) {
          console.warn('Could not clean URL history state:', e);
        }
      }
    }

    // If NOT loaded from URL, check localStorage
    if (!loadedFromUrl) {
      const fileIdToOpen = localStorage.getItem(SELECTED_FILE_KEY);
      if (fileIdToOpen) {
        console.log(`Found file ID to open from localStorage: ${fileIdToOpen}`);
        // This function handles version loading and removes the key
        loadSpecificIdeFile(fileIdToOpen);
      } else {
        console.log(
          'No specific file ID or shared URL data, starting new file.',
        );
        // This loads the latest version and runs code
        resetEditorState();
      }
    }
  }

  // Initial setup calls
  overrideConsole(); // Setup console redirection first
  setupDropdowns();
  populateVersionSelector(); // Populate the dropdown menu with versions

  // Register the function to run when this page container becomes visible
  pages.onShow('editor-container', editorPageOnOpen);
};
