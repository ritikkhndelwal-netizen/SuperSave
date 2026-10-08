import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = Number(process.env.API_PORT || 4000);
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

type Item = {
  id: string;
  url: string;
  status: 'processing' | 'ready' | 'failed';
  createdAt: string;
  title: string;
  summary: string;
  category: string;
  notes: string;
  tags: string[];
  keyTakeaways: string[];
  personalNote: string;
  source: 'Instagram' | 'YouTube' | 'Upload' | 'Web';
  duration?: string;
  thumbnail?: string;
  extractionMode?: 'video_lowres' | 'audio_fast';
};

const store = new Map<string, Item>();

function sourceFor(url: string): Item['source'] {
  const value = url.toLowerCase();
  if (value.includes('instagram.com')) return 'Instagram';
  if (value.includes('youtube.com') || value.includes('youtu.be')) return 'YouTube';
  return 'Web';
}

function seed(
  id: string,
  source: Item['source'],
  title: string,
  summary: string,
  category: string,
  notes: string,
  tags: string[],
  keyTakeaways: string[],
  thumbnail: string,
  duration: string
) {
  store.set(id, {
    id,
    url: source === 'Instagram' ? 'https://instagram.com/reel/demo' : 'https://youtube.com/watch?v=demo',
    status: 'ready',
    createdAt: new Date().toISOString(),
    title,
    summary,
    category,
    notes,
    tags,
    keyTakeaways,
    personalNote: '',
    source,
    thumbnail,
    duration,
  });
}

seed(
  'react-performance',
  'YouTube',
  '5 React Performance Wins I Wish I Knew Earlier',
  'A practical walkthrough of rendering, memoization, lazy loading, and avoiding unnecessary work in React apps.',
  'Programming',
  '## Core idea\nPerformance improvements should remove unnecessary work rather than add clever abstractions.\n\n## Practical techniques\n1. Keep component state as local as possible.\n2. Use memoization only when re-renders are measurably expensive.\n3. Lazy-load large routes and components.\n4. Stabilize expensive callbacks passed to memoized children.\n5. Profile before optimizing.',
  ['React', 'Performance', 'Frontend'],
  ['Profile before optimizing.', 'Prefer simpler component state.', 'Lazy-load expensive surfaces.'],
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80',
  '08:42'
);
seed(
  'protein-breakfast',
  'Instagram',
  'High-Protein Breakfast in 10 Minutes',
  'An easy vegetarian breakfast combining paneer, vegetables, and spices for a fast high-protein meal.',
  'Cooking & Food',
  '## Ingredients\n- 100–150 g paneer\n- Onion and tomato\n- Green chilli\n- Mixed spices\n\n## Steps\n1. Chop the vegetables.\n2. Sauté onion until soft.\n3. Add tomato and spices.\n4. Add crumbled paneer.',
  ['Breakfast', 'Vegetarian', 'Quick'],
  ['Prep vegetables first.', 'Add paneer late so it stays soft.', 'Adjust spice to taste.'],
  'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80',
  '00:58'
);
seed(
  'aws-deploy',
  'YouTube',
  'Deploy a Node API to AWS in a Simple Flow',
  'A compact deployment workflow using Docker, ECR, EC2, and Nginx.',
  'Cloud',
  '## Flow\nLocal Docker build → ECR push → EC2 pull → container run → Nginx reverse proxy.\n\n## Checklist\n- Build and tag image.\n- Authenticate Docker with ECR.\n- Push image.\n- Pull image on EC2.',
  ['AWS', 'Docker', 'Node.js'],
  ['ECR is the container registry.', 'Keep the app behind Nginx.', 'Automate image deployment after the manual flow works.'],
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80',
  '12:15'
);
seed(
  'brand-storytelling',
  'Instagram',
  'Make a Brand Story People Actually Remember',
  'A creator breaks down a repeatable framework for turning product features into a memorable story.',
  'Marketing',
  '## Framework\nStart with the user\'s problem, show the change, then make the product the enabler rather than the hero.\n\n## Structure\n1. Situation\n2. Tension\n3. Shift\n4. Outcome\n5. Memorable line',
  ['Branding', 'Storytelling'],
  ['Lead with the problem.', 'Show transformation.', 'Make the outcome concrete.'],
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80',
  '01:23'
);

