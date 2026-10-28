'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { UserCredits } from './types';
import { apiFetch } from './api';
import { useAuth } from './auth-context';

interface CreditsContextType {
  credits: UserCredits | null;
  loading: boolean;
  refreshCredits: () => Promise<void>;
  showCreditsModal: boolean;
  setShowCreditsModal: (show: boolean) => void;
}

const CreditsContext = createContext<CreditsContextType>({
  credits: null,
  loading: true,
  refreshCredits: async () => {},
  showCreditsModal: false,
  setShowCreditsModal: () => {},
});

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreditsModal, setShowCreditsModal] = useState<boolean>(false);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await apiFetch('/api/credits');
      if (res.ok) {
        const data = await res.json();
        setCredits(data);
      }
    } catch (err) {
      console.warn('Failed to fetch user credits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [user, fetchCredits]);

  return (
    <CreditsContext.Provider
      value={{
        credits,
        loading,
        refreshCredits: fetchCredits,
        showCreditsModal,
        setShowCreditsModal,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  return useContext(CreditsContext);
}
