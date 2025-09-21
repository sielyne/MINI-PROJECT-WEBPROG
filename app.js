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
            let newID = 1;
            if (data.length > 0) {
                newID = data[data.length - 1].id + 1;
            }
            data.push({ id: newID, username: parsed.username, password: parsed.password });
            saveData(data);
            res.writeHead(200, {'Content-Type': 'text/html'});
res.end(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Registrasi Berhasil</title>
        <link rel="stylesheet" href="style.css">
    </head>
    <body>
        <div class="result-page success">
            <h2>Registrasi berhasil! Selamat datang di Bloomii, <span>${parsed.username}</span>.</h2>
            <a href="/" class="back-btn">Login sekarang</a>
        </div>
    </body>
    </html>
`);

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
    else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Not Found');
    }
});


server.listen(3000, () => {
    console.log('Server listening on http://localhost:3000');
});