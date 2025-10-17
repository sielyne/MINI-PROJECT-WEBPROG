const http = require('http');
const fs = require('fs');
const querystring = require('querystring');
const path = require('path');
const bcrypt = require('bcrypt');

const DATA_DIR = 'data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BMI_FILE = path.join(DATA_DIR, 'bmi.json');
const MOOD_FILE = path.join(DATA_DIR, 'mood.json');
const QUIZ_FILE = path.join(DATA_DIR, 'quiz.json');

function initStorage() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR);
    }
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(BMI_FILE)) {
        fs.writeFileSync(BMI_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(MOOD_FILE)) {
        fs.writeFileSync(MOOD_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(QUIZ_FILE)) {
        fs.writeFileSync(QUIZ_FILE, JSON.stringify([], null, 2));
    }
}

// Load functions
function loadUsers() {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function loadBMI() {
    return JSON.parse(fs.readFileSync(BMI_FILE, 'utf8'));
}

function loadMood() {
    return JSON.parse(fs.readFileSync(MOOD_FILE, 'utf8'));
}

function loadQuiz() {
    return JSON.parse(fs.readFileSync(QUIZ_FILE, 'utf8'));
}

// Save functions
function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function saveBMI(bmiData) {
    fs.writeFileSync(BMI_FILE, JSON.stringify(bmiData, null, 2));
}

function saveMood(moodData) {
    fs.writeFileSync(MOOD_FILE, JSON.stringify(moodData, null, 2));
}

function saveQuiz(quizData) {
    fs.writeFileSync(QUIZ_FILE, JSON.stringify(quizData, null, 2));
}

const server = http.createServer((req, res) => {

    // Update user (username/password)
    if (req.method === 'PUT' && req.url === '/user-update') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                let users = loadUsers();
                const user = users.find(u => u.username === parsed.oldUsername);
                if (!user) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'User not found' }));
                }
                
                // Cek jika username baru sudah dipakai user lain
                if (parsed.newUsername && parsed.newUsername !== parsed.oldUsername) {
                    if (users.some(u => u.username === parsed.newUsername)) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: 'Username already taken' }));
                    }
                    user.username = parsed.newUsername;
                }
                
                if (parsed.newPassword) {
                    bcrypt.hash(parsed.newPassword, 10, (err, hash) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify({ error: 'Error hashing password' }));
                        }
                        user.password = hash;
                        saveUsers(users);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, username: user.username }));
                    });
                } else {
                    saveUsers(users);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, username: user.username }));
                }
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
        });
        return;
    }
    // Delete user
    if (req.method === 'DELETE' && req.url === '/user-delete') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                let users = loadUsers();
                const user = users.find(u => u.username === parsed.username);
                if (!user) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'User not found' }));
                }
                
                const userId = user.id;
                
                // Hapus user
                users = users.filter(u => u.id !== userId);
                saveUsers(users);
                
                // Hapus data BMI user
                let bmiData = loadBMI();
                bmiData = bmiData.filter(b => b.userId !== userId);
                saveBMI(bmiData);
                
                // Hapus data mood user
                let moodData = loadMood();
                moodData = moodData.filter(m => m.userId !== userId);
                saveMood(moodData);
                
                // Hapus data quiz user
                let quizData = loadQuiz();
                quizData = quizData.filter(q => q.userId !== userId);
                saveQuiz(quizData);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
        });
        return;
    }
    // Serve JavaScript files
    if (req.method === 'GET' && (req.url === '/handler.js' || (req.url.startsWith('/features/') && req.url.endsWith('.js')))) {
        const jsPath = path.join(__dirname, req.url);
        fs.readFile(jsPath, (err, content) => {
            if (err) {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('Not Found');
                return;
            }
            res.writeHead(200, {'Content-Type': 'application/javascript'});
            res.end(content);
        });
        return;
    }
    // Serve CSS files
    if (req.method === 'GET' && (req.url === '/style.css' || (req.url.startsWith('/features/') && req.url.endsWith('.css')))) {
        const cssPath = path.join(__dirname, req.url);
        fs.readFile(cssPath, (err, content) => {
            if (err) {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('Not Found');
                return;
            }
            res.writeHead(200, {'Content-Type': 'text/css'});
            res.end(content);
        });
        return;
    }
    // Serve HTML files
    if (req.method === 'GET' && (req.url === '/' || (req.url.startsWith('/features/') && req.url.endsWith('.html')))) {
        const filePath = req.url === '/' ? 'index.html' : req.url;
        const htmlPath = path.join(__dirname, filePath);
        fs.readFile(htmlPath, (err, content) => {
            if (err) {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end('Not Found');
                return;
            }
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(content);
        });
        return;
    }

    // Handle register
    else if (req.method === 'POST' && req.url === '/register') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            console.log('Received POST /register with body:', body);
            try {
                const parsed = querystring.parse(body);
                console.log('Parsed body:', parsed);
                if (!parsed.username || !parsed.password) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    return res.end('Username and password are required');
                }
                
                let users = loadUsers();
                const exists = users.some(u => u.username === parsed.username);
                if (exists) {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    return res.end('Registrasi gagal');
                }
                
                bcrypt.hash(parsed.password, 10, (err, hash) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        return res.end('Error hashing password');
                    }
                    
                    let newID = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
                    
                    users.push({
                        id: newID,
                        username: parsed.username,
                        password: hash
                    });
                    saveUsers(users);
                    
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('Registrasi berhasil');
                });
            } catch (err) {
                console.error('Error in /register:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            }
        });
    }
    
    // Handle login
    else if (req.method === 'POST' && req.url === '/login') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const parsed = querystring.parse(body);
            let users = loadUsers();
            const user = users.find(u => u.username === parsed.username);
            if (!user) {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                return res.end('Login gagal');
            }
            bcrypt.compare(parsed.password, user.password, (err, result) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    return res.end('Error checking password');
                }
                if (result) {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('Login berhasil');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('Login gagal');
                }
            });
        });
    }
    
    // Handle BMI calculation
    else if (req.method === 'POST' && req.url === '/bmi') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            console.log("=== BMI REQUEST DITERIMA ===");
            console.log("Raw body:", body);

            const parsed = querystring.parse(body);
            console.log("Parsed body:", parsed);

            const users = loadUsers();
            const user = users.find(u => u.username === parsed.username);
            if (!user) {
                console.log("User tidak ditemukan:", parsed.username);
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({ error: 'User tidak ditemukan' }));
                return;
            }

            const height = parseFloat(parsed.height);
            const weight = parseFloat(parsed.weight);

            // Validasi input
            if (height < 100 || height > 250 || weight < 30 || weight > 200) {
                console.log("Input tidak valid!");
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({ error: 'Invalid height or weight' }));
                return;
            }

            const bmi = (weight / ((height/100) ** 2)).toFixed(2);
            let status = '';
            if (bmi < 18.5) status = 'Underweight';
            else if (bmi < 25) status = 'Normal';
            else if (bmi < 30) status = 'Overweight';
            else status = 'Obese';

            console.log(`BMI hasil: ${bmi}, status: ${status}`);

            const today = new Date().toISOString().split('T')[0];
            let bmiData = loadBMI();
            const existingRecord = bmiData.find(r => r.userId === user.id && r.date === today);

            if (existingRecord) {
                res.writeHead(400, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({ error: 'Already submitted today' }));
                return;
            }

            const userBMIs = bmiData.filter(b => b.userId === user.id);
            const newId = userBMIs.length > 0 ? Math.max(...userBMIs.map(b => b.id)) + 1 : 1;
            
            bmiData.push({ 
                id: newId,
                userId: user.id,
                date: today, 
                height,
                weight,
                value: bmi,
                status
            });

            saveBMI(bmiData);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ bmi: bmi, status: status }));
        });
    }
    else if (req.method === 'GET' && req.url.startsWith('/bmi-history')) {
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const username = urlParams.get('username');

        const users = loadUsers();
        const user = users.find(u => u.username === username);
        if (!user) {
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "User not found" }));
        }

        const bmiData = loadBMI();
        const userBMIs = bmiData.filter(b => b.userId === user.id).map(b => ({
            id: b.id,
            date: b.date,
            height: b.height,
            weight: b.weight,
            value: b.value,
            status: b.status
        }));

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(userBMIs));
    }
    // Handle BMI update
    else if (req.method === 'PUT' && req.url === '/bmi') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const parsed = JSON.parse(body);
            const users = loadUsers();
            const user = users.find(u => u.username === parsed.username);
            if (!user) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "User not found" }));
            }

            let bmiData = loadBMI();
            let record = bmiData.find(r => r.userId === user.id && r.id === parsed.id);
            
            if (!record) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "Record not found" }));
            }

            // Update field
            record.height = parsed.height;
            record.weight = parsed.weight;
            record.value = (parsed.weight / ((parsed.height / 100) ** 2)).toFixed(2);
            record.status = record.value < 18.5 ? "Underweight" : 
                            record.value < 25 ? "Normal" : 
                            record.value < 30 ? "Overweight" : "Obese";

            saveBMI(bmiData);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, record: {
                id: record.id,
                date: record.date,
                height: record.height,
                weight: record.weight,
                value: record.value,
                status: record.status
            }}));
        });
    }
    // Handle BMI delete
    else if (req.method === 'DELETE' && req.url === '/bmi') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const parsed = JSON.parse(body);
            const users = loadUsers();
            const user = users.find(u => u.username === parsed.username);

            if (!user) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "User not found" }));
            }

            let bmiData = loadBMI();
            bmiData = bmiData.filter(r => !(r.userId === user.id && r.id === parsed.id));
            saveBMI(bmiData);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
        });
    }
    // Handle mood creation
    else if (req.method === 'POST' && req.url === '/mood') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const parsed = JSON.parse(body);
            const users = loadUsers();
            const user = users.find(u => u.username === parsed.username);
            
            if (!user) {
                res.writeHead(404, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify({ error: 'User not found' }));
            }

            const today = new Date().toISOString().split("T")[0];
            let moodData = loadMood();
            const existingMood = moodData.find(m => m.userId === user.id && m.date === today);
            
            if (existingMood) {
                res.writeHead(400, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify({ error: 'Already submitted mood today' }));
            }
            
            const userMoods = moodData.filter(m => m.userId === user.id);
            const newId = userMoods.length > 0 ? Math.max(...userMoods.map(m => m.id)) + 1 : 1;
            
            moodData.push({
                id: newId,
                userId: user.id,
                date: today,
                mood: parsed.mood,
                note: parsed.note
            });

            saveMood(moodData);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ success: true }));
        });
    }
    // Handle mood history
    else if (req.method === 'GET' && req.url.startsWith('/mood-history')) {
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const username = urlParams.get('username');
        const users = loadUsers();
        const user = users.find(u => u.username === username);
        
        if (!user) {
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "User not found" }));
        }
        
        const moodData = loadMood();
        const userMoods = moodData.filter(m => m.userId === user.id).map(m => ({
            id: m.id,
            date: m.date,
            mood: m.mood,
            note: m.note
        }));
        
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(userMoods));
    }
    
    // Handle mood update
    else if (req.method === 'PUT' && req.url === '/mood') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const parsed = JSON.parse(body);
            const users = loadUsers();
            const user = users.find(u => u.username === parsed.username);
            
            if (!user) {
                res.writeHead(404, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify({ error: 'User not found' }));
            }
            
            let moodData = loadMood();
            let mood = moodData.find(m => m.userId === user.id && m.id === parsed.id);
            
            if (!mood) {
                res.writeHead(404, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify({ error: 'Mood not found' }));
            }
            
            mood.mood = parsed.mood || mood.mood;
            mood.note = parsed.note || mood.note;
            saveMood(moodData);
            
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ success: true, mood: {
                id: mood.id,
                date: mood.date,
                mood: mood.mood,
                note: mood.note
            }}));
        });
    }
    // Handle mood delete
    else if (req.method === 'DELETE' && req.url === '/mood') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const parsed = JSON.parse(body);
            const users = loadUsers();
            const user = users.find(u => u.username === parsed.username);
            
            if (!user) {
                res.writeHead(404, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify({ error: 'User not found' }));
            }
            
            let moodData = loadMood();
            moodData = moodData.filter(m => !(m.userId === user.id && m.id === parsed.id));
            saveMood(moodData);
            
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ success: true }));
        });
    }
    
    // Handle quiz submission
    else if (req.method === 'POST' && req.url === '/quiz') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { username, answers, result, recommendation } = JSON.parse(body);
                const users = loadUsers();
                const user = users.find(u => u.username === username);
                
                if (!user) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'User not found' }));
                }
                
                let quizData = loadQuiz();
                const userQuizzes = quizData.filter(q => q.userId === user.id);
                const newId = userQuizzes.length > 0 ? Math.max(...userQuizzes.map(q => q.id)) + 1 : 1;
                
                const quizRecord = {
                    id: newId,
                    userId: user.id,
                    date: new Date().toISOString().split('T')[0],
                    answers,
                    result,
                    recommendation
                };
                
                quizData.push(quizRecord);
                saveQuiz(quizData);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, quiz: {
                    id: quizRecord.id,
                    date: quizRecord.date,
                    answers: quizRecord.answers,
                    result: quizRecord.result,
                    recommendation: quizRecord.recommendation
                }}));
            } catch (err) {
                console.error('Error in /quiz:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error saving quiz' }));
            }
        });
    }
    // Handle quiz history
    else if (req.method === 'GET' && req.url.startsWith('/quiz-history')) {
        try {
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const username = urlObj.searchParams.get('username');
            const users = loadUsers();
            const user = users.find(u => u.username === username);
            
            if (!user) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify([]));
            }
            
            const quizData = loadQuiz();
            const userQuizzes = quizData.filter(q => q.userId === user.id).map(q => ({
                id: q.id,
                date: q.date,
                answers: q.answers,
                result: q.result,
                recommendation: q.recommendation
            }));
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(userQuizzes));
        } catch (err) {
            console.error('Error in /quiz-history:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error fetching quiz history' }));
        }
    }
    // Assets
    else if (req.method === 'GET' && req.url.startsWith('/assets/')) {
        const imgPath = path.join(__dirname, req.url);
        fs.readFile(imgPath, (err, content) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                return res.end('Image not found');
            }
            const ext = path.extname(imgPath).toLowerCase();
            const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.svg': 'image/svg+xml'
            };
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
            res.end(content);
        });
        return;
    }
});

initStorage();

server.listen(3000, () => {
    console.log('Server listening on http://localhost:3000');
});