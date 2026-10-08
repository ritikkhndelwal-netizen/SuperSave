# Architecture

```text
Browser Extension
        │
        ▼
     Next.js Web
        │
        ▼
    Node API Gateway
       / \
      /   \
  Postgres  FastAPI AI
               │
               ▼
             Gemma 4
```

The extension is a capture layer. The website is the knowledge workspace. The API gateway provides a stable client contract. The AI service is isolated behind an HTTP contract so the model/runtime can change without rewriting clients.
