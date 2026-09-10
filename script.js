pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const $ = id => document.getElementById(id);

// --- TEMA Y NAVEGACIÓN ---
const themeToggle = $('theme-toggle'), rootElement = document.documentElement;
if (localStorage.getItem('theme')) { 
    rootElement.setAttribute('data-theme', localStorage.getItem('theme')); 
    if (localStorage.getItem('theme') === 'dark') {
        themeToggle.querySelector('.icon').innerText = '☀️';
        themeToggle.querySelector('.text').innerText = 'Modo Claro';
    }
}
themeToggle.addEventListener('click', () => { 
    const isDark = rootElement.getAttribute('data-theme') === 'dark'; 
    rootElement.setAttribute('data-theme', isDark ? 'light' : 'dark'); 
    localStorage.setItem('theme', isDark ? 'light' : 'dark'); 
    themeToggle.querySelector('.icon').innerText = isDark ? '🌙' : '☀️';
    themeToggle.querySelector('.text').innerText = isDark ? 'Modo Oscuro' : 'Modo Claro';
});

// --- MENÚ MÓVIL (HAMBURGUESA) ---
const mobileMenuBtn = $('mobile-menu-btn');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = $('sidebar-overlay');

if(mobileMenuBtn && sidebarOverlay) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('open');
    });
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('open');
    });
}

function resetWorkspaces() {
    if($('test-workspace')) $('test-workspace').style.display = 'none';
    if($('test-setup')) $('test-setup').style.display = 'block';
    if($('fc-workspace')) $('fc-workspace').style.display = 'none';
    if($('fc-editor')) $('fc-editor').style.display = 'none';
    if($('fc-setup')) $('fc-setup').style.display = 'block';
    if($('congrats-modal')) $('congrats-modal').style.display = 'none';
    if($('cases-workspace')) $('cases-workspace').style.display = 'none';
    if($('cases-setup')) $('cases-setup').style.display = 'block';
    
    const tutorChat = $('tutor-chat-container');
    if(tutorChat && tutorChat.classList.contains('tutor-fullscreen')) {
        $('btn-tutor-fullscreen').click();
    }
}

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault(); 
        const targetId = btn.dataset.target;
        if (!targetId) return;
        
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active-section'));
        
        btn.classList.add('active');
        const targetSection = $(targetId);
        if(targetSection) targetSection.classList.add('active-section');
        
        const spanText = btn.querySelector('span');
        $('page-title').innerText = spanText ? spanText.innerText : 'Configuración';
        
        const scrollContainer = document.querySelector('.scroll-container');
        if(scrollContainer) scrollContainer.scrollTop = 0;
        
        // Cerrar menú móvil si se pulsó una opción
        if (window.innerWidth <= 900) {
            sidebar.classList.remove('open');
            if(sidebarOverlay) sidebarOverlay.classList.remove('open');
        }

        resetWorkspaces(); 
        if(targetId === 'flashcards') checkDueCards();
        if(['tests', 'flashcards', 'cases', 'tutor'].includes(targetId)) renderAllDocSelectors();
    });
});

// --- POMODORO TIMER REDISEÑADO ---
let pomoTime = 25 * 60;
let pomoInterval = null;
let pomoIsRunning = false;
let pomoMode = 'work'; 

function updatePomoDisplay() {
    let m = Math.floor(pomoTime / 60).toString().padStart(2, '0');
    let s = (pomoTime % 60).toString().padStart(2, '0');
    $('pomodoro-time').innerText = `${m}:${s}`;
}

function switchPomoPhase() {
    if (pomoMode === 'work') {
        pomoMode = 'break';
        pomoTime = 5 * 60;
        $('pomodoro-time').style.color = 'var(--success-color)';
        $('pomo-mode-icon').className = 'fa-solid fa-mug-hot pomo-icon';
        alert("¡Fase de estudio terminada! Tómate 5 minutos de descanso.");
    } else {
        pomoMode = 'work';
        pomoTime = 25 * 60;
        $('pomodoro-time').style.color = 'var(--text-main)';
        $('pomo-mode-icon').className = 'fa-solid fa-clock pomo-icon';
        alert("¡Descanso terminado! Volvemos al estudio (25 min).");
    }
    updatePomoDisplay();
}

