'use client';

import React from 'react';
import { useCredits } from '../lib/credits-context';

export function CreditModal() {
  const { credits, showCreditsModal, setShowCreditsModal } = useCredits();

  if (!showCreditsModal || !credits) return null;

  const isLow = credits.remaining <= 5 && credits.remaining > 0;
  const isOut = credits.remaining === 0;

  const resetDate = new Date(credits.resetsAt).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className="modal-backdrop"
      onClick={() => setShowCreditsModal(false)}
      style={{ zIndex: 100 }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px', padding: '28px' }}
      >
        <button
          className="modal-close"
          onClick={() => setShowCreditsModal(false)}
          aria-label="Close modal"
        >
          ×
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #ba82ff, #7444d7)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 18,
              boxShadow: '0 4px 16px rgba(135,82,233,0.4)',
            }}
          >
            ⚡
          </div>
          <div>
            <h2 style={{ fontSize: '20px', margin: 0, letterSpacing: '-0.02em' }}>
              Monthly AI Credits
            </h2>
            <span style={{ fontSize: '11px', color: '#9d94a6' }}>
              Free Tier • Automatically renews each month
            </span>
          </div>
        </div>

        {/* Credit Meter Card */}
        <div
          style={{
            margin: '20px 0',
            padding: '18px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(160deg, #181323, #110e19)',
            border: isOut
              ? '1px solid #7f1d1d'
              : isLow
              ? '1px solid #78350f'
              : '1px solid #36294a',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '12px', color: '#ba82ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Remaining Balance
            </span>
            <span style={{ fontSize: '12px', color: '#9e94a8' }}>
              {credits.used} of {credits.limit} used
            </span>
          </div>

          <div style={{ margin: '8px 0 14px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <strong style={{ fontSize: '38px', letterSpacing: '-0.04em', color: isOut ? '#f87171' : isLow ? '#fbbf24' : '#fff' }}>
              {credits.remaining}
            </strong>
            <span style={{ fontSize: '15px', color: '#a097aa' }}>credits left</span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: '8px',
              borderRadius: '999px',
              background: '#231c2e',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${credits.percentage}%`,
                borderRadius: '999px',
                background: isOut
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                  : isLow
                  ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                  : 'linear-gradient(90deg, #ba82ff, #7444d7)',
                transition: 'width 0.4s ease',
                boxShadow: isOut
                  ? '0 0 12px rgba(239,68,68,0.5)'
                  : isLow
                  ? '0 0 12px rgba(245,158,11,0.5)'
                  : '0 0 12px rgba(186,130,255,0.4)',
              }}
            />
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#888092' }}>
            <span>Auto-refills on {resetDate}</span>
            <span>{credits.daysLeft} day{credits.daysLeft === 1 ? '' : 's'} remaining</span>
          </div>
        </div>

        {/* Feature Rules List */}
        <div style={{ display: 'grid', gap: '10px', margin: '20px 0' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12.5px', color: '#ddd' }}>
            <span style={{ color: '#ba82ff', fontSize: '14px' }}>⚡</span>
            <span>
              <strong>1 Save = 1 Credit:</strong> Covers video download & 14-dimension Gemini multimodal synthesis.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12.5px', color: '#ddd' }}>
            <span style={{ color: '#4ade80', fontSize: '14px' }}>♾️</span>
            <span>
              <strong>Unlimited Interactive Q&A:</strong> Ask questions grounded in your saved notes anytime for free.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12.5px', color: '#ddd' }}>
            <span style={{ color: '#4ade80', fontSize: '14px' }}>🌐</span>
            <span>
              <strong>Unlimited Multi-Language Translations:</strong> Translate your knowledge base without consuming credits.
            </span>
          </div>
        </div>

        {/* Pro Banner */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'rgba(147, 83, 238, 0.08)',
            border: '1px solid rgba(147, 83, 238, 0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <strong style={{ display: 'block', fontSize: '12px', color: '#f3e8ff' }}>
              Need more monthly saves?
            </strong>
            <span style={{ fontSize: '11px', color: '#aaa2b4' }}>
              SuperSave Pro with unlimited monthly video captures is launching soon.
            </span>
          </div>
        </div>

        <button
          type="button"
          className="primary-button wide"
          style={{ marginTop: '20px' }}
          onClick={() => setShowCreditsModal(false)}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
