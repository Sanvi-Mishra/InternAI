import express from 'express';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

dotenv.config();

const GEMINI_KEY = process.env.GEMINI_KEY;
const PORT = process.env.PORT || 3000;

if (!GEMINI_KEY) {
  console.error('Missing GEMINI_KEY in environment. Create server/.env with GEMINI_KEY=your_key');
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: '500kb' }));
app.use(cors());

// Basic rate limiter by IP: small limit to reduce abuse
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max 30 requests per IP per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

/**
 * POST /api/generate
 * Body: { model: "gemini-2.0-flash-exp", request: { ... } }
 * Forwards the request to:
 * https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=GEMINI_KEY
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { model = 'gemini-2.0-flash-exp', request } = req.body;
    if (!request) {
      return res.status(400).json({ error: 'Missing request body (request)' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;

    // Forward request as-is
    const fetchResp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const text = await fetchResp.text();
    // If the upstream responded non-OK, forward status and text
    if (!fetchResp.ok) {
      console.error('Upstream error', fetchResp.status, text);
      return res.status(fetchResp.status).type('text').send(text);
    }

    // Return the raw JSON response
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(text);

  } catch (err) {
    console.error('Proxy error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.send('AOEG proxy running. POST to /api/generate');
});

app.listen(PORT, () => {
  console.log(`AOEG server listening at http://localhost:${PORT}`);
});