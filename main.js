// main.js

// --- 1. MOBILE SIDEBAR TOGGLE LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
    const mobileToggle = document.getElementById("mobileToggle");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    function openSidebar() {
        sidebar.classList.remove("-translate-x-full");
        overlay.classList.remove("hidden");
        document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    function closeSidebar() {
        sidebar.classList.add("-translate-x-full");
        overlay.classList.add("hidden");
        document.body.style.overflow = "auto";
    }

    if (mobileToggle) {
        mobileToggle.addEventListener("click", openSidebar);
    }
    if (overlay) {
        overlay.addEventListener("click", closeSidebar);
    }

    // Close sidebar when clicking a link on mobile
    document.querySelectorAll("#sidebar a").forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth < 1024) closeSidebar();
        });
    });

    // Handle window resize (reset sidebar state if resizing from mobile to desktop)
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            overlay.classList.add("hidden");
            document.body.style.overflow = "auto";
        }
    });

    // --- 2. INITIALIZE DASHBOARD DATA & CHARTS ---
    // Only run this if we are on the dashboard page (check if expenseChart exists)
    if (document.getElementById("expenseChart")) {
        fetchDashboardData();
    }
});

// --- 3. FETCH DATA FROM BACKEND & UPDATE UI ---
async function fetchDashboardData() {
    try {
        // Replace with your actual backend URL (from the previous Node.js setup)
        const response = await fetch('http://localhost:5000/api/dashboard');
        
        if (!response.ok) throw new Error("Failed to fetch data");
        
        const data = await response.json();

        // Update Stats Cards
        document.getElementById("stat-students").innerText = data.stats.totalStudents.toLocaleString();
        document.getElementById("stat-staff").innerText = data.stats.totalStaff;
        document.getElementById("stat-expenses").innerText = `$${data.stats.monthlyExpenses.toLocaleString()}`;
        document.getElementById("stat-attendance").innerText = `${data.stats.attendanceRate}%`;

        // Update Recent Activities
        const activityContainer = document.getElementById("activity-container");
        if (activityContainer) {
            activityContainer.innerHTML = ''; // Clear hardcoded HTML
            data.recentActivities.forEach(activity => {
                const icon = activity.type === 'enrollment' ? 'user-plus' : 'money-bill-wave';
                const color = activity.type === 'enrollment' ? 'blue' : 'green';
                
                activityContainer.innerHTML += `
                    <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div class="bg-${color}-100 p-3 rounded-full">
                            <i class="fas fa-${icon} text-${color}-600"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-semibold text-gray-800">${activity.title}</p>
                            <p class="text-sm text-gray-600">${activity.description}</p>
                            <p class="text-xs text-gray-400 mt-1">${new Date(activity.timestamp).toLocaleDateString()}</p>
                        </div>
                    </div>
                `;
            });
        }

        // Initialize Charts with dynamic data
        initializeCharts(data.charts);

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Optional: Show a friendly error message on the UI
    }
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
                borderWidth: 2,
                pointBackgroundColor: "#4f46e5",
                pointRadius: 4
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Crucial for Tailwind height constraints
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
            cutout: '65%', // Makes the doughnut ring thinner
            plugins: {
                legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8, padding: 20 } }
            },
        },
    });
}