// DOM elements
const contentDisplay = document.getElementById('content-display');
const loading = document.getElementById('loading');
const refreshBtn = document.getElementById('refresh-btn');
const toggleThemeBtn = document.getElementById('toggle-theme');
const viewModeSelect = document.getElementById('view-mode');
const languageSelector = document.getElementById('language-selector');
const contentArea = document.querySelector('.content-area');

// Current URL being displayed
let currentUrl = '';

// CORS Proxy Configuration
// For local development: 'http://localhost:5000/fetch'
// For production: 'https://main.psi.uni-bamberg.de/cors-proxy/fetch'
// Fallback: 'https://api.allorigins.win/get'
const PROXY_URL = 'http://localhost:5001/fetch'; // Change this for production

// Cache management
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
let currentCacheTimestamp = null;

const getCachedContent = (url) => {
    try {
        const cached = localStorage.getItem(`cache_${url}`);
        if (!cached) return null;

        const { html, timestamp } = JSON.parse(cached);
        const now = Date.now();

        if (now - timestamp < CACHE_DURATION) {
            console.log('Using cached content for:', url);
            currentCacheTimestamp = timestamp;
            return html;
        } else {
            console.log('Cache expired for:', url);
            localStorage.removeItem(`cache_${url}`);
            return null;
        }
    } catch (e) {
        console.error('Error reading cache:', e);
        return null;
    }
};

const setCachedContent = (url, html) => {
    try {
        const timestamp = Date.now();
        const cacheData = {
            html: html,
            timestamp: timestamp
        };
        localStorage.setItem(`cache_${url}`, JSON.stringify(cacheData));
        currentCacheTimestamp = timestamp;
        console.log('Cached content for:', url);
    } catch (e) {
        console.error('Error saving cache:', e);
        // If localStorage is full, clear old cache entries
        if (e.name === 'QuotaExceededError') {
            clearOldCache();
            try {
                const timestamp = Date.now();
                const cacheData = { html: html, timestamp: timestamp };
                localStorage.setItem(`cache_${url}`, JSON.stringify(cacheData));
                currentCacheTimestamp = timestamp;
            } catch (e2) {
                console.error('Still cannot save to cache:', e2);
            }
        }
    }
};

const clearOldCache = () => {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith('cache_'));
    cacheKeys.forEach(key => localStorage.removeItem(key));
    console.log('Cleared old cache entries');
};

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

