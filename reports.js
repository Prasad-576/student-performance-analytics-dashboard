document.addEventListener('DOMContentLoaded', () => {
    let allStudents = [];
    const dom = {
        studentSelect: document.getElementById('student-select'),
        downloadAttendanceBtn: document.getElementById('download-attendance'),
        downloadMarksBtn: document.getElementById('download-marks'),
        reportPreview: document.getElementById('student-report-preview'),
        reportName: document.getElementById('report-student-name'),
        reportId: document.getElementById('report-student-id'),
        reportDept: document.getElementById('report-dept'),
        reportYear: document.getElementById('report-year'),
        reportAttendance: document.getElementById('report-attendance'),
        reportGrade: document.getElementById('report-grade'),
        reportSubjectsTable: document.querySelector('#report-subjects-table tbody'),
        downloadPdfBtn: document.getElementById('download-pdf-btn'),
        themeBtn: document.getElementById('theme-btn'),
    };

    init();

    async function init() {
        try {
            const response = await fetch('data.json');
            allStudents = await response.json();
            populateStudentSelect();
            setupEventListeners();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    function populateStudentSelect() {
        allStudents.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} (ID: ${student.id})`;
            dom.studentSelect.appendChild(option);
        });
    }

    function setupEventListeners() {
        dom.downloadAttendanceBtn.addEventListener('click', downloadAttendanceReport);
        dom.downloadMarksBtn.addEventListener('click', downloadMarksReport);
        dom.studentSelect.addEventListener('change', showStudentReport);
        dom.downloadPdfBtn.addEventListener('click', downloadStudentPDF);
        dom.themeBtn.addEventListener('click', toggleTheme);
    }

    // --- Bulk Reports ---
    function downloadAttendanceReport() {
        const headers = ['Student ID', 'Name', 'Department', 'Year', 'Attendance (%)'];
        const rows = allStudents.map(s => [s.id, s.name, s.department, s.year, s.attendance]);
        downloadCSV('Attendance_Report.csv', headers, rows);
    }

    function downloadMarksReport() {
        const headers = ['Student ID', 'Name', 'Department', 'Year', 'Full Stack', 'DSA', 'OS', 'SE', 'Programming', 'Average'];
        const rows = allStudents.map(s => {
            const subs = s.subjects;
            const avg = Math.round(Object.values(subs).reduce((a, b) => a + b, 0) / 5);
            return [
                s.id, s.name, s.department, s.year,
                subs['Full Stack'], subs['DSA'], subs['Operating System'], subs['Software Engineering'], subs['Programming'],
                avg
            ];
        });
        downloadCSV('Marks_Report.csv', headers, rows);
    }

    function downloadCSV(filename, headers, rows) {
        const csvContent = [
            headers.join(','),
            ...rows.map(e => e.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // --- Individual Report ---
    function showStudentReport(e) {
        const studentId = parseInt(e.target.value);
        if (!studentId) {
            dom.reportPreview.classList.add('hidden');
            return;
        }

        const student = allStudents.find(s => s.id === studentId);
        if (!student) return;

        dom.reportPreview.classList.remove('hidden');
        dom.reportName.textContent = student.name;
        dom.reportId.textContent = `ID: ${student.id}`;
        dom.reportDept.textContent = student.department;
        dom.reportYear.textContent = student.year;
        dom.reportAttendance.textContent = `${student.attendance}%`;

        const marks = Object.values(student.subjects);
        const avg = Math.round(marks.reduce((a, b) => a + b, 0) / marks.length);
        dom.reportGrade.textContent = getGrade(avg);
        dom.reportGrade.style.color = avg >= 40 ? '#10B981' : '#EF4444';

        dom.reportSubjectsTable.innerHTML = '';
        for (const [sub, mark] of Object.entries(student.subjects)) {
            const row = `<tr><td>${sub}</td><td>${mark}</td></tr>`;
            dom.reportSubjectsTable.innerHTML += row;
        }
    }

    function getGrade(avg) {
        if (avg >= 85) return 'A (Excellent)';
        if (avg >= 70) return 'B (Good)';
        if (avg >= 50) return 'C (Average)';
        return 'F (Fail)';
    }

    function downloadStudentPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const name = dom.reportName.textContent;
        doc.setFontSize(20);
        doc.text("Student Performance Report", 20, 20);

        doc.setFontSize(12);
        doc.text(`Name: ${name}`, 20, 40);
        doc.text(dom.reportId.textContent, 20, 50);
        doc.text(`Department: ${dom.reportDept.textContent}`, 20, 60);
        doc.text(`Year: ${dom.reportYear.textContent}`, 20, 70);
        doc.text(`Attendance: ${dom.reportAttendance.textContent}`, 20, 80);
        doc.text(`Grade: ${dom.reportGrade.textContent}`, 20, 90);

        const rows = [];
        dom.reportSubjectsTable.querySelectorAll('tr').forEach(tr => {
            const cells = tr.querySelectorAll('td');
            rows.push([cells[0].textContent, cells[1].textContent]);
        });

        doc.autoTable({
            startY: 100,
            head: [['Subject', 'Marks']],
            body: rows,
        });

        doc.save(`${name}_Report.pdf`);
    }

    function toggleTheme() {
        document.body.classList.toggle('light-mode');
        if (document.body.classList.contains('light-mode')) {
            dom.themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i> Dark Mode';
        } else {
            dom.themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i> Light Mode';
        }
    }
});
