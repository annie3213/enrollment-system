document.addEventListener('DOMContentLoaded', () => {
  
  // Function to load the student's current enrollments.
  async function loadEnrollments() {
    try {
      const res = await fetch('/api/student/enrollments');
      const enrollments = await res.json();
      const enrollmentsDiv = document.getElementById('enrollmentsList');
      
      if (!Array.isArray(enrollments) || enrollments.length === 0) {
        enrollmentsDiv.innerHTML = '<p>You have not enrolled in any courses yet.</p>';
        return;
      }
      
      let html = '<ul>';
      enrollments.forEach(enrollment => {
        html += `<li>
                    <strong>${enrollment.courseCode}</strong> - ${enrollment.courseName} (${enrollment.schedule})
                    <button onclick="deleteEnrollment(${enrollment.id})">Delete</button>
                 </li>`;
      });
      html += '</ul>';
      enrollmentsDiv.innerHTML = html;
    } catch (err) {
      document.getElementById('enrollmentsList').innerHTML = '<p>Error loading enrollments.</p>';
    }
  }

  // Function to delete a particular enrollment.
  window.deleteEnrollment = async (enrollmentId) => {
    if (!confirm('Are you sure you want to drop this subject?')) return;
    try {
      const res = await fetch('/api/student/delete-enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        loadEnrollments(); // Reload enrollments after deletion.
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error deleting subject. Please try again.');
    }
  };

  // (Optional) Function to load available subjects, if needed.
  async function loadSubjects() {
    try {
      const res = await fetch('/api/subjects');
      const subjects = await res.json();
      let html = '<ul>';
      subjects.forEach(subject => {
        html += `<li>
                    <strong>${subject.courseCode}</strong> - ${subject.courseName} (${subject.schedule})
                    <!-- You can add an enrollment button here if desired -->
                 </li>`;
      });
      html += '</ul>';
      document.getElementById('subjectsList').innerHTML = html;
    } catch (err) {
      document.getElementById('subjectsList').innerHTML = '<p>Error loading subjects.</p>';
    }
  }

  // Logout functionality.
  document.getElementById('logoutButton').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/logout', { credentials: 'same-origin' });
      if (res.ok) {
        window.location.href = '/login.html';
      } else {
        alert('Logout failed.');
      }
    } catch (err) {
      alert('Logout failed.');
    }
  });

  // Functionality for the "View COR" button.
  document.getElementById('viewCORButton').addEventListener('click', () => {
    window.location.href = 'cor.html';
  });

  // Initial load.
  loadSubjects();
  loadEnrollments();
});
