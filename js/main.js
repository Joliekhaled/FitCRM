// js/main.js

/* ========== Constants & Selectors ========== */
const STORAGE_KEY = 'fitcrm_clients';

const tabForm = document.getElementById('tab-form');
const tabList = document.getElementById('tab-list');
const pageForm = document.getElementById('page-form');
const pageList = document.getElementById('page-list');
const pageView = document.getElementById('page-view');

const clientForm = document.getElementById('client-form');
const addClientBtn = document.getElementById('add-client-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

const clientsTbody = document.getElementById('clients-tbody');
const searchInput = document.getElementById('search-input');

const clientDetails = document.getElementById('client-details');
const trainingHistoryEl = document.getElementById('training-history');
const exercisesNextEl = document.getElementById('exercises-next');
const backToListBtn = document.getElementById('back-to-list');

let currentViewedClientId = null;

/* ========== Utilities ========== */
function loadClients() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error('Failed to parse clients from storage', e);
        return [];
    }
}

function saveClients(clients) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

function generateId() {
    return String(Date.now()) + Math.floor(Math.random() * 1000);
}

/* ========== Navigation ========== */
function showSection(section) {
    pageForm.classList.add('hidden');
    pageList.classList.add('hidden');
    pageView.classList.add('hidden');
    tabForm.classList.remove('active');
    tabList.classList.remove('active');

    if (section === 'form') {
        pageForm.classList.remove('hidden');
        tabForm.classList.add('active');
    } else if (section === 'list') {
        pageList.classList.remove('hidden');
        tabList.classList.add('active');
    } else if (section === 'view') {
        pageView.classList.remove('hidden');
    }
}

tabForm.onclick = () => {
    clearForm();
    showSection('form');
};

tabList.onclick = () => {
    renderClientList();
    showSection('list');
};

