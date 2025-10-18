FeatureHandler.registerFeature('login', {
    init() {
        const regBtn = document.getElementById('registerBtn');
        const logBtn = document.getElementById('loginBtn');
        const backBtn = document.getElementById('backBtn');
        const userForm = document.getElementById('user-form');

        if (regBtn) regBtn.onclick = () => this.showForm('register');
        if (logBtn) logBtn.onclick = () => this.showForm('login');
        if (backBtn) backBtn.onclick = () => this.backToChoice();
        if (userForm) userForm.onsubmit = (e) => this.handleSubmit(e);

        // Theme toggle tetap
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
            if (savedTheme === 'dark') document.body.classList.add('dark-mode');
        }
    },

    showForm(type) {
        document.getElementById('choice-buttons').style.display = 'none';
        const form = document.getElementById('user-form');
        const title = document.getElementById('form-title');
        form.action = type === 'register' ? '/register' : '/login';
        title.textContent = type === 'register' ? 'Register' : 'Login';
        form.style.display = 'block';
    },

    backToChoice() {
        document.getElementById('user-form').style.display = 'none';
        const choiceButtons = document.getElementById('choice-buttons');
        choiceButtons.style.display = 'flex';
        choiceButtons.style.alignItems = 'center';
        choiceButtons.style.justifyContent = 'center';
        choiceButtons.style.width = '100%';
        document.getElementById('user-form').reset();
    },

    handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);

    console.log('Sending to:', form.action, 'with data:', new URLSearchParams(data).toString());

    fetch(form.action, { method: 'POST', body: new URLSearchParams(data) })
        .then(res => res.text())
        .then(result => {
            console.log('Server response:', result); // Debug server output

            if (form.action.endsWith('/login')) {
                // LOGIN HANDLER
                if (result.includes('Login berhasil')) {
                    const username = document.getElementById('username').value.trim();
                    if (username) {
                        FeatureHandler.setCurrentUser(username);
                        FeatureHandler.updateHeader();
                        FeatureHandler.showPage('menu');
                    } else {
                        alert('Username cannot be empty.');
                    }
                } else {
                    alert('Login failed: Incorrect username or password.');
                    form.reset();
                }
            } 
            
            else if (form.action.endsWith('/register')) {
                // REGISTER HANDLER
                FeatureHandler.setCurrentUser(null);
                FeatureHandler.updateHeader();

                if (result.includes('Registrasi berhasil')) {
                    alert('✅ Registration successful! Please log in to continue.');
                    this.showForm('login');
                    document.getElementById('password').value = '';
                } 
                else if (result.includes('Registrasi gagal')) {
                    alert('❌ Registration failed: Username already exists.');
                    form.reset();
                } 
                else if (result.includes('Username and password are required')) {
                    alert('⚠️ Registration failed: Username and password are required.');
                    form.reset();
                } 
                else {
                    alert('Registration failed: ' + result);
                    form.reset();
                }
            }
        })
        .catch(err => {
            console.error('Network error:', err);
            alert('⚠️ Network error. Please try again later.');
            form.reset();
        });
}


});
