/* STORAGE KEYS & DEFAULTS */
const STORAGE_TRIPS = 'haulsync_trips';
const STORAGE_MESSAGES = 'haulsync_messages';
const STORAGE_AVAILABILITY = 'haulsync_availability';
const STORAGE_APPROVED_USERS = 'haulsync_approved_users';

const defaultApprovedUsers = [
    { id: 1, fullName: 'John Williams', email: 'john@haulsync.com', phone: '+27 82 123 4567', role: 'Dispatcher' },
    { id: 2, fullName: 'Jane Smith', email: 'jane@haulsync.com', phone: '+27 82 123 4568', role: 'Manager' },
    { id: 3, fullName: 'Michael Nkosi', email: 'michael@haulsync.com', phone: '+27 82 123 4569', role: 'Driver' },
    { id: 4, fullName: 'Thabo Dlamini', email: 'thabo@haulsync.com', phone: '+27 82 123 4570', role: 'Driver' },
    { id: 5, fullName: 'Lerato Mbeki', email: 'lerato@haulsync.com', phone: '+27 82 123 4571', role: 'Driver' }
];

/* ─── USER MANAGEMENT ─── */
function loadApprovedUsers() {
    const stored = localStorage.getItem(STORAGE_APPROVED_USERS);
    if (stored) return JSON.parse(stored);
    saveApprovedUsers(defaultApprovedUsers);
    return defaultApprovedUsers;
}

function saveApprovedUsers(users) {
    localStorage.setItem(STORAGE_APPROVED_USERS, JSON.stringify(users));
}