app.get('/health', (_req, res) => res.json({ ok: true, service: 'supersave-api' }));

app.get('/api/content', (req, res) => {
  const q = String(req.query.q || '').toLowerCase().trim();
  const items = Array.from(store.values()).filter(
    (item) => !q || `${item.title} ${item.summary} ${item.notes} ${item.tags.join(' ')}`.toLowerCase().includes(q)
  );
  // Sort by newest first
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ items });
});

app.get('/api/content/:id', (req, res) => {
  const item = store.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  return res.json({ item });
});

app.post('/api/content', async (req: Request, res: Response) => {
  const url = String(req.body?.url || '').trim();
  const mode = (req.body?.mode === 'audio_fast' ? 'audio_fast' : 'video_lowres') as 'video_lowres' | 'audio_fast';

  if (!url) return res.status(400).json({ error: 'url is required' });
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const id = randomUUID();
  const initialSource = sourceFor(url);

  // Fast Metadata Fetch (< 500ms) to populate title and thumbnail immediately
  let initialTitle = 'Analyzing your content…';
  let initialThumbnail: string | undefined = undefined;
  let initialCategory = 'Processing';

  try {
    const metaResponse = await fetch(`${AI_SERVICE_URL}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_url: url }),
      signal: AbortSignal.timeout(1200), // Quick timeout so we don't delay initial UI feedback
    });

    if (metaResponse.ok) {
      const meta = (await metaResponse.json()) as {
        title: string;
        thumbnail?: string;
        category?: string;
        source?: Item['source'];
      };
      if (meta.title) initialTitle = meta.title;
      if (meta.thumbnail) initialThumbnail = meta.thumbnail;
      if (meta.category) initialCategory = meta.category;
    }
  } catch {
    // If metadata service times out, continue with placeholder
  }

  const item: Item = {
    id,
    url,
    status: 'processing',
    createdAt: new Date().toISOString(),
    title: initialTitle,
    summary: 'Gemini is processing the media and generating structured knowledge notes…',
    category: initialCategory,
    notes: '',
    tags: [],
    keyTakeaways: [],
    personalNote: '',
    source: initialSource,
    thumbnail: initialThumbnail,
    extractionMode: mode,
  };

  store.set(id, item);

  // Asynchronous Multimodal AI Extraction (Background)
  fetch(`${AI_SERVICE_URL}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_url: url, mode }),
  })
    .then(async (r) => {
      if (!r.ok) throw new Error(`AI service responded ${r.status}`);
      return r.json() as Promise<{
        title: string;
        summary: string;
        category: string;
        notes: string;
        tags: string[];
        key_takeaways?: string[];
        thumbnail?: string;
        duration?: string;
      }>;
    })
    .then((result) => {
      item.status = 'ready';
      item.title = result.title || item.title;
      item.summary = result.summary;
      item.category = result.category || item.category;
      item.notes = result.notes;
      item.tags = result.tags || [];
      item.keyTakeaways = result.key_takeaways || [];
      if (result.thumbnail) item.thumbnail = result.thumbnail;
      if (result.duration) item.duration = result.duration;
      console.log(`[AI Success] Processed ${id} (${item.title})`);
    })
    .catch((error) => {
      console.error(`[AI Error] Failed for ${id}:`, error);
      item.status = 'failed';
      item.summary = 'Processing was unable to finish. You can still read metadata or retry.';
    });

  // Return immediately with status 202 and initial metadata
  return res.status(202).json({ item });
});

app.patch('/api/content/:id/notes', (req, res) => {
  const item = store.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  item.personalNote = String(req.body?.personalNote || '');
  return res.json({ item });
});

app.post('/api/content/:id/qa', async (req, res) => {
  const item = store.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  const question = String(req.body?.question || '').trim();
  if (!question) return res.status(400).json({ error: 'question is required' });
  try {
    const response = await fetch(`${AI_SERVICE_URL}/qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context: item.notes || item.summary }),
    });
    if (!response.ok) throw new Error(`AI service responded ${response.status}`);
    return res.json(await response.json());
  } catch {
    return res.json({
      answer: 'The AI service is temporarily unavailable. Check that FastAPI is running on port 8000.',
    });
  }
});

app.listen(PORT, () => console.log(`SuperSave API running on http://localhost:${PORT}`));
