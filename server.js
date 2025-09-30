const http = require('http');
const fs = require('fs');
const querystring = require('querystring');
const path = require('path');
const bcrypt = require('bcrypt');

const DATA_FILE = 'data.json';

function loadData() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, '[]');
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
    console.log('Saving data:', data);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); 
}

const server = http.createServer((req, res) => {
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
            let data = loadData();
            const exists = data.some(u => u.username === parsed.username);
            if (exists) {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                return res.end('Registrasi gagal');
            }
            bcrypt.hash(parsed.password, 10, (err, hash) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    return res.end('Error hashing password');
                }
                let newID = data.length > 0 ? data[data.length - 1].id + 1 : 1;
                data.push({
                    id: newID,
                    username: parsed.username,
                    password: hash, // Simpan hash, bukan plain text
                    bmi: [],
                    moods: [],
                    quiz: []
                });
                saveData(data);
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Registrasi berhasil');
            });
        } catch (err) {
            console.error('Error in /register:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        }
    });
}else if (req.method === 'POST' && req.url === '/login') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
        const parsed = querystring.parse(body);
        let data = loadData();
        const user = data.find(u => u.username === parsed.username);
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

            let data = loadData();
            const user = data.find(u => u.username === parsed.username);
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
            const existingRecord = user.bmi.find(r => r.date === today);

            if (existingRecord) { res.end(JSON.stringify({ error: 'Already submitted today' })); return; }

            if (existingRecord) {
                // Update entri yang sudah ada untuk hari ini
                existingRecord.height = height;
                existingRecord.weight = weight;
                existingRecord.value = bmi;
                existingRecord.status = status;
            } else {
                // Tambah entri baru jika belum ada untuk hari ini
                const newId = user.bmi.length > 0 ? user.bmi[user.bmi.length - 1].id + 1 : 1;
                user.bmi.push({ 
                    id: newId,
                    date: today, 
                    height,
                    weight,
                    value: bmi,
                    status
                });
            }

            saveData(data);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ bmi: bmi, status: status }));
        });
    }
    // Handle BMI history
    else if (req.method === 'GET' && req.url.startsWith('/bmi-history')) {
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const username = urlParams.get('username');

        let data = loadData();
        const user = data.find(u => u.username === username);

        if (!user) {
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "User not found" }));
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(user.bmi));
    }
    // Handle BMI update
    else if (req.method === 'PUT' && req.url === '/bmi') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const parsed = JSON.parse(body);
            let data = loadData();

            const user = data.find(u => u.username === parsed.username);
            if (!user) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "User not found" }));
            }

            let record = user.bmi.find(r => r.id === parsed.id);
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

            saveData(data);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, record }));
        });
    }
    // Handle BMI delete
    else if (req.method === 'DELETE' && req.url === '/bmi') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const parsed = JSON.parse(body);
            let data = loadData();

            const user = data.find(u => u.username === parsed.username);
            if (!user) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "User not found" }));
            }

            user.bmi = user.bmi.filter(r => r.id !== parsed.id);
            saveData(data);

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
            let data = loadData();
            const user = data.find(u => u.username === parsed.username);
            if (!user) {
                res.writeHead(404, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify({ error: 'User not found' }));
            }

            const newId = user.moods.length > 0 ? user.moods[user.moods.length - 1].id + 1 : 1;
            const today = new Date().toISOString().split("T")[0];
            const existingMood = user.moods.find(m => m.date === today);
                if (existingMood) {
                res.writeHead(400, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify({ error: 'Already submitted mood today' }));
            }
            
            user.moods.push({
                id: newId,
                date: today,
                mood: parsed.mood,
                note: parsed.note
            });

            saveData(data);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ success: true }));
        });
    }
    // Handle mood history
    else if (req.method === 'GET' && req.url.startsWith('/mood-history')) {
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const username = urlParams.get('username');
    let data = loadData();
    const user = data.find(u => u.username === username);
    if (!user) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "User not found" }));
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(user.moods || []));
}
    // Handle mood update
    else if (req.method === 'PUT' && req.url === '/mood') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const parsed = JSON.parse(body);
            let data = loadData();
            const user = data.find(u => u.username === parsed.username);
            if (!user) {
                res.writeHead(404, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify({ error: 'User not found' }));
            }
            let mood = user.moods.find(m => m.id === parsed.id);
            if (!mood) {
                res.writeHead(404, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify({ error: 'Mood not found' }));
            }
            mood.mood = parsed.mood || mood.mood;
            mood.note = parsed.note || mood.note;
            saveData(data);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ success: true, mood }));
        });
    }
    // Handle mood delete
    else if (req.method === 'DELETE' && req.url === '/mood') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const parsed = JSON.parse(body);
            let data = loadData();
            const user = data.find(u => u.username === parsed.username);
            if (!user) {
                res.writeHead(404, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify({ error: 'User not found' }));
            }
            user.moods = user.moods.filter(m => m.id !== parsed.id);
            saveData(data);
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
            let data = loadData();
            const user = data.find(u => u.username === username);
            if (!user) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'User not found' }));
            }
            if (!user.quiz) user.quiz = [];
            const quizRecord = {
                id: user.quiz.length > 0 ? user.quiz[user.quiz.length - 1].id + 1 : 1,
                date: new Date().toISOString().split('T')[0],
                answers,
                result,
                recommendation
            };
            user.quiz.push(quizRecord);
            await saveData(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, quiz: quizRecord }));
        } catch (err) {
            console.error('Error in /quiz:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error saving quiz' }));
        }
    });
}
else if (req.method === 'GET' && req.url.startsWith('/quiz-history')) {
    try {
        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        const username = urlObj.searchParams.get('username');
        let data = loadData();
        const user = data.find(u => u.username === username);
        if (!user || !user.quiz || user.quiz.length === 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify([]));
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(user.quiz));
    } catch (err) {
        console.error('Error in /quiz-history:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error fetching quiz history' }));
    }
}   
});
server.listen(3000, () => {
    console.log('Server listening on http://localhost:3000');
});