'use client';

import { useState, useEffect } from 'react';
import type { SavedContent } from '../lib/types';

interface EditContentModalProps {
  item: SavedContent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedItem: SavedContent) => void;
}

export function EditContentModal({
  item,
  isOpen,
  onClose,
  onSuccess,
}: EditContentModalProps) {
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState(item.category || '');
  const [tags, setTags] = useState<string[]>(Array.isArray(item.tags) ? [...item.tags] : []);
  const [newTagInput, setNewTagInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(item.title);
      setCategory(item.category || '');
      setTags(Array.isArray(item.tags) ? [...item.tags] : []);
      setNewTagInput('');
      setError(null);
    }
  }, [isOpen, item]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUpdating) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isUpdating, onClose]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const clean = newTagInput.trim().replace(/^#+/, '').trim();
    if (!clean) return;
    if (tags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setNewTagInput('');
      return;
    }
    setTags([...tags, clean]);
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Title cannot be empty');
      return;
    }

    setIsUpdating(true);
    setError(null);
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${api}/api/content/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cleanTitle,
          category: category.trim() || item.category,
          tags,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update content details');
      }

      const data = await response.json();
      onSuccess(data.item);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error updating card');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-dialog" onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="eyebrow" style={{ margin: 0 }}>EDIT SAVED CARD</div>
          <button
            type="button"
            className="modal-close"
            style={{ position: 'static' }}
            onClick={onClose}
            disabled={isUpdating}
          >
            ×
          </button>
        </div>
        <h3>Update Title & Tags</h3>

        {error && (
          <div
            style={{
              color: '#ff6e8e',
              fontSize: '12px',
              background: 'rgba(255,110,142,0.1)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,110,142,0.3)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="modal-field">
            <label>Card Title</label>
            <input
              type="text"
              className="modal-input"
              style={{ margin: 0 }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title..."
              required
              autoFocus
            />
          </div>

          <div className="modal-field">
            <label>Category</label>
            <input
              type="text"
              className="modal-input"
              style={{ margin: 0 }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Engineering, AI, Cooking, Design..."
            />
          </div>

          <div className="modal-field">
            <label>Tags</label>
            <div className="tag-editor-box">
              {tags.length === 0 && (
                <span style={{ fontSize: '12px', color: '#6d6280' }}>No tags yet. Add tags below.</span>
              )}
              {tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    title="Remove tag"
                    disabled={isUpdating}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="tag-add-row">
              <input
                type="text"
                className="modal-input"
                style={{ margin: 0, flex: 1, padding: '8px 12px' }}
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type a tag & press Enter or Add..."
                disabled={isUpdating}
              />
              <button
                type="button"
                className="secondary-button"
                style={{ padding: '8px 14px', fontSize: '12px' }}
                onClick={handleAddTag}
                disabled={isUpdating}
              >
                + Add
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving Changes…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
