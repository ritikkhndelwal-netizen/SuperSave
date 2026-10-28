'use client';

import React from 'react';
import { useCredits } from '../lib/credits-context';

export function CreditBarWidget() {
  const { credits, loading, setShowCreditsModal } = useCredits();

  if (loading || !credits) {
    return (
      <div
        className="credit-bar-widget"
        style={{
          border: '1px solid #282133',
          background: 'rgba(18, 15, 24, 0.7)',
          padding: '12px 14px',
          borderRadius: '12px',
          marginBottom: '10px',
        }}
      >
        <div className="skeleton-line shimmer" style={{ width: '60%', height: '12px', marginBottom: '8px' }} />
        <div className="skeleton-line shimmer" style={{ width: '100%', height: '6px', borderRadius: '999px' }} />
      </div>
    );
  }

  const isLow = credits.remaining <= 5 && credits.remaining > 0;
  const isOut = credits.remaining === 0;

  return (
    <div
      className="credit-bar-widget"
      onClick={() => setShowCreditsModal(true)}
      title="Click to view credit usage details"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setShowCreditsModal(true);
        }
      }}
      style={{
        border: isOut
          ? '1px solid rgba(239, 68, 68, 0.4)'
          : isLow
          ? '1px solid rgba(245, 158, 11, 0.4)'
          : '1px solid #2c2339',
        background: isOut
          ? 'linear-gradient(160deg, rgba(35, 15, 20, 0.85), rgba(18, 11, 15, 0.85))'
          : isLow
          ? 'linear-gradient(160deg, rgba(35, 25, 15, 0.85), rgba(18, 14, 11, 0.85))'
          : 'linear-gradient(160deg, #181323, #110e19)',
        padding: '12px 14px',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isOut
          ? '0 4px 16px rgba(239, 68, 68, 0.15)'
          : '0 4px 14px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#ba82ff' }}>⚡</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#e5dcfa', letterSpacing: '0.02em' }}>
            AI CREDITS
          </span>
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '999px',
            background: isOut
              ? 'rgba(239, 68, 68, 0.2)'
              : isLow
              ? 'rgba(245, 158, 11, 0.2)'
              : 'rgba(186, 130, 255, 0.15)',
            color: isOut ? '#f87171' : isLow ? '#fbbf24' : '#cba4ff',
            border: isOut
              ? '1px solid rgba(239, 68, 68, 0.3)'
              : isLow
              ? '1px solid rgba(245, 158, 11, 0.3)'
              : '1px solid rgba(186, 130, 255, 0.25)',
          }}
        >
          {isOut ? 'Limit reached' : `${credits.remaining} left`}
        </span>
      </div>

      {/* Progress Track */}
      <div
        style={{
          height: '6px',
          borderRadius: '999px',
          background: '#231b2f',
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
              ? '0 0 8px rgba(239,68,68,0.5)'
              : '0 0 8px rgba(186,130,255,0.4)',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '7px',
          fontSize: '10.5px',
          color: '#8c8496',
        }}
      >
        <span>
          <strong>{credits.used}</strong> / {credits.limit} used
        </span>
        <span>Resets in {credits.daysLeft}d →</span>
      </div>
    </div>
  );
}
