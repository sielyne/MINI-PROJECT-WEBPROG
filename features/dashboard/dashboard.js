FeatureHandler.registerFeature('dashboard', {
  init() {
    console.log('🔍 Dashboard init dipanggil'); // Debug log
    
    // ✅ PENTING: Cek apakah kita benar-benar di halaman dashboard
    if (FeatureHandler.currentPage !== 'dashboard') {
      console.log('⛔ Bukan halaman dashboard, skip init');
      return;
    }

    const user = FeatureHandler.getCurrentUser();
    if (!user) {
      FeatureHandler.showPage('login');
      return;
    }

    // Pastikan elemen dashboard ada
    const dashboardUsername = document.getElementById('dashboard-username');
    const dashboardBackBtn = document.getElementById('dashboardBackBtn');
    
    if (!dashboardUsername || !dashboardBackBtn) {
      console.log('⚠️ Elemen dashboard tidak ditemukan');
      return;
    }

    dashboardUsername.textContent = user;
    dashboardBackBtn.addEventListener('click', () => {
      FeatureHandler.showPage('menu');
    });

    this.loadBMI(user);
    this.loadMood(user);
    this.loadQuiz(user);
  },

  loadBMI(username) {
    const bmiValue = document.getElementById('bmi-value');
    const bmiStatus = document.getElementById('bmi-status');
    
    if (!bmiValue || !bmiStatus) return;
    
    fetch(`/bmi-history?username=${username}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const last = data[data.length - 1];
          bmiValue.textContent = `${last.value}`;
          bmiStatus.textContent = `${last.status}`;
        } else {
          bmiValue.textContent = 'No data';
          bmiStatus.textContent = '-';
        }
      })
      .catch(err => console.error('Error loading BMI:', err));
  },

  loadMood(username) {
    const moodIcon = document.getElementById('mood-icon');
    const moodNote = document.getElementById('mood-note');
    
    if (!moodIcon || !moodNote) return;
    
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
          moodIcon.textContent = icons[todayMood.mood] || '-';
          moodNote.textContent = todayMood.note || '-';
        } else {
          moodIcon.textContent = '(Not filled)';
          moodNote.textContent = '-';
        }
      })
      .catch(err => console.error('Error loading mood:', err));
  },

  loadQuiz(username) {
    const quizResult = document.getElementById('quiz-result');
    
    if (!quizResult) return;
    
    fetch(`/quiz-history?username=${username}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const last = data[data.length - 1];
          quizResult.textContent = last.result || '-';
        } else {
          quizResult.textContent = '(Not filled)';
        }
      })
      .catch(err => console.error('Error loading quiz:', err));
  }
});