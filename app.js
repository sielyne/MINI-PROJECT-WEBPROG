const http = require('http');
const fs = require('fs');
const querystring = require('querystring');
const path = require('path');

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
    // Tambahkan ini di atas route lain
    if (req.method === 'GET' && req.url.startsWith('/style.css')) {
        const cssPath = path.join(__dirname, 'style.css');
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
    if (req.method === 'GET' && req.url === '/') {
        fs.readFile('app.html', (err, content) => {
            if (err) {
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.end('Internal Server Error');
                return;
            }
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(content);
        });
    }
    else if (req.method === 'POST' && req.url === '/register') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const parsed = querystring.parse(body);
            let data = loadData();
            // Cek apakah username sudah ada
            const exists = data.some(u => u.username === parsed.username);
            if (exists) {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end('<h2>Username sudah terdaftar. <a href="/">Kembali</a></h2>');
                return;
            }
            let newID = data.length > 0 ? data[data.length - 1].id + 1 : 1;
            data.push({ 
                id: newID, 
                username: parsed.username, 
                password: parsed.password, 
                bmi: [], 
                moods: [] 
            });
            saveData(data);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end('<h2>Registrasi berhasil! <a href="/">Login</a></h2>');
        });
    }
    else if (req.method === 'POST' && req.url === '/login') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const parsed = querystring.parse(body);
            let data = loadData();
            const user = data.find(u => u.username === parsed.username && u.password === parsed.password);
            if (user) {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Login Berhasil</title>
                        <link rel="stylesheet" href="style.css">
                    </head>
                    <body>
                        <div class="result-page success">
                            <h2>Login berhasil! Selamat datang, <span>${user.username}</span>.</h2>
                            <a href="/" class="back-btn">Logout</a>
                        </div>
                    </body>
                    </html>
                `);
            } else {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Login Gagal</title>
                        <link rel="stylesheet" href="style.css">
                    </head>
                    <body>
                        <div class="result-page failed">
                            <h2>Username atau password salah.</h2>
                            <a href="/" class="back-btn">Coba lagi</a>
                        </div>
                    </body>
                    </html>
                `);
            }
        });
    }

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

        // Status BMI
        let status = '';
        if (bmi < 18.5) status = 'Underweight';
        else if (bmi < 25) status = 'Normal';
        else if (bmi < 30) status = 'Overweight';
        else status = 'Obese';

        console.log(`BMI hasil: ${bmi}, status: ${status}`);

        // Generate ID baru
        const newId = user.bmi.length > 0 ? user.bmi[user.bmi.length - 1].id + 1 : 1;

        // Simpan record baru
        user.bmi.push({ 
            id: newId,
            date: new Date().toISOString().split('T')[0], 
            height,
            weight,
            value: bmi,
            status
        });
        saveData(data);

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ bmi: bmi, status: status }));
    });
}
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

    else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Not Found');
    }
});


server.listen(3000, () => {
    console.log('Server listening on http://localhost:3000');
});