$('btn-pomo-play').addEventListener('click', () => {
    if(pomoIsRunning) {
        clearInterval(pomoInterval);
        $('btn-pomo-play').innerHTML = '<i class="fa-solid fa-play" style="font-size:0.85rem;"></i>';
        pomoIsRunning = false;
    } else {
        pomoIsRunning = true;
        $('btn-pomo-play').innerHTML = '<i class="fa-solid fa-pause" style="font-size:0.85rem;"></i>';
        pomoInterval = setInterval(() => {
            if(pomoTime > 0) {
                pomoTime--;
                updatePomoDisplay();
            } else {
                clearInterval(pomoInterval);
                pomoIsRunning = false;
                $('btn-pomo-play').innerHTML = '<i class="fa-solid fa-play" style="font-size:0.85rem;"></i>';
                switchPomoPhase(); 
            }
        }, 1000);
    }
});

$('btn-pomo-skip').addEventListener('click', () => {
    clearInterval(pomoInterval);
    pomoIsRunning = false;
    $('btn-pomo-play').innerHTML = '<i class="fa-solid fa-play" style="font-size:0.85rem;"></i>';
    switchPomoPhase(); 
});

$('btn-pomo-reset').addEventListener('click', () => {
    clearInterval(pomoInterval);
    pomoIsRunning = false;
    pomoTime = pomoMode === 'work' ? 25 * 60 : 5 * 60;
    updatePomoDisplay();
    $('btn-pomo-play').innerHTML = '<i class="fa-solid fa-play" style="font-size:0.85rem;"></i>';
});


// --- DB Y ARCHIVOS ---
let db;
const dbReq = indexedDB.open('MetodologiaDB_v3', 3);
dbReq.onupgradeneeded = e => { 
    db = e.target.result; 
    if (!db.objectStoreNames.contains('docs')) db.createObjectStore('docs', { keyPath: 'id', autoIncrement: true }); 
    if (!db.objectStoreNames.contains('cards')) db.createObjectStore('cards', { keyPath: 'id', autoIncrement: true }); 
};
dbReq.onsuccess = e => { db = e.target.result; renderDocs(); checkDueCards(); renderAllDocSelectors(); };

async function getDocs() { return new Promise(res => { if(!db) return res([]); const req = db.transaction(['docs'],'readonly').objectStore('docs').getAll(); req.onsuccess = () => res(req.result); }); }
async function getCards() { return new Promise(res => { if(!db) return res([]); const req = db.transaction(['cards'],'readonly').objectStore('cards').getAll(); req.onsuccess = () => res(req.result); }); }
async function saveCard(card) { return new Promise(res => { const req = db.transaction(['cards'],'readwrite').objectStore('cards').put(card); req.onsuccess = () => res(); }); }

