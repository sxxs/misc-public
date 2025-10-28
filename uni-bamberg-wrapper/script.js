// DOM elements
const iframe = document.getElementById('content-frame');
const loading = document.getElementById('loading');
const refreshBtn = document.getElementById('refresh-btn');
const toggleThemeBtn = document.getElementById('toggle-theme');
const viewModeSelect = document.getElementById('view-mode');
const contentArea = document.querySelector('.content-area');

// Initialize theme from localStorage or default to light
const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
};

// Toggle theme
const toggleTheme = () => {
    document.body.classList.toggle('dark-theme');
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);

    // Add a nice animation feedback
    toggleThemeBtn.style.transform = 'rotate(180deg)';
    setTimeout(() => {
        toggleThemeBtn.style.transform = 'rotate(0deg)';
    }, 300);
};

// Show loading overlay
const showLoading = () => {
    loading.classList.add('active');
};

// Hide loading overlay
const hideLoading = () => {
    loading.classList.remove('active');
};

// Refresh iframe
const refreshIframe = () => {
    showLoading();
    iframe.src = iframe.src;

    // Add rotation animation to refresh button
    refreshBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        refreshBtn.style.transform = 'rotate(0deg)';
    }, 500);
};

// Change view mode
const changeViewMode = (mode) => {
    contentArea.classList.remove('mobile-view', 'tablet-view', 'full-view');
    contentArea.classList.add(`${mode}-view`);
    localStorage.setItem('viewMode', mode);
};

// Handle iframe load
iframe.addEventListener('load', () => {
    hideLoading();
    console.log('Content loaded successfully');
});

// Handle iframe load errors
iframe.addEventListener('error', () => {
    hideLoading();
    console.error('Error loading content');
});

// Event listeners
refreshBtn.addEventListener('click', refreshIframe);
toggleThemeBtn.addEventListener('click', toggleTheme);
viewModeSelect.addEventListener('change', (e) => {
    changeViewMode(e.target.value);
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // Restore view mode from localStorage
    const savedViewMode = localStorage.getItem('viewMode') || 'full';
    viewModeSelect.value = savedViewMode;
    changeViewMode(savedViewMode);

    // Show loading initially
    showLoading();

    // Add smooth transition to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.style.transition = 'all 0.3s ease';
    });

    // Handle quick links
    const quickLinks = document.querySelectorAll('.quick-links a');
    quickLinks.forEach(link => {
        link.addEventListener('click', () => {
            showLoading();
        });
    });

    // Log when iframe is about to load
    console.log('University of Bamberg Wrapper initialized');
    console.log('Loading:', iframe.src);
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + R: Refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshIframe();
    }

    // Ctrl/Cmd + D: Toggle dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleTheme();
    }

    // Ctrl/Cmd + 1/2/3: Change view mode
    if ((e.ctrlKey || e.metaKey) && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const modes = ['full', 'tablet', 'mobile'];
        const mode = modes[parseInt(e.key) - 1];
        viewModeSelect.value = mode;
        changeViewMode(mode);
    }
});

// Handle window resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        console.log('Window resized:', window.innerWidth, 'x', window.innerHeight);
    }, 250);
});

// Add error handling for cross-origin issues
window.addEventListener('error', (e) => {
    console.error('Error:', e.message);
}, true);

// Notify user of keyboard shortcuts on first visit
if (!localStorage.getItem('shortcuts-shown')) {
    setTimeout(() => {
        console.log('%c Keyboard Shortcuts ', 'background: #003366; color: white; padding: 10px; font-size: 14px; font-weight: bold');
        console.log('%c Ctrl/Cmd + R: Refresh iframe ', 'padding: 5px');
        console.log('%c Ctrl/Cmd + D: Toggle dark mode ', 'padding: 5px');
        console.log('%c Ctrl/Cmd + 1/2/3: Full/Tablet/Mobile view ', 'padding: 5px');
        localStorage.setItem('shortcuts-shown', 'true');
    }, 2000);
}
