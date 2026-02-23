document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let allStudents = [];
    let filteredStudents = [];
    let charts = {};
    const itemsPerPage = 10;
    let currentPage = 1;

    // --- DOM Elements ---
    const dom = {
        totalStudents: document.getElementById('total-students'),
        avgAttendance: document.getElementById('avg-attendance'),
        avgMarks: document.getElementById('avg-marks'),
        topPerformer: document.getElementById('top-performer'),
        tableBody: document.getElementById('student-table-body'),
        searchInput: document.getElementById('search-input'),
        filterDept: document.getElementById('filter-dept'),
        filterYear: document.getElementById('filter-year'),
        filterGender: document.getElementById('filter-gender'),
        resetBtn: document.getElementById('reset-filters'),
        prevPageBtn: document.getElementById('prev-page'),
        nextPageBtn: document.getElementById('next-page'),
        pageInfo: document.getElementById('page-info'),
        themeBtn: document.getElementById('theme-btn'),
    };

    // --- Initialization ---
    init();

    async function init() {
        try {
            const response = await fetch('data.json');
            allStudents = await response.json();
            filteredStudents = [...allStudents];

            updateDashboard();
            setupEventListeners();
        } catch (error) {
            console.error('Error loading data:', error);
            dom.tableBody.innerHTML = '<tr><td colspan="7">Error loading data. Please try again.</td></tr>';
        }
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        dom.searchInput.addEventListener('input', handleFilter);
        dom.filterDept.addEventListener('change', handleFilter);
        dom.filterYear.addEventListener('change', handleFilter);
        dom.filterGender.addEventListener('change', handleFilter);
        dom.resetBtn.addEventListener('click', resetFilters);

        dom.prevPageBtn.addEventListener('click', () => changePage(-1));
        dom.nextPageBtn.addEventListener('click', () => changePage(1));

        dom.themeBtn.addEventListener('click', toggleTheme);
    }

    // --- Filtering Logic ---
    function handleFilter() {
        const searchTerm = dom.searchInput.value.toLowerCase();
        const dept = dom.filterDept.value;
        const year = dom.filterYear.value;
        const gender = dom.filterGender.value;

        filteredStudents = allStudents.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm);
            const matchesDept = dept === 'all' || s.department === dept;
            const matchesYear = year === 'all' || s.year == year;
            const matchesGender = gender === 'all' || s.gender === gender;

            return matchesSearch && matchesDept && matchesYear && matchesGender;
        });

        currentPage = 1;
        updateDashboard();
    }

    function resetFilters() {
        dom.searchInput.value = '';
        dom.filterDept.value = 'all';
        dom.filterYear.value = 'all';
        dom.filterGender.value = 'all';
        handleFilter();
    }

    // --- Dashboard Updates ---
    function updateDashboard() {
        updateCards();
        updateTable();
        updateCharts();
    }

    function updateCards() {
        // Total Students
        animateValue(dom.totalStudents, parseInt(dom.totalStudents.innerText), filteredStudents.length, 1000);

        if (filteredStudents.length === 0) {
            dom.avgAttendance.innerText = '0%';
            dom.avgMarks.innerText = '0';
            dom.topPerformer.innerText = '-';
            return;
        }

        // Avg Attendance
        const totalAttendance = filteredStudents.reduce((sum, s) => sum + s.attendance, 0);
        const avgAtt = Math.round(totalAttendance / filteredStudents.length);
        dom.avgAttendance.innerText = `${avgAtt}%`;

        // Avg Marks (across all subjects for all students)
        let totalMarks = 0;
        let totalSubjectsCount = 0;
        filteredStudents.forEach(s => {
            const subs = Object.values(s.subjects);
            totalMarks += subs.reduce((a, b) => a + b, 0);
            totalSubjectsCount += subs.length;
        });
        const avgM = totalSubjectsCount ? Math.round(totalMarks / totalSubjectsCount) : 0;
        dom.avgMarks.innerText = avgM;

        // Top Performer
        const topStudent = filteredStudents.reduce((prev, current) => {
            const prevAvg = getStudentAvg(prev);
            const currAvg = getStudentAvg(current);
            return (prevAvg > currAvg) ? prev : current;
        });
        dom.topPerformer.innerText = topStudent.name;
    }

    function getStudentAvg(student) {
        const marks = Object.values(student.subjects);
        return marks.reduce((a, b) => a + b, 0) / marks.length;
    }

    // --- Table & Pagination ---
    function updateTable() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = filteredStudents.slice(startIndex, endIndex);

        dom.tableBody.innerHTML = '';
        pageData.forEach(student => {
            const avg = Math.round(getStudentAvg(student));
            const status = avg >= 40 ? 'Pass' : 'Fail';
            const statusColor = avg >= 40 ? '#10B981' : '#EF4444';

            const row = `
                <tr>
                    <td>#${student.id}</td>
                    <td>${student.name}</td>
                    <td>${student.department}</td>
                    <td>Year ${student.year}</td>
                    <td>${avg}</td>
                    <td>${student.attendance}%</td>
                    <td style="color: ${statusColor}; font-weight: 600;">${status}</td>
                </tr>
            `;
            dom.tableBody.innerHTML += row;
        });

        // Pagination Controls
        const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
        dom.pageInfo.innerText = `Page ${currentPage} of ${totalPages}`;
        dom.prevPageBtn.disabled = currentPage === 1;
        dom.nextPageBtn.disabled = currentPage === totalPages;
    }

    function changePage(direction) {
        currentPage += direction;
        updateTable();
    }

    // --- Charts ---
    function updateCharts() {
        renderBarChart();
        renderLineChart();
        renderPieChart();
        renderDoughnutChart();
    }

    const commonOptions = {
        responsive: true,
        plugins: {
            legend: { labels: { color: '#94A3B8' } },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#94A3B8' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94A3B8' }
            }
        }
    };

    function renderBarChart() {
        // Prepare Data: Avg marks per subject
        const subjects = ['Full Stack', 'DSA', 'Operating System', 'Software Engineering', 'Programming'];
        const subjectTotals = { 'Full Stack': 0, 'DSA': 0, 'Operating System': 0, 'Software Engineering': 0, 'Programming': 0 };
        const subjectCounts = { ...subjectTotals };

        filteredStudents.forEach(s => {
            for (const [sub, marks] of Object.entries(s.subjects)) {
                if (subjectTotals.hasOwnProperty(sub)) {
                    subjectTotals[sub] += marks;
                    subjectCounts[sub]++;
                }
            }
        });

        const averages = subjects.map(sub => subjectCounts[sub] ? Math.round(subjectTotals[sub] / subjectCounts[sub]) : 0);

        const ctx = document.getElementById('barChart').getContext('2d');
        if (charts.bar) charts.bar.destroy();

        charts.bar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: subjects,
                datasets: [{
                    label: 'Avg Marks',
                    data: averages,
                    backgroundColor: '#4F46E5',
                    borderRadius: 6
                }]
            },
            options: commonOptions
        });
    }

    function renderLineChart() {
        // Prepare Data: Avg marks per semester
        // Only show semesters present in filtered data
        const semesters = [...new Set(filteredStudents.map(s => s.semester))].sort((a, b) => a - b);
        const semAverages = semesters.map(sem => {
            const studentsInSem = filteredStudents.filter(s => s.semester === sem);
            const total = studentsInSem.reduce((sum, s) => sum + getStudentAvg(s), 0);
            return Math.round(total / studentsInSem.length);
        });

        const ctx = document.getElementById('lineChart').getContext('2d');
        if (charts.line) charts.line.destroy();

        charts.line = new Chart(ctx, {
            type: 'line',
            data: {
                labels: semesters.map(s => `Sem ${s}`),
                datasets: [{
                    label: 'Performance Trend',
                    data: semAverages,
                    borderColor: '#06B6D4',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(6, 182, 212, 0.1)'
                }]
            },
            options: commonOptions
        });
    }

    function renderPieChart() {
        const maleCount = filteredStudents.filter(s => s.gender === 'Male').length;
        const femaleCount = filteredStudents.filter(s => s.gender === 'Female').length;

        const ctx = document.getElementById('pieChart').getContext('2d');
        if (charts.pie) charts.pie.destroy();

        charts.pie = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Male', 'Female'],
                datasets: [{
                    data: [maleCount, femaleCount],
                    backgroundColor: ['#3B82F6', '#EC4899'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94A3B8' } }
                }
            }
        });
    }

    function renderDoughnutChart() {
        // Grade Distribution: A (>85), B (>70), C (>50), F (<50)
        let grades = { A: 0, B: 0, C: 0, F: 0 };
        filteredStudents.forEach(s => {
            const avg = getStudentAvg(s);
            if (avg >= 85) grades.A++;
            else if (avg >= 70) grades.B++;
            else if (avg >= 50) grades.C++;
            else grades.F++;
        });

        const ctx = document.getElementById('doughnutChart').getContext('2d');
        if (charts.doughnut) charts.doughnut.destroy();

        charts.doughnut = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['A (Excellent)', 'B (Good)', 'C (Average)', 'F (Fail)'],
                datasets: [{
                    data: [grades.A, grades.B, grades.C, grades.F],
                    backgroundColor: ['#10B981', '#F59E0B', '#6366F1', '#EF4444'],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '70%',
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94A3B8' } }
                }
            }
        });
    }

    // --- Utilities ---
    function animateValue(obj, start, end, duration) {
        if (start === end) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function toggleTheme() {
        document.body.classList.toggle('light-mode');
        // If body has light-mode class, we are in light mode, so button should offer Dark Mode
        if (document.body.classList.contains('light-mode')) {
            dom.themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i> Dark Mode';
        } else {
            // We are in dark mode, button should offer Light Mode
            dom.themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i> Light Mode';
        }
    }
});