$('pdf-upload').addEventListener('change', async (e) => {
    const files = e.target.files; 
    if(!files || files.length === 0) return;
    
    $('upload-status').innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Procesando ${files.length} documento(s)...`;
    $('upload-status').style.color = 'var(--text-main)';
    
    setTimeout(async () => {
        try {
            let guardados = 0;
            for(let f = 0; f < files.length; f++) {
                const file = files[f];
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                
                const pagePromises = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    pagePromises.push(
                        pdf.getPage(i).then(page => page.getTextContent()).then(content => content.items.map(it => it.str).join(' '))
                    );
                }
                const pagesText = await Promise.all(pagePromises);
                const text = pagesText.join('\n');
                
                await new Promise(resolve => {
                    const req = db.transaction(['docs'], 'readwrite').objectStore('docs')
                        .add({ name: file.name, content: text.replace(/wuolah/gi, '').trim(), pages: pdf.numPages });
                    req.onsuccess = () => { guardados++; resolve(); };
                });
            }
            $('upload-status').innerHTML = `<i class="fa-solid fa-check"></i> ¡${guardados} documento(s) guardado(s)!`; 
            $('upload-status').style.color = 'var(--success-color)';
            setTimeout(() => { $('upload-status').innerHTML = ''; }, 3000); 
            renderDocs(); renderAllDocSelectors(); 
            
        } catch(err) { 
            console.error(err);
            $('upload-status').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Error al procesar PDF.'; 
            $('upload-status').style.color = 'var(--danger-color)'; 
        }
        e.target.value = '';
    }, 100);
});

async function renderDocs() { 
    const docs = await getDocs(); 
    $('doc-list').innerHTML = docs.map(d => `
        <li class="doc-item glass-effect">
            <div style="display: flex; align-items: center; width: 80%;">
                <i class="fa-solid fa-file-pdf" style="color:var(--text-muted); margin-right:12px; font-size:1.2rem;"></i> 
                <span class="doc-name-display" style="font-weight:500; cursor:pointer;" ondblclick="enableRename(${d.id}, this)">${d.name}</span>
                <input type="text" class="doc-rename-input" style="display:none;" value="${d.name}" onblur="saveRename(${d.id}, this)" onkeypress="if(event.key === 'Enter') this.blur()">
                <span class="text-muted text-sm" style="margin-left:10px;">(${d.pages} pags)</span>
            </div>
            <button class="action-btn icon-btn" style="background:transparent; color:var(--text-muted);" onclick="deleteDoc(${d.id})"><i class="fa-solid fa-trash"></i></button>
        </li>`).join(''); 
}

window.enableRename = function(id, spanElement) {
    const inputElement = spanElement.nextElementSibling;
    spanElement.style.display = 'none'; inputElement.style.display = 'inline-block';
    let name = inputElement.value;
    if(name.toLowerCase().endsWith('.pdf')) { inputElement.dataset.ext = '.pdf'; inputElement.value = name.substring(0, name.length - 4); }
    inputElement.focus(); inputElement.select();
}
window.saveRename = async function(id, inputElement) {
    const spanElement = inputElement.previousElementSibling;
    let newName = inputElement.value.trim();
    if(newName === '') { inputElement.style.display = 'none'; spanElement.style.display = 'inline-block'; return; }
    if(inputElement.dataset.ext && !newName.toLowerCase().endsWith('.pdf')) newName += '.pdf';
    const tx = db.transaction(['docs'], 'readwrite');
    const store = tx.objectStore('docs');
    store.get(id).onsuccess = function(e) {
        const doc = e.target.result; doc.name = newName;
        store.put(doc).onsuccess = () => { renderDocs(); renderAllDocSelectors(); };
    };
}
window.deleteDoc = id => { db.transaction(['docs'], 'readwrite').objectStore('docs').delete(id).onsuccess = () => { renderDocs(); renderAllDocSelectors(); }; }

async function renderAllDocSelectors() {
    const docs = await getDocs();
    const htmlSelects = docs.length ? docs.map(d => `<div class="doc-selector-item"><input type="checkbox" value="${d.id}" checked class="doc-chk"><label>${d.name}</label></div>`).join('') : '<div style="color:var(--text-muted); font-size:0.9rem;">Sube apuntes primero.</div>';
    ['tests-doc-selector', 'flashcards-doc-selector', 'cases-doc-selector', 'tutor-doc-selector'].forEach(id => { if($(id)) $(id).innerHTML = htmlSelects; });
    const optionsHtml = '<option value="all">📚 Todos los apuntes (Mazo Global)</option>' + docs.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    if($('fc-study-filter')) $('fc-study-filter').innerHTML = optionsHtml;
    const editorOptionsHtml = '<option value="general">General (Sin asociar)</option>' + docs.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    if($('new-fc-doc-id')) $('new-fc-doc-id').innerHTML = editorOptionsHtml;
}


// --- 🧠 CONEXIÓN API GEMINI 🧠 ---
function setBtnLoading(btn, text) {
    if(btn.disabled) return false; 
    btn.disabled = true;
    btn.dataset.origText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${text}`;
    btn.style.opacity = '0.7';
    btn.style.pointerEvents = 'none';
    return true;
}
function resetBtnLoading(btn) {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.origText;
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'auto';
}

async function askGemini(prompt) {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) { alert('Añade tu Clave API en la sección de Ajustes primero.'); return null; }
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2 } })
        });
        const data = await response.json();
        if(data.error) { alert('Error API: ' + data.error.message); return null; }
        return data.candidates[0].content.parts[0].text;
    } catch (error) { console.error(error); alert('Error al conectar con la IA.'); return null; }
}

