import express from 'express';
import cors from 'cors';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { MONGO_URI } from './config';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import companyRoutes from './routes/company';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/company', companyRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 4000;
const DEMO_MODE = process.env.DEMO_MODE === 'true';
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
      return;
    }

    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

function startServer(mode: 'mongo' | 'demo') {
  app.listen(port, () => console.log(`Backend running on http://localhost:${port} (${mode} mode)`));
}

if (DEMO_MODE) {
  console.warn('Starting backend in demo mode without MongoDB.');
  startServer('demo');
} else {
  mongoose
    .connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 })
    .then(() => {
      console.log('Connected to MongoDB');
      startServer('mongo');
    })
    .catch((err) => {
      console.warn('MongoDB connection failed. Falling back to demo mode.');
      console.warn(err.message);
      startServer('demo');
    });
}
