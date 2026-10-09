(() => {
  const APP_URL = 'http://localhost:3000';
  const API_URL = 'http://localhost:4000';
  const statusEl = document.getElementById('status');
  const pageEl = document.getElementById('page');
  const urlInput = document.getElementById('url-input') as HTMLInputElement | null;
  const pasteBtn = document.getElementById('paste-btn') as HTMLButtonElement | null;
  const saveButton = document.getElementById('save') as HTMLButtonElement | null;
  const openButton = document.getElementById('open') as HTMLButtonElement | null;

  let activeTabUrl = '';

  async function saveUrlDirectly(url: string): Promise<{ ok: boolean; error?: string }> {
    if (!url || !url.startsWith('http')) {
      return { ok: false, error: 'Cannot save this URL (must start with http/https).' };
    }
    try {
      const response = await fetch(`${API_URL}/api/content`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        return { ok: false, error: data?.error || `API error (${response.status})` };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot connect to API at http://localhost:4000.' };
    }
  }

  // Detect active tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.url && tab.url.startsWith('http')) {
      activeTabUrl = tab.url;
      if (pageEl) pageEl.textContent = tab.url;
    } else {
      if (pageEl) pageEl.textContent = 'Non-web page (use input above to paste a URL)';
    }
  });

  // Try auto-reading clipboard to pre-fill if it's a media URL
  if (navigator.clipboard && navigator.clipboard.readText && urlInput) {
    navigator.clipboard.readText().then((text) => {
      const trimmed = (text || '').trim();
      if (
        trimmed.startsWith('http') &&
        (trimmed.includes('youtube.com') ||
          trimmed.includes('youtu.be') ||
          trimmed.includes('instagram.com') ||
          trimmed.includes('x.com') ||
          trimmed.includes('twitter.com') ||
          trimmed.includes('tiktok.com'))
      ) {
        urlInput.value = trimmed;
        if (statusEl) statusEl.textContent = '📋 Detected media link from clipboard!';
      }
    }).catch(() => {});
  }

  // Paste button
  if (pasteBtn && urlInput) {
    pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          urlInput.value = text.trim();
          urlInput.focus();
        }
      } catch {
        if (statusEl) statusEl.textContent = 'Please press Ctrl + V to paste.';
      }
    });
  }

  // Save button
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      const inputVal = urlInput?.value.trim() || '';
      const targetUrl = inputVal || activeTabUrl;

      if (!targetUrl || !targetUrl.startsWith('http')) {
        if (statusEl) statusEl.textContent = '⚠️ Please paste a valid URL or open a media page.';
        urlInput?.focus();
        return;
      }

      saveButton.disabled = true;
      if (statusEl) statusEl.textContent = 'Saving & analyzing with Gemini…';

      chrome.runtime.sendMessage({ type: 'SAVE_CURRENT_PAGE', url: targetUrl }, (response) => {
        if (chrome.runtime.lastError || !response) {
          saveUrlDirectly(targetUrl).then((res) => {
            if (statusEl) {
              statusEl.textContent = res.ok ? '✓ Saved! Gemini is extracting notes.' : (res.error || 'Failed to save.');
            }
            saveButton.disabled = false;
            if (res.ok && urlInput) urlInput.value = '';
          });
        } else {
          if (statusEl) {
            statusEl.textContent = response.ok ? '✓ Saved! Gemini is extracting notes.' : (response.error || 'Failed to save.');
          }
          saveButton.disabled = false;
          if (response.ok && urlInput) urlInput.value = '';
        }
      });
    });
  }

  // Open knowledge library
  if (openButton) {
    openButton.addEventListener('click', () => {
      chrome.tabs.create({ url: `${APP_URL}/dashboard` });
    });
  }
})();
