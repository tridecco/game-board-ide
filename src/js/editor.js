/**
 * @fileoverview Editor Module
 * @description This module handles the editor functionalities for the application.
 */

const MONACO_EDITOR_VERSION = '0.52.2';
const DEFAULT_EDITOR_OPTIONS = {
  language: 'javascript',
  theme: 'vs-dark',
  automaticLayout: true,
  minimap: {
    enabled: false,
  },
};

/**
 * @class Editor - Handles the editor functionalities of the application.
 */
class Editor {
  /**
   * @constructor
   * @param {HTMLElement} editorElement - The HTML element for the editor.
   * @param {Object} [options] - Optional parameters for the editor.
   */
  constructor(editorElement, options = {}) {
    this.editorElement = editorElement;
    this.options = { ...DEFAULT_EDITOR_OPTIONS, ...options };
    this.editorInstance = null;

    this._initMonaco();
  }

  /**
   * @method _initMonaco - Initializes the Monaco Editor.
   */
  _initMonaco() {
    require.config({
      paths: {
        vs: `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_EDITOR_VERSION}/min/vs`,
      },
    });

    require(['vs/editor/editor.main'], () => {
      this.editorInstance = monaco.editor.create(
        this.editorElement,
        this.options,
      );

      this.editorInstance.onDidChangeModelContent((event) => {
        const currentContent = this.getContent();
        this.contentChangeCallbacks.forEach((cb) => {
          if (typeof cb === 'function') {
            cb(currentContent, event);
          }
        });
      });
    });
  }

  /**
   * @method onContentChange - Registers a callback to be called when the content of the editor changes.
   * @param {Function} callback - The callback function to be called on content change.
   */
  onContentChange(callback) {
    if (typeof callback === 'function') {
      this.contentChangeCallbacks.push(callback);
    }
  }

  /**
   * @method setContent - Sets the content of the editor.
   * @param {string} content - The content to set in the editor.
   */
  setContent(code) {
    if (this.editorInstance) {
      let model = this.editorInstance.getModel();
      if (model) {
        model.setValue(code);
      } else {
        model = monaco.editor.createModel(code, this.options.language);
        this.editorInstance.setModel(model);
      }
    }
  }

  /**
   * @method getContent - Gets the current content of the editor.
   * @returns {string} - The current content of the editor.
   */
  getContent() {
    if (this.editorInstance) {
      const model = this.editorInstance.getModel();
      return model ? model.getValue() : '';
    }
    return '';
  }
}

module.exports = Editor;
