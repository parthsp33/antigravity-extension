# Antigravity Usage Monitor - Chrome Extension

A Chrome extension to monitor antigravity usage directly from your browser, displaying real-time data from your local API server.

## Features

- **Quick Popup View**: Click the extension icon to see a quick snapshot of usage data
- **Detailed Side Panel**: Open a full-featured side panel for in-depth monitoring
- **Auto-Refresh**: Enable automatic refresh every 30 seconds
- **Real-time Updates**: Always see the latest usage information
- **Error Handling**: Clear error messages if the API is unavailable
- **JSON Formatting**: Beautifully formatted display of usage data

## Installation

### Prerequisites
- Google Chrome (or Chromium-based browser like Edge, Brave, etc.)
- The antigravity-usage local API server running at `http://localhost:8787`
- Node.js and the `antigravity-usage` CLI tool installed

### Step 1: Ensure Your API Server is Running

```bash
# In your project directory
npm install
npm start
```

Your API should be running at: `http://localhost:8787`

### Step 2: Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top-right corner)
3. Click "Load unpacked"
4. Navigate to the `chrome-extension` folder in this project
5. Select the folder and click "Open"

The extension should now appear in your Chrome extensions list!

### Step 3: Use the Extension

1. **Quick View (Popup)**:
   - Click the Antigravity Usage icon in the Chrome toolbar
   - You'll see a quick snapshot of the latest usage data
   - Click "View Details" to open the full side panel

2. **Detailed View (Side Panel)**:
   - Click "View Details" from the popup, or
   - Click the extension icon and then use the side panel feature
   - Enable "Auto-refresh every 30 seconds" to monitor automatically
   - Click the 🔄 button to manually refresh

## File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Popup UI
├── popup.js               # Popup logic
├── panel.html             # Side panel UI
├── panel.js               # Side panel logic
├── background.js          # Service worker
├── styles.css             # Combined styling
└── icons/
    ├── icon-16.png        # Small icon
    ├── icon-48.png        # Medium icon
    └── icon-128.png       # Large icon
```

## Configuration

### API Endpoint

The extension is configured to connect to:
```
http://localhost:8787/usage
```

If your server runs on a different port, edit `popup.js` and `panel.js`:

Find this line and update the port:
```javascript
const API_URL = 'http://localhost:8787/usage';
```

## Troubleshooting

### "Cannot connect to API" Error

1. **Check if the server is running**:
   ```bash
   curl http://localhost:8787/health
   ```
   You should see: `{"ok":true}`

2. **If server is not running**:
   ```bash
   npm start
   ```

3. **Verify antigravity-usage is installed**:
   ```bash
   antigravity-usage
   ```

### Extension Not Showing Data

1. Open Chrome DevTools (F12)
2. Go to the "Console" tab
3. Look for error messages
4. Check that `localhost:8787` is accessible from your browser

### Port Already in Use

If port 8787 is already in use, you can:
1. Change the port in `server.js`
2. Update the API_URL in both `popup.js` and `panel.js`

## Development

To modify the extension:

1. Edit the relevant files (.html, .js, .css)
2. In `chrome://extensions/`, click the refresh icon for "Antigravity Usage Monitor"
3. Test the changes by clicking the extension icon

### Console Debugging

1. Right-click the extension icon
2. Select "Inspect popup" or "Inspect side panel"
3. View console logs and debug

## Security Notes

- The extension only connects to `http://localhost:8787`
- No data is sent to external servers
- Auto-refresh frequency is limited to 30 seconds for performance

## Version

Current version: 1.0.0

## License

This extension is part of the antigravity-usage project.

## Support

For issues or feature requests, check the main project repository.
