import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import rateLimit from 'express-rate-limit';

const app = express();

// --- Security: Restrict CORS to known origins ---
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'chrome-extension://*',  // Chrome extension popups
];
app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server (no origin) and known origins
      if (!origin || ALLOWED_ORIGINS.some((o) => o === origin || (o.includes('*') && origin?.startsWith(o.replace('*', ''))))) {
        return callback(null, true);
      }
      callback(new Error('Blocked by CORS'));
    },
    credentials: true,
  })
);

// --- Security: Rate limiting ---
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const extractionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                   // 10 extractions per 15 min (protects Gemini API credits)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Extraction rate limit reached. Please wait before saving more content.' },
});

app.use(generalLimiter);
app.use(express.json({ limit: '2mb' }));

const PORT = Number(process.env.API_PORT || 4000);
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export type Chapter = {
  timestamp: string;
  seconds: number;
  title: string;
  summary: string;
};

export type CodeSnippet = {
  language: string;
  title: string;
  code: string;
  timestamp?: string;
};

export type VisualInsights = {
  on_screen_text: string[];
  diagrams_or_slides: string[];
  tools_or_ui_shown: string[];
  objects_or_ingredients: string[];
};

export type DetectedResource = {
  name: string;
  type: string;
  reference: string;
};

export type DetectedProduct = {
  brand: string;
  name: string;
  category: string;
};

export type FactOrClaim = {
  claim: string;
  verification_note: string;
};

export type DeepMetadata = {
  tags: string[];
  keywords: string[];
  technologies: string[];
  people: string[];
  brands: string[];
  locations: string[];
};

export type SummaryDetail = {
  executive: string;
  tldr: string;
};

export type Item = {
  id: string;
  url: string;
  status: 'processing' | 'ready' | 'failed';
  createdAt: string;
  title: string;
  content_type?: string;
  category: string;
  subcategory?: string;
  summary: string;
  summary_detail?: SummaryDetail;
  notes: string;
  tags: string[];
  keyTakeaways: string[];
  chapters?: Chapter[];
  visual_insights?: VisualInsights;
  code_snippets?: CodeSnippet[];
  detected_resources?: DetectedResource[];
  detected_products?: DetectedProduct[];
  facts_and_claims?: FactOrClaim[];
  metadata?: DeepMetadata;
  action_items?: string[];
  personalNote: string;
  source: 'Instagram' | 'YouTube' | 'Upload' | 'Web' | 'Pinterest';
  duration?: string;
  thumbnail?: string;
  embed_url?: string;
  extractionMode?: 'video_lowres' | 'audio_fast';
};

import { dbStore } from './db';
const store = dbStore;

function isValidHttpUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '169.254.169.254' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.16.') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function sourceFor(url: string): Item['source'] {
  const value = url.toLowerCase();
  if (value.includes('instagram.com')) return 'Instagram';
  if (value.includes('youtube.com') || value.includes('youtu.be')) return 'YouTube';
  if (value.includes('pinterest.com') || value.includes('pin.it')) return 'Pinterest';
  return 'Web';
}

function seed(
  id: string,
  source: Item['source'],
  title: string,
  contentType: string,
  summary: string,
  category: string,
  subcategory: string,
  notes: string,
  tags: string[],
  keyTakeaways: string[],
  thumbnail: string,
  duration: string,
  embedUrl: string,
  chapters: Chapter[],
  codeSnippets: CodeSnippet[],
  visualInsights: VisualInsights,
  resources: DetectedResource[],
  products: DetectedProduct[],
  facts: FactOrClaim[],
  actions: string[]
) {
  store.set(id, {
    id,
    url: source === 'Instagram' ? 'https://instagram.com/reel/demo' : 'https://youtube.com/watch?v=demo',
    status: 'ready',
    createdAt: new Date().toISOString(),
    title,
    content_type: contentType,
    summary,
    summary_detail: {
      executive: summary,
      tldr: keyTakeaways.join(' • '),
    },
    category,
    subcategory,
    notes,
    tags,
    keyTakeaways,
    chapters,
    code_snippets: codeSnippets,
    visual_insights: visualInsights,
    detected_resources: resources,
    detected_products: products,
    facts_and_claims: facts,
    metadata: {
      tags,
      keywords: tags.map((t) => t.toLowerCase()),
      technologies: tags,
      people: ['Engineering Lead'],
      brands: [source],
      locations: [],
    },
    action_items: actions,
    personalNote: '',
    source,
    thumbnail,
    duration,
    embed_url: embedUrl,
  });
}

