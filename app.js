const express = require('express');
const fetch = require('node-fetch'); // npm install node-fetch
const csv = require('csvtojson');    // npm install csvtojson
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(cors());

app.use(bodyParser.json());

app.post('/examtimer_test/grade_select', async (req, res) => {
  const { grade } = req.body;
  if (!grade) return res.status(400).json({ error: 'No grade specified' });

  const url = `https://raw.githubusercontent.com/sunnyhan0317/examtimer_test/main/data/${grade}.csv`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('file not found');
    const text = await response.text();
    // 假設 CSV 欄位順序: 起始時間,結束時間,科目,是否換班
    const rows = await csv({
      noheader: false,
      headers: ['start_time', 'end_time', 'subject', 'change_class_no']
    }).fromString(text);

    // 如果首行是標題，你可能想要過濾掉
    const filteredRows = rows.filter(row => row.start_time !== '起始時間');

    res.json(filteredRows);
  } catch (err) {
    res.status(500).json({ error: `fetch error: ${err.message}` });
  }
});

app.use(express.static('.')); // 讓 index.html 可直接打開

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));