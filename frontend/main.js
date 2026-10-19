const currentRole = localStorage.getItem('userRole') || 'admin';

function applyPermissions() {
    document.querySelectorAll('.user-role-display').forEach(el => el.innerText = currentRole.charAt(0).toUpperCase() + currentRole.slice(1));
    document.querySelectorAll('.user-avatar-display').forEach(el => el.innerText = currentRole.charAt(0).toUpperCase());

    document.querySelectorAll('[data-role-required]').forEach(el => {
        const allowedRoles = el.getAttribute('data-role-required').split(',');
        if (currentRole === 'admin' || allowedRoles.includes(currentRole)) el.classList.remove('hidden');
        else el.classList.add('hidden');
    });
    const settingsContent = document.getElementById('settings-content');
    const accessDenied = document.getElementById('access-denied');
    if (settingsContent && accessDenied) {
        if (currentRole === 'admin') {
            settingsContent.classList.remove('hidden'); accessDenied.classList.add('hidden');
        } else {
            settingsContent.classList.add('hidden'); accessDenied.classList.remove('hidden');
        }
    }
}
window.changeRole = function (role) {
    localStorage.setItem('userRole', role);
    window.location.reload();
};
document.addEventListener("DOMContentLoaded", () => {
    applyPermissions();

    // Sidebar Logic
    const mobileToggle = document.getElementById("mobileToggle");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    if (mobileToggle) mobileToggle.addEventListener("click", () => { sidebar.classList.remove("-translate-x-full"); overlay.classList.remove("hidden"); document.body.style.overflow = "hidden"; });
    if (overlay) overlay.addEventListener("click", () => { sidebar.classList.add("-translate-x-full"); overlay.classList.add("hidden"); document.body.style.overflow = "auto"; });

    // Modal Logic
    const modalTriggers = document.querySelectorAll('[data-modal-target]');
    const modalCloses = document.querySelectorAll('[data-modal-close]');
    const modals = document.querySelectorAll('.modal-overlay');

    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const targetModal = document.getElementById(trigger.getAttribute('data-modal-target'));
            if (targetModal) { targetModal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
        });
    });

    modalCloses.forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal-overlay');
            if (modal) { modal.classList.add('hidden'); document.body.style.overflow = 'auto'; }
        });
    });

    modals.forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.add('hidden'); document.body.style.overflow = 'auto'; } });
    });
    // --- REAL FORM SUBMISSION TO BACKEND ---
    document.querySelectorAll('.modal-form').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formId = form.closest('.modal-overlay').id;
            let endpoint = '';
            let payload = {};

            if (formId === 'add-expense-modal') {
                endpoint = 'http://localhost:5000/api/expenses';
                payload = {
                    title: form.querySelector('[name="title"]').value,
                    amount: parseFloat(form.querySelector('[name="amount"]').value),
                    category: form.querySelector('[name="category"]').value,
                    date: form.querySelector('[name="date"]').value || new Date()
                };
            } else {
                // Dummy forms (settings, categories)
                form.closest('.modal-overlay').classList.add('hidden');
                document.body.style.overflow = 'auto';
                alert('Action completed successfully!');
                return;
            }

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error('Failed to save');

                form.closest('.modal-overlay').classList.add('hidden');
                document.body.style.overflow = 'auto';

                if (document.getElementById("expenseChart")) {
                    fetchDashboardData(); // Refresh dashboard if on it
                } else {
                    window.location.reload(); // Reload expenses page to show new item
                }

            } catch (error) {
                console.error(error);
                alert('Error saving data. Is your Node.js backend running?');
            }
        });
    });

    if (document.getElementById("expenseChart")) fetchDashboardData();
});
async function fetchDashboardData() {
    let data;
    try {
        const response = await fetch('http://localhost:5000/api/dashboard');
        if (!response.ok) throw new Error("Backend not responding");
        data = await response.json();
    } catch (error) {
        console.warn("Backend offline. Using mock data.");
        data = {
            stats: { totalStudents: 1248, totalStaff: 84, monthlyExpenses: 24580, attendanceRate: 94.2 },
            charts: {
                expenseTrends: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], data: [3200, 4500, 3800, 5200, 4800, 6100] },
                categoryDistribution: { labels: ["Materials", "Food", "Transport"], data: [25, 35, 15] }
            },
            recentActivities: [{ type: 'enrollment', title: 'New student enrolled', description: 'Sarah Johnson', timestamp: new Date() }]
        };
    }

    if (document.getElementById("stat-students")) document.getElementById("stat-students").innerText = data.stats.totalStudents.toLocaleString();
    if (document.getElementById("stat-staff")) document.getElementById("stat-staff").innerText = data.stats.totalStaff;
    if (document.getElementById("stat-expenses")) document.getElementById("stat-expenses").innerText = `$${data.stats.monthlyExpenses.toLocaleString()}`;
    if (document.getElementById("stat-attendance")) document.getElementById("stat-attendance").innerText = `${data.stats.attendanceRate}%`;

    const activityContainer = document.getElementById("activity-container");
    if (activityContainer) {
        activityContainer.innerHTML = '';
        data.recentActivities.forEach(activity => {
            activityContainer.innerHTML += `
                <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div class="bg-blue-100 p-3 rounded-full"><i class="fas fa-${activity.type === 'enrollment' ? 'user-plus' : 'money-bill-wave'} text-blue-600"></i></div>
                    <div class="flex-1"><p class="font-semibold text-gray-800">${activity.title}</p><p class="text-sm text-gray-600">${activity.description}</p></div>
                </div>`;
        });
    }

    initializeCharts(data.charts);
}

function initializeCharts(chartData) {
    const expenseCtx = document.getElementById("expenseChart").getContext("2d");
    new Chart(expenseCtx, { type: "line", data: { labels: chartData.expenseTrends.labels, datasets: [{ label: "Expenses", data: chartData.expenseTrends.data, borderColor: "#4f46e5", backgroundColor: "rgba(79, 70, 229, 0.1)", tension: 0.4, fill: true }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
    const categoryCtx = document.getElementById("categoryChart").getContext("2d");
    new Chart(categoryCtx, { type: "doughnut", data: { labels: chartData.categoryDistribution.labels, datasets: [{ data: chartData.categoryDistribution.data, backgroundColor: ["#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#f59e0b"], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: "bottom" } } } });
}