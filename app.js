const express = require('express');
const fetch = require('node-fetch'); // npm install node-fetch
const csv = require('csvtojson');    // npm install csvtojson
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(cors());

app.use(bodyParser.json());

app.post('/grade_select', async (req, res) => {
  const { grade } = req.body;
  if (!grade) return res.status(400).json({ error: 'No grade specified' });

  const url = `https://raw.githubusercontent.com/sunnyhan0317/examtimer_test/main/data/${grade}.csv`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('file not found');
    const text = await response.text();
    const rows = await csv({
      noheader: false,
      headers: ['start_time', 'end_time', 'subject', 'change_class_no']
    }).fromString(text);

    // filter first line
    const filteredRows = rows.filter(row => row.start_time !== '起始時間');

    res.json(filteredRows);
  } catch (err) {
    res.status(500).json({ error: `fetch error: ${err.message}` });
  }
});

app.use(express.static('.')); // let index.html can open

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));