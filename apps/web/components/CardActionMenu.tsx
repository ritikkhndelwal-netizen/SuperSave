'use client';

import React from 'react';
import type { SavedContent } from '../lib/types';

interface CardActionMenuProps {
  itemId: string;
  item: SavedContent;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onEdit: (item: SavedContent) => void;
  onDelete: (item: SavedContent) => void;
  style?: React.CSSProperties;
  dropdownStyle?: React.CSSProperties;
}

export function CardActionMenu({
  itemId,
  item,
  openMenuId,
  setOpenMenuId,
  onEdit,
  onDelete,
  style,
  dropdownStyle,
}: CardActionMenuProps) {
  const isOpen = openMenuId === itemId;

  return (
    <>
      <button
        type="button"
        className="card-menu-btn"
        style={style}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpenMenuId(isOpen ? null : itemId);
        }}
        title="Card options"
        aria-label="Card options"
      >
        •••
      </button>
      {isOpen && (
        <div
          className="card-dropdown-menu"
          style={dropdownStyle}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <button
            type="button"
            onClick={() => {
              setOpenMenuId(null);
              onEdit(item);
            }}
          >
            ✏️ Edit details
          </button>
          <button
            type="button"
            className="delete-action"
            onClick={() => {
              setOpenMenuId(null);
              onDelete(item);
            }}
          >
            🗑️ Delete card
          </button>
        </div>
      )}
    </>
  );
}