async function getContextText(selectorId) {
    const checkedBoxes = document.querySelectorAll(`#${selectorId} .doc-chk:checked`);
    if (checkedBoxes.length === 0) return "";
    const docs = await getDocs(); let context = "";
    checkedBoxes.forEach(cb => {
        const doc = docs.find(d => d.id === parseInt(cb.value));
        if (doc) context += `\n--- DOCUMENTO: ${doc.name} ---\n${doc.content}\n`;
    });
    return context.substring(0, 500000); 
}

function cleanJSON(str) {
    try {
        let clean = str.replace(/```json/gi, '').replace(/```/g, '').trim();
        const start = clean.indexOf('['); const end = clean.lastIndexOf(']');
        if (start !== -1 && end !== -1) clean = clean.substring(start, end + 1);
        return JSON.parse(clean);
    } catch (e) { throw new Error("El formato devuelto por la IA no fue válido."); }
}

// --- GENERADOR DE TESTS ---
let currentTest = []; let currentTestIndex = 0; let correctAnswers = 0; let wrongAnswers = 0;

$('btn-start-test').addEventListener('click', async () => { 
    const context = await getContextText('tests-doc-selector');
    if(!context) return alert('Selecciona al menos un documento.');
    const numQ = parseInt($('test-num-questions').value) || 5;
    const btn = $('btn-start-test');
    if(!setBtnLoading(btn, 'Creando test...')) return;
    
    const diff = $('test-difficulty').value;
    const prompt = `Actúa como profesor universitario de Ciencias del Deporte. Basado estrictamente en este temario:\n${context}\n\nCrea un examen tipo test de ${numQ} preguntas. Nivel de dificultad: ${diff}. Devuelve ÚNICAMENTE un array JSON válido, sin formato markdown. Formato EXACTO requerido: [{"q": "Pregunta", "options": ["A) opc", "B) opc", "C) opc", "D) opc"], "ans": 0, "exp": "Explicación breve de por qué es la correcta"}]`;
    
    const res = await askGemini(prompt);
    resetBtnLoading(btn);
    
    if(res) {
        try {
            currentTest = cleanJSON(res);
            currentTestIndex = 0; correctAnswers = 0; wrongAnswers = 0;
            $('test-setup').style.display = 'none'; $('test-workspace').style.display = 'block';
            $('test-results').style.display = 'none'; $('test-card-content').style.display = 'block';
            $('test-total-q').innerText = currentTest.length;
            renderTestQuestion();
        } catch(e) { alert('Error al leer el examen. La IA ha enviado un formato erróneo. Inténtalo de nuevo.'); }
    }
});

function renderTestQuestion() {
    const qData = currentTest[currentTestIndex];
    $('test-current-q').innerText = currentTestIndex + 1;
    $('test-question-text').innerText = qData.q;
    
    const container = $('test-options-container'); container.innerHTML = '';
    $('test-feedback').style.display = 'none'; $('btn-next-test-q').style.display = 'none';
    
    const letters = ['A', 'B', 'C', 'D'];
    qData.options.forEach((optText, i) => {
        let cleanText = optText.replace(/^[A-D]\)\s*/i, '');
        const btn = document.createElement('button'); btn.className = 'test-option-btn inner-glass';
        btn.innerHTML = `<span class="opt-letter">${letters[i]}</span> <span class="opt-text">${cleanText}</span>`;
        btn.onclick = () => handleTestAnswer(i, btn); container.appendChild(btn);
    });
}

