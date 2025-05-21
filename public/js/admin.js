document.addEventListener('DOMContentLoaded', () => {
  // Logout functionality.
  document.getElementById('logoutButton').addEventListener('click', async () => {
    try {
      const response = await fetch('/api/logout', { credentials: 'same-origin' });
      if (response.ok) {
        window.location.href = '/login.html';
      } else {
        alert('Logout failed.');
      }
    } catch (err) {
      alert('Logout failed.');
    }
  });

  // View Students.
  document.getElementById('btnViewStudents').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/admin/students');
      const students = await res.json();
      let html = '<h2>Registered Students</h2>';
      if (students.length > 0) {
        html += '<ul>';
        students.forEach(s => {
          const cap = word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '';
          const fullName = `${cap(s.firstName)} ${cap(s.middleName)} ${cap(s.lastName)}`;
          html += `<li>ID: ${s.id} - ${fullName}</li>`;
        });
        html += '</ul>';
      } else {
        html += '<p>No students found.</p>';
      }
      document.getElementById('content').innerHTML = html;
    } catch (err) {
      document.getElementById('content').innerHTML = `<p>Error fetching students: ${err.message}</p>`;
    }
  });

  // View Enrollments.
  document.getElementById('btnViewEnrollments').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/admin/enrollments');
      const enrollments = await res.json();
      let html = '<h2>Enrollments</h2>';
      if (enrollments.length > 0) {
        html += '<ul>';
        enrollments.forEach(e => {
          html += `<li>ID: ${e.id} - Student ID: ${e.studentId}, ${e.courseCode}: ${e.courseName} (${e.schedule}) [${e.enrollmentDate}]</li>`;
        });
        html += '</ul>';
      } else {
        html += '<p>No enrollments found.</p>';
      }
      document.getElementById('content').innerHTML = html;
    } catch (err) {
      document.getElementById('content').innerHTML = `<p>Error fetching enrollments: ${err.message}</p>`;
    }
  });

  // View Subjects.
  document.getElementById('btnViewSubjects').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/admin/subjects');
      const subjects = await res.json();
      let html = '<h2>Subjects</h2>';
      if (subjects.length > 0) {
        html += '<ul>';
        subjects.forEach(s => {
          html += `<li>ID: ${s.id} - ${s.courseCode}: ${s.courseName} (${s.schedule})</li>`;
        });
        html += '</ul>';
      } else {
        html += '<p>No subjects found.</p>';
      }
      document.getElementById('content').innerHTML = html;
    } catch (err) {
      document.getElementById('content').innerHTML = `<p>Error fetching subjects: ${err.message}</p>`;
    }
  });

  // Add New Subject.
  document.getElementById('btnAddSubject').addEventListener('click', () => {
    let html = `
      <h2>Add New Subject</h2>
      <form id="addSubjectForm">
        <label>Course Code: <input type="text" name="courseCode" required></label><br>
        <label>Course Name: <input type="text" name="courseName" required></label><br>
        <label>Schedule: <input type="text" name="schedule" placeholder="e.g., M/W 7:30-9:00 AM" required></label><br>
        <button type="submit">Add Subject</button>
      </form>
      <div id="addSubjectMessage"></div>
    `;
    document.getElementById('content').innerHTML = html;
    
    document.getElementById('addSubjectForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const courseCode = formData.get('courseCode');
      const courseName = formData.get('courseName');
      const schedule = formData.get('schedule');
      
      try {
        const res = await fetch('/api/admin/add-subject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseCode, courseName, schedule })
        });
        const data = await res.json();
        document.getElementById('addSubjectMessage').innerText = data.message;
      } catch (err) {
        document.getElementById('addSubjectMessage').innerText = 'Error adding subject';
      }
    });
  });

  // Add New Student.
  document.getElementById('btnAddStudent').addEventListener('click', () => {
    let html = `
      <h2>Add New Student</h2>
      <form id="addStudentForm">
        <label>First Name: <input type="text" name="firstName" required></label><br>
        <label>Last Name: <input type="text" name="lastName" required></label><br>
        <label>Password: <input type="password" name="password" required></label><br>
        <button type="submit">Add Student</button>
      </form>
      <div id="addStudentMessage"></div>
    `;
    document.getElementById('content').innerHTML = html;
    
    document.getElementById('addStudentForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const firstName = formData.get('firstName');
      const lastName = formData.get('lastName');
      const password = formData.get('password');
      
      try {
        const res = await fetch('/api/admin/add-student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, lastName, password })
        });
        const data = await res.json();
        document.getElementById('addStudentMessage').innerText = data.message;
      } catch (err) {
        document.getElementById('addStudentMessage').innerText = 'Error adding student';
      }
    });
  });

  // Delete Student.
  document.getElementById('btnDeleteStudent').addEventListener('click', () => {
    let html = `
      <h2>Delete Student</h2>
      <form id="deleteStudentForm">
        <label>Student ID: <input type="number" name="studentId" required></label><br>
        <button type="submit">Delete Student</button>
      </form>
      <div id="deleteStudentMessage"></div>
    `;
    document.getElementById('content').innerHTML = html;
    
    document.getElementById('deleteStudentForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const studentId = formData.get('studentId');
      
      try {
        const res = await fetch('/api/admin/delete-student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId })
        });
        const data = await res.json();
        document.getElementById('deleteStudentMessage').innerText = data.message;
      } catch (err) {
        document.getElementById('deleteStudentMessage').innerText = 'Error deleting student';
      }
    });
  });
});
