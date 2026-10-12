'use client';

import { useState, useEffect } from 'react';
import type { SavedContent } from '../lib/types';

interface DeleteConfirmModalProps {
  item: SavedContent;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function DeleteConfirmModal({
  item,
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-dialog" onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="eyebrow" style={{ margin: 0, color: '#ff6e8e' }}>DELETE CARD</div>
          <button
            type="button"
            className="modal-close"
            style={{ position: 'static' }}
            onClick={onClose}
            disabled={isDeleting}
          >
            ×
          </button>
        </div>
        <h3>Are you sure you want to delete this?</h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#c5b8d8', lineHeight: 1.5 }}>
          This will permanently delete <strong style={{ color: '#fff' }}>"{item.title}"</strong> and all its extracted intelligence from SuperSave. This action cannot be undone.
        </p>

        <div className="modal-actions" style={{ marginTop: '10px' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={isDeleting}
          >
            Keep Card
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete Forever'}
          </button>
        </div>
      </div>
    </div>
  );
}
