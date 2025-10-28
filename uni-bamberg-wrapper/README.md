# University of Bamberg Wrapper

A modern, responsive wrapper interface for viewing the University of Bamberg website with enhanced features and improved user experience.

## Features

- **Modern UI**: Clean and intuitive interface with smooth animations
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **View Modes**: Switch between full, tablet, and mobile viewport sizes
- **Quick Links**: Easy access to important university sections
- **Keyboard Shortcuts**: Quick navigation and control
- **Persistent Settings**: Theme and view preferences are saved locally

## Usage

### Opening the Application

Simply open `index.html` in your web browser:

```bash
# Option 1: Direct file opening
open index.html

# Option 2: Using a local server (recommended)
python3 -m http.server 8000
# Then visit: http://localhost:8000
```

### Controls

#### Buttons
- **Refresh**: Reload the iframe content
- **Toggle Theme**: Switch between light and dark modes
- **View Mode Dropdown**: Select Full, Tablet, or Mobile view

#### Keyboard Shortcuts
- `Ctrl/Cmd + R`: Refresh iframe
- `Ctrl/Cmd + D`: Toggle dark mode
- `Ctrl/Cmd + 1`: Full view
- `Ctrl/Cmd + 2`: Tablet view
- `Ctrl/Cmd + 3`: Mobile view

### Quick Links Sidebar

The sidebar provides quick access to main sections:
- Home
- English Version
- Studies
- Research
- University Information

## Technical Details

### Structure

```
uni-bamberg-wrapper/
├── index.html          # Main HTML file
├── styles.css          # Styling and theming
├── script.js           # Interactive functionality
└── README.md          # This file
```

### Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- CSS Grid and Flexbox support

### Technologies Used

- HTML5
- CSS3 (with CSS Variables for theming)
- Vanilla JavaScript (ES6+)
- Local Storage for persistence

## Features in Detail

### Theme System
The wrapper includes a sophisticated theming system that:
- Uses CSS custom properties for easy customization
- Persists theme preference in localStorage
- Smoothly transitions between themes
- Adapts all UI elements including shadows and borders

### Responsive Layout
- Desktop: Sidebar + content area side by side
- Tablet/Mobile: Stacked layout with collapsible sidebar
- Fluid typography and spacing
- Touch-friendly interface elements

### View Modes
Switch between different viewport sizes to:
- Test responsive behavior
- View mobile version of the website
- Optimize screen real estate

## Customization

### Changing Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #003366;
    --secondary-color: #0066cc;
    --accent-color: #ff9900;
    /* ... more variables */
}
```

### Adding More Quick Links

Edit the sidebar section in `index.html`:

```html
<ul class="quick-links">
    <li><a href="YOUR_URL" target="content-frame">Link Text</a></li>
</ul>
```

## Limitations

- **Cross-Origin Restrictions**: Some websites may prevent iframe embedding due to X-Frame-Options headers
- **JavaScript Access**: Cannot access iframe content if cross-origin restrictions apply
- **Authentication**: May not work with sites requiring authentication
- **Cookies**: Cookie handling depends on browser security policies

## License

This is a demonstration project. The University of Bamberg website and its content belong to their respective owners.

## Future Enhancements

Potential improvements:
- Bookmark system
- History navigation
- Screenshot capability
- Custom CSS injection
- Translation features
- Search functionality