/* ========== Render List ========== */
function renderClientList(filter = '') {
    const clients = loadClients();
    const q = filter.trim().toLowerCase();
    clientsTbody.innerHTML = '';

    const filtered = clients.filter(c => {
        if (!q) return true;
        return (c.fullname || '').toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
        clientsTbody.innerHTML = `<tr><td colspan="6">No clients found.</td></tr>`;
        return;
    }

    filtered.forEach(client => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td data-label="Name">${escapeHtml(client.fullname || '')}</td>
            <td data-label="Email">${escapeHtml(client.email || '')}</td>
            <td data-label="Phone">${escapeHtml(client.phone || '')}</td>
            <td data-label="Fitness Goal">${escapeHtml(client.goal === 'Other' ? (client.goal_other || 'Other') : (client.goal || ''))}</td>
            <td data-label="Start Date">${escapeHtml(client.start_date || '')}</td>
            <td data-label="Actions">
                <button class="action-btn view-btn" data-id="${client.id}">View</button>
                <button class="action-btn edit-btn" data-id="${client.id}">Edit</button>
                <button class="action-btn delete-btn" data-id="${client.id}">Delete</button>
            </td>
        `;

        tr.querySelector('.view-btn').addEventListener('click', () => openClientView(client.id));
        tr.querySelector('.edit-btn').addEventListener('click', () => startEditClient(client.id));
        tr.querySelector('.delete-btn').addEventListener('click', () => deleteClient(client.id));

        clientsTbody.appendChild(tr);
    });
}

/* ========== Form Add/Edit/Delete ========== */
function clearForm() {
    clientForm.reset();
    document.getElementById('client_id').value = '';
    cancelEditBtn.classList.add('hidden');
    addClientBtn.textContent = 'Add Client';
}

function populateForm(client) {
    document.getElementById('client_id').value = client.id || '';
    document.getElementById('fullname').value = client.fullname || '';
    document.getElementById('age').value = client.age || '';
    document.getElementById('gender').value = client.gender || '';
    document.getElementById('email').value = client.email || '';
    document.getElementById('phone').value = client.phone || '';
    document.getElementById('goal').value = client.goal || '';
    document.getElementById('goal_other').value = client.goal_other || '';
    document.getElementById('start_date').value = client.start_date || '';
}

function startEditClient(id) {
    const clients = loadClients();
    const client = clients.find(c => c.id === id);
    if (!client) { alert('Client not found.'); return; }
    populateForm(client);
    addClientBtn.textContent = 'Save Changes';
    cancelEditBtn.classList.remove('hidden');
    showSection('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

cancelEditBtn.addEventListener('click', (e) => {
    e.preventDefault();
    clearForm();
});

clientForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const id = document.getElementById('client_id').value;
    const clientData = {
        id: id || generateId(),
        fullname: document.getElementById('fullname').value.trim(),
        age: parseInt(document.getElementById('age').value, 10),
        gender: document.getElementById('gender').value,
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        goal: document.getElementById('goal').value,
        goal_other: document.getElementById('goal_other').value.trim(),
        start_date: document.getElementById('start_date').value,
        training_history: []
    };

    const clients = loadClients();
    const existingIndex = clients.findIndex(c => c.id === clientData.id);

    if (existingIndex >= 0) {
        clientData.training_history = clients[existingIndex].training_history || [];
        clients[existingIndex] = { ...clients[existingIndex], ...clientData };
        saveClients(clients);
        alert('Client updated successfully.');
    } else {
        clients.push(clientData);
        saveClients(clients);
        alert('Client added successfully.');
    }

    clearForm();
    renderClientList();
    showSection('list');
});

function deleteClient(id) {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) return;
    const clients = loadClients();
    const newClients = clients.filter(c => c.id !== id);
    saveClients(newClients);
    renderClientList();
    alert('Client deleted.');
}

/* ========== Client View & Exercises ========== */

function openClientView(id) {
    const clients = loadClients();
    const client = clients.find(c => c.id === id);
    if (!client) { alert('Client not found.'); return; }

    currentViewedClientId = client.id;

    clientDetails.innerHTML = `
        <h2>${escapeHtml(client.fullname)}</h2>
        <p><strong>Email:</strong> ${escapeHtml(client.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(client.phone)}</p>
        <p><strong>Fitness Goal:</strong> ${escapeHtml(client.goal === 'Other' ? (client.goal_other || 'Other') : client.goal)}</p>
        <p><strong>Membership Start Date:</strong> ${escapeHtml(client.start_date)}</p>
        <p><strong>Age:</strong> ${escapeHtml(String(client.age || ''))}</p>
        <p><strong>Gender:</strong> ${escapeHtml(client.gender || '')}</p>
    `;

    renderTrainingHistory(client);

    // Exercises for next session
    exercisesNextEl.innerHTML = '<p>Loading suggested exercises…</p>';
    fetchSuggestedExercises(5)
        .then(list => {
            exercisesNextEl.innerHTML = '';
            if (!list || list.length === 0) {
                exercisesNextEl.innerHTML = '<p>No exercises available right now.</p>';
                return;
            }

            const wrap = document.createElement('div');
            wrap.style.display = 'flex';
            wrap.style.flexDirection = 'column';
            wrap.style.gap = '8px';

            list.forEach(ex => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'primary-btn';
                btn.style.background = '#fff';
                btn.style.color = '#2b4162';
                btn.style.border = '1px solid #bdbdbd';
                btn.style.textAlign = 'left';
                btn.style.padding = '8px';
                btn.style.borderRadius = '6px';
                btn.innerHTML = `<strong>${escapeHtml(ex.name)}</strong>${ex.description ? ' — ' + escapeHtml(stripHtml(ex.description).slice(0,120)) + (stripHtml(ex.description).length > 120 ? '...' : '') : ''}`;

                // When clicked, add to client training history
                btn.addEventListener('click', () => {
                    addExerciseToClientHistory(currentViewedClientId, ex);
                });

                wrap.appendChild(btn);
            });

            exercisesNextEl.appendChild(wrap);
        })
        .catch(err => {
            exercisesNextEl.innerHTML = `<p>Couldn't fetch exercises from Wger. Showing local suggestions.</p>`;
            const fallback = getLocalFallbackExercises(5);
            const wrap = document.createElement('div');
            wrap.style.display = 'flex';
            wrap.style.flexDirection = 'column';
            wrap.style.gap = '8px';
            fallback.forEach(ex => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'primary-btn';
                btn.style.background = '#fff';
                btn.style.color = '#2b4162';
                btn.style.border = '1px solid #bdbdbd';
                btn.style.textAlign = 'left';
                btn.style.padding = '8px';
                btn.style.borderRadius = '6px';
                btn.innerHTML = `<strong>${escapeHtml(ex.name)}</strong>${ex.description ? ' — ' + escapeHtml(stripHtml(ex.description).slice(0,120)) : ''}`;
                btn.addEventListener('click', () => addExerciseToClientHistory(currentViewedClientId, ex));
                wrap.appendChild(btn);
            });
            exercisesNextEl.appendChild(wrap);
        });

    showSection('view');
}

