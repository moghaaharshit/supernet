// Super Net Voice Assistant - Local Commands Only
(function() {
    function init() {
        const html = `
        <div id="sna-container">
            <button id="sna-btn" title="Super Net AI Assistant">
                <svg class="sna-mic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
            </button>
            <div id="sna-modal" class="sna-hidden">
                <div class="sna-modal-box">
                    <div class="sna-modal-header">
                        <div class="sna-modal-logo">
                            <div class="sna-pulse-ring"></div>
                            <div class="sna-pulse-ring delay"></div>
                            <div class="sna-pulse-ring delay2"></div>
                            <div class="sna-core"></div>
                        </div>
                        <div class="sna-title">
                            <h3>Super Net AI</h3>
                            <small>Your Smart Assistant</small>
                        </div>
                        <button id="sna-close" class="sna-close-btn">X</button>
                    </div>
                    <div class="sna-modal-body">
                        <div id="sna-status-area">
                            <p id="sna-status-text">Always Listening...</p>
                        </div>
                        <div id="sna-response" class="sna-hidden">
                            <p id="sna-response-text"></p>
                        </div>
                        <div id="sna-tables" class="sna-hidden">
                            <h4>Processing Tables...</h4>
                            <div id="sna-tables-list"></div>
                        </div>
                        <div id="sna-commands">
                            <p class="sna-commands-title">Available Commands:</p>
                            <ul>
                                <li>"Open Dashboard" / "Dashboard kholo"</li>
                                <li>"Open Excel" / "Excel kholo"</li>
                                <li>"Open Rules" / "Rules kholo"</li>
                                <li>"Open Send" / "Send kholo"</li>
                                <li>"Open Settings" / "Settings kholo"</li>
                                <li>"Remind all" / "Sabko reminder bhej"</li>
                                <li>"Remind [table name]"</li>
                                <li>"Go back" / "Home pe jao"</li>
                            </ul>
                        </div>
                    </div>
                    <div class="sna-modal-footer">
                        <button id="sna-stop-btn">Band Kar</button>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
        
        const css = document.createElement('style');
        css.textContent = `
            #sna-container { position: fixed; bottom: 24px; right: 24px; z-index: 9999; }
            #sna-btn {
                width: 60px; height: 60px; border-radius: 50%;
                background: linear-gradient(135deg, #6366f1, #ec4899);
                border: none; cursor: pointer; position: relative;
                box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
                transition: all 0.3s ease;
                display: flex; align-items: center; justify-content: center;
            }
            #sna-btn:hover { transform: scale(1.1); box-shadow: 0 6px 30px rgba(99, 102, 241, 0.6); }
            #sna-btn.active {
                animation: sna-btn-glow 1.5s ease-in-out infinite;
                background: linear-gradient(135deg, #10b981, #059669);
            }
            @keyframes sna-btn-glow {
                0%, 100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.6), 0 0 30px rgba(16, 185, 129, 0.3); }
                50% { box-shadow: 0 0 25px rgba(16, 185, 129, 0.9), 0 0 50px rgba(16, 185, 129, 0.5); }
            }
            .sna-mic {
                width: 24px; height: 24px; color: white; position: relative; z-index: 2;
                filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.6));
                transition: filter 0.3s ease;
            }
            #sna-btn.active .sna-mic {
                filter: drop-shadow(0 0 15px rgba(16, 185, 129, 0.9)) drop-shadow(0 0 30px rgba(16, 185, 129, 0.6));
                animation: sna-mic-glow 1s ease-in-out infinite;
            }
            @keyframes sna-mic-glow {
                0%, 100% { filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.8)); }
                50% { filter: drop-shadow(0 0 25px rgba(16, 185, 129, 1)) drop-shadow(0 0 50px rgba(16, 185, 129, 0.5)); }
            }

            #sna-modal {
                position: fixed; bottom: 100px; right: 24px; width: 380px; max-height: 500px;
                background: linear-gradient(135deg, #1e293b, #0f172a);
                border-radius: 20px; border: 1px solid rgba(99, 102, 241, 0.3);
                box-shadow: 0 20px 60px rgba(0,0,0,0.5); overflow: hidden;
                animation: sna-slideup 0.3s ease;
            }
            #sna-modal.sna-hidden { display: none; }
            @keyframes sna-slideup { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            .sna-modal-header {
                display: flex; align-items: center; gap: 12px; padding: 16px;
                background: rgba(99, 102, 241, 0.1); border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            .sna-modal-logo { width: 50px; height: 50px; position: relative; display: flex; align-items: center; justify-content: center; }
            .sna-pulse-ring { position: absolute; width: 50px; height: 50px; border-radius: 50%; border: 2px solid #6366f1; animation: sna-pulse 2s ease-out infinite; }
            .sna-pulse-ring.delay { animation-delay: 0.5s; }
            .sna-pulse-ring.delay2 { animation-delay: 1s; }
            @keyframes sna-pulse { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }
            .sna-core { width: 20px; height: 20px; background: linear-gradient(135deg, #6366f1, #ec4899); border-radius: 50%; position: relative; z-index: 1; }
            .sna-title { flex: 1; }
            .sna-title h3 { margin: 0; color: white; font-size: 16px; }
            .sna-title small { color: #ec4899; font-style: italic; }
            .sna-close-btn { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1); border: none; color: white; cursor: pointer; font-size: 14px; }
            .sna-close-btn:hover { background: rgba(239, 68, 68, 0.5); }
            .sna-modal-body { padding: 20px; min-height: 150px; max-height: 300px; overflow-y: auto; }
            #sna-status-area { text-align: center; }
            #sna-status-text { color: #94a3b8; font-style: italic; margin: 0; }
            #sna-response { text-align: center; padding: 16px; background: rgba(99, 102, 241, 0.15); border-radius: 12px; border: 1px solid rgba(99, 102, 241, 0.3); animation: sna-fadein 0.3s ease; }
            #sna-response-text { color: white; margin: 0; line-height: 1.6; }
            #sna-response.sna-hidden { display: none; }
            @keyframes sna-fadein { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            #sna-tables h4 { color: white; margin: 0 0 12px 0; text-align: center; }
            #sna-tables.sna-hidden { display: none; }
            #sna-tables-list { display: flex; flex-direction: column; gap: 8px; }
            .sna-table-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
            .sna-table-item.done { border-color: #10b981; background: rgba(16,185,129,0.1); }
            .sna-table-item .sna-tname { flex: 1; color: white; font-weight: 500; }
            .sna-table-item .sna-tstatus { color: #94a3b8; font-size: 12px; }
            .sna-table-item.done .sna-tstatus { color: #10b981; }
            .sna-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
            .sna-modal-footer { padding: 12px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; }
            #sna-stop-btn { padding: 10px 24px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; border-radius: 20px; font-weight: 600; cursor: pointer; }
            #sna-stop-btn:hover { transform: scale(1.05); }
            #sna-commands { margin-top: 16px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; }
            .sna-commands-title { color: #94a3b8; font-size: 12px; margin: 0 0 8px 0; }
            #sna-commands ul { margin: 0; padding-left: 20px; }
            #sna-commands li { color: #64748b; font-size: 11px; margin-bottom: 4px; }
            @media (max-width: 480px) {
                #sna-container { bottom: 16px; right: 16px; }
                #sna-modal { width: calc(100% - 32px); right: 16px; bottom: 90px; }
            }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(css);
        
        initVoiceAssistant();
    }
    
    function initVoiceAssistant() {
        let recognition = null;
        let isListening = localStorage.getItem('sna_listening') === 'true';
        let micPermissionGranted = false;
        const synthesis = window.speechSynthesis;
        
        const btn = document.getElementById('sna-btn');
        const modal = document.getElementById('sna-modal');
        const closeBtn = document.getElementById('sna-close');
        const stopBtn = document.getElementById('sna-stop-btn');
        const statusText = document.getElementById('sna-status-text');
        const response = document.getElementById('sna-response');
        const responseText = document.getElementById('sna-response-text');
        const tablesSection = document.getElementById('sna-tables');
        const tablesList = document.getElementById('sna-tables-list');
        
        // Pehle microphone ki permission maango
        function requestMicPermission(callback) {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(function(stream) {
                        // Permission mil gayi, stream band karo (recognition apna handle karega)
                        stream.getTracks().forEach(track => track.stop());
                        micPermissionGranted = true;
                        if (callback) callback(true);
                    })
                    .catch(function(err) {
                        console.error('Mic permission denied:', err);
                        micPermissionGranted = false;
                        statusText.textContent = '❌ Microphone blocked hai!';
                        statusText.style.color = '#ef4444';
                        showMicBlockedMessage();
                        if (callback) callback(false);
                    });
            } else {
                if (callback) callback(false);
            }
        }
        
        function showMicBlockedMessage() {
            response.classList.remove('sna-hidden');
            responseText.innerHTML = `
                <strong style="color:#ef4444;">❌ Microphone Access Blocked!</strong><br><br>
                Voice commands kaam nahi karenge.<br><br>
                <strong>Fix kaise karo:</strong><br>
                1. Browser ke address bar mein 🔒 ya 🎤 icon par click karo<br>
                2. Microphone ko <strong>"Allow"</strong> karo<br>
                3. Page ko refresh karo (F5)
            `;
            responseText.style.textAlign = 'left';
            responseText.style.fontSize = '13px';
        }
        
        // Setup speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = false; // Changed to false for better mobile/Safari support
            recognition.interimResults = false;
            recognition.lang = 'en-IN';
            
            recognition.onresult = function(e) {
                const transcript = e.results[e.results.length - 1][0].transcript;
                console.log('Heard:', transcript);
                handleCommand(transcript);
            };
            
            recognition.onerror = function(e) {
                console.log('Speech error:', e.error);
                isListening = false;
                btn.classList.remove('active');
                
                if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                    statusText.textContent = '❌ Microphone blocked hai!';
                    statusText.style.color = '#ef4444';
                    showMicBlockedMessage();
                    modal.classList.remove('sna-hidden');
                } else if (e.error === 'network') {
                    statusText.textContent = '❌ Network / Browser Issue!';
                    statusText.style.color = '#ef4444';
                    
                    response.classList.remove('sna-hidden');
                    responseText.innerHTML = `
                        <strong style="color:#ef4444;">❌ Network Error (Web Speech API)</strong><br><br>
                        1. Aap <strong>HTTPS</strong> link use karein.<br>
                        2. Aap <strong>Google Chrome</strong> browser use karein.<br>
                        3. Mic button tap karke dobara try karein.
                    `;
                    responseText.style.textAlign = 'left';
                    responseText.style.fontSize = '13px';
                    modal.classList.remove('sna-hidden');
                } else {
                    statusText.textContent = 'Tap mic to speak again';
                    statusText.style.color = '#94a3b8';
                }
            };
            
            recognition.onstart = function() {
                statusText.textContent = '🎤 Listening... Bolo!';
                statusText.style.color = '#10b981';
            };
            
            recognition.onend = function() {
                isListening = false;
                btn.classList.remove('active');
                if (statusText.textContent.includes('Listening')) {
                    statusText.textContent = 'Tap mic to speak';
                    statusText.style.color = '#94a3b8';
                }
            };
        } else {
            // Browser support nahi hai
            setTimeout(() => {
                statusText.textContent = '❌ Chrome browser use karo!';
                statusText.style.color = '#ef4444';
            }, 500);
        }
        
        // Event listeners (added touchstart for mobile Safari/Brave support)
        const startAction = function(e) {
            e.preventDefault();
            modal.classList.remove('sna-hidden');
            if (!isListening) {
                requestMicPermission(function(granted) {
                    if (granted) startListening();
                });
            }
        };
        btn.addEventListener('click', startAction);
        btn.addEventListener('touchstart', startAction, { passive: false });
        
        closeBtn.addEventListener('click', function() {
            modal.classList.add('sna-hidden');
        });
        
        stopBtn.addEventListener('click', function() {
            if (recognition) recognition.stop();
            isListening = false;
            localStorage.setItem('sna_listening', 'false');
            btn.classList.remove('active');
            modal.classList.add('sna-hidden');
        });
        
        // Removed Auto-start to prevent mobile Safari/Brave permission blocks
        // Users must tap the mic to start listening
        
        function startListening() {
            if (!recognition) {
                showResponse('Voice recognition supported nahi hai! Chrome browser use karo!');
                return;
            }
            try {
                recognition.start();
                isListening = true;
                localStorage.setItem('sna_listening', 'true');
                btn.classList.add('active');
                statusText.textContent = '🎤 Listening... Bolo!';
                statusText.style.color = '#10b981';
            } catch(e) {
                if (e.name !== 'InvalidStateError') {
                    console.log('Start error:', e);
                }
            }
        }
        
        let lastCommandTime = 0;
        let lastCommandText = '';
        
        function handleCommand(text) {
            const lower = text.toLowerCase().trim();
            statusText.textContent = text;
            
            // 1. Open commands
            if (lower.startsWith('open ')) {
                const section = lower.replace('open ', '').trim();
                if (section.includes('dashboard') || section.includes('home')) {
                    respond('Opening Dashboard');
                    setTimeout(() => window.location.href = '/frontend/dashboard.html', 1000);
                } else if (section.includes('excel')) {
                    respond('Opening Excel');
                    setTimeout(() => window.location.href = '/frontend/excel.html', 1000);
                } else if (section.includes('rule')) {
                    respond('Opening Rules');
                    setTimeout(() => window.location.href = '/frontend/rules.html', 1000);
                } else if (section.includes('send') || section.includes('message')) {
                    respond('Opening Send Message');
                    setTimeout(() => window.location.href = '/frontend/send.html', 1000);
                } else if (section.includes('setting')) {
                    respond('Opening Settings');
                    setTimeout(() => window.location.href = '/frontend/settings.html', 1000);
                } else if (section.includes('analytic')) {
                    respond('Opening Analytics');
                    setTimeout(() => window.location.href = '/frontend/analytics.html', 1000);
                } else {
                    respond('Section not found: ' + section);
                }
                return;
            }
            
            // 2. Remind commands
            if (lower.startsWith('remind ')) {
                const target = lower.replace('remind ', '').trim();
                if (target === 'all') {
                    startAllReminders();
                } else {
                    startSpecificReminder(target);
                }
                return;
            }
            
            // Command not recognized
            respond('Command not recognized. Use: "open [section name]" or "remind [all/table name]"');
        }
        
        function respond(text) {
            showResponse(text);
            speak(text);
        }
        
        function showResponse(text) {
            response.classList.remove('sna-hidden');
            responseText.textContent = text;
            setTimeout(() => response.classList.add('sna-hidden'), 8000);
        }
        
        function speak(text) {
            if (!synthesis) return;
            synthesis.cancel();
            const cleanText = text.replace(/[^\w\s.,!?]/g, '').trim();
            const u = new SpeechSynthesisUtterance(cleanText);
            u.lang = 'en-IN';
            u.rate = 1.1;
            u.pitch = 1.1;
            u.volume = 1.0;
            const voices = synthesis.getVoices();
            const hindi = voices.find(v => v.lang.startsWith('hi'));
            const eng = voices.find(v => v.lang.startsWith('en'));
            if (hindi) u.voice = hindi;
            else if (eng) u.voice = eng;
            synthesis.speak(u);
        }
        
        async function startAllReminders() {
            respond('Alright Sir! Sab tables ko reminder bhej rahi hoon!');
            
            try {
                const res = await fetch('/api/tables');
                const tables = await res.json();
                
                if (tables.length === 0) {
                    respond('Sir, koi table nahi hai! Pehle Excel upload karo!');
                    return;
                }
                
                await processTables(tables);
            } catch(e) {
                respond('Sir, kuch gadbad ho gayi! Try again!');
            }
        }
        
        async function startSpecificReminder(name) {
            statusText.textContent = 'Finding: ' + name + '...';
            
            try {
                const res = await fetch('/api/tables');
                const tables = await res.json();
                
                const found = tables.find(t => t.name.toLowerCase().includes(name.toLowerCase()));
                
                if (!found) {
                    const names = tables.map(t => t.name).join(', ');
                    respond('Sir, ' + name + ' nahi mili! Available tables: ' + (names || 'Koi nahi'));
                    return;
                }
                
                respond('Mil gayi Sir! ' + found.name + ' ko notify kar rahi hoon!');
                await processTables([found]);
            } catch(e) {
                respond('Sir, kuch gadbad ho gayi! Try again!');
            }
        }
        
        async function processTables(tables) {
            tablesSection.classList.remove('sna-hidden');
            tablesList.innerHTML = '';
            let totalWaSent = 0;
            let totalSmsSent = 0;
            
            for (const table of tables) {
                const item = document.createElement('div');
                item.className = 'sna-table-item';
                item.style.flexDirection = 'column';
                item.style.alignItems = 'flex-start';
                item.innerHTML = `
                    <div class="sna-tname" style="margin-bottom: 8px; width: 100%; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">${table.name}</div>
                    <div style="display:flex; width: 100%; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="color:#10b981; font-size:12px; font-weight:bold;">WhatsApp</span>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div class="sna-tstatus sna-wa-status">Processing...</div><div class="sna-spinner sna-wa-spinner"></div>
                        </div>
                    </div>
                    <div style="display:flex; width: 100%; justify-content: space-between; align-items: center;">
                        <span style="color:#6366f1; font-size:12px; font-weight:bold;">SMS</span>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div class="sna-tstatus sna-sms-status">Processing...</div><div class="sna-spinner sna-sms-spinner"></div>
                        </div>
                    </div>
                `;
                tablesList.appendChild(item);
                
                try {
                    const result = await sendNotifications(table);
                    totalWaSent += result.waSent;
                    totalSmsSent += result.smsSent;
                    item.classList.add('done');
                    item.querySelector('.sna-wa-status').textContent = 'Done! ' + result.waSent + ' sent';
                    if (item.querySelector('.sna-wa-spinner')) item.querySelector('.sna-wa-spinner').remove();
                    
                    item.querySelector('.sna-sms-status').textContent = 'Done! ' + result.smsSent + ' sent';
                    if (item.querySelector('.sna-sms-spinner')) item.querySelector('.sna-sms-spinner').remove();
                } catch(e) {
                    item.querySelector('.sna-wa-status').textContent = 'Error';
                    if (item.querySelector('.sna-wa-spinner')) item.querySelector('.sna-wa-spinner').remove();
                    item.querySelector('.sna-sms-status').textContent = 'Error';
                    if (item.querySelector('.sna-sms-spinner')) item.querySelector('.sna-sms-spinner').remove();
                }
                
                await new Promise(r => setTimeout(r, 500));
            }
            
            respond('Done Sir! Total ' + totalWaSent + ' WhatsApp aur ' + totalSmsSent + ' SMS send ho gaye!');
            setTimeout(() => tablesSection.classList.add('sna-hidden'), 6000);
        }
        // Robust date parser - handles all common formats
        function parseExpiryDate(val) {
            if (val === null || val === undefined || val === '') return null;
            if (val instanceof Date && !isNaN(val.getTime())) return val;
            if (typeof val === 'number' && val > 30000 && val < 60000) {
                const excelEpoch = new Date(1899, 11, 30);
                const d = new Date(excelEpoch.getTime() + val * 86400000);
                if (!isNaN(d.getTime())) return d;
            }
            const str = String(val).trim();
            if (!str) return null;
            const monthMap = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
            const monthNames = Object.keys(monthMap);
            function makeLocalDate(y, m, d) {
                const date = new Date(y, m, d);
                if (!isNaN(date.getTime()) && date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) return date;
                return null;
            }
            const lowerStr = str.toLowerCase();
            const foundMonthIdx = monthNames.findIndex(m => lowerStr.includes(m));
            if (foundMonthIdx !== -1) {
                const wordParts = str.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
                let month = -1, day = -1, year = -1;
                for (const wp of wordParts) {
                    const wl = wp.toLowerCase();
                    if (monthMap[wl] !== undefined) { month = monthMap[wl]; continue; }
                    const num = parseInt(wp);
                    if (isNaN(num)) continue;
                    if (num > 1900 && num < 2100) { year = num; continue; }
                    if (num >= 1 && num <= 31 && day === -1) { day = num; continue; }
                    if (num >= 1 && num <= 12 && month === -1) { month = num - 1; continue; }
                }
                if (month !== -1 && day !== -1 && year !== -1) {
                    const d = makeLocalDate(year, month, day);
                    if (d) return d;
                }
            }
            const dateOnly = str.split(/[\sT]+/)[0];
            if (dateOnly !== str) {
                const d = parseExpiryDate(dateOnly);
                if (d) return d;
            }
            const parts = dateOnly.split(/[\/\-\.]/);
            if (parts.length >= 3) {
                let p0 = parseInt(parts[0]);
                let p1 = parseInt(parts[1]);
                let p2 = parseInt(parts[2]);
                if (isNaN(p0) || isNaN(p1) || isNaN(p2)) return null;
                if (p2 < 100) p2 += 2000;
                if (p0 > 1900 && p0 < 2100 && p1 >= 1 && p1 <= 12 && p2 >= 1 && p2 <= 31) {
                    const d = makeLocalDate(p0, p1 - 1, p2);
                    if (d) return d;
                }
                if (p0 >= 1 && p0 <= 31 && p1 >= 1 && p1 <= 12 && p2 > 1900) {
                    const d = makeLocalDate(p2, p1 - 1, p0);
                    if (d) return d;
                }
                if (p0 >= 1 && p0 <= 12 && p1 >= 1 && p1 <= 31 && p2 > 1900) {
                    const d = makeLocalDate(p2, p0 - 1, p1);
                    if (d) return d;
                }
                if (p0 >= 1 && p0 <= 31 && p1 >= 1 && p1 <= 12 && p2 >= 2000 && p2 <= 2099) {
                    const d = makeLocalDate(p2, p1 - 1, p0);
                    if (d) return d;
                }
            }
            const fallback = new Date(dateOnly);
            if (!isNaN(fallback.getTime()) && dateOnly.length >= 8) {
                return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
            }
            return null;
        }

        async function sendNotifications(table) {
            const settings = table.notifySettings || {};
            const beforeDays = settings.beforeDays !== undefined ? settings.beforeDays : 0;
            const beforeMsg = settings.beforeExpiryMsg || 'Hello {name}, your WiFi plan is expiring in {days} days. Please recharge soon.';
            const expiredMsg = settings.expiredMsg || 'Hello {name}, your WiFi plan has expired {days} days ago.';
            
            const headers = table.headers;
            const data = table.data;
            
            const findCol = (names) => {
                for (const n of names) {
                    const idx = headers.findIndex(h => String(h).toLowerCase().includes(n.toLowerCase()));
                    if (idx !== -1) return idx;
                }
                return -1;
            };
            
            const phoneCol = findCol(['phone', 'mobile', 'whatsapp', 'number', 'pho', 'phom']);
            const nameCol = findCol(['customer name', 'name', 'customer']);
            const expiryCol = findCol(['expiry date', 'expiry', 'expir', 'validity', 'valid', 'expire', 'expirationdate', 'expiration date', 'expiration', 'exp date']);
            
            if (phoneCol === -1 || expiryCol === -1) {
                return { waSent: 0, smsSent: 0 };
            }
            
            const today = new Date();
            let waSent = 0;
            let smsSent = 0;
            
            for (const row of data) {
                const phone = row[phoneCol];
                if (!phone) continue;
                
                const name = nameCol !== -1 ? (row[nameCol] || 'Customer') : 'Customer';
                let days = null;
                
                // Only use expiry date to calculate remaining days
                if (row[expiryCol]) {
                    const exp = parseExpiryDate(row[expiryCol]);
                    if (exp) {
                        days = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
                    }
                }
                
                if (days === null) continue;
                
                let msg;
                if (days < 0) {
                    msg = expiredMsg.replace(/{name}/g, name).replace(/{days}/g, Math.abs(days));
                } else if (days >= 0 && days <= beforeDays) {
                    msg = beforeMsg.replace(/{name}/g, name).replace(/{days}/g, days);
                } else {
                    continue;
                }
                
                // 1. Send WhatsApp
                try {
                    const resWa = await fetch('/api/whatsapp/send', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ phoneNumber: String(phone), message: msg })
                    });
                    const resultWa = await resWa.json();
                    if (resultWa.success) waSent++;
                } catch(e) {
                    console.error('WA Error:', e);
                }
                
                // 2. Send SMS
                try {
                    let customApi = localStorage.getItem('smsApiUrl');
                    if (!customApi) {
                        customApi = '';
                    }
                    const smsApiUrl = customApi
                        .replace('PHONE_NUMBER', encodeURIComponent(String(phone)))
                        .replace('HELLOWORLD', encodeURIComponent(msg));
                    
                    const resSms = await fetch(smsApiUrl, { mode: 'no-cors' });
                    // Since it's no-cors we can't read the response properly, but we can assume it triggered
                    smsSent++;
                } catch(e) {
                    console.error('SMS Error:', e);
                }
                
                await new Promise(r => setTimeout(r, 1500));
            }
            
            return { waSent, smsSent };
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    
    setTimeout(() => {
        if (localStorage.getItem('sna_listening') === 'true') {
            const btn = document.getElementById('sna-btn');
            if (btn) btn.click();
        }
    }, 500);
})();
