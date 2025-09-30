FeatureHandler.registerFeature('menu', {
    init() {
        if (!FeatureHandler.getCurrentUser()) {
            FeatureHandler.showPage('login');
            return;
        }
        document.getElementById('current-user').textContent = FeatureHandler.getCurrentUser();
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