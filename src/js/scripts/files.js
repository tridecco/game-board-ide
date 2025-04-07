/**
 * @fileoverview Files Page Script
 * @description Handles listing, searching, opening, renaming, deleting, and downloading files stored in the IDE.
 */

const SELECTED_FILE_KEY = 'editorOpenFileId'; // Key for localStorage communication
const ALERT_DURATION = 4000;
const ALERT_SHORT_DURATION = 2000;
const ALERT_LONG_DURATION = 5000;
const ALERT_DELAY = 100;
const TIMESTAMP_SLICE_LENGTH = 19;

module.exports = function filesScript({ pages, ui, fs }) {
  const container = document.getElementById('files-container');
  const tableBody = document.getElementById('files-table-body');
  const emptyMessage = document.getElementById('files-empty-message');
  const searchInput = document.getElementById('files-search-input');
  const downloadZipButton = document.getElementById(
    'files-download-zip-button',
  );

  let allFilesCache = []; // Cache the full list for searching

  function formatTimestamp(timestamp) {
    // ... (keep existing formatTimestamp function) ...
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      console.warn('Failed to format timestamp:', timestamp, e);
      return 'Invalid Date';
    }
  }

  function renderFileList(filesToRender) {
    if (!tableBody || !emptyMessage || !downloadZipButton) return;

    tableBody.innerHTML = ''; // Clear previous content
    emptyMessage.classList.add('hidden');
    downloadZipButton.disabled = true; // Disable initially

    if (!filesToRender || filesToRender.length === 0) {
      emptyMessage.classList.remove('hidden');
      // Update message based on whether it's a search result or initial load
      emptyMessage.textContent = searchInput.value
        ? 'No files found matching your search.'
        : 'No files found in the IDE storage.';
      return; // Stop here if no files to render
    }

    // Enable download button if there are files
    downloadZipButton.disabled = false;

    filesToRender.forEach((file) => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50';
      const lastModified = file.metadata?.updatedAt;
      const fileName = file.name || 'Unnamed File';

      row.innerHTML = `
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${fileName}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${formatTimestamp(lastModified)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button data-action="open" data-file-id="${file.id}"
                              class="text-indigo-600 hover:text-indigo-900" title="Open in Editor">
                          Open
                      </button>
                      <button data-action="rename" data-file-id="${file.id}" data-current-name="${fileName}"
                              class="text-yellow-600 hover:text-yellow-900" title="Rename File">
                          Rename
                      </button>
                      <button data-action="download-single" data-file-id="${file.id}"
                              class="text-green-600 hover:text-green-900" title="Download File">
                          Download
                      </button>
                      <button data-action="delete" data-file-id="${file.id}"
                              class="text-red-600 hover:text-red-900" title="Delete File">
                          Delete
                      </button>
                  </td>
              `;
      tableBody.appendChild(row);
    });
  }

  async function loadAndDisplayFiles() {
    if (!tableBody || !emptyMessage || !downloadZipButton) return;

    tableBody.innerHTML = `
              <tr>
                  <td colspan="3" class="px-6 py-4 text-center text-gray-500">
                      Loading files...
                  </td>
              </tr>`;
    emptyMessage.classList.add('hidden');
    downloadZipButton.disabled = true; // Disable while loading

    try {
      allFilesCache = fs.listFiles(); // Fetch and cache
      filterAndRenderFiles(); // Render based on current search (if any)
    } catch (error) {
      console.error('Failed to list files:', error);
      allFilesCache = []; // Clear cache on error
      tableBody.innerHTML = `
                  <tr>
                      <td colspan="3" class="px-6 py-4 text-center text-red-500">
                          Error loading files: ${error.message}
                      </td>
                  </tr>`;
      emptyMessage.classList.remove('hidden');
      emptyMessage.textContent = 'Error loading files.';
      ui.alert('Failed to load file list.', 'error');
    }
  }

  function filterAndRenderFiles() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (!searchTerm) {
      renderFileList(allFilesCache); // Render all cached files if search is empty
      return;
    }

    const filteredFiles = allFilesCache.filter((file) =>
      (file.name || '').toLowerCase().includes(searchTerm),
    );
    renderFileList(filteredFiles);
  }

  function handleOpenFile(fileId) {
    if (!fileId) return;
    console.log(`Requesting to open file: ${fileId}`);
    try {
      localStorage.setItem(SELECTED_FILE_KEY, fileId);
      pages.switchTo('editor-container');
    } catch (e) {
      console.error('Failed to set item in localStorage:', e);
      ui.alert('Could not prepare file for opening. Storage error.', 'error');
    }
  }

  function handleRenameFile(fileId, currentName) {
    if (!fileId) return;

    const newName = prompt('Enter new file name:', currentName);

    if (newName === null || newName.trim() === '') {
      if (newName !== null) ui.alert('File name cannot be empty.', 'warning');
      return;
    }

    if (newName === currentName) return;

    try {
      fs.updateFile(fileId, { name: newName.trim() });
      ui.alert(`File renamed to "${newName.trim()}".`, 'success');
      loadAndDisplayFiles(); // Reload and re-render the list to reflect change
    } catch (error) {
      console.error(`Failed to rename file ${fileId}:`, error);
      ui.alert(`Failed to rename file: ${error.message}`, 'error');
    }
  }

  function handleDeleteFile(fileId) {
    // ... (keep existing handleDeleteFile function, but refresh correctly) ...
    if (!fileId) return;

    if (confirm('Are you sure you want to permanently delete this file?')) {
      try {
        fs.deleteFile(fileId);
        ui.alert('File deleted successfully.', 'success');
        loadAndDisplayFiles(); // Reload and re-render the list
      } catch (error) {
        console.error(`Failed to delete file ${fileId}:`, error);
        ui.alert(`Failed to delete file: ${error.message}`, 'error');
      }
    }
  }

  function handleDownloadSingleFile(fileId) {
    if (!fileId) return;

    try {
      const fileData = fs.loadFile(fileId);
      if (!fileData) {
        throw new Error(`File with ID ${fileId} not found.`);
      }

      // Determine filename (similar to fs.exportFile)
      let fileName = fileData.name || 'untitled';
      if (!fileName.toLowerCase().includes('.')) {
        // Basic extension check
        fileName += '.js'; // Default to .js if no extension found
      }

      const blob = new Blob([fileData.content], {
        type: 'application/octet-stream',
      }); // Use generic type or detect based on extension

      // Trigger download using the anchor link method
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        ui.alert(`Downloaded "${fileName}".`, 'success', ALERT_SHORT_DURATION);
      }, ALERT_DELAY);
    } catch (error) {
      console.error(`Failed to download file ${fileId}:`, error);
      ui.alert(`Failed to download file: ${error.message}`, 'error');
    }
  }

  async function handleDownloadZip() {
    if (typeof JSZip === 'undefined') {
      ui.alert(
        'ZIP functionality is unavailable. JSZip library not loaded.',
        'error',
      );
      console.error('JSZip library not found.');
      return;
    }

    if (allFilesCache.length === 0) {
      ui.alert('No files available to download.', 'info');
      return;
    }

    const zip = new JSZip();
    let filesAdded = 0;
    let hasErrors = false;
    const zipButtonOriginalText = downloadZipButton.innerHTML;
    downloadZipButton.disabled = true;
    downloadZipButton.innerHTML = `
          <svg class="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Zipping...`; // Simple loading state

    ui.alert('Preparing ZIP file...', 'info', ALERT_LONG_DURATION); // Longer alert duration

    try {
      // Iterate and load each file's content
      // Using Promise.all for potentially faster loading (concurrent reads from localStorage)
      const fileLoadPromises = allFilesCache.map(async (fileMeta) => {
        try {
          const fileData = await fs.loadFile(fileMeta.id);
          if (fileData && fileData.content !== undefined) {
            let fileNameInZip = fileData.name || `unnamed_${fileData.id}.js`;
            // Basic filename sanitization for ZIP (replace problematic chars)
            fileNameInZip = fileNameInZip.replace(/[\\/:*?"<>|]/g, '_');
            if (!fileNameInZip.toLowerCase().includes('.')) {
              fileNameInZip += '.js'; // Add default extension
            }
            zip.file(fileNameInZip, fileData.content);
            filesAdded++;
          } else {
            console.warn(`Skipping file ${fileMeta.id} (no content or data)`);
          }
        } catch (loadError) {
          console.error(
            `Failed to load file ${fileMeta.id} for zipping:`,
            loadError,
          );
          hasErrors = true; // Mark that at least one file failed
        }
      });

      await Promise.all(fileLoadPromises); // Wait for all file loads/adds

      if (filesAdded === 0) {
        throw new Error('No valid files could be added to the ZIP archive.');
      }

      // Generate ZIP
      const blob = await zip.generateAsync({ type: 'blob' });

      // Trigger download
      const timestamp = new Date()
        .toISOString()
        .slice(0, TIMESTAMP_SLICE_LENGTH)
        .replace(/[-T:]/g, '');
      const zipFilename = `ide_files_${timestamp}.zip`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFilename;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        const successMsg = `Downloaded ${filesAdded} file(s) as ${zipFilename}.${hasErrors ? ' Some files failed to load.' : ''}`;
        ui.alert(successMsg, hasErrors ? 'warning' : 'success', ALERT_DURATION);
      }, ALERT_DELAY);
    } catch (error) {
      console.error('Failed to create or download ZIP file:', error);
      ui.alert(`Failed to create ZIP: ${error.message}`, 'error');
    } finally {
      // Restore button state
      downloadZipButton.disabled = false;
      downloadZipButton.innerHTML = zipButtonOriginalText;
    }
  }

  function handleContainerClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const fileId = button.dataset.fileId;
    const currentName = button.dataset.currentName;

    switch (action) {
      case 'back-to-home':
        pages.switchTo('home-container');
        break;
      case 'open':
        handleOpenFile(fileId);
        break;
      case 'rename':
        handleRenameFile(fileId, currentName);
        break;
      case 'download-single':
        handleDownloadSingleFile(fileId);
        break;
      case 'download-zip':
        handleDownloadZip();
        break;
      case 'delete':
        handleDeleteFile(fileId);
        break;
      default:
        console.warn('Unknown file action:', action);
    }
  }

  // Initial setup
  loadAndDisplayFiles();

  // Attach event listeners
  container.addEventListener('click', handleContainerClick);
  searchInput.addEventListener('input', filterAndRenderFiles); // Add listener for search
};
