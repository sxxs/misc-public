# University of Bamberg Web Wrapper

A clean, text-focused wrapper for the University of Bamberg website with async content fetching, smart caching, and custom styling.

## Features

- ✅ **Async Content Fetching**: Fetches content via custom CORS proxy
- ✅ **Smart Caching**: 1-hour cache with timestamp display
- ✅ **Browser History Integration**: Browser back/forward buttons work seamlessly
- ✅ **Navigation Buttons**: Custom back/forward buttons with keyboard shortcuts
- ✅ **Shareable URLs**: Each page has a unique URL you can copy and share
- ✅ **Clean Text Display**: No images, ads, or clutter - just content
- ✅ **Hyphenation**: Automatic hyphenation for German and English
- ✅ **Accordion Lists**: Large link lists (study programs) collapse into accordions
- ✅ **Beautiful Tables**: Professional table styling with hover effects
- ✅ **News Boxes**: Grouped date, heading, and teaser display
- ✅ **Dark Mode**: Toggle between light and dark themes
- ✅ **View Modes**: Full, tablet, and mobile view options
- ✅ **Multi-language**: German, English, Spanish support
- ✅ **Keyboard Shortcuts**: Quick navigation and control

## Quick Start

### 1. Set up Virtual Environment (first time only)

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Run the CORS Proxy

**Option A: Using the start script**
```bash
./start-proxy.sh
```

**Option B: Manual start**
```bash
source venv/bin/activate
python3 cors-proxy.py
```

The proxy will run on `http://localhost:5000`

### 3. Open the Wrapper (in a new terminal)

Serve the files with a web server:

```bash
# Python 3
python3 -m http.server 8080

# Or with Node.js
npx http-server -p 8080
```

Visit `http://localhost:8080` in your browser

## Controls

### Buttons
- **Language Selector**: Switch between Deutsch, English, Español
- **← Back / Forward →**: Navigate through browsing history
- **Refresh**: Force reload content (bypasses cache)
- **Toggle Theme**: Switch between light and dark modes
- **View Mode Dropdown**: Select Full, Tablet, or Mobile view

### Keyboard Shortcuts
- `Ctrl/Cmd + R`: Refresh content (bypasses cache)
- `Ctrl/Cmd + D`: Toggle dark mode
- `Alt + ←`: Navigate back
- `Alt + →`: Navigate forward
- `Ctrl/Cmd + 1`: Full view
- `Ctrl/Cmd + 2`: Tablet view
- `Ctrl/Cmd + 3`: Mobile view

### Quick Links Sidebar

Navigate university sections without leaving the wrapper:
- 🏠 Home
- 🌍 English Version
- 📚 Studium (Studies)
- 🔬 Forschung (Research)
- 👨‍🏫 Lehre (Teaching)
- 🏛️ Universität (University)
- 🎓 Fakultäten (Faculties)
- ✈️ International

Internal links keep you in the wrapper, external links open in new tabs.

## Configuration

### Change Proxy URL

Edit `script.js` line 17:

```javascript
// For local development
const PROXY_URL = 'http://localhost:5000/fetch';

// For production
const PROXY_URL = 'https://main.psi.uni-bamberg.de/cors-proxy/fetch';
```

### Adjust Cache Duration

Edit `script.js` line 20:

```javascript
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying the CORS proxy to production servers.

## Technical Details

### File Structure

```
uni-bamberg-wrapper/
├── index.html          # Main HTML file
├── styles.css          # All styling and theming
├── script.js           # Content fetching and display logic
├── cors-proxy.py       # Python CORS proxy server
├── requirements.txt    # Python dependencies
├── DEPLOYMENT.md       # Deployment instructions
└── README.md          # This file
```

### How It Works

1. **Fetch**: User clicks a link → JavaScript fetches via CORS proxy
2. **Cache**: Content stored in localStorage with timestamp
3. **Parse**: HTML parsed with DOMParser
4. **Extract**: Remove images, scripts, navigation - keep text content
5. **Display**: Render clean content with custom styling
6. **History**: Browser URL updates with `?url=...` parameter using History API
7. **Links**: Internal links stay in wrapper, external open in new tabs

### Browser History Integration

The wrapper uses the HTML5 History API to sync with your browser:

- **URL Format**: `http://localhost:8080/?url=https://www.uni-bamberg.de/studium/`
- **Browser Buttons**: Native back/forward buttons work perfectly
- **Shareable**: Copy the URL to share a specific page
- **Bookmarkable**: Bookmark any page and it loads correctly
- **State Sync**: Custom buttons stay in sync with browser buttons

### Browser Compatibility

- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support
- ✅ Mobile browsers: Responsive design

### Technologies Used

**Frontend:**
- HTML5
- CSS3 (CSS Variables, Flexbox, Grid)
- Vanilla JavaScript (ES6+)
- DOMParser API
- LocalStorage API

**Backend:**
- Python 3
- Flask (CORS proxy)
- Requests library

## Customization

### Changing Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --primary-color: #003366;      /* University blue */
    --secondary-color: #005a9c;
    --accent-color: #c8102e;       /* Accent red */
    --bg-color: #f8f9fa;
}
```

### Adding Quick Links

Edit the sidebar in `index.html`:

```html
<ul class="quick-links">
    <li><a href="URL" class="fetch-link">🔗 Link Text</a></li>
</ul>
```

### Customizing Content Extraction

Modify `displayExtractedContent()` in `script.js` to adjust what content is extracted and how it's displayed.

## Cache Management

The wrapper automatically:
- Caches fetched content for 1 hour
- Shows cache timestamp on pages
- Clears old cache when storage is full
- Bypasses cache on manual refresh

## Security Considerations

The CORS proxy:
- ✅ Only allows uni-bamberg.de domains
- ✅ No authentication stored or transmitted
- ⚠️ Add rate limiting for production
- ⚠️ Consider adding authentication if needed
- ⚠️ Monitor logs for abuse

## License

MIT License - Free to use and modify.

University of Bamberg website content belongs to the university.

## Contributing

Contributions welcome! Please:
- Test thoroughly
- Follow existing code style
- Update documentation
- Add comments for complex logic

## Support

- Wrapper issues: Open a GitHub issue
- University website content: Contact the university
