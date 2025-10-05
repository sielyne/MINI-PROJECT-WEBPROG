FeatureHandler.registerFeature('profile', {
  init() {
    const username = FeatureHandler.getCurrentUser();
    if (!username) {
      FeatureHandler.showPage('login');
      return;
    }

    document.getElementById('profile-username').textContent = username;

    this.loadBMI(username);
    this.loadMood(username);
    this.loadQuiz(username);
  },

  loadBMI(username) {
    fetch(`/bmi-history?username=${username}`)
      .then(res => res.json())
      .then(data => {
        const list = document.getElementById('profile-bmi-list');
        list.innerHTML = '';
        data.slice(-5).reverse().forEach(item => {
          list.innerHTML += `<li>${item.date}: ${item.value} (${item.status})</li>`;
        });
      });
  },

  loadMood(username) {
    fetch(`/mood-history?username=${username}`)
      .then(res => res.json())
      .then(data => {
        const list = document.getElementById('profile-mood-list');
        list.innerHTML = '';
        data.slice(-5).reverse().forEach(item => {
          list.innerHTML += `<li>${item.date}: ${item.mood} — ${item.note}</li>`;
        });
      });
  },

  loadQuiz(username) {
    fetch(`/quiz-history?username=${username}`)
      .then(res => res.json())
      .then(data => {
        const list = document.getElementById('profile-quiz-list');
        list.innerHTML = '';
        data.slice(-3).reverse().forEach(item => {
          list.innerHTML += `<li>${item.date}: ${item.result}</li>`;
        });
      });
  }
});
