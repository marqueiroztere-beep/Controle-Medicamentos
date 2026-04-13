import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes         from './routes/auth';
import medicationRoutes   from './routes/medications';
import agendaRoutes       from './routes/agenda';
import doseRoutes         from './routes/doses';
import notificationRoutes from './routes/notifications';
import adherenceRoutes    from './routes/adherence';
import patientRoutes      from './routes/patients';
import { errorHandler }   from './middleware/errorHandler';
import { configureVapid, sendPendingNotifications } from './services/notificationService';

// Catch any unhandled errors so Railway Deploy Logs show the reason
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection:', reason);
  process.exit(1);
});

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

console.log(`Starting server on PORT=${PORT} NODE_ENV=${process.env.NODE_ENV}`);

// Configure VAPID for push notifications
try {
  configureVapid();
} catch (err) {
  console.warn('VAPID configuration failed (push notifications disabled):', err);
}

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGIN || true
    : true,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Routes
app.use('/api/auth',          authRoutes);
app.use('/api/patients',      patientRoutes);
app.use('/api/medications',   medicationRoutes);
app.use('/api/agenda',        agendaRoutes);
app.use('/api/doses',         doseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/adherence',     adherenceRoutes);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Controle de Medicamentos API running on port ${PORT}`);

  // Poll for notifications every 60 seconds
  setInterval(async () => {
    try {
      await sendPendingNotifications();
    } catch (err) {
      console.error('Notification polling error:', err);
    }
  }, 60_000);

  // Run once at startup too
  sendPendingNotifications().catch(console.error);
});

export default app;
