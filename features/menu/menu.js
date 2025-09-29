FeatureHandler.registerFeature('menu', {
    init() {
        document.getElementById('current-user').textContent = FeatureHandler.getCurrentUser();
        document.getElementById('bmiBtn').addEventListener('click', () => FeatureHandler.showPage('bmi'));
        document.getElementById('moodBtn').addEventListener('click', () => FeatureHandler.showPage('mood'));
        document.getElementById('quizBtn').addEventListener('click', () => FeatureHandler.showPage('quiz'));
        document.getElementById('logoutBtn').addEventListener('click', () => {
            FeatureHandler.setCurrentUser(null);
            FeatureHandler.showPage('login');
        });
    }
});