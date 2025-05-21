document.addEventListener('DOMContentLoaded', () => {
  // Handle login form submission
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('studentId').value.trim();
    const password = document.getElementById('password').value.trim();
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password })
      });
      const data = await response.json();
      if (response.ok) {
        // Redirect users based on login type: if admin, redirect to the protected /admin route
        if (data.isAdmin) {
          window.location.href = '/admin';
        } else {
          window.location.href = 'dashboard.html';
        }
      } else {
        document.getElementById('loginMessage').innerText = data.message;
      }
    } catch (err) {
      document.getElementById('loginMessage').innerText = 'Login error. Please try again.';
    }
  });
  
  // Back Home button functionality
  document.getElementById('backHomeButton').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
});
