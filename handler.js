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
      const protectedPages = ['menu', 'dashboard', 'profile', 'bmi', 'mood', 'quiz'];
      const username = this.getCurrentUser();

      // 🔹 1️⃣ Khusus: kalau belum login dan mau buka menu → langsung ke login TANPA alert
      if (!username && pageId === 'menu') {
        this.showPage('login');
        return;
      }

      // 🔹 2️⃣ Kalau belum login dan buka halaman lain yang dilindungi → alert
      if (!username && protectedPages.includes(pageId)) {
        alert('⚠️ You are not logged in yet! Please log in first.');
        this.showPage('login');
        return;
      }

      // Hindari reload halaman sama
      if (this.currentPage === pageId) return;
      this.currentPage = pageId;

      const container = document.getElementById('app-container');
      const header = document.getElementById('main-header');
      if (header) header.style.display = 'flex';


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
                localStorage.setItem(
                  'theme',
                  document.body.classList.contains('dark-mode') ? 'dark' : 'light'
                );
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
              applyThemeToggle();
              this.executeFeature(pageId, 'init');
            };
            document.head.appendChild(link);
          } else {
            container.innerHTML = tempContainer.innerHTML;
            applyThemeToggle();
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

        updateHeader() {
          const header = document.getElementById('main-header');
          const headerName = document.getElementById('header-username');
          const nav = document.getElementById('header-nav');
          const profileIcon = document.getElementById('profileIcon');
          const navLogout = document.getElementById('navLogoutBtn');
          const username = this.getCurrentUser();
          if (header) header.style.display = 'flex';

          if (username) {
            if (headerName) {
              headerName.textContent = `Hi, ${username}`;
              headerName.style.display = 'inline';
            }
            if (profileIcon) profileIcon.style.display = 'inline';
            if (navLogout) navLogout.style.display = 'inline';
          } else {
            if (headerName) {
              headerName.textContent = '';
              headerName.style.display = 'none';
            }
            if (nav) nav.classList.add('hidden');
            if (profileIcon) profileIcon.style.display = 'none';
            if (navLogout) navLogout.style.display = 'none';
          }
        },

    clearCurrentUser() {
        localStorage.removeItem('bloomii-currentUser');
    },


    // Initialize app
    init() {
        const storedUser = localStorage.getItem('bloomii-username');
        if (storedUser) {
            this.currentUser = storedUser;
            this.showPage('menu');
        } else {
            this.showPage('login');
        }
        this.updateHeader();


        // Set username in header
        const profileIcon = document.getElementById('profileIcon');
        if (profileIcon) {
            profileIcon.addEventListener('click', () => {
                this.showPage('profile');
            });
        }

        const username = this.getCurrentUser();
        if (username) {
            const headerName = document.getElementById('header-username');
            if (headerName) headerName.textContent = `Hi, ${username}`;
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
          navLogout.addEventListener('click', () => {
          this.setCurrentUser(null);
          this.updateHeader();
          this.showPage('login');
      });
    }
};


// Initialize app on load
window.onload = () => FeatureHandler.init();