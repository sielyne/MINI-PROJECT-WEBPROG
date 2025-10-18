FeatureHandler.registerFeature('dashboard', {
  init() {
    const user = FeatureHandler.getCurrentUser();
    if (!user) {
      FeatureHandler.showPage('login');
      return;
    }

    document.getElementById('dashboard-username').textContent = user;
    document.getElementById('dashboardBackBtn').addEventListener('click', () => {
      FeatureHandler.showPage('menu');
    });

    this.loadBMI(user);
    this.loadMood(user);
    this.loadQuiz(user);
  },

  loadBMI(username) {
    fetch(`/bmi-history?username=${username}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const last = data[data.length - 1];
          document.getElementById('bmi-value').textContent = `${last.value}`;
          document.getElementById('bmi-status').textContent = `${last.status}`;
        } else {
          document.getElementById('bmi-value').textContent = 'No data';
          document.getElementById('bmi-status').textContent = '-';
        }
      });
  },

  loadMood(username) {
    fetch(`/mood-history?username=${username}`)
      .then(res => res.json())
      .then(data => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayMood = data.find(m => m.date === todayStr);
        if (todayMood) {
          const icons = {
            happy: '😊', neutral: '😐', sad: '😢',
            angry: '😡', fear: '😨', disgusted: '🤢'
          };
          document.getElementById('mood-icon').textContent = icons[todayMood.mood] || '-';
          document.getElementById('mood-note').textContent = todayMood.note || '-';
        } else {
          document.getElementById('mood-icon').textContent = ' (Not filled)';
          document.getElementById('mood-note').textContent = '-';
        }
      });
  },

  loadQuiz(username) {
    fetch(`/quiz-history?username=${username}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const last = data[data.length - 1];
          document.getElementById('quiz-result').textContent = last.result || '-';
        } else {
          document.getElementById('quiz-result').textContent = '(Not filled)';
        }
      });
  }
});
