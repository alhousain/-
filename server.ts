import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Cloud data file path
const DATA_DIR = path.resolve(__dirname, 'data');
const CLOUD_STORAGE_FILE = path.join(DATA_DIR, 'cloud_schedule.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// API: Save entire schedule to Cloud
app.post('/api/cloud-save', (req, res) => {
  try {
    const { appointments, students, settings } = req.body;
    if (!appointments || !students || !settings) {
      return res.status(400).json({ success: false, error: 'بيانات غير مكتملة' });
    }

    const payload = {
      version: '2.0',
      lastSavedAt: new Date().toISOString(),
      appointments,
      students,
      settings,
    };

    fs.writeFileSync(CLOUD_STORAGE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    return res.json({
      success: true,
      lastSavedAt: payload.lastSavedAt,
      message: 'تم حفظ الجدول سحابياً بنجاح',
    });
  } catch (error) {
    console.error('Error saving to cloud:', error);
    return res.status(500).json({ success: false, error: 'فشل الحفظ السحابي' });
  }
});

// API: Load schedule from Cloud
app.get('/api/cloud-load', (_req, res) => {
  try {
    if (!fs.existsSync(CLOUD_STORAGE_FILE)) {
      return res.json({ success: true, hasData: false });
    }

    const raw = fs.readFileSync(CLOUD_STORAGE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return res.json({
      success: true,
      hasData: true,
      data: parsed,
    });
  } catch (error) {
    console.error('Error loading from cloud:', error);
    return res.status(500).json({ success: false, error: 'فشل استرجاع البيانات السحابية' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production static assets
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Development mode with Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Teacher Scheduler server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