// Fetch and display content
const fetchAndDisplayContent = async (url, forceRefresh = false) => {
    showLoading();
    currentUrl = url;

    try {
        let htmlContent;

        // Check cache first unless force refresh
        if (!forceRefresh) {
            htmlContent = getCachedContent(url);
        }

        // Fetch from server if not in cache
        if (!htmlContent) {
            console.log('Fetching from server:', url);
            const proxyUrl = `${PROXY_URL}?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Handle error from proxy
            if (data.error) {
                throw new Error(data.error);
            }

            htmlContent = data.contents;

            // Cache the content
            setCachedContent(url, htmlContent);
        }

        // Parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        // Extract and display content
        displayExtractedContent(doc, url);

    } catch (error) {
        console.error('Error fetching content:', error);
        displayError(error.message);
    } finally {
        hideLoading();
    }
};

// Extract meaningful content from parsed HTML
const displayExtractedContent = (doc, sourceUrl) => {
    const extracted = document.createElement('div');
    extracted.className = 'fetched-content';

    // Detect language for hyphenation
    const htmlLang = doc.documentElement.lang || 'de';
    const language = htmlLang.startsWith('en') ? 'en' : 'de';
    extracted.setAttribute('lang', language);

    // Try to find main content area
    const mainContent = doc.querySelector('main') ||
                       doc.querySelector('.main-content') ||
                       doc.querySelector('#main') ||
                       doc.querySelector('article') ||
                       doc.querySelector('.content') ||
                       doc.body;

    // Extract title
    const title = doc.querySelector('h1')?.textContent || doc.title || 'Content';
    const titleEl = document.createElement('h1');
    titleEl.textContent = title.trim();
    extracted.appendChild(titleEl);

    // Add source URL
    const sourceLink = document.createElement('p');
    sourceLink.innerHTML = `<small>Source: <a href="${sourceUrl}" target="_blank">${sourceUrl}</a></small>`;
    sourceLink.style.color = 'var(--accent-color)';
    sourceLink.style.marginBottom = '0.5rem';
    extracted.appendChild(sourceLink);

    // Add cache timestamp if available
    if (currentCacheTimestamp) {
        const cacheInfo = document.createElement('p');
        cacheInfo.className = 'cache-info';
        const cacheDate = new Date(currentCacheTimestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now - cacheDate) / 1000 / 60);
        const diffHours = Math.floor(diffMinutes / 60);

        let timeAgo;
        if (diffMinutes < 1) {
            timeAgo = 'just now';
        } else if (diffMinutes < 60) {
            timeAgo = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        } else {
            timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        }

        const formattedDate = cacheDate.toLocaleString(language === 'de' ? 'de-DE' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        cacheInfo.innerHTML = `<small>📦 Cached version from ${formattedDate} (${timeAgo})</small>`;
        extracted.appendChild(cacheInfo);
    }

    // Extract main content elements
    if (mainContent) {
        const contentClone = mainContent.cloneNode(true);

        // Remove all unwanted elements including image captions/alt text
        contentClone.querySelectorAll(`
            script, style, nav, header, footer, aside,
            .navigation, .nav, .menu, .sidebar,
            img, picture, figure, figcaption, video, iframe, canvas, svg,
            .social-media, .share, .advertisement, .ad,
            button, form, input, select, textarea,
            .image-caption, .caption, .img-caption
        `).forEach(el => el.remove());

        // Process news boxes - group date, title, teaser
        contentClone.querySelectorAll('.news-item, .teaser, .article-preview').forEach(newsBox => {
            newsBox.classList.add('news-box');
        });

        // Process links
        contentClone.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href === '') {
                link.replaceWith(link.textContent);
                return;
            }

            if (!href.startsWith('http')) {
                const baseUrl = new URL(sourceUrl);
                link.href = new URL(href, baseUrl.origin).href;
            }

            if (link.href && link.href.includes('uni-bamberg.de')) {
                link.classList.add('fetch-link');
                link.addEventListener('click', handleFetchLinkClick);
            } else {
                link.target = '_blank';
            }
        });

        // Detect and wrap large link lists (study programs, etc.)
        contentClone.querySelectorAll('ul, ol').forEach(list => {
            const links = list.querySelectorAll('a');
            const linkCount = links.length;
            const totalItems = list.querySelectorAll('li').length;

            // If list has many links (>10) and mostly links, make it collapsible
            if (linkCount > 10 && linkCount / totalItems > 0.7) {
                const accordion = createAccordion(list, linkCount);
                list.replaceWith(accordion);
            }
        });

        // Clean up empty elements
        contentClone.querySelectorAll('*').forEach(el => {
            if (el.children.length === 0 && !el.textContent.trim()) {
                el.remove();
            }
        });

        extracted.appendChild(contentClone);
    }

    // Replace content
    contentDisplay.innerHTML = '';
    contentDisplay.appendChild(extracted);
};

// Create accordion for large lists
const createAccordion = (listElement, itemCount) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'accordion';

    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.innerHTML = `
        <span class="accordion-title">📚 View list (${itemCount} items)</span>
        <span class="accordion-icon">▼</span>
    `;

    const content = document.createElement('div');
    content.className = 'accordion-content';
    content.appendChild(listElement.cloneNode(true));

    header.addEventListener('click', () => {
        wrapper.classList.toggle('active');
    });

    wrapper.appendChild(header);
    wrapper.appendChild(content);

    return wrapper;
};

// Display error message
const displayError = (message) => {
    contentDisplay.innerHTML = `
        <div class="error-message">
            <h3>Failed to Load Content</h3>
            <p>${message}</p>
            <p>The content might be restricted or unavailable. Try accessing the <a href="${currentUrl}" target="_blank">original page</a> directly.</p>
        </div>
    `;
};

// Refresh current content
const refreshContent = () => {
    if (currentUrl) {
        fetchAndDisplayContent(currentUrl, true); // Force refresh
    }

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

// Change language
const changeLanguage = (lang) => {
    const languageUrls = {
        'de': 'https://www.uni-bamberg.de',
        'en': 'https://www.uni-bamberg.de/en/',
        'es': 'https://www.uni-bamberg.de/es/'
    };
    const url = languageUrls[lang] || languageUrls['de'];
    fetchAndDisplayContent(url);
    localStorage.setItem('language', lang);
};

// Handle click on fetch-link elements
const handleFetchLinkClick = (e) => {
    e.preventDefault();
    const url = e.currentTarget.href;
    if (url) {
        showLoading();
        fetchAndDisplayContent(url);
        // Scroll to top
        contentDisplay.scrollTop = 0;
    }
};

// Event listeners
refreshBtn.addEventListener('click', refreshContent);
toggleThemeBtn.addEventListener('click', toggleTheme);
viewModeSelect.addEventListener('change', (e) => {
    changeViewMode(e.target.value);
});
languageSelector.addEventListener('change', (e) => {
    changeLanguage(e.target.value);
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // Restore view mode from localStorage
    const savedViewMode = localStorage.getItem('viewMode') || 'full';
    viewModeSelect.value = savedViewMode;
    changeViewMode(savedViewMode);

    // Restore language from localStorage
    const savedLanguage = localStorage.getItem('language') || 'de';
    languageSelector.value = savedLanguage;

    // Add smooth transition to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.style.transition = 'all 0.3s ease';
    });

    // Handle fetch links (navigation links)
    const fetchLinks = document.querySelectorAll('.fetch-link');
    fetchLinks.forEach(link => {
        link.addEventListener('click', handleFetchLinkClick);
    });

    // Load home page by default
    const languageUrls = {
        'de': 'https://www.uni-bamberg.de',
        'en': 'https://www.uni-bamberg.de/en/',
        'es': 'https://www.uni-bamberg.de/es/'
    };
    const homeUrl = languageUrls[savedLanguage];
    fetchAndDisplayContent(homeUrl);

    console.log('University of Bamberg Wrapper initialized');
    console.log('Fetching:', homeUrl);
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + R: Refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshContent();
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
        console.log('%c Otto-Friedrich-Universität Bamberg - Keyboard Shortcuts ', 'background: #003366; color: white; padding: 10px; font-size: 14px; font-weight: bold');
        console.log('%c Ctrl/Cmd + R: Refresh content ', 'padding: 5px');
        console.log('%c Ctrl/Cmd + D: Toggle dark mode ', 'padding: 5px');
        console.log('%c Ctrl/Cmd + 1/2/3: Full/Tablet/Mobile view ', 'padding: 5px');
        console.log('%c Use language selector to switch between Deutsch, English, and Español ', 'padding: 5px');
        localStorage.setItem('shortcuts-shown', 'true');
    }, 2000);
}