function handleTestAnswer(selectedIndex, btnElement) {
    const btns = document.querySelectorAll('.test-option-btn');
    btns.forEach(b => { b.style.pointerEvents = 'none'; b.style.opacity = '0.7'; });
    
    const qData = currentTest[currentTestIndex];
    const isCorrect = selectedIndex === qData.ans;
    
    if(isCorrect) {
        btnElement.style.borderColor = 'var(--success-color)'; btnElement.style.background = 'rgba(48, 209, 88, 0.1)';
        correctAnswers++;
    } else {
        btnElement.style.borderColor = 'var(--danger-color)'; btnElement.style.background = 'rgba(255, 69, 58, 0.1)';
        btns[qData.ans].style.borderColor = 'var(--success-color)'; wrongAnswers++;
    }
    
    $('test-feedback').style.display = 'block';
    $('test-feedback').innerHTML = `<strong>${isCorrect ? '¡Correcto!' : 'Incorrecto.'}</strong> ${qData.exp}`;
    $('btn-next-test-q').style.display = 'block';
}

$('btn-next-test-q').addEventListener('click', () => {
    currentTestIndex++;
    if(currentTestIndex < currentTest.length) { renderTestQuestion(); } 
    else {
        $('test-card-content').style.display = 'none'; $('test-results').style.display = 'block';
        const usePenalty = $('test-penalty-mode').checked;
        let finalScoreText = ""; let detailText = ""; const totalQ = currentTest.length;
        
        if(usePenalty) {
            let rawScore = correctAnswers - (wrongAnswers * 0.25);
            if (rawScore < 0) rawScore = 0;
            let noteOver10 = (rawScore / totalQ) * 10;
            finalScoreText = `${noteOver10.toFixed(2)}<span style="font-size:2rem; color:var(--text-muted);">/10</span>`;
            detailText = `Aciertos: ${correctAnswers} | Fallos: ${wrongAnswers} (-${(wrongAnswers*0.25).toFixed(2)} pts)`;
        } else {
            let noteOver10 = (correctAnswers / totalQ) * 10;
            finalScoreText = `${correctAnswers}<span style="font-size:2rem; color:var(--text-muted);">/${totalQ}</span>`;
            detailText = `Nota Equivalente: ${noteOver10.toFixed(2)} / 10`;
        }
        $('test-score-text').innerHTML = finalScoreText; $('test-score-detail').innerText = detailText;
    }
});
$('btn-exit-test').addEventListener('click', () => { $('test-workspace').style.display = 'none'; $('test-setup').style.display = 'block'; });

// --- FLASHCARDS IA ---
$('btn-generate-fc').addEventListener('click', async () => {
    const context = await getContextText('flashcards-doc-selector');
    if(!context) return alert('Selecciona al menos un documento.');
    const btn = $('btn-generate-fc'); if(!setBtnLoading(btn, 'Creando tarjetas...')) return;
    const prompt = `Basado en estos apuntes:\n${context}\n\nExtrae 5 conceptos clave, definiciones o fórmulas importantes y crea tarjetas de memoria (flashcards). Devuelve ÚNICAMENTE un array JSON válido. Formato EXACTO: [{"q": "Concepto o pregunta muy corta", "a": "Definición directa y concisa"}]`;
    const res = await askGemini(prompt); resetBtnLoading(btn);
    if(res) {
        try {
            const cards = cleanJSON(res);
            const checkedCb = document.querySelector('#flashcards-doc-selector .doc-chk:checked');
            const docId = checkedCb ? checkedCb.value : 'general';
            for(let c of cards) await saveCard({ q: c.q, a: c.a, docId, level: 0, nextReview: Date.now() });
            alert(`¡Se han añadido ${cards.length} tarjetas nuevas al mazo!`); checkDueCards();
        } catch(e) { alert('Error al leer las tarjetas de la IA.'); }
    }
});

