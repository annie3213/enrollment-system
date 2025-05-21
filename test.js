// test.js
const express = require('express');
const app = express();
const port = 4005;

app.get('/', (req, res) => {
  res.send('Hello from the test server on port 4005!');
});

app.listen(port, () => {
  console.log(`Test server is running on port ${port}`);
});
