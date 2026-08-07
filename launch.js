const { spawn } = require('child_process');
const { exec } = require('child_process');

console.log('========================================');
console.log('   Super Net - WhatsApp Auto Replay');
console.log('========================================');
console.log('Server shuru ho raha hai, please wait...\n');

const server = spawn('node', ['backend/server.js'], {
    cwd: __dirname,
    shell: true
});

let browserOpened = false;

server.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text);

    // Tunnelmole link dhundho aur browser mein kholo
    if (!browserOpened) {
        const match = text.match(/https:\/\/[a-z0-9\-]+\.tunnelmole\.net/);
        if (match) {
            const url = match[0];
            browserOpened = true;
            console.log('\n✅ Link mil gaya! Browser mein khul raha hai...\n');
            // Windows ya Android (Termux) mein browser open karo
            let command;
            if (process.platform === 'android') {
                command = `termux-open-url "${url}"`;
            } else if (process.platform === 'win32') {
                command = `start "" "${url}"`;
            } else if (process.platform === 'darwin') {
                command = `open "${url}"`;
            } else {
                command = `xdg-open "${url}"`;
            }
            
            exec(command, (err) => {
                if (err) console.error('Browser open nahi ho saka:', err.message);
            });
        }
    }
});

server.stderr.on('data', (data) => {
    process.stderr.write(data);
});

server.on('close', (code) => {
    console.log(`\nServer band ho gaya (code: ${code})`);
});

// Ctrl+C pe gracefully band karo
process.on('SIGINT', () => {
    console.log('\nServer band kiya ja raha hai...');
    server.kill();
    process.exit(0);
});
