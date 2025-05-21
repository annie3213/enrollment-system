// database.js
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function initDB() {
  // Open (or create) the SQLite database.
  const db = await open({
    filename: './database.db',
    driver: sqlite3.Database,
  });

  // Create the necessary tables if they do not exist.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      middleName TEXT,
      lastName TEXT NOT NULL,
      homeAddress TEXT,
      contactNumber TEXT,
      firstGeneration TEXT,
      password TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courseCode TEXT NOT NULL,
      courseName TEXT NOT NULL,
      schedule TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      subjectId INTEGER NOT NULL,
      enrollmentDate TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id),
      FOREIGN KEY (subjectId) REFERENCES subjects(id)
    );
  `);

  // Seed the subjects table if it’s empty.
  const subjectCount = await db.get(`SELECT COUNT(*) AS count FROM subjects`);
  if (subjectCount.count === 0) {
    await db.exec(`
      INSERT INTO subjects (courseCode, courseName, schedule) VALUES 
        ('GEC-RPH', 'Readings in Philippine History', 'TTh 8:30-10:00 AM'),
        ('GEC-MMW', 'Mathematics in the Modern World', 'M/W 7:30-9:00 AM'),
        ('CC 111', 'Introduction to Computing', 'W/TH 9:00-12:00'),
        ('CC 112', 'Computer Programming 1 (Lec)', 'M 1:00-3:00 PM');
    `);
    console.log("Database seeded with default subjects.");
  }
  
  return db;
}

module.exports = { initDB };
