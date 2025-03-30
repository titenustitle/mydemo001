# Memory Saver

A Progressive Web App (PWA) for saving and organizing links, photos, and files with offline capability.

## Features

- Save links with URL, title, favicon, tags, and notes
- Upload photos with preview thumbnails and metadata
- Store files with type icons and basic information
- Unified search across all content types
- Responsive design for mobile and desktop
- Offline capability with Service Worker
- Local storage using IndexedDB and FileSystem Access API

## Technical Stack

- Vanilla JavaScript
- IndexedDB for structured data storage
- FileSystem Access API for file storage
- Service Worker for offline capability
- Progressive Web App (PWA) features

## Project Structure

```
memory-saver/
├── index.html          # Main HTML file
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
├── css/
│   └── styles.css     # Styles
├── js/
│   ├── db.js          # Database operations
│   ├── fileManager.js # File handling
│   ├── ui.js          # UI components
│   └── app.js         # Main application
└── icons/
    ├── favicon.ico
    └── app-icons/     # PWA icons
```

## Browser Support

- Chrome (recommended)
- Edge
- Opera
- Other modern browsers that support:
  - IndexedDB
  - FileSystem Access API
  - Service Workers

## Getting Started

1. Clone the repository
2. Open `index.html` in a modern web browser
3. Allow file system access when prompted
4. Start saving your memories!

## Usage

### Adding Links
1. Click "Add Link"
2. Enter the URL
3. Add optional title, tags, and notes
4. Click "Save Link"

### Adding Photos
1. Click "Add Photo"
2. Select an image file
3. Add optional tags and notes
4. Click "Save Photo"

### Adding Files
1. Click "Add File"
2. Select any file
3. Add optional tags and notes
4. Click "Save File"

### Searching
- Use the search bar to find items across all content types
- Search works on titles, URLs, tags, and notes

### Deleting Items
- Click the "Delete" button on any item to remove it
- Confirm deletion when prompted

## Development

The application is built with vanilla JavaScript and modern web APIs. No build process is required.

## License

MIT License 