import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
dns.setServers(['1.1.1.1', '8.8.8.8']);
dns.setDefaultResultOrder('verbatim');

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express';
import journalRoutes from './routes/journalRoutes.js';
import userRoutes from './routes/userRoutes.js';
import constellationRoutes from './routes/constellationRoutes.js';

dotenv.config({
  path: [
    fileURLToPath(new URL('../.env', import.meta.url)),
    fileURLToPath(new URL('../../.env.local', import.meta.url)),
  ],
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Routes
app.use('/api/journals', journalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/constellations', constellationRoutes);

app.get('/', (req, res) => {
  res.send('AstraJournal API is running');
});

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/astrajournal';
console.log('Attempting to connect to MongoDB...');
// Hide the password in the log for security if it's an Atlas URI
const maskedUri = mongoUri.replace(/\/\/.*:.*@/, '//<user>:<password>@');
console.log(`Connection string: ${maskedUri}`);



mongoose.connect(mongoUri)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error details:');
    console.error(error);
  });