function getApprovedUserByEmail(email) {
    const users = loadApprovedUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

function addApprovedUser(user) {
    const users = loadApprovedUsers();
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    users.push({ id: newId, fullName: user.fullName, email: user.email, phone: user.phone || '', role: user.role });
    saveApprovedUsers(users);
    renderApprovedUsers();
    return true;
}

function removeApprovedUser(id) {
    let users = loadApprovedUsers();
    users = users.filter(u => u.id !== id);
    saveApprovedUsers(users);
    renderApprovedUsers();
}

function renderApprovedUsers() {
    const tbody = document.getElementById('approvedUsersTableBody');
    if (!tbody) return;
    const users = loadApprovedUsers();
    tbody.innerHTML = '';
    users.forEach(u => {
        let badgeClass = 'badge-green';
        if (u.role === 'Manager') badgeClass = 'badge-red';
        else if (u.role === 'Dispatcher') badgeClass = 'badge-yellow';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${u.fullName}</td>
            <td>${u.email}</td>
            <td>${u.phone || '—'}</td>
            <td><span class="${badgeClass}">${u.role}</span></td>
            <td><button class="btn-small remove-user-btn" data-id="${u.id}">Remove</button></td>
        `;
        tbody.appendChild(row);
    });
}

/* ─── TRIPS ─── */
function loadTrips() {
    const stored = localStorage.getItem(STORAGE_TRIPS);
    return stored ? JSON.parse(stored) : [];
}

function saveTrips(trips) {
    localStorage.setItem(STORAGE_TRIPS, JSON.stringify(trips));
}

/* ─── MESSAGES ─── */
function loadMessages() {
    const stored = localStorage.getItem(STORAGE_MESSAGES);
    return stored ? JSON.parse(stored) : [];
}

function saveMessages(messages) {
    localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages));
}

/* ─── AVAILABILITY ─── */
function loadAvailability() {
    const stored = localStorage.getItem(STORAGE_AVAILABILITY);
    if (stored) return JSON.parse(stored);
    const defaultData = [
        { name: 'Michael Nkosi', status: 'Available', location: 'JHB', eta: '—' },
        { name: 'Thabo Dlamini', status: 'On Trip', location: 'PTA → DUR', eta: '14:30' },
        { name: 'Lerato Mbeki', status: 'Off Duty', location: 'DUR', eta: '08:00 tomorrow' },
        { name: 'Sipho Zulu', status: 'Available', location: 'CPT', eta: '—' },
        { name: 'Naledi Ndlovu', status: 'On Break', location: 'BLOEM', eta: '12:00' },
        { name: 'Johan van der Merwe', status: 'Available', location: 'GQ', eta: '—' }
    ];
    saveAvailability(defaultData);
    return defaultData;
}

function saveAvailability(drivers) {
    localStorage.setItem(STORAGE_AVAILABILITY, JSON.stringify(drivers));
}

/* ─── GLOBALS ─── */
let trips = loadTrips();
let messages = loadMessages();

function generateTripId() {
    const num = Math.floor(1000 + Math.random() * 9000);
    return 'T' + num;
}

function getTrip(id) {
    return trips.find(t => t.id === id);
}

function getStatusClass(status) {
    if (status === 'Delayed') return 'badge-red';
    if (status === 'Active' || status === 'In Progress' || status === 'On Time') return 'badge-yellow';
    if (status === 'Completed') return 'badge-green';
    return 'badge-yellow';
}

function getStatusBtnClass(status) {
    if (status === 'Delayed') return 'red-btn';
    if (status === 'Active' || status === 'In Progress') return 'yellow-btn';
    if (status === 'Completed') return 'green-btn';
    return 'green-btn';
}

/* ─── RENDER FUNCTIONS ─── */
function renderTrips() {
    const tbody = document.getElementById('tripsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    trips.forEach(trip => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${trip.id}</td>
            <td>${trip.pickup}</td>
            <td>${trip.delivery}</td>
            <td><span class="${getStatusClass(trip.status)}">${trip.status}</span></td>
            <td>${trip.driver || '—'}</td>
            <td>
                <button class="btn-small view-trip-btn" data-id="${trip.id}">View</button>
                <button class="btn-small edit-trip-btn" data-id="${trip.id}">Edit</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    updateRecentTrips();
    updateStats();
    updateAlert();
    populateAssignTripDropdown();
    saveTrips(trips);
}

function updateRecentTrips() {
    const container = document.getElementById('recentTripsList');
    if (!container) return;
    const recent = trips.slice(0, 4);
    container.innerHTML = '';
    recent.forEach(t => {
        const div = document.createElement('div');
        div.className = 'trip-item';
        div.innerHTML = `
            <span><i class="fa-regular fa-clock"></i> ${t.id} - ${t.pickup} → ${t.delivery}</span>
            <button class="${getStatusBtnClass(t.status)}">${t.status}</button>
        `;
        container.appendChild(div);
    });
}

function updateStats() {
    const active = trips.filter(t => t.status === 'Active' || t.status === 'In Progress' || t.status === 'On Time').length;
    const delayed = trips.filter(t => t.status === 'Delayed').length;
    const elActive = document.getElementById('statActiveTrips');
    const elDelayed = document.getElementById('statDelayed');
    if (elActive) elActive.textContent = active;
    if (elDelayed) elDelayed.textContent = delayed;
}

function updateAlert() {
    const delayedTrips = trips.filter(t => t.status === 'Delayed');
    const msgEl = document.getElementById('alertMessage');
    if (!msgEl) return;
    if (delayedTrips.length > 0) {
        msgEl.textContent = `Delay on Trip ${delayedTrips[0].id} - ${delayedTrips[0].pickup} → ${delayedTrips[0].delivery} (${delayedTrips[0].driver})`;
    } else {
        msgEl.textContent = 'All trips on time.';
    }
}

function populateAssignTripDropdown() {
    const select = document.getElementById('assignTripSelect');
    if (!select) return;
    const unassigned = trips.filter(t => t.status !== 'Assigned' && t.status !== 'In Progress' && t.status !== 'Completed');
    select.innerHTML = '';
    unassigned.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `${t.id} - ${t.pickup} → ${t.delivery} (${t.status})`;
        select.appendChild(opt);
    });
}

function renderMessages() {
    const container = document.getElementById('messageList');
    if (!container) return;
    container.innerHTML = '';
    messages.slice(0, 5).forEach(m => {
        const div = document.createElement('div');
        div.className = 'message-item';
        div.innerHTML = `
            <strong>${m.sender}</strong> <span>${m.text}</span> <span class="msg-time">${m.time}</span>
        `;
        container.appendChild(div);
    });
    saveMessages(messages);
}

function renderAvailability() {
    const drivers = loadAvailability();
    const tbody = document.getElementById('availTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    drivers.forEach(d => {
        let statusClass = 'badge-green';
        if (d.status === 'On Trip' || d.status === 'On Break') statusClass = 'badge-yellow';
        else if (d.status === 'Off Duty') statusClass = 'badge-red';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${d.name}</td>
            <td><span class="${statusClass}">${d.status}</span></td>
            <td>${d.location}</td>
            <td>${d.eta}</td>
        `;
        tbody.appendChild(row);
    });

    const available = drivers.filter(d => d.status === 'Available').length;
    const onTrip = drivers.filter(d => d.status === 'On Trip' || d.status === 'On Break').length;
    const offDuty = drivers.filter(d => d.status === 'Off Duty').length;
    const availEl = document.getElementById('availAvailable');
    const onTripEl = document.getElementById('availOnTrip');
    const offDutyEl = document.getElementById('availOffDuty');
    const statAvailEl = document.getElementById('statAvailableDrivers');
    if (availEl) availEl.textContent = available;
    if (onTripEl) onTripEl.textContent = onTrip;
    if (offDutyEl) offDutyEl.textContent = offDuty;
    if (statAvailEl) statAvailEl.textContent = available;
}

/* ─── MANAGER DASHBOARD ─── */
function renderManagerDashboard() {
    const drivers = loadAvailability();

    // Driver Performance table
    const perfTbody = document.getElementById('mgrDriverPerformance');
    if (perfTbody) {
        perfTbody.innerHTML = '';
        drivers.forEach(d => {
            const driverTrips = trips.filter(t => t.driver === d.name);
            const total = driverTrips.length;
            const onTime = driverTrips.filter(t => t.status === 'Completed' || t.status === 'On Time').length;
            const onTimePct = total > 0 ? Math.round((onTime / total) * 100) : 0;
            const rating = total > 0 ? (onTimePct / 20).toFixed(1) : '—';
            let statusClass = 'badge-green';
            if (d.status === 'On Trip' || d.status === 'On Break') statusClass = 'badge-yellow';
            else if (d.status === 'Off Duty') statusClass = 'badge-red';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${d.name}</td>
                <td>${total}</td>
                <td><span class="${onTimePct >= 90 ? 'status-good' : onTimePct >= 70 ? 'status-warning' : 'status-danger'}">${onTimePct}%</span></td>
                <td>${rating} ★</td>
                <td><span class="${statusClass}">${d.status}</span></td>
            `;
            perfTbody.appendChild(row);
        });
    }

    // KPI updates
    let totalRating = 0;
    drivers.forEach(d => {
        const driverTrips = trips.filter(t => t.driver === d.name);
        const total = driverTrips.length;
        const onTime = driverTrips.filter(t => t.status === 'Completed' || t.status === 'On Time').length;
        const pct = total > 0 ? (onTime / total) * 100 : 0;
        totalRating += total > 0 ? (pct / 20) : 0;
    });
    const avg = drivers.length > 0 ? (totalRating / drivers.length).toFixed(1) : 0;
    const avgEl = document.getElementById('mgrAvgRating');
    if (avgEl) avgEl.textContent = avg + ' ★';

    // Exception Summary
    const delayedCount = trips.filter(t => t.status === 'Delayed').length;
    const summaryData = {
        delay: delayedCount,
        deviation: 1,
        missed: 0,
        vehicle: 0
    };
    const totalExceptions = summaryData.delay + summaryData.deviation + summaryData.missed + summaryData.vehicle;
    const summaryContainer = document.getElementById('mgrExceptionSummary');
    if (summaryContainer) {
        summaryContainer.innerHTML = `
            <div class="exception-item"><span>Delay</span><span class="count">${summaryData.delay}</span><span class="bar" style="width:${totalExceptions > 0 ? (summaryData.delay / totalExceptions) * 100 : 0}%;"></span></div>
            <div class="exception-item"><span>Route Deviation</span><span class="count">${summaryData.deviation}</span><span class="bar" style="width:${totalExceptions > 0 ? (summaryData.deviation / totalExceptions) * 100 : 0}%;"></span></div>
            <div class="exception-item"><span>Missed Delivery</span><span class="count">${summaryData.missed}</span><span class="bar" style="width:${totalExceptions > 0 ? (summaryData.missed / totalExceptions) * 100 : 0}%;"></span></div>
            <div class="exception-item"><span>Vehicle Issue</span><span class="count">${summaryData.vehicle}</span><span class="bar" style="width:${totalExceptions > 0 ? (summaryData.vehicle / totalExceptions) * 100 : 0}%;"></span></div>
        `;
    }
    const openExEl = document.getElementById('mgrOpenExceptions');
    if (openExEl) openExEl.textContent = totalExceptions;

    // Exceptions Breakdown
    const breakdownContainer = document.getElementById('mgrExceptionsBreakdown');
    if (breakdownContainer) {
        breakdownContainer.innerHTML = summaryContainer ? summaryContainer.innerHTML : '';
    }

    // Exceptions List
    const exceptionsList = document.getElementById('mgrExceptionsList');
    if (exceptionsList) {
        const sampleExceptions = [
            { trip: 'T1107', type: 'Delay', description: 'Traffic on N2', status: 'Acknowledged' },
            { trip: 'T1203', type: 'Route Deviation', description: 'Detour due to roadworks', status: 'New' }
        ];
        exceptionsList.innerHTML = '';
        sampleExceptions.forEach(e => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${e.trip}</td>
                <td>${e.type}</td>
                <td>${e.description}</td>
                <td><span class="${e.status === 'Acknowledged' ? 'badge-yellow' : 'badge-red'}">${e.status}</span></td>
            `;
            exceptionsList.appendChild(row);
        });
    }

    // Drivers List
    const driversList = document.getElementById('mgrDriversList');
    if (driversList) {
        driversList.innerHTML = '';
        drivers.forEach(d => {
            const statusClass = d.status === 'Available' ? 'badge-green' : d.status === 'On Trip' || d.status === 'On Break' ? 'badge-yellow' : 'badge-red';
            const driverTrips = trips.filter(t => t.driver === d.name);
            const total = driverTrips.length;
            const onTime = driverTrips.filter(t => t.status === 'Completed' || t.status === 'On Time').length;
            const pct = total > 0 ? Math.round((onTime / total) * 100) : 0;
            const rating = total > 0 ? (pct / 20).toFixed(1) : '—';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${d.name}</td>
                <td><span class="${statusClass}">${d.status}</span></td>
                <td>${rating} ★</td>
                <td>${total}</td>
                <td><button class="btn-small flag-driver-btn" data-driver="${d.name}">Flag</button> <button class="btn-small view-driver-btn" data-driver="${d.name}">View</button></td>
            `;
            driversList.appendChild(row);
        });
    }

    // Maintenance List
    const maintList = document.getElementById('mgrMaintenanceList');
    if (maintList) {
        const sampleMaintenance = [
            { vehicle: 'Freightliner #8', issue: 'Brake wear', severity: 'Medium', days: 3 },
            { vehicle: 'Ford Transit #12', issue: 'Tire puncture', severity: 'High', days: 1 }
        ];
        maintList.innerHTML = '';
        sampleMaintenance.forEach(m => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${m.vehicle}</td>
                <td>${m.issue}</td>
                <td><span class="${m.severity === 'High' ? 'badge-red' : 'badge-yellow'}">${m.severity}</span></td>
                <td>${m.days}</td>
            `;
            maintList.appendChild(row);
        });
    }

    // Disputes List
    const disputesList = document.getElementById('mgrDisputesList');
    if (disputesList) {
        const sampleDisputes = [
            { trip: 'T1107', customer: 'ABC Logistics', reason: 'Signature Mismatch', status: 'Pending' },
            { trip: 'T9981', customer: 'XYZ Express', reason: 'Damaged Goods', status: 'Pending' }
        ];
        disputesList.innerHTML = '';
        sampleDisputes.forEach(d => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${d.trip}</td>
                <td>${d.customer}</td>
                <td>${d.reason}</td>
                <td><span class="badge-yellow">${d.status}</span></td>
            `;
            disputesList.appendChild(row);
        });
    }

    // Approved Users
    renderApprovedUsers();
}

/* ─── TRIP CRUD ─── */
function createTrip(data) {
    const newTrip = {
        id: generateTripId(),
        pickup: data.pickup,
        delivery: data.delivery,
        status: 'Draft',
        driver: data.driver || '—',
        customer: data.customer || '—',
        priority: data.priority || 'Standard',
        date: new Date().toISOString().slice(0, 10)
    };
    trips.unshift(newTrip);
    renderTrips();
}

function updateTrip(id, data) {
    const trip = getTrip(id);
    if (!trip) return;
    if (data.pickup) trip.pickup = data.pickup;
    if (data.delivery) trip.delivery = data.delivery;
    if (data.status) trip.status = data.status;
    if (data.driver) trip.driver = data.driver;
    if (data.customer) trip.customer = data.customer;
    if (data.priority) trip.priority = data.priority;
    renderTrips();
}

function assignTrip(tripId, driver) {
    const trip = getTrip(tripId);
    if (!trip) return false;
    trip.driver = driver;
    trip.status = 'Assigned';
    renderTrips();
    return true;
}

function sendMessage(driver, content) {
    const time = new Date().toLocaleTimeString();
    messages.unshift({ sender: 'Dispatcher', text: `To ${driver}: ${content}`, time });
    renderMessages();
}

function updateDriverStatus(driverName, newStatus, location, eta) {
    const drivers = loadAvailability();
    const driver = drivers.find(d => d.name === driverName);
    if (driver) {
        driver.status = newStatus;
        if (location) driver.location = location;
        if (eta) driver.eta = eta;
        saveAvailability(drivers);
        renderAvailability();
        return true;
    }
    return false;
}

/* ─── AUTH MODALS ─── */
// These are used on the landing page (Index.cshtml)
// They are also present in Login, Register, Forgot views.
// The functions are globally available.

/* ─── LANDING PAGE MODALS (About, Services, Contact) ─── */
// These are handled inline in the HTML views.
// But we keep them here for consistency.

/* ─── LOGIN / REGISTER / FORGOT ─── */
// The login form in Auth/Login uses these functions.
// They are already defined in the view's inline script.

/* ─── DISPATCHER DASHBOARD ─── */
// All event listeners are attached below.

/* ─── PROFILE MODAL ─── */
const profileOverlay = document.getElementById('profileOverlay');
const closeProfileBtn = document.getElementById('closeProfileBtn');

function openProfile() {
    if (profileOverlay) {
        profileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeProfile() {
    if (profileOverlay) {
        profileOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

if (closeProfileBtn) {
    closeProfileBtn.addEventListener('click', closeProfile);
}
if (profileOverlay) {
    profileOverlay.addEventListener('click', function (e) {
        if (e.target === this) closeProfile();
    });
}

// Profile tabs
document.querySelectorAll('.profile-tabs button').forEach(function (btn) {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.profile-tabs button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.profile-form').forEach(f => f.classList.remove('active'));
        const formId = 'form' + this.dataset.tab.replace('-', '');
        const targetForm = document.getElementById(formId);
        if (targetForm) targetForm.classList.add('active');
    });
});

// Edit Profile Form
const editProfileForm = document.getElementById('editProfileForm');
if (editProfileForm) {
    editProfileForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = document.getElementById('editFullName').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const displayName = document.getElementById('profileDisplayName');
        if (displayName) displayName.textContent = name;
        document.querySelectorAll('.dropdown-header strong').forEach(el => el.textContent = name);
        alert('Profile updated successfully!');
        closeProfile();
    });
}

const editCancel = document.getElementById('editProfileCancel');
if (editCancel) editCancel.addEventListener('click', closeProfile);

// Change Password Form
const changePwForm = document.getElementById('changePasswordForm');
if (changePwForm) {
    changePwForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const current = document.getElementById('currentPassword').value;
        const newPw = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmNewPassword').value;
        if (!current || !newPw || !confirm) {
            alert('Please fill in all fields.');
            return;
        }
        if (newPw !== confirm) {
            alert('New passwords do not match.');
            return;
        }
        if (newPw.length < 8) {
            alert('Password must be at least 8 characters.');
            return;
        }
        alert('Password changed successfully!');
        closeProfile();
    });
}

const changeCancel = document.getElementById('changePasswordCancel');
if (changeCancel) changeCancel.addEventListener('click', closeProfile);

// Avatar upload
const avatarEdit = document.getElementById('profileAvatarEdit');
const avatarInput = document.getElementById('profileAvatarInput');
if (avatarEdit && avatarInput) {
    avatarEdit.addEventListener('click', function () { avatarInput.click(); });
    avatarInput.addEventListener('change', function (e) {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (ev) {
                document.getElementById('profileAvatarImg').src = ev.target.result;
                document.querySelectorAll('.avatar').forEach(a => a.src = ev.target.result);
                document.querySelectorAll('.dropdown-header img').forEach(i => i.src = ev.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
}

/* ─── DROPDOWN MENU ─── */
document.querySelectorAll('.avatar-wrapper').forEach(function (wrapper) {
    wrapper.addEventListener('click', function (e) {
        e.stopPropagation();
        const menu = this.querySelector('.dropdown-menu');
        if (menu) menu.classList.toggle('open');
    });
});

document.addEventListener('click', function () {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
});

// Profile menu items
const profileMenuItem = document.getElementById('profileMenuItem');
if (profileMenuItem) {
    profileMenuItem.addEventListener('click', function () {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
        openProfile();
    });
}

/* ─── LOGOUT ─── */
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }
}

const logoutMenuItem = document.getElementById('logoutMenuItem');
if (logoutMenuItem) logoutMenuItem.addEventListener('click', logout);

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', logout);

/* ─── SIDEBAR NAVIGATION ─── */
document.querySelectorAll('.sidebar li').forEach(function (item) {
    item.addEventListener('click', function () {
        const parent = this.parentElement;
        parent.querySelectorAll('li').forEach(li => li.classList.remove('active'));
        this.classList.add('active');

        const sectionId = this.dataset.section;
        const content = this.closest('.main-layout').querySelector('.dashboard-content');
        if (!content) return;
        content.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const target = content.querySelector('#section-' + sectionId);
        if (target) target.classList.add('active');
    });
});

/* ─── CREATE TRIP MODAL ─── */
const createTripOverlay = document.getElementById('createTripOverlay');
const closeCreateTripBtn = document.getElementById('closeCreateTripBtn');
const createTripForm = document.getElementById('createTripForm');

const createTripBtn = document.getElementById('createTripBtn');
if (createTripBtn) {
    createTripBtn.addEventListener('click', function () {
        if (createTripOverlay) {
            createTripOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
}

if (closeCreateTripBtn) {
    closeCreateTripBtn.addEventListener('click', function () {
        if (createTripOverlay) {
            createTripOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}
if (createTripOverlay) {
    createTripOverlay.addEventListener('click', function (e) {
        if (e.target === this) {
            createTripOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

if (createTripForm) {
    createTripForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const pickup = document.getElementById('tripPickup').value.trim();
        const delivery = document.getElementById('tripDelivery').value.trim();
        const customer = document.getElementById('tripCustomer').value.trim();
        const priority = document.getElementById('tripPriority').value;
        const driver = document.getElementById('tripDriver').value.trim();

        if (!pickup || !delivery || !customer) {
            alert('Please fill in Pickup, Delivery, and Customer.');
            return;
        }

        createTrip({ pickup, delivery, customer, priority, driver });
        if (createTripOverlay) {
            createTripOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        createTripForm.reset();
        alert('Trip created successfully with status "Draft".');
    });
}

/* ─── VIEW TRIP MODAL ─── */
const viewTripOverlay = document.getElementById('viewTripOverlay');
const closeViewTripBtn = document.getElementById('closeViewTripBtn');
const viewTripId = document.getElementById('viewTripId');
const viewTripContent = document.getElementById('viewTripContent');
let currentViewTripId = null;

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('view-trip-btn')) {
        const id = e.target.dataset.id;
        currentViewTripId = id;
        const trip = getTrip(id);
        if (!trip) return;
        if (viewTripId) viewTripId.textContent = trip.id;
        if (viewTripContent) {
            viewTripContent.innerHTML = `
                <p><strong>Pickup:</strong> ${trip.pickup}</p>
                <p><strong>Delivery:</strong> ${trip.delivery}</p>
                <p><strong>Customer:</strong> ${trip.customer}</p>
                <p><strong>Driver:</strong> ${trip.driver || '—'}</p>
                <p><strong>Status:</strong> ${trip.status}</p>
                <p><strong>Priority:</strong> ${trip.priority}</p>
                <p><strong>Date:</strong> ${trip.date || '—'}</p>
            `;
        }
        if (viewTripOverlay) {
            viewTripOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
});

const editTripFromView = document.getElementById('editTripFromView');
if (editTripFromView) {
    editTripFromView.addEventListener('click', function () {
        if (!currentViewTripId) return;
        if (viewTripOverlay) {
            viewTripOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        const trip = getTrip(currentViewTripId);
        if (!trip) return;
        document.getElementById('tripPickup').value = trip.pickup;
        document.getElementById('tripDelivery').value = trip.delivery;
        document.getElementById('tripCustomer').value = trip.customer;
        document.getElementById('tripPriority').value = trip.priority;
        document.getElementById('tripDriver').value = trip.driver;
        if (createTripOverlay) {
            createTripOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        if (createTripForm) {
            createTripForm.onsubmit = function (e) {
                e.preventDefault();
                const pickup = document.getElementById('tripPickup').value.trim();
                const delivery = document.getElementById('tripDelivery').value.trim();
                const customer = document.getElementById('tripCustomer').value.trim();
                const priority = document.getElementById('tripPriority').value;
                const driver = document.getElementById('tripDriver').value.trim();

                if (!pickup || !delivery || !customer) {
                    alert('Please fill in Pickup, Delivery, and Customer.');
                    return;
                }

                updateTrip(currentViewTripId, { pickup, delivery, customer, priority, driver });
                if (createTripOverlay) {
                    createTripOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
                createTripForm.reset();
                createTripForm.onsubmit = null;
                alert('Trip updated successfully!');
            };
        }
    });
}

if (closeViewTripBtn) {
    closeViewTripBtn.addEventListener('click', function () {
        if (viewTripOverlay) {
            viewTripOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}
if (viewTripOverlay) {
    viewTripOverlay.addEventListener('click', function (e) {
        if (e.target === this) {
            viewTripOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

/* ─── EDIT TRIP (inline from table) ─── */
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('edit-trip-btn')) {
        const id = e.target.dataset.id;
        const trip = getTrip(id);
        if (!trip) return;
        currentViewTripId = id;
        document.getElementById('tripPickup').value = trip.pickup;
        document.getElementById('tripDelivery').value = trip.delivery;
        document.getElementById('tripCustomer').value = trip.customer;
        document.getElementById('tripPriority').value = trip.priority;
        document.getElementById('tripDriver').value = trip.driver;
        if (createTripOverlay) {
            createTripOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        if (createTripForm) {
            createTripForm.onsubmit = function (e) {
                e.preventDefault();
                const pickup = document.getElementById('tripPickup').value.trim();
                const delivery = document.getElementById('tripDelivery').value.trim();
                const customer = document.getElementById('tripCustomer').value.trim();
                const priority = document.getElementById('tripPriority').value;
                const driver = document.getElementById('tripDriver').value.trim();

                if (!pickup || !delivery || !customer) {
                    alert('Please fill in Pickup, Delivery, and Customer.');
                    return;
                }

                updateTrip(id, { pickup, delivery, customer, priority, driver });
                if (createTripOverlay) {
                    createTripOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
                createTripForm.reset();
                createTripForm.onsubmit = null;
                alert('Trip updated successfully!');
            };
        }
    }
});

/* ─── ASSIGN TRIP MODAL ─── */
const assignTripOverlay = document.getElementById('assignTripOverlay');
const closeAssignTripBtn = document.getElementById('closeAssignTripBtn');
const assignTripForm = document.getElementById('assignTripForm');

const assignTripBtn = document.getElementById('assignTripBtn');
if (assignTripBtn) {
    assignTripBtn.addEventListener('click', function () {
        populateAssignTripDropdown();
        if (assignTripOverlay) {
            assignTripOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
}

if (closeAssignTripBtn) {
    closeAssignTripBtn.addEventListener('click', function () {
        if (assignTripOverlay) {
            assignTripOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}
if (assignTripOverlay) {
    assignTripOverlay.addEventListener('click', function (e) {
        if (e.target === this) {
            assignTripOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

if (assignTripForm) {
    assignTripForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const tripId = document.getElementById('assignTripSelect').value;
        const driver = document.getElementById('assignDriverSelect').value;
        if (!tripId) {
            alert('Please select a trip.');
            return;
        }
        if (assignTrip(tripId, driver)) {
            if (assignTripOverlay) {
                assignTripOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
            alert('Trip ' + tripId + ' assigned to ' + driver + ' successfully!');
        }
    });
}

/* ─── SEND MESSAGE MODAL ─── */
const sendMsgOverlay = document.getElementById('sendMessageOverlay');
const closeSendMsgBtn = document.getElementById('closeSendMessageBtn');
const sendMsgForm = document.getElementById('sendMessageForm');

const sendMsgBtn = document.getElementById('sendMsgBtn');
if (sendMsgBtn) {
    sendMsgBtn.addEventListener('click', function () {
        if (sendMsgOverlay) {
            sendMsgOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
}

const msgIcon = document.getElementById('msgIcon');
if (msgIcon) {
    msgIcon.addEventListener('click', function () {
        const msgLink = document.querySelector('#dispatcherDashboard .sidebar li[data-section="messaging"]');
        if (msgLink) msgLink.click();
    });
}

const bellIcon = document.getElementById('bellIcon');
if (bellIcon) {
    bellIcon.addEventListener('click', function () {
        const notifications = [
            'Trip T1203 is delayed.',
            'New maintenance report for Freightliner #8.',
            'Driver Michael Nkosi is on break.'
        ];
        alert('Notifications:\n\n' + notifications.join('\n'));
    });
}

if (closeSendMsgBtn) {
    closeSendMsgBtn.addEventListener('click', function () {
        if (sendMsgOverlay) {
            sendMsgOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}
if (sendMsgOverlay) {
    sendMsgOverlay.addEventListener('click', function (e) {
        if (e.target === this) {
            sendMsgOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

if (sendMsgForm) {
    sendMsgForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const driver = document.getElementById('msgDriverSelect').value;
        const content = document.getElementById('msgContent').value.trim();
        if (!content) {
            alert('Please enter a message.');
            return;
        }
        sendMessage(driver, content);
        if (sendMsgOverlay) {
            sendMsgOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        sendMsgForm.reset();
        alert('Message sent to ' + driver + ' successfully!');
    });
}

/* ─── SIMULATE DRIVER AVAILABILITY ─── */
const simBtn = document.getElementById('simulateAvailabilityBtn');
if (simBtn) {
    simBtn.addEventListener('click', function () {
        const drivers = loadAvailability();
        const statuses = ['Available', 'On Trip', 'On Break', 'Off Duty'];
        const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const locations = ['JHB', 'PTA', 'DUR', 'CPT', 'BLOEM', 'GQ'];
        const randomLocation = locations[Math.floor(Math.random() * locations.length)];
        const eta = randomStatus === 'On Trip' ? new Date(Date.now() + 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
        updateDriverStatus(randomDriver.name, randomStatus, randomLocation, eta);
        alert(`${randomDriver.name} updated status to "${randomStatus}" (simulated from mobile)`);
    });
}

/* ─── ALERT DETAILS BUTTON ─── */
const alertDetailsBtn = document.getElementById('alertDetailsBtn');
if (alertDetailsBtn) {
    alertDetailsBtn.addEventListener('click', function () {
        const delayed = trips.filter(t => t.status === 'Delayed');
        if (delayed.length > 0) {
            let msg = 'Delayed Trips:\n\n';
            delayed.forEach(t => {
                msg += `${t.id} - ${t.pickup} → ${t.delivery} (Driver: ${t.driver})\n`;
            });
            alert(msg);
        } else {
            alert('All trips are on time! No delays to report.');
        }
    });
}

/* ─── MANAGER: FLAG / VIEW DRIVER ─── */
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('flag-driver-btn')) {
        const driver = e.target.dataset.driver;
        if (confirm('Flag driver ' + driver + ' for performance review?')) {
            alert('Driver ' + driver + ' flagged for review.');
        }
    }
    if (e.target.classList.contains('view-driver-btn')) {
        const driver = e.target.dataset.driver;
        alert('Viewing details for ' + driver);
    }
});

/* ─── ADD USER MODAL (Manager) ─── */
const addUserOverlay = document.getElementById('addUserOverlay');
const closeAddUserBtn = document.getElementById('closeAddUserBtn');
const addUserForm = document.getElementById('addUserForm');

const addUserBtn = document.getElementById('addUserBtn');
if (addUserBtn) {
    addUserBtn.addEventListener('click', function () {
        if (addUserOverlay) {
            addUserOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
}

if (closeAddUserBtn) {
    closeAddUserBtn.addEventListener('click', function () {
        if (addUserOverlay) {
            addUserOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}
if (addUserOverlay) {
    addUserOverlay.addEventListener('click', function (e) {
        if (e.target === this) {
            addUserOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

if (addUserForm) {
    addUserForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const fullName = document.getElementById('addUserFullName').value.trim();
        const email = document.getElementById('addUserEmail').value.trim();
        const phone = document.getElementById('addUserPhone').value.trim();
        const role = document.getElementById('addUserRole').value;

        if (!fullName || !email) {
            alert('Please fill in Name and Email.');
            return;
        }

        const existing = getApprovedUserByEmail(email);
        if (existing) {
            alert('This user is already in the system.');
            return;
        }

        addApprovedUser({ fullName, email, phone, role });
        if (addUserOverlay) {
            addUserOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        addUserForm.reset();
        alert('User added successfully!');
    });
}

/* ─── REMOVE USER ─── */
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('remove-user-btn')) {
        const id = parseInt(e.target.dataset.id);
        if (confirm('Are you sure you want to remove this user?')) {
            removeApprovedUser(id);
            alert('User removed successfully.');
        }
    }
});

/* ─── MAP ─── */
let map;

function initMap() {
    if (map) return;
    const container = document.getElementById('map');
    if (!container) return;

    map = L.map('map').setView([-28.5, 24.5], 5.5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OSM & CartoDB',
        subdomains: 'abcd'
    }).addTo(map);
    map.zoomControl.setPosition('bottomright');

    function createTruckMarker(color, truckId) {
        return L.divIcon({
            className: 'custom-truck-icon',
            html: `<div class="truck-wrapper"><i class="fa-solid fa-truck truck-icon" style="color:${color};"></i><div class="motion-line-mid"></div><div class="truck-label">${truckId}</div></div>`,
            iconSize: [48, 64],
            iconAnchor: [24, 32],
            popupAnchor: [0, -28]
        });
    }

    const trucks = [
        { id: "T1203", lat: -26.2041, lng: 28.0473, city: "Johannesburg", driver: "Michael Nkosi", status: "On Route", eta: "14:30", vehicle: "Ford Transit #12", color: "#1d4db7" },
        { id: "T1450", lat: -25.7479, lng: 28.2293, city: "Pretoria", driver: "Thabo Dlamini", status: "On Time", eta: "15:00", vehicle: "Freightliner #8", color: "#29b34a" },
        { id: "T1107", lat: -29.8587, lng: 31.0218, city: "Durban", driver: "Lerato Mbeki", status: "Delayed", eta: "16:20", vehicle: "RAM 2500", color: "#ef2f2f" },
        { id: "T9981", lat: -33.9249, lng: 18.4241, city: "Cape Town", driver: "Sipho Zulu", status: "In Transit", eta: "17:45", vehicle: "Volvo FH16", color: "#f7b928" }
    ];

    trucks.forEach(function (truck) {
        const marker = L.marker([truck.lat, truck.lng], {
            icon: createTruckMarker(truck.color, truck.id)
        }).addTo(map);
        marker.bindPopup(`<b>Truck ${truck.id}</b><br> ${truck.city}<br>Driver: ${truck.driver}<br>Status: ${truck.status}<br>ETA: ${truck.eta}`);
    });

    const warehouseIcon = L.divIcon({
        html: '<div style="background:#ef2f2f;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:2px solid white;border-radius:6px;"><i class="fa-solid fa-warehouse" style="color:white;font-size:18px;"></i></div>',
        iconSize: [32, 32],
        className: 'custom-warehouse'
    });
    L.marker([-26.130, 28.200], { icon: warehouseIcon }).bindPopup("<b>Isando Main Hub</b>").addTo(map);

    const capeIcon = L.divIcon({
        html: '<div style="background:#1d4db7;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:2px solid white;border-radius:6px;"><i class="fa-solid fa-warehouse" style="color:white;font-size:18px;"></i></div>',
        iconSize: [32, 32],
        className: 'custom-warehouse'
    });
    L.marker([-33.9249, 18.4241], { icon: capeIcon }).bindPopup("<b>Cape Town Depot</b>").addTo(map);

    window.addEventListener('resize', function () {
        if (map) setTimeout(function () { map.invalidateSize(); }, 100);
    });
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', function () {
    // Check if we're on a dashboard page
    if (document.getElementById('dispatcherDashboard')) {
        // Dispatcher dashboard
        renderTrips();
        renderMessages();
        renderAvailability();
        if (document.getElementById('map')) {
            setTimeout(initMap, 300);
        }
    }
    if (document.getElementById('managerDashboard')) {
        // Manager dashboard
        renderManagerDashboard();
    }
});

console.log('HaulSync script loaded successfully.');