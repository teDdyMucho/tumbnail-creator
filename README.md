# URL Collector

A minimal, responsive website that collects and validates URLs with live preview functionality.

## Features

- **URL Validation**: Accepts only http:// or https:// URLs
- **Auto-correction**: Automatically prepends https:// if protocol is missing
- **Live Preview**: Shows domain, favicon, and attempts to fetch Open Graph metadata
- **Responsive Design**: Mobile-first design that works on all screen sizes
- **Dark Mode**: Toggle between light and dark themes
- **Accessibility**: Full keyboard navigation and screen reader support
- **Copy to Clipboard**: Easy URL copying with toast notifications
- **CORS Handling**: Graceful fallback when Open Graph data can't be fetched

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Create React App
- **No Backend Required**: Fully client-side application

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Usage

1. **Enter a URL**: Type any URL in the input field
2. **Auto-correction**: URLs without protocol will automatically get `https://` prepended on blur
3. **Validation**: Only valid HTTP/HTTPS URLs are accepted
4. **Preview**: Click "Use this URL" to see a preview with domain and metadata
5. **Copy**: Use the copy button to copy the normalized URL to clipboard
6. **Change**: Click "Change URL" to unlock the input and enter a new URL

## Keyboard Shortcuts

- **Enter**: Submit the form
- **Escape**: Clear the input field or close toast notifications
- **Tab**: Navigate through interactive elements

## Browser Support

- Modern browsers with ES6+ support
- Clipboard API support for paste/copy functionality
- Responsive design works on mobile and desktop

## Project Structure

```
src/
├── components/
│   ├── UrlForm.tsx      # URL input and validation
│   ├── UrlPreview.tsx   # Preview display with metadata
│   ├── ThemeToggle.tsx  # Dark/light mode toggle
│   └── Toast.tsx        # Notification component
├── App.tsx              # Main application component
├── index.tsx            # Application entry point
└── index.css            # Global styles and Tailwind imports
```

## Features in Detail

### URL Validation
- Validates URLs using native URL constructor
- Requires http:// or https:// protocol
- Shows inline error messages for invalid inputs

### Preview System
- Attempts to fetch Open Graph metadata (title, description, image)
- Falls back gracefully when CORS blocks requests
- Shows favicon from domain/favicon.ico
- Displays normalized URL with copy functionality

### Accessibility
- Proper ARIA labels and roles
- Focus management and keyboard navigation
- Screen reader announcements for state changes
- High contrast focus indicators

### Responsive Design
- Mobile-first approach
- Flexible layouts that adapt to screen size
- Touch-friendly interactive elements
- Readable typography at all sizes
