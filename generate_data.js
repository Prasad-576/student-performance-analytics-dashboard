const fs = require('fs');

const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Information Technology'];
const genders = ['Male', 'Female'];
const subjects = ['Full Stack', 'DSA', 'Operating System', 'Software Engineering', 'Programming'];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateStudents(count) {
    const students = [];
    for (let i = 1; i <= count; i++) {
        const dept = departments[getRandomInt(0, departments.length - 1)];
        const year = getRandomInt(1, 4);
        // Semester depends on year (e.g., Year 1 -> Sem 1 or 2)
        const semester = (year * 2) - getRandomInt(0, 1);

        const studentSubjects = {};
        let totalMarks = 0;
        subjects.forEach(sub => {
            const marks = getRandomInt(40, 99); // Random marks between 40 and 99
            studentSubjects[sub] = marks;
            totalMarks += marks;
        });

        students.push({
            id: 100 + i,
            name: `Student_${100 + i}`,
            gender: genders[getRandomInt(0, 1)],
            department: dept,
            year: year,
            semester: semester,
            subjects: studentSubjects,
            attendance: getRandomInt(60, 100) // Attendance between 60% and 100%
        });
    }
    return students;
}

const data = generateStudents(750); // Generate 750 students
fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log('data.json generated with ' + data.length + ' records.');