// Fetch real exercises from Wger API
async function fetchSuggestedExercises(count = 5) {
    try {
        const resp = await fetch('https://wger.de/api/v2/exercise/?language=2&status=2&limit=500');
        if (!resp.ok) throw new Error('Failed to fetch');
        const data = await resp.json();
        const results = Array.isArray(data.results) ? data.results : [];

        // Map to name & description
        const pool = results.map(ex => ({
            name: ex.name || 'Exercise',
            description: ex.description || ex.long_description || ''
        })).filter(ex => ex.name && ex.name.trim() !== '');

        // Pick 5 random exercises
        const picks = [];
        const copy = [...pool];
        while (picks.length < Math.min(count, copy.length)) {
            const idx = Math.floor(Math.random() * copy.length);
            picks.push(copy.splice(idx,1)[0]);
        }

        // If not enough, fill with local fallback
        while (picks.length < count) picks.push(getLocalFallbackExercises(count)[picks.length % count]);

        return picks;
    } catch (err) {
        console.warn('Wger fetch failed', err);
        return getLocalFallbackExercises(count);
    }
}


function renderTrainingHistory(client) {
    trainingHistoryEl.innerHTML = '';
    if (!client.training_history || client.training_history.length === 0) {
        trainingHistoryEl.innerHTML = '<li>No training history.</li>';
        return;
    }
    client.training_history.forEach(item => {
        const li = document.createElement('li');
        if (typeof item === 'string') li.textContent = item;
        else if (item && item.name) li.textContent = `${item.date || ''} — ${item.name}`.trim();
        else li.textContent = JSON.stringify(item);
        trainingHistoryEl.appendChild(li);
    });
}

function addExerciseToClientHistory(clientId, ex) {
    const clients = loadClients();
    const idx = clients.findIndex(c => c.id === clientId);
    if (idx < 0) { alert('Client not found for adding exercise.'); return; }

    const timestamp = new Date().toISOString().slice(0,10);
    const entryText = `${timestamp}: ${ex.name || 'Unnamed exercise'}`;  // use real name

    clients[idx].training_history = clients[idx].training_history || [];
    clients[idx].training_history.unshift(entryText);
    saveClients(clients);

    if (currentViewedClientId === clientId) {
        renderTrainingHistory(clients[idx]);
    }
    alert(`Added "${ex.name || 'Unnamed exercise'}" to ${clients[idx].fullname}'s training history.`);
}


/* ========== Search ========== */
searchInput.addEventListener('input', (e) => renderClientList(e.target.value));
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const q = e.target.value.trim().toLowerCase();
        if (!q) return;
        const clients = loadClients();
        const found = clients.find(c => (c.fullname || '').toLowerCase() === q);
        if (found) openClientView(found.id);
        else { alert('No exact match found. Showing filtered results.'); renderClientList(q); }
    }
});

/* ========== Wger API with local fallback ========== */

async function fetchSuggestedExercises(count = 5) {
    try {
        const resp = await fetch('https://wger.de/api/v2/exercise/?language=2&status=2&limit=500');
        if (!resp.ok) throw new Error('Network response not ok');
        const data = await resp.json();
        const results = Array.isArray(data.results) ? data.results : [];

        // Filter only exercises with a non-empty name
        const validExercises = results.filter(ex => ex.name && ex.name.trim() !== '');

        if (validExercises.length === 0) return getLocalFallbackExercises(count);

        // Map to {name, description}
        const pool = validExercises.map(item => ({
            name: item.name.trim(),
            description: item.description ? stripHtml(item.description).trim() : ''
        }));

        // Pick random 'count' exercises
        const picks = [];
        const copy = [...pool];
        while (picks.length < Math.min(count, copy.length)) {
            const idx = Math.floor(Math.random() * copy.length);
            picks.push(copy.splice(idx, 1)[0]);
        }

        // fallback if not enough
        while (picks.length < count) {
            const fallback = getLocalFallbackExercises(1)[0];
            picks.push(fallback);
        }

        return picks;
    } catch (err) {
        console.warn('Wger fetch failed, using local fallback', err);
        return getLocalFallbackExercises(count);
    }
}