if (store.count() === 0) {
  seed(
    'react-performance',
    'YouTube',
    '5 React Performance Wins I Wish I Knew Earlier',
    'code_tutorial',
    'A practical walkthrough of rendering, memoization, lazy loading, and avoiding unnecessary work in React apps.',
    'Programming',
    'Frontend Optimization',
    '## Core idea\nPerformance improvements should remove unnecessary work rather than add clever abstractions.\n\n## Practical techniques\n1. Keep component state as local as possible.\n2. Use memoization only when re-renders are measurably expensive.\n3. Lazy-load large routes and components.\n4. Stabilize expensive callbacks passed to memoized children.\n5. Profile with Chrome DevTools before optimizing.',
    ['React', 'Performance', 'Frontend', 'Next.js'],
    [
      'Profile before optimizing using React DevTools Profiler.',
      'Keep state as local as possible to avoid parent-tree cascading re-renders.',
      'Lazy-load large routes and expensive UI components with React.lazy().',
    ],
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80',
    '08:42',
    'https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1',
    [
      { timestamp: '00:00', seconds: 0, title: 'Introduction & Problem Hook', summary: 'Why React apps feel sluggish' },
      { timestamp: '01:15', seconds: 75, title: 'Pushing State Down', summary: 'Avoid lifting state up prematurely' },
      { timestamp: '03:40', seconds: 220, title: 'Memoization Truths', summary: 'When useMemo hurts performance' },
      { timestamp: '06:10', seconds: 370, title: 'Code Splitting Routes', summary: 'Using dynamic imports' },
    ],
    [
      {
        language: 'tsx',
        title: 'State Isolation Pattern',
        code: `function ExpensiveParent() {\n  return (\n    <div>\n      <IsolatedCounter />\n      <VeryHeavyChart />\n    </div>\n  );\n}`,
        timestamp: '02:30',
      },
    ],
    {
      on_screen_text: ['React DevTools Profiler', 'Flamegraph Analysis', 'Lifting State Down'],
      diagrams_or_slides: ['Component tree re-render waterfall comparison diagram'],
      tools_or_ui_shown: ['VS Code', 'Chrome DevTools Profiler', 'Vite App'],
      objects_or_ingredients: ['MacBook Pro', 'Mechanical Keyboard'],
    },
    [{ name: 'React Documentation', type: 'website', reference: 'https://react.dev' }],
    [{ brand: 'Meta', name: 'React 19', category: 'Software Framework' }],
    [{ claim: 'Over 80% of useMemo usages add net overhead due to dependency array checks', verification_note: 'Backed by React compiler team profiling studies' }],
    ['Profile top 3 slowest views with React Profiler', 'Refactor global modal state into local state']
  );

  seed(
    'protein-breakfast',
    'Instagram',
    'High-Protein Breakfast in 10 Minutes',
    'recipe',
    'An easy vegetarian breakfast combining paneer, vegetables, and spices for a fast 35g high-protein meal.',
    'Cooking & Food',
    'Healthy Vegetarian',
    '## Ingredients\n- 150g fresh paneer (crumbled)\n- 1 diced onion & 1 tomato\n- 2 green chillies\n- Turmeric, cumin, black pepper, pink salt\n\n## Cooking Steps\n1. Heat 1 tsp olive oil or ghee in pan.\n2. Sauté onion and green chillies for 2 minutes until translucent.\n3. Add chopped tomato and dry spices; cook until soft.\n4. Add crumbled paneer; toss for 3 minutes on low heat.',
    ['Breakfast', 'Vegetarian', 'Fitness', 'HighProtein'],
    [
      'Prep chopped vegetables beforehand for a <10 minute cook time.',
      'Add paneer late on gentle heat so it retains moisture and softness.',
      'Yields 35g protein with under 350 calories.',
    ],
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80',
    '00:58',
    '',
    [
      { timestamp: '00:00', seconds: 0, title: 'Ingredient Showcase', summary: 'Paneer, veggies, and spices' },
      { timestamp: '00:18', seconds: 18, title: 'Sautéing Vegetables', summary: 'Cooking onions and spices' },
      { timestamp: '00:40', seconds: 40, title: 'Paneer Fold & Plating', summary: 'Final fold and nutritional breakdown' },
    ],
    [],
    {
      on_screen_text: ['35g Protein', '10 Min Prep', 'Paneer Bhurji Healthy Style'],
      diagrams_or_slides: ['Macro breakdown graphic: 35g P / 12g C / 18g F'],
      tools_or_ui_shown: ['Cast iron skillet', 'Digital kitchen scale'],
      objects_or_ingredients: ['Paneer', 'Onion', 'Tomato', 'Cumin', 'Green chilli'],
    },
    [{ name: 'Nutrition Calculator', type: 'tool', reference: 'MyFitnessPal' }],
    [{ brand: 'Amul', name: 'Fresh Malai Paneer', category: 'Dairy' }],
    [{ claim: 'Contains 35 grams of complete vegetarian protein', verification_note: '150g paneer contains ~27g protein plus 8g from veggies and dairy additions' }],
    ['Buy fresh paneer for weekly breakfast prep', 'Keep pre-chopped onions in container']
  );
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'supersave-api' }));

