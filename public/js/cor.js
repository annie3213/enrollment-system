document.addEventListener('DOMContentLoaded', async () => {
  async function loadCOR() {
    try {
      const res = await fetch('/api/student/cor');
      if (!res.ok) {
        throw new Error('Could not fetch COR information');
      }
      const data = await res.json();
      const student = data.student;
      const enrollments = data.enrollments;
      
      // Display student info
      const studentInfoDiv = document.getElementById('studentInfo');
      studentInfoDiv.innerHTML = `
        <p><strong>Name:</strong> ${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}</p>
        <p><strong>Student ID:</strong> ${student.id}</p>
      `;
      
      // Display enrolled subjects
      const coursesListDiv = document.getElementById('coursesList');
      if (enrollments.length === 0) {
        coursesListDiv.innerHTML = '<p>You have not enrolled in any courses.</p>';
      } else {
        let html = '<ul>';
        enrollments.forEach(e => {
          html += `<li><strong>${e.courseCode}</strong>: ${e.courseName} (${e.schedule})</li>`;
        });
        html += '</ul>';
        coursesListDiv.innerHTML = html;
      }
    } catch (err) {
      alert('Error loading COR: ' + err.message);
    }
  }
  
  // Load COR data dynamically.
  loadCOR();

  // Print functionality
  document.getElementById('printButton').addEventListener('click', () => {
    window.print();
  });

  // Notification after printing
  window.onafterprint = () => {
    alert('Your Certificate of Registration has been printed successfully.');
  };

  // Back button to dashboard
  document.getElementById('backToDashboard').addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });
});
