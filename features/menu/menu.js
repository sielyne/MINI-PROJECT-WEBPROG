FeatureHandler.registerFeature('menu', {
  init() {
    console.log('Home page loaded');

    // Navigasi ke Dashboard
    const dashboardBtn = document.getElementById('dashboardBtn');
    if (dashboardBtn) {
      dashboardBtn.addEventListener('click', () => {
        FeatureHandler.showPage('dashboard');
      });
    }

    // Navigasi ke Blog
    const blogBtn = document.getElementById('blogBtn');
    if (blogBtn) {
      blogBtn.addEventListener('click', () => {
        FeatureHandler.showPage('blog');
      });
    }

    // Navigasi ke Profile
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        FeatureHandler.showPage('profile');
      });
    }

    // Tombol fitur lainnya pakai onclick langsung di HTML (BMI, Mood, Quiz)
  }
});