app.get('/api/content', (req, res) => {
  const q = String(req.query.q || '').toLowerCase().trim();
  const items = Array.from(store.values()).filter(
    (item) => !q || `${item.title} ${item.summary} ${item.notes} ${(item.tags || []).join(' ')}`.toLowerCase().includes(q)
  );
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ items });
});

app.get('/api/content/:id', (req, res) => {
  const item = store.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  return res.json({ item });
});

function triggerExtraction(item: Item, clientMeta?: Record<string, unknown>) {
  fetch(`${AI_SERVICE_URL}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_url: item.url, mode: item.extractionMode || 'video_lowres', client_meta: clientMeta }),
    signal: AbortSignal.timeout(120_000), // 2-minute maximum timeout
  })
    .then(async (r) => {
      if (!r.ok) throw new Error(`AI service responded ${r.status}`);
      return r.json() as Promise<{
        title: string;
        content_type?: string;
        category: string;
        subcategory?: string;
        summary: string;
        summary_detail?: SummaryDetail;
        notes: string;
        tags: string[];
        key_takeaways?: string[];
        chapters?: Chapter[];
        visual_insights?: VisualInsights;
        code_snippets?: CodeSnippet[];
        detected_resources?: DetectedResource[];
        detected_products?: DetectedProduct[];
        facts_and_claims?: FactOrClaim[];
        metadata?: DeepMetadata;
        action_items?: string[];
        thumbnail?: string;
        duration?: string;
        embed_url?: string;
      }>;
    })
    .then((result) => {
      item.status = 'ready';
      item.title = result.title || item.title;
      item.content_type = result.content_type || 'general';
      item.summary = result.summary;
      item.summary_detail = result.summary_detail;
      item.category = result.category || item.category;
      item.subcategory = result.subcategory;
      item.notes = result.notes;
      item.tags = result.tags || [];
      item.keyTakeaways = result.key_takeaways || [];
      item.chapters = result.chapters || [];
      item.visual_insights = result.visual_insights;
      item.code_snippets = result.code_snippets || [];
      item.detected_resources = result.detected_resources || [];
      item.detected_products = result.detected_products || [];
      item.facts_and_claims = result.facts_and_claims || [];
      item.metadata = result.metadata;
      item.action_items = result.action_items || [];
      if (result.thumbnail) item.thumbnail = result.thumbnail;
      if (result.duration) item.duration = result.duration;
      if (result.embed_url) item.embed_url = result.embed_url;
      store.set(item.id, item);
      console.log(`[AI Success] Processed ${item.id} with 14 intelligence dimensions`);
    })
    .catch((error) => {
      console.error(`[AI Error] Failed for ${item.id}:`, error);
      item.status = 'failed';
      item.summary = 'Processing was unable to finish. You can retry extraction anytime.';
      store.set(item.id, item);
    });
}

app.post('/api/content', extractionLimiter, async (req: Request, res: Response) => {
  const url = String(req.body?.url || '').trim();
  const mode = (req.body?.mode === 'audio_fast' ? 'audio_fast' : 'video_lowres') as 'video_lowres' | 'audio_fast';

  if (!url || !isValidHttpUrl(url)) {
    return res.status(400).json({ error: 'A valid public HTTP or HTTPS URL is required' });
  }

  const id = randomUUID();
  const initialSource = sourceFor(url);

  const clientMeta = req.body?.client_meta;

  // Fast Metadata Fetch (< 500ms)
  let initialTitle = clientMeta?.title ? String(clientMeta.title).trim() : 'Analyzing your content…';
  let initialThumbnail: string | undefined = clientMeta?.thumbnail ? String(clientMeta.thumbnail).trim() : undefined;
  let initialCategory = 'Processing';
  let initialEmbed: string | undefined = undefined;

  try {
    const metaResponse = await fetch(`${AI_SERVICE_URL}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_url: url }),
      signal: AbortSignal.timeout(1200),
    });

    if (metaResponse.ok) {
      const meta = (await metaResponse.json()) as {
        title: string;
        thumbnail?: string;
        category?: string;
        embed_url?: string;
      };
      if (meta.title && (!clientMeta?.title || initialTitle === 'Analyzing your content…')) initialTitle = meta.title;
      if (meta.thumbnail && !initialThumbnail) initialThumbnail = meta.thumbnail;
      if (meta.category) initialCategory = meta.category;
      if (meta.embed_url) initialEmbed = meta.embed_url;
    }
  } catch {
    // Timeout fallback
  }

  const item: Item = {
    id,
    url,
    status: 'processing',
    createdAt: new Date().toISOString(),
    title: initialTitle,
    summary: 'Gemini is processing multimodal video intelligence across 14 dimensions…',
    category: initialCategory,
    notes: '',
    tags: [],
    keyTakeaways: [],
    personalNote: '',
    source: initialSource,
    thumbnail: initialThumbnail,
    embed_url: initialEmbed,
    extractionMode: mode,
  };

  store.set(id, item);

  // Asynchronous Multimodal Deep Extraction (Background)
  triggerExtraction(item, clientMeta);

  return res.status(202).json({ item });
});