function getLocalFallbackExercises(count = 5) {
    const local = [
        { name: 'Bodyweight Squat', description: 'Basic squat to train legs and glutes.' },
        { name: 'Push-up', description: 'Upper-body pressing exercise for chest & triceps.' },
        { name: 'Plank', description: 'Core stability hold.' },
        { name: 'Lunge (forward)', description: 'Single-leg exercise for quadriceps & balance.' },
        { name: 'Bent-over Row (dumbbell)', description: 'Back pulling exercise for lat and rhomboids.' },
        { name: 'Glute Bridge', description: 'Posterior chain activation.' },
        { name: 'Jumping Jacks', description: 'Cardio warm-up.' },
        { name: 'Mountain Climbers', description: 'Cardio + core move.' },
        { name: 'Dumbbell Shoulder Press', description: 'Shoulder strengthening.' },
        { name: 'Dead Bug', description: 'Core coordination exercise.' }
    ];
    return local.slice(0, count);
}

/* ========== Validation ========== */
function validateForm() {
    if (!clientForm.checkValidity()) { 
        clientForm.reportValidity(); 
        return false; 
    }

    const name = document.getElementById('fullname').value.trim();
    if (!/^[A-Za-z\s]+$/.test(name)) { 
        alert('Please enter a valid name (letters only).'); 
        return false; 
    }

    const email = document.getElementById('email').value.trim();
    if (!validateEmail(email)) { 
        alert('Please enter a valid email address.'); 
        return false; 
    }

    const phone = document.getElementById('phone').value.trim();
    if (!/^\d{11}$/.test(phone)) { 
        alert('Please enter a valid phone number (11 digits).'); 
        return false; 
    }

    const goal = document.getElementById('goal').value;
    if (goal === 'Other') {
        const other = document.getElementById('goal_other').value.trim();
        if (!other) { 
            alert('Please provide the "Other" fitness goal text.'); 
            return false; 
        }
    }

    return true;
}

function validateEmail(email) { const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; return re.test(email); }

/* ========== Helpers ========== */
function escapeHtml(text) {
    if (!text && text !== 0) return '';
    return String(text)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
function stripHtml(html) { if (!html) return ''; return html.replace(/<\/?[^>]+(>|$)/g, ''); }

/* ========== Seed to 10 (preserve existing clients) ========== */
function seedToTen() {
    const existing = loadClients();
    if (existing.length > 0) return; // STOP if data already exists

    const pool = [
        { fullname: 'Wassim Sabry', email: 'weza.sabr@gmail.com', phone: '01212973618', goal: 'Weight Loss', start_date:'2025-01-01', age:30, gender:'Male' },
        { fullname: 'Sarah Ali', email: 'sarah.ali@gmail.com', phone: '01237983620', goal: 'Muscle Gain', start_date:'2025-02-05', age:27, gender:'Female' },
        { fullname: 'Michael Girgis', email: 'mike.gi@gmail.com', phone: '01112900018', goal: 'General Fitness', start_date:'2025-02-15', age:35, gender:'Male' },
        { fullname: 'Amina Hassan', email: 'amina.hassan@gmail.com', phone: '01014993119', goal: 'Flexibility', start_date:'2025-03-01', age:29, gender:'Female' },
        { fullname: 'David Jameel', email: 'david.j@gmail.com', phone: '01200473817', goal: 'Strength Training', start_date:'2025-03-12', age:32, gender:'Male' },
        { fullname: 'Layla Omar', email: 'layla.omar@gmail.com', phone: '01222843618', goal: 'Endurance', start_date:'2025-03-20', age:26, gender:'Female' },
        { fullname: 'Chris Evans', email: 'chris.evans@gmail.com', phone: '01221133618', goal: 'Cardio', start_date:'2025-04-02', age:34, gender:'Male' },
        { fullname: 'Mona Farid', email: 'mona.farid@gmail.com', phone: '01213879198', goal: 'Weight Loss', start_date:'2025-04-10', age:28, gender:'Female' },
        { fullname: 'Ahmed Salah', email: 'ahmed.salah@gmail.com', phone: '01102572019', goal: 'Muscle Gain', start_date:'2025-04-18', age:31, gender:'Male' },
        { fullname: 'Mostafa Ahmed', email: 'Mostafa.ahmed@gmail.com', phone: '01019975698', goal: 'General Fitness', start_date:'2025-05-01', age:29, gender:'Male' }
    ];

    const clientsToSeed = pool.map(c => ({
        id: generateId(),
        ...c,
        goal_other: '',
        training_history: []
    }));

    saveClients(clientsToSeed); // save ONLY ONCE
}
seedToTen();

// Back to List button (from client view)
backToListBtn.addEventListener('click', () => {
    renderClientList();
    showSection('list');
});

/* ========== Init ========== */
(function init() {
    const clients = loadClients();
    if (clients.length === 0) {
        seedToTen();  // only seed if storage is empty
    }
    renderClientList();
    showSection('form');
})();

