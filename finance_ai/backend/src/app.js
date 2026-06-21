import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import { SupabaseClient } from './lib/supabase.js';
import { authMiddleware } from './middleware/auth.js';
import { getProfile, updateProfile, completeOnboarding } from './handlers/profile.js';
import { listDocuments, uploadDocument, deleteDocument, analyzeDocument } from './handlers/documents.js';
import { getFinancialData, updateFinancialData } from './handlers/financial.js';
import { getAnalysis, runAnalysis } from './handlers/taxAnalysis.js';
import { generateStrategy } from './handlers/taxbuddy.js';
import { startLiveCoach, liveCoachMessage } from './handlers/taxbuddyLive.js';
import { getStats } from './handlers/dashboard.js';
import { getSchemes, getPersonalizedSchemes } from './handlers/schemes.js';

export function createApp() {
  const app = express();
  const sb = new SupabaseClient();

  app.use(morgan('dev'));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }
        if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
          return callback(null, true);
        }
        const frontendUrl = process.env.FRONTEND_URL;
        if (frontendUrl && origin === frontendUrl) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Accept', 'Authorization', 'Content-Type'],
      exposedHeaders: ['Link'],
      credentials: true,
      maxAge: 300,
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 32 * 1024 * 1024 },
  });

  app.use('/api', authMiddleware(sb));

  app.get('/api/profile', getProfile(sb));
  app.put('/api/profile', updateProfile(sb));
  app.post('/api/onboarding/complete', completeOnboarding(sb));

  app.get('/api/documents', listDocuments(sb));
  app.post('/api/documents/upload', upload.single('file'), uploadDocument(sb));
  app.delete('/api/documents/:id', deleteDocument(sb));
  app.post('/api/documents/:id/analyze', analyzeDocument(sb));

  app.get('/api/financial-data', getFinancialData(sb));
  app.put('/api/financial-data', updateFinancialData(sb));

  app.get('/api/tax-analysis', getAnalysis(sb));
  app.post('/api/tax-analysis/run', runAnalysis(sb));
  app.post('/api/taxbuddy/strategy', generateStrategy(sb));
  app.post('/api/taxbuddy/live/start', startLiveCoach(sb));
  app.post('/api/taxbuddy/live/message', liveCoachMessage(sb));

  app.get('/api/dashboard/stats', getStats(sb));
  app.get('/api/schemes', getSchemes(sb));
  app.post('/api/schemes/personalized', getPersonalizedSchemes(sb));

  app.use((err, _req, res, _next) => {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'file too large' });
    }
    console.error(err);
    if (res.headersSent) {
      return;
    }
    res.status(500).json({ error: err?.message || 'internal server error' });
  });

  return app;
}