app.post('/api/content/:id/retry', extractionLimiter, (req: Request, res: Response) => {
  const id = String(req.params.id);
  const item = store.get(id);
  if (!item) return res.status(404).json({ error: 'Content not found' });

  item.status = 'processing';
  item.summary = 'Retrying Gemini multimodal extraction…';
  store.set(id, item);

  triggerExtraction(item);
  return res.json({ ok: true, item });
});

app.patch('/api/content/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const item = store.get(id);
  if (!item) return res.status(404).json({ error: 'Content not found' });

  if (typeof req.body?.title === 'string' && req.body.title.trim()) {
    item.title = req.body.title.trim();
  }
  if (Array.isArray(req.body?.tags)) {
    const sanitized = req.body.tags
      .map((t: unknown) => String(t).trim().replace(/^#+/, '').trim())
      .filter(Boolean);
    item.tags = Array.from(new Set(sanitized));
    if (item.metadata) {
      item.metadata.tags = item.tags;
      item.metadata.keywords = item.tags.map((t) => t.toLowerCase());
    }
  }
  if (typeof req.body?.category === 'string' && req.body.category.trim()) {
    item.category = req.body.category.trim();
  }
  if (typeof req.body?.subcategory === 'string') {
    item.subcategory = req.body.subcategory.trim();
  }
  store.set(id, item);
  return res.json({ ok: true, item });
});

app.delete('/api/content/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  if (!store.has(id)) {
    return res.status(404).json({ error: 'Content not found' });
  }
  store.delete(id);
  return res.json({ ok: true, deletedId: id });
});

app.patch('/api/content/:id/notes', (req, res) => {
  const item = store.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  item.personalNote = String(req.body?.personalNote || '');
  store.set(item.id, item);
  return res.json({ item });
});

app.post('/api/content/:id/qa', async (req, res) => {
  const item = store.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  const question = String(req.body?.question || '').trim();
  const search_mode = req.body?.search_mode === 'note_and_web' ? 'note_and_web' : 'note_only';
  if (!question) return res.status(400).json({ error: 'question is required' });
  try {
    const response = await fetch(`${AI_SERVICE_URL}/qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context: item.notes || item.summary, search_mode }),
    });
    if (!response.ok) throw new Error(`AI service responded ${response.status}`);
    return res.json(await response.json());
  } catch {
    return res.json({
      answer: 'The AI service is temporarily unavailable. Check that FastAPI is running on port 8000.',
      search_mode,
      sources: [],
    });
  }
});

app.post('/api/content/:id/translate', async (req, res) => {
  const item = store.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  const targetLanguage = String(req.body?.language || 'Hindi').trim();

  try {
    const textToTranslate = `Summary:\n${item.summary}\n\nNotes:\n${item.notes}`;
    const response = await fetch(`${AI_SERVICE_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textToTranslate, target_language: targetLanguage }),
    });
    if (!response.ok) throw new Error(`AI translate service responded ${response.status}`);
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Translation failed. AI service may be unreachable.' });
  }
});

app.listen(PORT, () => console.log(`SuperSave API running on http://localhost:${PORT}`));
