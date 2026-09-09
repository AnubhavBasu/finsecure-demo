require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transferRoutes = require('./routes/transfers');

const app = express();
app.use(cors()); // demo only — allow the local web app and the Expo dev client
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transfers', transferRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`FinSecure demo backend listening on http://localhost:${PORT}`);
});