// --- CASOS IA ---
$('btn-start-case').addEventListener('click', async () => {
    const context = await getContextText('cases-doc-selector');
    if(!context) return alert('Selecciona temario base.');
    const btn = $('btn-start-case'); if(!setBtnLoading(btn, 'Diseñando caso...')) return;
    const prompt = `Actúa como profesor evaluador de Ciencias del Deporte. Usando esta teoría:\n${context}\n\nInventa un caso práctico desafiante para el alumno. Describe el sujeto ficticio, su objetivo y su contexto deportivo. Luego, plantea 3 cuestiones o problemas que el alumno deba resolver aplicando la teoría del PDF. Utiliza formato Markdown limpio (usando ## para títulos y viñetas). NO resuelvas el caso, solo plantéalo.`;
    const res = await askGemini(prompt); resetBtnLoading(btn);
    if(res) { $('cases-setup').style.display = 'none'; $('cases-workspace').style.display = 'block'; $('cases-content').innerHTML = marked.parse(res); }
});
$('btn-exit-cases').addEventListener('click', () => { $('cases-workspace').style.display = 'none'; $('cases-setup').style.display = 'block'; });

// --- TUTOR IA (ESTILO GEMINI) ---
$('btn-send-tutor').addEventListener('click', async () => {
    const input = $('tutor-input'); const msg = input.value.trim(); if(!msg) return;
    const context = await getContextText('tutor-doc-selector');
    if(!context) return alert('Selecciona apuntes para que el tutor los lea.');
    
    const btn = $('btn-send-tutor'); if(btn.disabled) return; btn.disabled = true;
    
    const chatHist = $('chat-history');
    chatHist.innerHTML += `<div class="msg-user">${msg}</div>`;
    input.value = ''; chatHist.scrollTop = chatHist.scrollHeight;
    
    const typingId = 'typing-' + Date.now();
    chatHist.innerHTML += `
        <div id="${typingId}" class="msg-ai">
            <div class="ai-avatar"><i class="fa-solid fa-sparkles"></i></div>
            <div class="ai-content"><p>Escribiendo... <i class="fa-solid fa-spinner fa-spin"></i></p></div>
        </div>`;
    chatHist.scrollTop = chatHist.scrollHeight;
    
    const prompt = `Eres un tutor particular experto en Metodología del Entrenamiento. Tu alumno te hace una pregunta. Responde de forma didáctica, clara y cercana, basándote EXCLUSIVAMENTE en estos apuntes:\n${context}\n\nPregunta del alumno: "${msg}"\n\nResponde usando Markdown. Usa listas y negritas para facilitar la lectura. Si la respuesta no está en los apuntes, dile que no lo sabe con seguridad basado en ese material.`;
    
    const res = await askGemini(prompt); btn.disabled = false;
    const typingEl = $(typingId).querySelector('.ai-content');
    if(res) { typingEl.innerHTML = marked.parse(res); } else { typingEl.innerHTML = "<p><em>Error de conexión.</em></p>"; }
    chatHist.scrollTop = chatHist.scrollHeight;
});
$('tutor-input').addEventListener('keypress', (e) => { if(e.key === 'Enter') $('btn-send-tutor').click(); });

$('btn-tutor-fullscreen').addEventListener('click', () => {
    const container = $('tutor-chat-container');
    const icon = $('btn-tutor-fullscreen').querySelector('i');
    const tutorSectionGrid = $('tutor').querySelector('.tutor-grid');
    
    container.classList.toggle('tutor-fullscreen');
    
    if(container.classList.contains('tutor-fullscreen')) {
        icon.classList.remove('fa-expand'); 
        icon.classList.add('fa-compress');
        document.body.appendChild(container);
    } else {
        icon.classList.remove('fa-compress'); 
        icon.classList.add('fa-expand');
        tutorSectionGrid.appendChild(container);
    }
    
    setTimeout(() => {
        const chatHist = $('chat-history');
        chatHist.scrollTop = chatHist.scrollHeight;
    }, 50);
});

