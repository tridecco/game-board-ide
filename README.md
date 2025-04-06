# Tridecco Game Boaed IDE

Tridecco Game Board IDE is a dedicated web development environment for creating and experimenting with Tridecco game boards. Built upon the tridecco-board library, it provides a visual, code-driven approach to board design, real-time rendering, and interactive gameplay prototyping.

## Features

- **Code Editor**: A built-in code editor using Monaco Editor, with syntax highlighting for JavaScript.
- **Canvas Renderer**: Renders the game board in using the `tridecco-board` library, allowing for real-time visualization of changes.
- **Console Output**: Displays console logs and errors from the game board code, making debugging easier.
- **Version Support**: Supports multiple versions of the `tridecco-board` library, allowing selection of different versions for testing and compatibility.
- **File Management**: Load and save game board code to/from local files, enabling easy sharing and collaboration.
- **Sharing**: Generate a shareable link to the current game board instance, allowing others to view or edit the board in their browser.
- **Easy to Deploy**: Can be deployed on GitHub Pages or any static file hosting service. Simply build the project and upload the `dist` folder.

## Tech Stack

- **Languages**: JavaScript, HTML, CSS
- **Frameworks**: EJS, Tailwind CSS

## Getting Started

### Prerequisites

- Node.js

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/tridecco/tridecco-board-ide.git && cd tridecco-board-ide
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Build the project:

   ```bash
   npm run build
   ```

4. The built files will be in the `dist` directory. You can serve them using a static file server or deploy them to a hosting service like GitHub Pages.

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.
