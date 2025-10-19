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


  showPage(pageId) {
    const protectedPages = ['dashboard', 'profile', 'bmi', 'mood', 'quiz'];
    const username = this.getCurrentUser();
    if (!username && pageId === 'menu') {
      this.showPage('login');
      return;
    }
    if (!username && protectedPages.includes(pageId)) {
      alert('⚠️ You are not logged in yet! Please log in first.');
      this.showPage('login');
      return;
    }
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



  clearCurrentUser() {
    this.currentUser = null;
    localStorage.removeItem('bloomii-username');
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


  init() {
  const storedUser = sessionStorage.getItem('bloomii-username');

  if (storedUser) {
    this.currentUser = storedUser;
    this.showPage('menu');
  } else {
    this.currentUser = null;
    this.showPage('login');
  }


  document.addEventListener('click', (e) => {
    const target = e.target;
    const nav = document.getElementById('header-nav');
    const hamburger = document.getElementById('hamburgerBtn');

    if (target && target.id === 'profileIcon') {
      this.showPage('profile');
      return;
    }

    if (target && target.id === 'hamburgerBtn') {
      if (nav) nav.classList.toggle('hidden');
      return;
    }

    if (target && target.id === 'navLogoutBtn') {
      this.setCurrentUser(null);
      this.updateHeader();
      this.showPage('login');
      return;
    }

    if (
      nav &&
      !nav.classList.contains('hidden') && 
      !nav.contains(target) && 
      target !== hamburger
    ) {
      nav.classList.add('hidden');
    }
  }, false);
  },

};


window.onload = () => FeatureHandler.init();
