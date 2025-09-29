FeatureHandler.registerFeature('login', {
    init() {
        document.getElementById('registerBtn').addEventListener('click', () => this.showForm('register'));
        document.getElementById('loginBtn').addEventListener('click', () => this.showForm('login'));
        document.getElementById('backBtn').addEventListener('click', () => this.backToChoice());
        document.getElementById('user-form').addEventListener('submit', (e) => this.handleSubmit(e));
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
        console.log('Returning to choice buttons'); // Log untuk debugging
        document.getElementById('user-form').style.display = 'none';
        const choiceButtons = document.getElementById('choice-buttons');
        choiceButtons.style.display = 'flex';
        choiceButtons.style.alignItems = 'center';
        choiceButtons.style.justifyContent = 'center';
        choiceButtons.style.width = '100%'; // Pastikan lebar penuh
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
                if (form.action.endsWith('/login')) {
                    if (result.includes('Login berhasil')) {
                        FeatureHandler.setCurrentUser(document.getElementById('username').value);
                        FeatureHandler.showPage('menu');
                    } else {
                        alert('Login failed: Wrong username or password');
                    }
                } else {
                    if (result.includes('Registrasi berhasil')) {
                        alert('Registration successful! Please login now.');
                        this.showForm('login');
                    } else if (result.includes('Registrasi gagal')) {
                        alert('Registration failed: Username already exists');
                    } else if (result.includes('Username and password are required')) {
                        alert('Registration failed: Username dan password harus diisi!');
                    } else {
                        alert('Registration failed: ' + result);
                    }
                }
            })
            .catch(err => {
                console.error('Network error:', err);
                alert('Network error. Please try again.');
            });
    }
});