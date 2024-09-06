const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let globalPatCount = 0;

app.get('/api/pat', (req, res) => {
  res.json({ count: globalPatCount });
});

app.post('/api/pat', (req, res) => {
  globalPatCount += 1;
  res.json({ count: globalPatCount });
});

app.get('/', (req, res) => {
  res.send('Cat Pat Counter API is running!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
