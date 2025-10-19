FeatureHandler.registerFeature('menu', {
  
  init() {

    const username = FeatureHandler.getCurrentUser();
      if (!username) {
       FeatureHandler.showPage('login');
      return;
    }

    console.log('Home page loaded');

    const dashboardBtn = document.getElementById('dashboardBtn');
    if (dashboardBtn) {
      dashboardBtn.addEventListener('click', () => {
        FeatureHandler.showPage('dashboard');
      });
    }

    const blogBtn = document.getElementById('blogBtn');
    if (blogBtn) {
      blogBtn.addEventListener('click', () => {
        FeatureHandler.showPage('blog');
      });
    }

    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        FeatureHandler.showPage('profile');
      });
    }
  }
});