// --- LÓGICA FLASHCARDS CORE ---
let currentSessionCards = []; let currentIndex = 0; let studyMode = 'due'; 

async function checkDueCards() {
    const cards = await getCards(); const now = Date.now();
    const selectedFilter = $('fc-study-filter').value;
    const filteredCards = selectedFilter === 'all' ? cards : cards.filter(c => c.docId == selectedFilter);
    const dueCards = filteredCards.filter(c => c.nextReview <= now);
    $('fc-due-count').innerText = dueCards.length;
}
$('fc-study-filter').addEventListener('change', checkDueCards);

$('btn-study-due').addEventListener('click', async () => {
    const cards = await getCards(); const now = Date.now();
    const selectedFilter = $('fc-study-filter').value;
    let filteredCards = selectedFilter === 'all' ? cards : cards.filter(c => c.docId == selectedFilter);
    let dueCards = filteredCards.filter(c => c.nextReview <= now);
    if(dueCards.length === 0) { alert("¡Al día! No tienes tarjetas para repasar en este mazo hoy."); return; }
    const limit = parseInt($('fc-daily-limit').value) || 15;
    let reviews = dueCards.filter(c => c.level > 0); let newCards = dueCards.filter(c => c.level === 0); 
    if(newCards.length > limit) newCards = newCards.slice(0, limit);
    currentSessionCards = [...reviews, ...newCards]; currentSessionCards.sort(() => Math.random() - 0.5); 
    startSession('due');
});

$('btn-study-all').addEventListener('click', async () => {
    const cards = await getCards(); const selectedFilter = $('fc-study-filter').value;
    currentSessionCards = selectedFilter === 'all' ? cards : cards.filter(c => c.docId == selectedFilter);
    if(currentSessionCards.length === 0) { alert("Este mazo está vacío."); return; }
    currentSessionCards.sort(() => Math.random() - 0.5); startSession('all');
});

function startSession(mode) {
    studyMode = mode; currentIndex = 0;
    $('fc-setup').style.display = 'none'; $('fc-workspace').style.display = 'block';
    $('fc-mode-label').innerText = mode === 'due' ? 'Repaso Diario:' : 'Modo Juego:';
    const scrollContainer = document.querySelector('.scroll-container');
    if(scrollContainer) scrollContainer.scrollTop = 0; showCard(0);
}
async function getDocName(id) {
    if(id === 'general' || !id) return 'General';
    const docs = await getDocs(); const doc = docs.find(d => d.id == id); return doc ? doc.name : 'General';
}

async function showCard(index) {
    $('active-flashcard').classList.remove('is-flipped');
    $('fc-controls-front').style.display = 'flex'; $('fc-controls-back').style.display = 'none';
    const card = currentSessionCards[index];
    $('fc-q-text').innerText = card.q; $('fc-a-text').innerText = card.a;
    $('fc-counter').innerText = `${index + 1} / ${currentSessionCards.length}`;
    const docName = await getDocName(card.docId);
    $('fc-doc-label').innerText = docName.length > 25 ? docName.substring(0, 25) + '...' : docName;
    if (studyMode === 'due') {
        if (card.level === 0) { $('fc-good-time').innerText = `10m`; } 
        else if (card.level === 0.5) { $('fc-good-time').innerText = `1d`; } 
        else { const nextInterval = card.level * 2; $('fc-good-time').innerText = `${nextInterval}d`; }
    } else { $('fc-good-time').innerText = ''; }
}

$('active-flashcard').addEventListener('click', () => { flipCardUI(); }); $('btn-flip-fc').addEventListener('click', () => { flipCardUI(); });
function flipCardUI() {
    const card = $('active-flashcard');
    if (!card.classList.contains('is-flipped')) {
        card.classList.add('is-flipped'); $('fc-controls-front').style.display = 'none'; $('fc-controls-back').style.display = 'flex';
    }
}

