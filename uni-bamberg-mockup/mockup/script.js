/**
 * Universitat Bamberg Homepage
 * Interactive functionality
 */

(function() {
    'use strict';

    // DOM Elements
    const menuToggle = document.getElementById('menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    const searchToggle = document.getElementById('search-toggle');
    const searchOverlay = document.getElementById('search-overlay');
    const searchClose = document.getElementById('search-close');
    const searchInput = document.getElementById('search-input');
    const header = document.querySelector('.site-header');
    const navPanels = document.getElementById('nav-panels');
    const navItems = document.querySelectorAll('.nav-item[data-panel]');
    const navTriggers = document.querySelectorAll('.nav-trigger');

    // ============================================
    // Mobile Navigation
    // ============================================
    function toggleMobileNav() {
        const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', !isExpanded);
        mobileNav.classList.toggle('active');
        mobileNav.setAttribute('aria-hidden', isExpanded);
        document.body.style.overflow = isExpanded ? '' : 'hidden';
    }

    function closeMobileNav() {
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('active');
        mobileNav.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', toggleMobileNav);

        // Close on link click
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileNav);
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
                closeMobileNav();
                menuToggle.focus();
            }
        });
    }

    // ============================================
    // Mobile Navigation Accordion
    // ============================================
    const mobileNavTriggers = document.querySelectorAll('.mobile-nav-trigger');

    mobileNavTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
            const submenu = trigger.nextElementSibling;

            // Close all other submenus
            mobileNavTriggers.forEach(otherTrigger => {
                if (otherTrigger !== trigger) {
                    otherTrigger.setAttribute('aria-expanded', 'false');
                    const otherSubmenu = otherTrigger.nextElementSibling;
                    if (otherSubmenu) {
                        otherSubmenu.classList.remove('active');
                        otherSubmenu.setAttribute('aria-hidden', 'true');
                    }
                }
            });

            // Toggle current submenu
            trigger.setAttribute('aria-expanded', !isExpanded);
            if (submenu) {
                submenu.classList.toggle('active');
                submenu.setAttribute('aria-hidden', isExpanded);
            }
        });
    });

    // ============================================
    // Contextual Navigation Panels (Desktop)
    // ============================================
    let activePanel = null;
    let panelCloseTimeout = null;

    function openPanel(panelId) {
        if (panelCloseTimeout) {
            clearTimeout(panelCloseTimeout);
            panelCloseTimeout = null;
        }

        // Close any active panel first
        if (activePanel && activePanel !== panelId) {
            const prevPanel = document.getElementById(`panel-${activePanel}`);
            if (prevPanel) prevPanel.classList.remove('active');

            const prevItem = document.querySelector(`.nav-item[data-panel="${activePanel}"]`);
            if (prevItem) {
                prevItem.classList.remove('active');
                const prevTrigger = prevItem.querySelector('.nav-trigger');
                if (prevTrigger) prevTrigger.setAttribute('aria-expanded', 'false');
            }
        }

        // Open new panel
        const panel = document.getElementById(`panel-${panelId}`);
        const navItem = document.querySelector(`.nav-item[data-panel="${panelId}"]`);
        const trigger = navItem?.querySelector('.nav-trigger');

        if (panel && navPanels) {
            navPanels.classList.add('active');
            navPanels.setAttribute('aria-hidden', 'false');
            panel.classList.add('active');

            if (navItem) navItem.classList.add('active');
            if (trigger) trigger.setAttribute('aria-expanded', 'true');

            activePanel = panelId;
        }
    }

    function closePanel() {
        if (!activePanel) return;

        const panel = document.getElementById(`panel-${activePanel}`);
        const navItem = document.querySelector(`.nav-item[data-panel="${activePanel}"]`);
        const trigger = navItem?.querySelector('.nav-trigger');

        if (panel) panel.classList.remove('active');
        if (navItem) navItem.classList.remove('active');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');

        if (navPanels) {
            navPanels.classList.remove('active');
            navPanels.setAttribute('aria-hidden', 'true');
        }

        activePanel = null;
    }

    function schedulePanelClose() {
        panelCloseTimeout = setTimeout(() => {
            closePanel();
        }, 150);
    }

    function cancelPanelClose() {
        if (panelCloseTimeout) {
            clearTimeout(panelCloseTimeout);
            panelCloseTimeout = null;
        }
    }

    // Setup nav item interactions
    navItems.forEach(item => {
        const panelId = item.dataset.panel;
        const trigger = item.querySelector('.nav-trigger');

        // Mouse enter on nav item
        item.addEventListener('mouseenter', () => {
            openPanel(panelId);
        });

        // Mouse leave from nav item
        item.addEventListener('mouseleave', () => {
            schedulePanelClose();
        });

        // Click on trigger
        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                if (activePanel === panelId) {
                    closePanel();
                } else {
                    openPanel(panelId);
                }
            });
        }
    });

    // Keep panel open when hovering over it
    if (navPanels) {
        navPanels.addEventListener('mouseenter', () => {
            cancelPanelClose();
        });

        navPanels.addEventListener('mouseleave', () => {
            schedulePanelClose();
        });

        // Close panel when clicking links inside
        navPanels.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closePanel();
            });
        });
    }

    // Close panel on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activePanel) {
            closePanel();
            const navItem = document.querySelector(`.nav-item[data-panel="${activePanel}"]`);
            const trigger = navItem?.querySelector('.nav-trigger');
            if (trigger) trigger.focus();
        }
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (activePanel) {
            const isInsideNav = e.target.closest('.nav-primary') || e.target.closest('.nav-panels');
            if (!isInsideNav) {
                closePanel();
            }
        }
    });

    // ============================================
    // Search Overlay
    // ============================================
    function openSearch() {
        searchOverlay.classList.add('active');
        searchOverlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => searchInput.focus(), 100);
    }

    function closeSearch() {
        searchOverlay.classList.remove('active');
        searchOverlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        searchInput.value = '';
    }

    if (searchToggle && searchOverlay && searchClose) {
        searchToggle.addEventListener('click', openSearch);
        searchClose.addEventListener('click', closeSearch);

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
                closeSearch();
                searchToggle.focus();
            }
        });

        // Close on backdrop click
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) {
                closeSearch();
            }
        });
    }

    // ============================================
    // Header Scroll Behavior
    // ============================================
    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateHeader() {
        const currentScrollY = window.scrollY;

        // Add/remove scrolled class for styling
        if (currentScrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Hide/show header on scroll (optional - uncomment to enable)
        // if (currentScrollY > lastScrollY && currentScrollY > 100) {
        //     header.style.transform = 'translateY(-100%)';
        // } else {
        //     header.style.transform = 'translateY(0)';
        // }

        lastScrollY = currentScrollY;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }, { passive: true });

    // ============================================
    // Dark Mode Toggle
    // ============================================
    const THEME_KEY = 'uni-bamberg-theme';

    function getPreferredTheme() {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored) return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        setTheme(next);
    }

    // Initialize theme
    setTheme(getPreferredTheme());

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_KEY)) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });

    // Keyboard shortcut for dark mode (Ctrl+D or Cmd+D)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            toggleTheme();
        }
    });

    // ============================================
    // Smooth Scroll for Anchor Links
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const headerHeight = header.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Update URL without jumping
                history.pushState(null, '', targetId);
            }
        });
    });

    // ============================================
    // Intersection Observer for Animations
    // ============================================
    if ('IntersectionObserver' in window) {
        const animatedElements = document.querySelectorAll(
            '.quick-card, .news-featured, .news-card, .faculty-card, .research-card, .event-item'
        );

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(el => {
            el.style.animationPlayState = 'paused';
            observer.observe(el);
        });
    }

    // ============================================
    // Language Switch (placeholder functionality)
    // ============================================
    document.querySelectorAll('.lang-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.lang-link').forEach(l => {
                l.classList.remove('active');
                l.removeAttribute('aria-current');
            });
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
            // In production, this would redirect to the appropriate language version
        });
    });

    // ============================================
    // Accordion Functionality
    // ============================================
    const accordionTriggers = document.querySelectorAll('.accordion-trigger');

    accordionTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
            const content = trigger.nextElementSibling;

            // Toggle current accordion
            trigger.setAttribute('aria-expanded', !isExpanded);

            if (content && content.classList.contains('accordion-content')) {
                if (isExpanded) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            }
        });
    });

    // ============================================
    // Filter Chips Functionality
    // ============================================
    const filterChips = document.querySelectorAll('.filter-chip');

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Remove active from all chips in the same group
            const parent = chip.parentElement;
            parent.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));

            // Add active to clicked chip
            chip.classList.add('active');
        });
    });

    // ============================================
    // Console Welcome Message
    // ============================================
    console.log(
        '%cUniversitat Bamberg',
        'font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #1B3A4B;'
    );
    console.log(
        '%cStudieren im Welterbe',
        'font-family: system-ui, sans-serif; font-size: 14px; color: #C4652E;'
    );

})();
