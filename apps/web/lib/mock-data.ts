import type { SavedContent } from './types';

export const mockContent: SavedContent[] = [
  {
    id: 'react-performance',
    title: '5 React Performance Wins I Wish I Knew Earlier',
    content_type: 'code_tutorial',
    summary: 'A practical walkthrough of rendering, memoization, lazy loading, and avoiding unnecessary work in React apps.',
    summary_detail: {
      executive: 'Comprehensive guide covering real-world React render bottlenecks, why premature memoization hurts performance, and how pushing state down removes rerenders entirely.',
      tldr: 'Profile before optimizing • Push state down • Lazy load routes • Avoid premature useMemo',
    },
    category: 'Programming',
    subcategory: 'Frontend Architecture',
    source: 'YouTube',
    sourceUrl: 'https://youtube.com/watch?v=demo',
    savedAt: 'Today',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80',
    embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1',
    tags: ['React', 'Performance', 'Frontend', 'Next.js'],
    duration: '08:42',
    notes: `## Core idea
Performance improvements should remove unnecessary work rather than add clever abstractions.

## Practical techniques
1. Keep component state as local as possible.
2. Use memoization only when re-renders are measurably expensive.
3. Lazy-load large routes and components.
4. Stabilize expensive callbacks passed to memoized children.
5. Profile with Chrome DevTools before optimizing.

## Recommended workflow
- Reproduce the slow interaction.
- Record a React Profiler trace.
- Identify the largest repeated work.
- Apply one change and measure again.`,
    keyTakeaways: [
      'Profile with DevTools before optimizing using React DevTools Profiler.',
      'Push state down into subcomponents instead of lifting state up unnecessarily.',
      'Lazy-load large routes and expensive UI components with React.lazy().',
    ],
    chapters: [
      { timestamp: '00:00', seconds: 0, title: 'Introduction & Problem Hook', summary: 'Why React apps feel sluggish in large codebases' },
      { timestamp: '01:15', seconds: 75, title: 'Pushing State Down', summary: 'Avoid lifting state up prematurely' },
      { timestamp: '03:40', seconds: 220, title: 'Memoization Truths', summary: 'When useMemo and useCallback hurt performance' },
      { timestamp: '06:10', seconds: 370, title: 'Code Splitting Routes', summary: 'Dynamic imports with Next.js dynamic()' },
    ],
    code_snippets: [
      {
        language: 'tsx',
        title: 'Pushing State Down Pattern',
        code: `// Move state to the branch that actually needs it\nfunction IsolatedCounter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;\n}\n\nexport function Dashboard() {\n  return (\n    <div>\n      <ExpensiveHeader />\n      <IsolatedCounter />\n      <HugeDataGrid />\n    </div>\n  );\n}`,
        timestamp: '02:30',
      },
    ],
    visual_insights: {
      on_screen_text: ['React DevTools Profiler', 'Flamegraph Waterfall Analysis', 'Lifting State Down'],
      diagrams_or_slides: ['Component tree re-render waterfall comparison diagram'],
      tools_or_ui_shown: ['VS Code', 'Chrome DevTools Profiler', 'Vite App'],
      objects_or_ingredients: ['MacBook Pro M3', 'Mechanical Keyboard'],
    },
    detected_resources: [
      { name: 'React Official Documentation', type: 'website', reference: 'https://react.dev' },
      { name: 'React Compiler Playground', type: 'tool', reference: 'https://playground.react.dev' },
    ],
    detected_products: [
      { brand: 'Meta', name: 'React 19', category: 'Software Framework' },
      { brand: 'Google', name: 'Chrome DevTools', category: 'Browser Profiler' },
    ],
    facts_and_claims: [
      {
        claim: 'Over 80% of useMemo usages add net overhead due to dependency array checks',
        verification_note: 'Backed by React compiler team benchmarks showing memoization overhead on trivial calculations',
      },
    ],
    metadata: {
      tags: ['React', 'Performance', 'Frontend', 'Next.js'],
      keywords: ['memoization', 'render tree', 'flamegraph', 'profiler'],
      technologies: ['React 19', 'Next.js', 'TypeScript'],
      people: ['Engineering Lead'],
      brands: ['YouTube', 'Meta'],
      locations: [],
    },
    action_items: [
      'Profile top 3 slowest views with React Profiler',
      'Refactor global modal state into local state',
      'Replace static imports of heavy modals with dynamic imports',
    ],
    personalNote: 'Try the profiler workflow on the next dashboard performance issue.',
  },
  {
    id: 'protein-breakfast',
    title: 'High-Protein Breakfast in 10 Minutes',
    content_type: 'recipe',
    summary: 'An easy vegetarian breakfast combining paneer, vegetables, and spices for a fast 35g high-protein meal.',
    summary_detail: {
      executive: 'Quick, high-satiety vegetarian breakfast designed for fitness and busy mornings, delivering 35g protein in under 10 minutes.',
      tldr: '150g paneer • Sauté veggies with spices • 35g protein • Ready in 10 mins',
    },
    category: 'Cooking & Food',
    subcategory: 'Healthy Fitness Meals',
    source: 'Instagram',
    sourceUrl: 'https://instagram.com/reel/demo',
    savedAt: 'Yesterday',
    thumbnail: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80',
    tags: ['Breakfast', 'Vegetarian', 'Quick', 'HighProtein'],
    duration: '00:58',
    notes: `## Ingredients
- 150g fresh paneer (crumbled)
- 1 diced onion & 1 tomato
- 2 green chillies
- Turmeric, cumin, black pepper, pink salt
- Fresh coriander for garnish

## Cooking Steps
1. Chop vegetables finely.
2. Sauté onion and green chillies in 1 tsp olive oil or ghee for 2 minutes.
3. Add diced tomato and dry spices; cook until soft.
4. Add crumbled paneer; toss for 3 minutes on gentle heat.
5. Finish with chopped coriander.`,
    keyTakeaways: [
      'Prep chopped vegetables beforehand for a <10 minute cook time.',
      'Add paneer late on gentle heat so it retains moisture and softness.',
      'Yields 35g protein with under 350 total calories.',
    ],
    chapters: [
      { timestamp: '00:00', seconds: 0, title: 'Ingredients Overview', summary: 'Paneer, veggies, and spices breakdown' },
      { timestamp: '00:18', seconds: 18, title: 'Sautéing Vegetables', summary: 'Cooking onions, tomatoes, and chillies' },
      { timestamp: '00:40', seconds: 40, title: 'Paneer Fold & Plating', summary: 'Gentle toss and nutritional macros' },
    ],
    code_snippets: [],
    visual_insights: {
      on_screen_text: ['35g Protein', '10 Min Prep', 'Paneer Bhurji Healthy Style'],
      diagrams_or_slides: ['Macro breakdown graphic: 35g P / 12g C / 18g F'],
      tools_or_ui_shown: ['Cast iron skillet', 'Digital kitchen scale'],
      objects_or_ingredients: ['Fresh Paneer', 'Onion', 'Tomato', 'Cumin', 'Green chilli'],
    },
    detected_resources: [
      { name: 'Macro Tracker', type: 'tool', reference: 'MyFitnessPal' },
    ],
    detected_products: [
      { brand: 'Amul', name: 'Fresh Malai Paneer', category: 'Dairy' },
    ],
    facts_and_claims: [
      {
        claim: 'Delivers 35 grams of vegetarian protein in a single meal',
        verification_note: '150g paneer contains ~27g protein plus 8g from veggies and dairy additions',
      },
    ],
    metadata: {
      tags: ['Breakfast', 'Vegetarian', 'Quick', 'HighProtein'],
      keywords: ['paneer', 'bhurji', 'macros', 'quick meal'],
      technologies: [],
      people: ['Fitness Chef'],
      brands: ['Instagram'],
      locations: [],
    },
    action_items: [
      'Buy fresh paneer for weekly breakfast prep',
      'Keep pre-chopped onions in an airtight container',
    ],
    personalNote: 'Could prep the vegetables the night before.',
  },
  {
    id: 'aws-deploy',
    title: 'Deploy a Node API to AWS in a Simple Flow',
    content_type: 'code_tutorial',
    summary: 'A compact deployment workflow using Docker, ECR, EC2, and Nginx.',
    summary_detail: {
      executive: 'Step-by-step production deployment pipeline pushing containerized Node.js services to AWS with reverse proxying.',
      tldr: 'Docker build • Push to ECR • EC2 pull • Nginx reverse proxy',
    },
    category: 'Cloud',
    subcategory: 'DevOps & Infrastructure',
    source: 'YouTube',
    sourceUrl: 'https://youtube.com/watch?v=aws-demo',
    savedAt: '3 days ago',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80',
    tags: ['AWS', 'Docker', 'Node.js', 'DevOps'],
    duration: '12:15',
    notes: `## Flow
Local Docker build → ECR push → EC2 pull → container run → Nginx reverse proxy.

## Checklist
- Build and tag image.
- Authenticate Docker with ECR.
- Push image.
- Pull image on EC2.
- Expose the app internally.
- Proxy traffic through Nginx.`,
    keyTakeaways: [
      'ECR is the container registry.',
      'Keep the app behind Nginx reverse proxy.',
      'Automate image deployment after the manual flow works.',
    ],
    chapters: [
      { timestamp: '00:00', seconds: 0, title: 'Architecture Overview', summary: 'ECR to EC2 flow' },
      { timestamp: '03:10', seconds: 190, title: 'Dockerizing Node.js', summary: 'Multi-stage Dockerfile' },
      { timestamp: '07:45', seconds: 465, title: 'ECR Authentication', summary: 'AWS CLI login' },
      { timestamp: '10:00', seconds: 600, title: 'Nginx Config & SSL', summary: 'Configuring reverse proxy' },
    ],
    code_snippets: [
      {
        language: 'bash',
        title: 'ECR Push Script',
        code: `aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com\ndocker build -t my-api .\ndocker push 123456789.dkr.ecr.us-east-1.amazonaws.com/my-api:latest`,
        timestamp: '08:15',
      },
    ],
    visual_insights: {
      on_screen_text: ['AWS Management Console', 'EC2 Security Groups', 'Port 80/443'],
      diagrams_or_slides: ['AWS Architecture Diagram showing ECR, EC2, and VPC'],
      tools_or_ui_shown: ['AWS Console', 'iTerm2', 'Docker Desktop'],
      objects_or_ingredients: [],
    },
    detected_resources: [
      { name: 'AWS CLI Documentation', type: 'website', reference: 'https://docs.aws.amazon.com/cli' },
    ],
    detected_products: [
      { brand: 'Amazon Web Services', name: 'EC2 & ECR', category: 'Cloud Infrastructure' },
    ],
    facts_and_claims: [],
    metadata: {
      tags: ['AWS', 'Docker', 'Node.js', 'DevOps'],
      keywords: ['ECR', 'EC2', 'Docker', 'Nginx'],
      technologies: ['Docker', 'AWS CLI', 'Nginx', 'Node.js'],
      people: [],
      brands: ['AWS'],
      locations: [],
    },
    action_items: [
      'Create ECR repository in us-east-1',
      'Configure IAM user with ECR push permissions',
    ],
    personalNote: '',
  },
  {
    id: 'brand-storytelling',
    title: 'Make a Brand Story People Actually Remember',
    content_type: 'business',
    summary: 'A creator breaks down a repeatable framework for turning product features into a memorable story.',
    category: 'Marketing',
    source: 'Instagram',
    sourceUrl: 'https://instagram.com/reel/story-demo',
    savedAt: 'Last week',
    thumbnail: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80',
    tags: ['Branding', 'Storytelling', 'Marketing'],
    duration: '01:23',
    notes: `## Framework
Start with the user's problem, show the change, then make the product the enabler rather than the hero.

## Structure
1. Situation
2. Tension
3. Shift
4. Outcome
5. Memorable line`,
    keyTakeaways: [
      'Lead with the user problem, not your product features.',
      'Show clear transformation before and after.',
      'Make the outcome emotionally concrete.',
    ],
    chapters: [
      { timestamp: '00:00', seconds: 0, title: 'The Feature Trap', summary: 'Why feature lists fail' },
      { timestamp: '00:35', seconds: 35, title: 'The 5-Step Story Arc', summary: 'Situation to memorable line' },
    ],
    code_snippets: [],
    visual_insights: {
      on_screen_text: ['Situation', 'Tension', 'Shift', 'Outcome'],
      diagrams_or_slides: ['Story arc curve graphic'],
      tools_or_ui_shown: ['Notion story board'],
      objects_or_ingredients: ['Coffee cup', 'Notebook'],
    },
    detected_resources: [],
    detected_products: [],
    facts_and_claims: [],
    action_items: ['Rewrite landing page hero using the 5-step story arc'],
    personalNote: '',
  },
];
