import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import contractRoutes from './routes/contracts.js';
import jobRoutes from './routes/jobs.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api/rental-contracts', contractRoutes);
app.use('/api/fulfillment-jobs', jobRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`Rocket Rentals API listening on http://localhost:${PORT}`);
});