$('btn-fc-bad').addEventListener('click', async () => {
    let card = currentSessionCards[currentIndex];
    if(studyMode === 'due') { card.level = 0; card.nextReview = Date.now(); await saveCard(card); currentSessionCards.push({...card}); }
    nextCard();
});

$('btn-fc-good').addEventListener('click', async () => {
    let card = currentSessionCards[currentIndex];
    if(studyMode === 'due') {
        if (card.level === 0) { card.level = 0.5; card.nextReview = Date.now(); await saveCard(card); currentSessionCards.push({...card}); } 
        else if (card.level === 0.5) { card.level = 1; card.nextReview = Date.now() + (1 * 24 * 60 * 60 * 1000); await saveCard(card); } 
        else { const nextIntervalDays = card.level * 2; card.level += 1; card.nextReview = Date.now() + (nextIntervalDays * 24 * 60 * 60 * 1000); await saveCard(card); }
    }
    nextCard();
});

function nextCard() {
    currentIndex++;
    if(currentIndex < currentSessionCards.length) { showCard(currentIndex); } 
    else {
        $('fc-workspace').style.display = 'none';
        if (studyMode === 'due') { $('congrats-modal').style.display = 'flex'; } 
        else { alert("Modo juego completado."); $('fc-setup').style.display = 'block'; }
        checkDueCards();
    }
}

$('btn-close-congrats').addEventListener('click', () => { $('congrats-modal').style.display = 'none'; $('fc-setup').style.display = 'block'; });
$('btn-back-setup-fc').addEventListener('click', () => { $('fc-workspace').style.display = 'none'; $('fc-setup').style.display = 'block'; });

$('btn-manual-fc').addEventListener('click', async () => { $('fc-setup').style.display = 'none'; $('fc-editor').style.display = 'block'; await renderEditorDeck(); });
$('btn-exit-editor').addEventListener('click', () => { $('fc-editor').style.display = 'none'; $('fc-setup').style.display = 'block'; checkDueCards();});
$('btn-add-fc').addEventListener('click', async () => {
    const q = $('new-fc-q').value.trim(); const a = $('new-fc-a').value.trim(); const docId = $('new-fc-doc-id').value;
    if(q && a) { await saveCard({ q, a, docId, level: 0, nextReview: Date.now() }); $('new-fc-q').value = ''; $('new-fc-a').value = ''; await renderEditorDeck(); }
});

async function renderEditorDeck() {
    const cards = await getCards(); $('fc-total-count').innerText = cards.length; let html = '';
    for (const c of cards) {
        const docName = await getDocName(c.docId); const levelDisplay = c.level === 0.5 ? '0.5 (Apr.)' : c.level;
        html += `
        <li class="doc-item glass-effect" style="flex-direction:column; align-items:flex-start;">
            <div style="font-weight:600; margin-bottom:8px; font-size:1.05rem;">P: ${c.q}</div>
            <div style="color:var(--text-muted); margin-bottom:12px;">R: ${c.a}</div>
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                <div style="font-size:0.8rem; background:var(--inner-glass-bg); padding:4px 8px; border-radius:6px; color:var(--text-muted);"><i class="fa-solid fa-folder"></i> ${docName} | Nvl: ${levelDisplay}</div>
                <button onclick="deleteCard(${c.id})" class="action-btn icon-btn" style="background:transparent; color:var(--danger-color);"><i class="fa-solid fa-trash"></i></button>
            </div>
        </li>`;
    }
    $('editor-deck-list').innerHTML = html;
}
window.deleteCard = async (id) => { db.transaction(['cards'], 'readwrite').objectStore('cards').delete(id).onsuccess = async () => { await renderEditorDeck(); }; }

if(localStorage.getItem('gemini_api_key')) $('api-key-input').value = localStorage.getItem('gemini_api_key');
$('save-api-key-btn').addEventListener('click', () => { localStorage.setItem('gemini_api_key', $('api-key-input').value); alert('Clave guardada localmente.'); });
