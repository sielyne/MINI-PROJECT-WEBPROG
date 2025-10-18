const FeatureHandler = {
  currentUser: null,
  callbacks: {},
  currentPage: null,

  registerFeature(featureName, callback) {
    this.callbacks[featureName] = callback;
  },

  executeFeature(featureName, method, ...args) {
    if (this.callbacks[featureName] && this.callbacks[featureName][method]) {
      this.callbacks[featureName][method](...args);
    } else {
      console.error(`Feature ${featureName} or method ${method} not found!`);
    }
  },

  // Load and show a specific page
  showPage(pageId) {
    const protectedPages = ['dashboard', 'profile', 'bmi', 'mood', 'quiz'];
    const username = this.getCurrentUser();

    // Special: kalau belum login dan mau buka menu dari fitur bebas (mis. blog),
    // kita arahkan ke login tanpa alert. Namun akses langsung ke menu juga harus dicegah.
    if (!username && pageId === 'menu') {
      this.showPage('login');
      return;
    }

    // Kalau belum login dan mau buka halaman yang dilindungi → alert + redirect ke login
    if (!username && protectedPages.includes(pageId)) {
      alert('⚠️ You are not logged in yet! Please log in first.');
      this.showPage('login');
      return;
    }

    // Hindari reload halaman sama
    if (this.currentPage === pageId) return;
    this.currentPage = pageId;

    const container = document.getElementById('app-container');

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

        const finishRender = () => {
          applyThemeToggle();
          this.executeFeature(pageId, 'init');
          // Sinkronkan header **setelah** konten ter-insert dan init feature berjalan
          this.updateHeader();
        };

        if (!existingStyle) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = cssHref;
          link.onload = () => {
            container.innerHTML = tempContainer.innerHTML;
            finishRender();
          };
          document.head.appendChild(link);
        } else {
          container.innerHTML = tempContainer.innerHTML;
          finishRender();
        }
      })
      .catch(err => console.error(`Error loading ${pageId}:`, err));
  },

  // Set current user (sync ke localStorage)
  setCurrentUser(username) {
  this.currentUser = username;
  if (username) {
    sessionStorage.setItem('bloomii-username', username);
  } else {
    sessionStorage.removeItem('bloomii-username');
  }
},

getCurrentUser() {
  return this.currentUser;
},


  // Remove current user (helper yang benar)
  clearCurrentUser() {
    this.currentUser = null;
    localStorage.removeItem('bloomii-username');
  },

  // Update header UI sesuai status login
  updateHeader() {
    const header = document.getElementById('main-header');
    const headerName = document.getElementById('header-username');
    const nav = document.getElementById('header-nav');
    const profileIcon = document.getElementById('profileIcon');
    const navLogout = document.getElementById('navLogoutBtn');
    const username = this.getCurrentUser();

    // Pastikan header tampil (layout), tapi elemen dalamnya diatur
    if (header) header.style.display = 'flex';

    if (username) {
      if (headerName) {
        headerName.textContent = `Hi, ${username}`;
        headerName.style.display = 'inline';
      }
      if (profileIcon) profileIcon.style.display = 'inline';
      if (navLogout) navLogout.style.display = 'inline';
      // Nav tertutup by default, user harus klik hamburger untuk membuka
      if (nav) nav.classList.add('hidden');
    } else {
      if (headerName) {
        headerName.textContent = '';
        headerName.style.display = 'none';
      }
      if (profileIcon) profileIcon.style.display = 'none';
      if (navLogout) navLogout.style.display = 'none';
      if (nav) nav.classList.add('hidden');
    }
  },

  // Initialize app
  init() {
  const storedUser = sessionStorage.getItem('bloomii-username');

  if (storedUser) {
    // Kalau ada user tersimpan, treat as logged-in
    this.currentUser = storedUser;
    // langsung ke menu (user sudah dianggap login)
    this.showPage('menu');
  } else {
    this.currentUser = null;
    this.showPage('login');
  }

  // Event listener global
  document.addEventListener('click', (e) => {
    const target = e.target;
    const nav = document.getElementById('header-nav');
    const hamburger = document.getElementById('hamburgerBtn');

    // Klik ikon profil
    if (target && target.id === 'profileIcon') {
      this.showPage('profile');
      return;
    }

    // Klik hamburger → toggle menu
    if (target && target.id === 'hamburgerBtn') {
      if (nav) nav.classList.toggle('hidden');
      return;
    }

    // Klik tombol logout
    if (target && target.id === 'navLogoutBtn') {
      this.setCurrentUser(null);
      this.updateHeader();
      this.showPage('login');
      return;
    }

    // Klik di luar menu dan hamburger → close menu
    if (
      nav &&
      !nav.classList.contains('hidden') && // menu lagi terbuka
      !nav.contains(target) && // bukan klik di dalam nav
      target !== hamburger // bukan klik hamburger
    ) {
      nav.classList.add('hidden');
    }
  }, false);
  },

};

// Initialize app on load
window.onload = () => FeatureHandler.init();
