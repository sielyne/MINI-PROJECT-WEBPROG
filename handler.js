const FeatureHandler = {
    currentUser: null,
    callbacks: {},
    currentPage: null,

    // Register a callback for a feature
    registerFeature(featureName, callback) {
        this.callbacks[featureName] = callback;
    },

    // Execute a feature callback
    executeFeature(featureName, method, ...args) {
        if (this.callbacks[featureName] && this.callbacks[featureName][method]) {
            this.callbacks[featureName][method](...args);
        } else {
            console.error(`Feature ${featureName} or method ${method} not found!`);
        }
    },

    // Load and show a specific page
    showPage(pageId) {
        if (this.currentPage === pageId) return;
        this.currentPage = pageId;

        const container = document.getElementById('app-container');
        const header = document.getElementById('main-header');
        if (header) {
            header.style.display =  'flex';
        }

        fetch(`features/${pageId}/${pageId}.html`)
  .then(res => res.text())
  .then(html => {
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = html;

    const cssHref = `features/${pageId}/${pageId}.css`;
    const existingStyle = document.querySelector(`link[href="${cssHref}"]`);
    const applyThemeToggle = () => {
      const toggleBtn = document.getElementById('themeToggleBtn');
      if (toggleBtn) {
        toggleBtn.onclick = () => {
          document.body.classList.toggle('dark-mode');
          localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        };

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
      }
    };

    if (!existingStyle) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      link.onload = () => {
        container.innerHTML = tempContainer.innerHTML;
        applyThemeToggle(); // ← selalu dipanggil
        this.executeFeature(pageId, 'init');
      };
      document.head.appendChild(link);
    } else {
      container.innerHTML = tempContainer.innerHTML;
      applyThemeToggle(); // ← selalu dipanggil
      this.executeFeature(pageId, 'init');
    }
  })

                .catch(err => console.error(`Error loading ${pageId}:`, err));
},

    // Set current user
    setCurrentUser(username) {
    this.currentUser = username;
    if (username) {
      localStorage.setItem('bloomii-username', username);
    } else {
      localStorage.removeItem('bloomii-username');
    }
    },

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    },

    // Initialize app
    init() {
        // Sync currentUser from localStorage if available
        const storedUser = localStorage.getItem('bloomii-username');
        if (storedUser) {
            this.currentUser = storedUser;
        }
        this.showPage('login');

        
      // Set username in header
      this.updateHeaderUsername();
      const profileIcon = document.getElementById('profileIcon');
      if (profileIcon) {
        profileIcon.addEventListener('click', () => {
          this.showPage('profile');
        });
      }

        // Toggle nav menu
        const hamburger = document.getElementById('hamburgerBtn');
        const nav = document.getElementById('header-nav');
        if (hamburger && nav) {
            hamburger.addEventListener('click', () => {
                nav.classList.toggle('hidden');
            });
        }

        // Logout
        const navLogout = document.getElementById('navLogoutBtn');
        if (navLogout) {
            navLogout.addEventListener('click', () => {
                this.setCurrentUser(null);
                this.showPage('login');
            });
        }
    },

    
    updateHeaderUsername() {
      const headerName = document.getElementById('header-username');
      if (headerName) {
        if (this.currentUser) {
          headerName.textContent = `Hi, ${this.currentUser}`;
        } else {
          headerName.textContent = '';
        }
      }
    }
};

// Initialize app on load
window.onload = () => FeatureHandler.init();
