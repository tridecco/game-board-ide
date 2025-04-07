/**
 * @fileoverview Home Page Script
 * @description Handles interactions on the homepage, including creating new files and listing recent files.
 */

const MAX_RECENT_FILES = 5; // Max number of recent files to show
const SELECTED_FILE_KEY = 'editorOpenFileId'; // Key for localStorage communication (same as files.js)

module.exports = function script({ pages, ui, fs }) {
  const container = document.getElementById('home-container');
  const recentFilesList = document.getElementById('home-recent-files-list');
  const recentFilesPlaceholder = document.getElementById(
    'home-recent-files-placeholder',
  );

  function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      console.warn('Failed to format timestamp:', timestamp, e);
      return 'Invalid Date';
    }
  }

  function populateRecentFiles() {
    if (!recentFilesList || !recentFilesPlaceholder) {
      console.error('Homepage recent files elements not found.');
      return;
    }

    recentFilesList.innerHTML = ''; // Clear previous list
    recentFilesPlaceholder.textContent = 'Loading recent files...';
    recentFilesPlaceholder.classList.remove('hidden');

    try {
      const allFiles = fs.listFiles(); // Already sorted by date descending

      // Sort again by updatedAt to be sure we get the most recently modified
      allFiles.sort(
        (a, b) => (b.metadata?.updatedAt || 0) - (a.metadata?.updatedAt || 0),
      );

      const recentFiles = allFiles.slice(0, MAX_RECENT_FILES);

      if (recentFiles.length === 0) {
        recentFilesPlaceholder.textContent = 'No recent files found.';
        // Keep it visible
        return;
      }

      recentFilesPlaceholder.classList.add('hidden'); // Hide placeholder if files exist

      recentFiles.forEach((file) => {
        const fileElement = document.createElement('div');
        fileElement.className =
          'flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer border border-transparent hover:border-gray-200';
        fileElement.dataset.action = 'open-recent'; // Make the whole div clickable
        fileElement.dataset.fileId = file.id;

        const fileNameSpan = document.createElement('span');
        fileNameSpan.className = 'text-sm font-medium text-gray-800 truncate';
        fileNameSpan.textContent = file.name || 'Unnamed File';
        fileNameSpan.title = file.name || 'Unnamed File'; // Tooltip for long names

        const fileDateSpan = document.createElement('span');
        fileDateSpan.className = 'text-xs text-gray-500 whitespace-nowrap ml-2';
        fileDateSpan.textContent = `Modified: ${formatTimestamp(file.metadata?.updatedAt)}`;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex-grow min-w-0 mr-4'; // Allow truncation
        infoDiv.appendChild(fileNameSpan);

        fileElement.appendChild(infoDiv);
        fileElement.appendChild(fileDateSpan);

        recentFilesList.appendChild(fileElement);
      });
    } catch (error) {
      console.error('Failed to list recent files:', error);
      recentFilesPlaceholder.textContent = 'Error loading recent files.';
      recentFilesPlaceholder.classList.remove('hidden');
      ui.alert('Could not load recent files.', 'error');
    }
  }

  function handleContainerClick(event) {
    // Find the closest element with a data-action attribute
    const targetElement = event.target.closest('[data-action]');
    if (!targetElement) return;

    const action = targetElement.dataset.action;
    const fileId = targetElement.dataset.fileId; // Will be undefined for non-file actions

    switch (action) {
      case 'create-new':
        console.log('Action: Create New File');
        // Clear any potential file ID from previous navigation
        try {
          localStorage.removeItem(SELECTED_FILE_KEY);
        } catch (e) {
          console.warn('Could not remove item from localStorage:', e);
        }
        pages.switchTo('editor-container');
        break;

      case 'open-recent':
        if (!fileId) return;
        console.log(`Action: Open Recent File - ${fileId}`);
        try {
          localStorage.setItem(SELECTED_FILE_KEY, fileId);
          pages.switchTo('editor-container');
        } catch (e) {
          console.error('Failed to set item in localStorage:', e);
          ui.alert(
            'Could not prepare file for opening. Storage error.',
            'error',
          );
        }
        break;

      case 'go-to-files':
        console.log('Action: Go To File Manager');
        pages.switchTo('files-container');
        break;

      default:
        console.warn('Unknown home action:', action);
    }
  }

  // Populate the list when the script runs
  populateRecentFiles();

  // Attach event listener
  container.addEventListener('click', handleContainerClick);

  // Refresh recent files when the page is shown
  pages.onShow('home-container', populateRecentFiles);
};
