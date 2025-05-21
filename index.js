// index.js
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();
const { initDB } = require('./database');
const { schedulesConflict, capitalize } = require('./helpers'); // Helper functions

(async () => {
  const db = await initDB(); // Initialize/Open the SQLite database

  const app = express();
  const port = process.env.PORT || 4005;

  // Setup session middleware.
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 2 * 60 * 60 * 1000 } // 2 hours
  }));

  app.use(bodyParser.json());
  // Serve static assets from the "public" folder.
  app.use(express.static(path.join(__dirname, 'public')));

  // ----------------- ADMIN AUTHENTICATION MIDDLEWARE -----------------
  function ensureAdmin(req, res, next) {
    if (req.session && req.session.admin) {
      next();  // User is authenticated as admin.
    } else {
      res.status(401).send("Access Denied. Admin login required.");
    }
  }

  // ----------------- PROTECTED ADMIN ROUTE -----------------
  // Serves the admin dashboard page (stored in the "views" folder)
  app.get('/admin', ensureAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
  });

  // ----------------- BASIC TEST ROUTE -----------------
  app.get('/ping', (req, res) => {
    res.send('pong');
  });

  // ----------------- STUDENT & ADMIN ENDPOINTS -----------------

  // Student Registration
  app.post('/api/register', async (req, res) => {
    const { firstName, middleName, lastName, homeAddress, contactNumber, firstGeneration, password } = req.body;
    if (!firstName || !lastName || !password) {
      return res.status(400).json({ message: 'Missing required fields: first name, last name, or password.' });
    }
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.run(
        `INSERT INTO students (firstName, middleName, lastName, homeAddress, contactNumber, firstGeneration, password)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
         firstName, middleName, lastName, homeAddress, contactNumber, firstGeneration, hashedPassword
      );
      res.json({ message: 'Registration successful', studentId: result.lastID });
    } catch (err) {
      res.status(500).json({ message: 'Error during registration', error: err.message });
    }
  });

  // Login Endpoint (Admin and Student)
  app.post('/api/login', async (req, res) => {
    const { id, password } = req.body;
    const cleanId = id.trim();
    const cleanPassword = password.trim();

    // Admin login branch.
    if (cleanId === 'admin') {
      const adminPassword = process.env.ADMIN_PASSWORD || '5132846';
      if (cleanPassword === adminPassword) {
        req.session.admin = true;
        req.session.username = 'admin';
        return res.json({ message: 'Admin login successful', isAdmin: true });
      } else {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    // Student login branch.
    if (!cleanId || !cleanPassword) {
      return res.status(400).json({ message: 'Missing id or password' });
    }
    try {
      const student = await db.get(`SELECT * FROM students WHERE id = ?`, [cleanId]);
      if (student && await bcrypt.compare(cleanPassword, student.password)) {
        req.session.student = student;
        return res.json({ message: 'Login successful', student });
      } else {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (err) {
      return res.status(500).json({ message: 'Error during login', error: err.message });
    }
  });

  // Logout Endpoint
  app.get('/api/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) return res.status(500).json({ message: 'Logout failed.' });
      res.clearCookie('connect.sid');
      res.json({ message: 'Logout successful' });
    });
  });

  // Subject Enrollment (student)
  app.post('/api/enroll', async (req, res) => {
    if (!req.session.student) {
      return res.status(401).json({ message: "Unauthorized: Please log in as a student." });
    }
    const studentId = req.session.student.id;
    const { subjectId } = req.body;
    if (!subjectId) {
      return res.status(400).json({ message: "Subject ID is required." });
    }
    try {
      // Verify subject existence.
      const subject = await db.get(`SELECT * FROM subjects WHERE id = ?`, [subjectId]);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found." });
      }
      // Check for duplicate enrollment.
      const duplicate = await db.get(
        `SELECT * FROM enrollments WHERE studentId = ? AND subjectId = ?`,
        [studentId, subjectId]
      );
      if (duplicate) {
        return res.status(400).json({ message: "You are already enrolled in this subject." });
      }
      // Check for schedule conflicts.
      const currentEnrollments = await db.all(
        `SELECT s.courseCode, s.courseName, s.schedule 
         FROM enrollments e JOIN subjects s ON e.subjectId = s.id
         WHERE e.studentId = ?`,
         [studentId]
      );
      for (const enrolled of currentEnrollments) {
        if (schedulesConflict(enrolled.schedule, subject.schedule)) {
          return res.status(400).json({
            message: `Schedule conflict with ${enrolled.courseCode} - ${enrolled.courseName} (${enrolled.schedule}). Clear the conflicting enrollment first.`
          });
        }
      }
      // Insert the enrollment.
      const result = await db.run(
        `INSERT INTO enrollments (studentId, subjectId) VALUES (?, ?)`,
        [studentId, subjectId]
      );
      res.json({ message: "Enrollment successful!", enrollmentId: result.lastID });
    } catch (error) {
      res.status(500).json({ message: "Enrollment error", error: error.message });
    }
  });

  // ----------------- DELETE ENROLLMENT ENDPOINT (for students) -----------------
  // This endpoint allows a logged-in student to drop an enrolled subject.
  app.post('/api/student/delete-enrollment', async (req, res) => {
    if (!req.session.student) {
      return res.status(401).json({ message: "Unauthorized: Please log in as a student." });
    }
    const { enrollmentId } = req.body;
    if (!enrollmentId) {
      return res.status(400).json({ message: "Enrollment ID is required." });
    }
    try {
      // Check that this enrollment belongs to the current student.
      const enrollment = await db.get(
        "SELECT * FROM enrollments WHERE id = ? AND studentId = ?",
        [enrollmentId, req.session.student.id]
      );
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found or does not belong to you." });
      }
      // Delete the enrollment record.
      await db.run("DELETE FROM enrollments WHERE id = ?", [enrollmentId]);
      res.json({ message: "Enrollment deleted successfully." });
    } catch (err) {
      res.status(500).json({ message: "Error deleting enrollment", error: err.message });
    }
  });

  // Get All Available Subjects (for both students/admin)
  app.get('/api/subjects', async (req, res) => {
    try {
      const subjects = await db.all(`SELECT * FROM subjects ORDER BY id ASC`);
      res.json(subjects);
    } catch (err) {
      res.status(500).json({ message: "Error fetching subjects", error: err.message });
    }
  });

  // Get Student's Current Enrollments
  app.get('/api/student/enrollments', async (req, res) => {
    if (!req.session.student) {
      return res.status(401).json({ message: "Unauthorized: Please log in as a student." });
    }
    const studentId = req.session.student.id;
    try {
      const enrollments = await db.all(
        `SELECT e.id, s.courseCode, s.courseName, s.schedule, e.enrollmentDate
         FROM enrollments e JOIN subjects s ON e.subjectId = s.id 
         WHERE e.studentId = ?`,
         studentId
      );
      res.json(enrollments);
    } catch (err) {
      res.status(500).json({ message: 'Error retrieving enrollments', error: err.message });
    }
  });

  // Get Certificate of Registration (COR)
  app.get('/api/student/cor', async (req, res) => {
    if (!req.session.student) {
      return res.status(401).json({ message: "Unauthorized: Please log in as a student." });
    }
    try {
      // Fetch the student record.
      const student = await db.get("SELECT * FROM students WHERE id = ?", [req.session.student.id]);
      // Fetch enrolled subject details.
      const enrollments = await db.all(
        `SELECT s.courseCode, s.courseName, s.schedule 
         FROM enrollments e JOIN subjects s ON e.subjectId = s.id 
         WHERE e.studentId = ?`,
        [req.session.student.id]
      );

      // Capitalize name parts.
      student.firstName = capitalize(student.firstName);
      student.middleName = student.middleName ? capitalize(student.middleName) : "";
      student.lastName = capitalize(student.lastName);
      
      // Capitalize course names.
      enrollments.forEach(e => {
        e.courseName = capitalize(e.courseName);
      });
      
      res.json({
        student: {
          id: student.id,
          firstName: student.firstName,
          middleName: student.middleName,
          lastName: student.lastName
        },
        enrollments
      });
    } catch (error) {
      res.status(500).json({ message: "Error retrieving COR", error: error.message });
    }
  });

  // ----------------- ADMIN ENDPOINTS -----------------

  // Get All Registered Students (admin)
  app.get('/api/admin/students', async (req, res) => {
    if (!req.session.admin) {
      return res.status(401).json({ message: "Unauthorized: Admin access required." });
    }
    try {
      const students = await db.all("SELECT id, firstName, middleName, lastName FROM students ORDER BY id ASC");
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Error fetching students", error: error.message });
    }
  });

  // Get All Enrollments (admin)
  app.get('/api/admin/enrollments', async (req, res) => {
    if (!req.session.admin) {
      return res.status(401).json({ message: "Unauthorized: Admin access required." });
    }
    try {
      const enrollments = await db.all(`
         SELECT e.id, e.studentId, s.courseCode, s.courseName, s.schedule, e.enrollmentDate 
         FROM enrollments e 
         JOIN subjects s ON e.subjectId = s.id
         ORDER BY e.id ASC
      `);
      res.json(enrollments);
    } catch (err) {
      res.status(500).json({ message: "Error fetching enrollments", error: err.message });
    }
  });

  // Get All Subjects (admin)
  app.get('/api/admin/subjects', async (req, res) => {
    if (!req.session.admin) {
      return res.status(401).json({ message: "Unauthorized: Admin access required." });
    }
    try {
      const subjects = await db.all(`SELECT * FROM subjects ORDER BY id ASC`);
      res.json(subjects);
    } catch (err) {
      res.status(500).json({ message: "Error fetching subjects", error: err.message });
    }
  });

  // Add New Subject (admin)
  app.post('/api/admin/add-subject', async (req, res) => {
    if (!req.session.admin) {
      return res.status(401).json({ message: "Unauthorized: Admin access required." });
    }
    const { courseCode, courseName, schedule } = req.body;
    if (!courseCode || !courseName || !schedule) {
      return res.status(400).json({ message: "Missing courseCode, courseName, or schedule." });
    }
    try {
      const result = await db.run(
        `INSERT INTO subjects (courseCode, courseName, schedule) VALUES (?, ?, ?)`,
        [courseCode, courseName, schedule]
      );
      res.json({ message: "Subject added successfully", subjectId: result.lastID });
    } catch (err) {
      res.status(500).json({ message: "Error adding subject", error: err.message });
    }
  });

  // Add New Student (admin)
  app.post('/api/admin/add-student', async (req, res) => {
    if (!req.session.admin) {
      return res.status(401).json({ message: "Unauthorized: Admin access required." });
    }
    const { firstName, lastName, password } = req.body;
    if (!firstName || !lastName || !password) {
      return res.status(400).json({ message: "Missing first name, last name, or password." });
    }
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.run(
         `INSERT INTO students (firstName, lastName, password) VALUES (?, ?, ?)`,
         [firstName, lastName, hashedPassword]
      );
      res.json({ message: "Student added successfully", studentId: result.lastID });
    } catch(err) {
      res.status(500).json({ message: "Error adding student", error: err.message });
    }
  });

  // Delete Student (admin)
  app.post('/api/admin/delete-student', async (req, res) => {
    if (!req.session.admin) {
      return res.status(401).json({ message: "Unauthorized: Admin access required." });
    }
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required." });
    }
    try {
      await db.run(`DELETE FROM students WHERE id = ?`, [studentId]);
      res.json({ message: "Student deleted successfully." });
    } catch(err) {
      res.status(500).json({ message: "Error deleting student", error: err.message });
    }
  });

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})();
