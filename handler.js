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
        if (this.currentPage === pageId) return;
        this.currentPage = pageId;

        const container = document.getElementById('app-container');
        fetch(`features/${pageId}/${pageId}.html`)
            .then(res => res.text())
            .then(html => {
                container.innerHTML = html;
                // Load feature-specific CSS
                const existingStyle = document.querySelector(`link[href="features/${pageId}/${pageId}.css"]`);
                if (!existingStyle) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = `features/${pageId}/${pageId}.css`;
                    document.head.appendChild(link);
                }
                // Initialize feature
                this.executeFeature(pageId, 'init');
            })
            .catch(err => console.error(`Error loading ${pageId}:`, err));
    },

    // Set current user
    setCurrentUser(username) {
        this.currentUser = username;
    },

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    },

    // Initialize app
    init() {
        this.showPage('login');
    }
};

// Initialize app on load
window.onload = () => FeatureHandler.init();