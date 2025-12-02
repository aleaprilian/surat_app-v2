const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Gunakan rute surat
app.use('/api/surat', require('./routes/surat'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server generator berjalan di port ${PORT}`));