'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../lib/auth-context';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeDemo, setActiveDemo] = useState<'coding' | 'recipe' | 'fitness'>('coding');

  const demoExamples = {
    coding: {
      platform: 'YouTube',
      title: '5 React Performance Wins I Wish I Knew Earlier',
      duration: '08:42',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80',
      category: 'Programming',
      summary: 'Practical walkthrough of rendering, memoization, lazy loading, and avoiding unnecessary work in React apps.',
      takeaways: [
        'Profile before optimizing using React DevTools Profiler.',
        'Keep state as local as possible to avoid parent-tree cascading re-renders.',
        'Lazy-load large routes and expensive UI components with React.lazy().',
      ],
      code: `function ExpensiveParent() {\n  return (\n    <div>\n      <IsolatedCounter />\n      <VeryHeavyChart />\n    </div>\n  );\n}`,
      action: 'Profile top 3 slowest views with React Profiler',
    },
    recipe: {
      platform: 'Instagram',
      title: 'High-Protein Breakfast in 10 Minutes (35g Protein)',
      duration: '00:58',
      thumbnail: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80',
      category: 'Cooking & Food',
      summary: 'Fast vegetarian breakfast combining paneer, diced onions, and spices for an energizing high-protein start.',
      takeaways: [
        'Prep chopped onions and tomatoes beforehand for sub-10 minute cook times.',
        'Add paneer on low heat to preserve moisture and softness.',
        'Yields 35g complete protein under 350 calories.',
      ],
      code: `# Nutrition Breakdown\nProtein: 35g  •  Carbs: 14g  •  Fats: 16g\nPrep: 3 mins  •  Cook: 7 mins`,
      action: 'Buy fresh paneer for weekly breakfast prep',
    },
    fitness: {
      platform: 'Instagram',
      title: 'Fix Your Overhead Shoulder Mobility Routine',
      duration: '01:15',
      thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80',
      category: 'Fitness',
      summary: '3 corrective exercises targeting thoracic extension and lat tightness before heavy pressing movements.',
      takeaways: [
        'Foam roll upper thoracic spine with arms crossed for 90 seconds.',
        'Perform PVC pipe pass-throughs with locked elbows and slow tempo.',
        'Banded face-pulls activate lower traps and external rotators.',
      ],
      code: `Routine:\n1. Thoracic Roller: 2 sets x 45s\n2. Band Pass-throughs: 3 sets x 12 reps\n3. Face Pulls: 3 sets x 15 reps`,
      action: 'Add 5-minute mobility circuit before bench/overhead workouts',
    },
  };

  const current = demoExamples[activeDemo];

  return (
    <div style={{ minHeight: '100vh', background: '#09070f', color: '#f7f2fa', overflowX: 'hidden' }}>
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'fixed',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, rgba(124, 58, 237, 0.08) 45%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Navigation Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(20px)',
          background: 'rgba(9, 7, 15, 0.75)',
          borderBottom: '1px solid #1f192b',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, #ba82ff, #7444d7)',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 20px rgba(135, 82, 233, 0.4)',
                fontSize: '15px',
                fontWeight: 900,
              }}
            >
              ⚡
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>SuperSave</span>
          </Link>

          <nav className="landing-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <a href="#features" style={{ fontSize: '13px', color: '#a69cb0', textDecoration: 'none' }}>Features</a>
            <a href="#how-it-works" style={{ fontSize: '13px', color: '#a69cb0', textDecoration: 'none' }}>How it Works</a>
            <a href="#mobile" style={{ fontSize: '13px', color: '#a69cb0', textDecoration: 'none' }}>Android & Extension</a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <Link
                href="/dashboard"
                style={{
                  background: 'linear-gradient(135deg, #ba82ff, #8752e9)',
                  color: '#fff',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 6px 20px rgba(135, 82, 233, 0.35)',
                }}
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  style={{
                    color: '#d6cbe4',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    padding: '8px 14px',
                  }}
                >
                  Log in
                </Link>
                <Link
                  href="/login"
                  style={{
                    background: 'linear-gradient(135deg, #ba82ff, #8752e9)',
                    color: '#fff',
                    padding: '9px 18px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 6px 20px rgba(135, 82, 233, 0.35)',
                  }}
                >
                  Start Free →
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px 40px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            background: 'rgba(168, 85, 247, 0.12)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            fontSize: '12px',
            fontWeight: 700,
            color: '#d8b4fe',
            marginBottom: '26px',
            letterSpacing: '0.02em',
          }}
        >
          <span>✨</span>
          <span>Multimodal AI Second Brain for Reels, Videos & the Web</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(36px, 6vw, 62px)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.04em',
            margin: '0 auto 22px',
            maxWidth: '900px',
            background: 'linear-gradient(180deg, #ffffff 30%, #c4b5fd 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Stop saving links you never open. Turn them into instant knowledge.
        </h1>

        <p
          style={{
            fontSize: '18px',
            lineHeight: 1.6,
            color: '#a69cb0',
            maxWidth: '680px',
            margin: '0 auto 36px',
          }}
        >
          Save any Instagram Reel, YouTube tutorial, or X post in 1 click. Gemini 3.5 AI watches and listens to extract
          clean code snippets, step-by-step recipes, takeaways, and timestamps.
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
          <Link
            href="/login"
            style={{
              background: 'linear-gradient(135deg, #ba82ff, #7c3aed)',
              color: '#ffffff',
              padding: '14px 28px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 12px 36px rgba(124, 58, 237, 0.45)',
              transition: 'all 0.2s ease',
            }}
          >
            Create Your Knowledge Vault Free →
          </Link>

          <a
            href="#demo"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid #2f2540',
              color: '#ded3ec',
              padding: '14px 24px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            See Live Example ↓
          </a>
        </div>

        {/* Platform pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', flexWrap: 'wrap', color: '#7a7086', fontSize: '12px', fontWeight: 600 }}>
          <span>Supports:</span>
          <span style={{ color: '#baa0dc' }}>📸 Instagram Reels</span>
          <span style={{ color: '#baa0dc' }}>▶️ YouTube Videos</span>
          <span style={{ color: '#baa0dc' }}>𝕏 Threads</span>
          <span style={{ color: '#baa0dc' }}>📌 Pinterest</span>
          <span style={{ color: '#baa0dc' }}>🌐 Any Web Page</span>
        </div>
      </section>

      {/* Interactive Live Demo Preview Card */}
      <section id="demo" style={{ maxWidth: '1060px', margin: '40px auto 80px', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '18px' }}>
          {(['coding', 'recipe', 'fitness'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveDemo(tab)}
              style={{
                border: '1px solid',
                borderColor: activeDemo === tab ? '#8752e9' : '#272036',
                background: activeDemo === tab ? '#22163b' : '#120e1c',
                color: activeDemo === tab ? '#f3e8ff' : '#9c91a8',
                padding: '8px 18px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease',
              }}
            >
              {tab === 'coding' ? '💻 Coding Tutorial' : tab === 'recipe' ? '🍳 Cooking Recipe' : '💪 Fitness Routine'}
            </button>
          ))}
        </div>

        {/* Card Mockup Shell */}
        <div
          style={{
            background: 'linear-gradient(160deg, #151122 0%, #0d0a14 100%)',
            border: '1px solid #332648',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Mock Window Controls */}
          <div
            style={{
              padding: '12px 18px',
              borderBottom: '1px solid #221a30',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0d0a15',
            }}
          >
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
            <span style={{ marginLeft: '12px', fontSize: '11px', color: '#6a6077', fontFamily: 'monospace' }}>
              supersave://library/{current.platform.toLowerCase()}/{activeDemo}
            </span>
          </div>

          <div className="landing-demo-grid">
            {/* Left Column: Media + Summary */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: current.platform === 'Instagram' ? '#5a1d52' : '#571818',
                    color: '#fff',
                  }}
                >
                  {current.platform}
                </span>
                <span style={{ fontSize: '12px', color: '#8d8299' }}>{current.category}</span>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#b9a5d1', fontFamily: 'monospace' }}>
                  ⏱️ {current.duration}
                </span>
              </div>

              <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em', color: '#f5effc' }}>
                {current.title}
              </h3>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#a69cb0', margin: '0 0 18px' }}>{current.summary}</p>

              <div style={{ background: '#09070f', border: '1px solid #231b31', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#baa0dc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  ⚡ AI Key Takeaways
                </div>
                {current.takeaways.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '12.5px', color: '#cfc4dd', marginBottom: '6px', lineHeight: 1.5 }}>
                    <span style={{ color: '#ba82ff' }}>•</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: '#09070f', border: '1px solid #231b31', borderRadius: '12px', padding: '14px', fontFamily: 'monospace', fontSize: '11.5px', color: '#d5c4ea', whiteSpace: 'pre-wrap' }}>
                {current.code}
              </div>
            </div>

            {/* Right Column: Visual Card preview + Action Item */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  height: '180px',
                  borderRadius: '14px',
                  backgroundImage: `url(${current.thumbnail})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                  border: '1px solid #2d243b',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(9, 7, 15, 0.9) 0%, transparent 60%)',
                    borderRadius: '14px',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    right: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'rgba(34, 22, 59, 0.85)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(186, 130, 255, 0.3)',
                    fontSize: '11px',
                    color: '#e7d8f9',
                  }}
                >
                  <span>✓</span>
                  <span>14 Multimodal Dimensions Ready</span>
                </div>
              </div>

              <div style={{ background: '#120e1c', border: '1px solid #241b31', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#8d809c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  🎯 Next Action Item
                </div>
                <div style={{ fontSize: '12.5px', color: '#f0e6fa', lineHeight: 1.4, display: 'flex', gap: '8px' }}>
                  <input type="checkbox" readOnly checked style={{ accentColor: '#ba82ff', marginTop: '3px' }} />
                  <span>{current.action}</span>
                </div>
              </div>

              <div style={{ background: '#120e1c', border: '1px solid #241b31', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#8d809c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  💬 Ask This Note
                </div>
                <p style={{ fontSize: '11.5px', color: '#9d91a9', margin: '0 0 10px' }}>Ask specific questions about this video with instant citations.</p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    readOnly
                    value="How do I implement this?"
                    style={{ flex: 1, background: '#09070f', border: '1px solid #281f35', borderRadius: '8px', padding: '7px 10px', fontSize: '11px', color: '#baa0dc' }}
                  />
                  <button style={{ background: '#7444d7', border: 'none', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
                    Ask
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" style={{ maxWidth: '1100px', margin: '60px auto 100px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', color: '#ba82ff', textTransform: 'uppercase', marginBottom: '8px' }}>
            HOW IT WORKS
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>
            From casual scrolling to permanent memory in 3 steps
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '22px' }}>
          <div style={{ background: 'rgba(18, 14, 26, 0.7)', border: '1px solid #261f33', borderRadius: '18px', padding: '28px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#25173d', border: '1px solid #4a2c7c', display: 'grid', placeItems: 'center', fontSize: '18px', marginBottom: '18px', color: '#d8b4fe' }}>
              1
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 10px' }}>Share from Android or Browser</h3>
            <p style={{ fontSize: '13.5px', color: '#9f94a8', lineHeight: 1.6, margin: 0 }}>
              Use the native Android OS Share Sheet directly from Instagram or YouTube. Or click the SuperSave Chrome extension while browsing.
            </p>
          </div>

          <div style={{ background: 'rgba(18, 14, 26, 0.7)', border: '1px solid #261f33', borderRadius: '18px', padding: '28px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#25173d', border: '1px solid #4a2c7c', display: 'grid', placeItems: 'center', fontSize: '18px', marginBottom: '18px', color: '#d8b4fe' }}>
              2
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 10px' }}>Multimodal AI Synthesis</h3>
            <p style={{ fontSize: '13.5px', color: '#9f94a8', lineHeight: 1.6, margin: 0 }}>
              Gemini 3.5 inspects the actual video visuals, slides, on-screen code, and spoken audio to extract 14 structured intelligence dimensions.
            </p>
          </div>

          <div style={{ background: 'rgba(18, 14, 26, 0.7)', border: '1px solid #261f33', borderRadius: '18px', padding: '28px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#25173d', border: '1px solid #4a2c7c', display: 'grid', placeItems: 'center', fontSize: '18px', marginBottom: '18px', color: '#d8b4fe' }}>
              3
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 10px' }}>Searchable Second Brain</h3>
            <p style={{ fontSize: '13.5px', color: '#9f94a8', lineHeight: 1.6, margin: 0 }}>
              Instantly search by topic, tag, or spoken word. AI automatically organizes content into smart collections so you can retrieve answers instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section id="features" style={{ maxWidth: '1100px', margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', color: '#ba82ff', textTransform: 'uppercase', marginBottom: '8px' }}>
            POWERFUL CAPABILITIES
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>
            Engineered for high-signal learning
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
          {[
            {
              icon: '📱',
              title: 'Android OS Share Target',
              desc: 'Tap "Share" inside Instagram, YouTube, or TikTok and select SuperSave. Runs as an offline-capable PWA on any mobile phone.',
            },
            {
              icon: '🧩',
              title: 'Browser Extension & Fast Capture',
              desc: 'Chrome & Brave extension with clipboard auto-detection, keyboard shortcuts, and right-click context menu saving.',
            },
            {
              icon: '⚡',
              title: '14 Multimodal Dimensions',
              desc: 'Chapters, code snippets, visual text, diagrams, key claims, ingredients, and actionable to-do items synthesized automatically.',
            },
            {
              icon: '🤖',
              title: 'Ask this Note (Interactive AI)',
              desc: 'Chat directly with any video note. Get answers grounded in the video with web search verification.',
            },
            {
              icon: '🗂️',
              title: 'Smart Auto-Collections',
              desc: 'AI clusters your library into high-signal collections like React, High-Protein Meals, and DevOps automatically.',
            },
            {
              icon: '🌍',
              title: 'Multi-Language Translation',
              desc: '1-click translate any English tutorial or recipe into Hindi, Spanish, German, French, and Japanese.',
            },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(17, 13, 24, 0.7)',
                border: '1px solid #261e33',
                borderRadius: '16px',
                padding: '24px',
                transition: 'transform 0.2s ease',
              }}
            >
              <div style={{ fontSize: '26px', marginBottom: '14px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: '#9c90a6', lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section
        style={{
          maxWidth: '1000px',
          margin: '0 auto 80px',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #251644 0%, #130c22 100%)',
            border: '1px solid #4a287e',
            borderRadius: '26px',
            padding: '54px 36px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(108, 50, 196, 0.25)',
          }}
        >
          <h2 style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 14px' }}>
            Start building your personal knowledge vault today
          </h2>
          <p style={{ fontSize: '15px', color: '#c4b5d6', maxWidth: '540px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            Free for personal use. Never lose a valuable insight, recipe, or tutorial again.
          </p>
          <Link
            href="/login"
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #ba82ff, #7c3aed)',
              color: '#ffffff',
              padding: '14px 32px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 10px 30px rgba(135, 82, 233, 0.5)',
            }}
          >
            Sign In & Open SuperSave →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1b1626', padding: '32px 24px', textAlign: 'center', color: '#6d6379', fontSize: '12px' }}>
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} SuperSave. Powered by Gemini 3.5 & Supabase.</p>
      </footer>
    </div>
  );
}
