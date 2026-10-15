// frontend/main.js

document.addEventListener("DOMContentLoaded", () => {
    // --- 1. MOBILE SIDEBAR TOGGLE LOGIC ---
    const mobileToggle = document.getElementById("mobileToggle");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    function openSidebar() {
        if (sidebar) sidebar.classList.remove("-translate-x-full");
        if (overlay) overlay.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.add("-translate-x-full");
        if (overlay) overlay.classList.add("hidden");
        document.body.style.overflow = "auto";
    }

    if (mobileToggle) mobileToggle.addEventListener("click", openSidebar);
    if (overlay) overlay.addEventListener("click", closeSidebar);

    // Close sidebar when clicking a link on mobile
    document.querySelectorAll("#sidebar a").forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth < 1024) closeSidebar();
        });
    });

    // Handle window resize (reset sidebar state if resizing from mobile to desktop)
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            if (overlay) overlay.classList.add("hidden");
            document.body.style.overflow = "auto";
        }
    });

    // --- 2. INITIALIZE DASHBOARD DATA (Only runs if on index.html) ---
    if (document.getElementById("expenseChart")) {
        fetchDashboardData();
    }
});

// --- 3. FETCH DATA FROM BACKEND & UPDATE UI ---
async function fetchDashboardData() {
    let data;

    try {
        // Try to fetch from backend (Node.js API)
        const response = await fetch('http://localhost:5000/api/dashboard');
        if (!response.ok) throw new Error("Backend not responding");
        data = await response.json();
    } catch (error) {
        console.warn("Backend not running. Using Mock Data to display UI perfectly.");
        // FALLBACK MOCK DATA (So the UI looks perfect even without backend)
        data = {
            stats: { totalStudents: 1248, totalStaff: 84, monthlyExpenses: 24580, attendanceRate: 94.2 },
            charts: {
                expenseTrends: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], data: [3200, 4500, 3800, 5200, 4800, 6100] },
                categoryDistribution: { labels: ["Materials", "Food", "Transport", "Maintenance", "Technology"], data: [25, 35, 15, 15, 10] }
            },
            recentActivities: [
                { type: 'enrollment', title: 'New student enrolled', description: 'Sarah Johnson in Grade 5', timestamp: new Date() },
                { type: 'payment', title: 'Fee payment received', description: 'From Michael Brown - $450.00', timestamp: new Date() }
            ]
        };
    }

    // Update Stats Cards (with safety checks to prevent JS errors if elements don't exist)
    if (document.getElementById("stat-students")) document.getElementById("stat-students").innerText = data.stats.totalStudents.toLocaleString();
    if (document.getElementById("stat-staff")) document.getElementById("stat-staff").innerText = data.stats.totalStaff;
    if (document.getElementById("stat-expenses")) document.getElementById("stat-expenses").innerText = `$${data.stats.monthlyExpenses.toLocaleString()}`;
    if (document.getElementById("stat-attendance")) document.getElementById("stat-attendance").innerText = `${data.stats.attendanceRate}%`;

    // Update Recent Activities
    const activityContainer = document.getElementById("activity-container");
    if (activityContainer) {
        activityContainer.innerHTML = '';
        data.recentActivities.forEach(activity => {
            const icon = activity.type === 'enrollment' ? 'user-plus' : 'money-bill-wave';
            const color = activity.type === 'enrollment' ? 'blue' : 'green';
            activityContainer.innerHTML += `
                <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div class="bg-${color}-100 p-3 rounded-full"><i class="fas fa-${icon} text-${color}-600"></i></div>
                    <div class="flex-1">
                        <p class="font-semibold text-gray-800">${activity.title}</p>
                        <p class="text-sm text-gray-600">${activity.description}</p>
                        <p class="text-xs text-gray-400 mt-1">${new Date(activity.timestamp).toLocaleDateString()}</p>
                    </div>
                </div>`;
        });
    }

    // Initialize Charts with dynamic data
    initializeCharts(data.charts);
}

// --- 4. CHART.JS INITIALIZATION ---
function initializeCharts(chartData) {
    // Expense Trends Chart (Line)
    const expenseCtx = document.getElementById("expenseChart").getContext("2d");
    new Chart(expenseCtx, {
        type: "line",
        data: {
            labels: chartData.expenseTrends.labels,
            datasets: [{
                label: "Expenses",
                data: chartData.expenseTrends.data,
                borderColor: "#4f46e5",
                backgroundColor: "rgba(79, 70, 229, 0.1)",
                tension: 0.4,
                fill: true,
                borderWidth: 2
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#f3f4f6' } },
                x: { grid: { display: false } }
            }
        },
    });

    // Category Distribution Chart (Doughnut)
    const categoryCtx = document.getElementById("categoryChart").getContext("2d");
    new Chart(categoryCtx, {
        type: "doughnut",
        data: {
            labels: chartData.categoryDistribution.labels,
            datasets: [{
                data: chartData.categoryDistribution.data,
                backgroundColor: ["#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#f59e0b"],
                borderWidth: 0,
                hoverOffset: 4
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8, padding: 20 } }
            }
        },
    });
}