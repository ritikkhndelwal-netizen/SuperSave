"use strict";
(() => {
    const APP_URL = 'http://localhost:3000';
    const API_URL = 'http://localhost:4000';
    const statusEl = document.getElementById('status');
    const pageEl = document.getElementById('page');
    const saveButton = document.getElementById('save');
    const openButton = document.getElementById('open');
    async function saveUrlDirectly(url) {
        if (!url || !url.startsWith('http')) {
            return { ok: false, error: 'Cannot save this URL type (must start with http/https).' };
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
        }
        catch {
            return { ok: false, error: 'Cannot connect to API at http://localhost:4000.' };
        }
    }
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (pageEl) {
            if (tab?.url && tab.url.startsWith('http')) {
                pageEl.textContent = tab.url;
            }
            else {
                pageEl.textContent = tab?.url || 'Active tab (non-web page)';
            }
        }
    });
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            saveButton.disabled = true;
            if (statusEl)
                statusEl.textContent = 'Saving…';
            chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
                const url = tab?.url || '';
                if (!url || !url.startsWith('http')) {
                  if (statusEl)
                    statusEl.textContent = '⚠️ Open an Instagram, YouTube, or web link to save.';
                  saveButton.disabled = false;
                  return;
                }
                let handled = false;
                try {
                    chrome.runtime.sendMessage({ type: 'SAVE_CURRENT_PAGE', url }, (response) => {
                        if (chrome.runtime.lastError || !response) {
                            saveUrlDirectly(url).then((res) => {
                                if (statusEl) {
                                    statusEl.textContent = res.ok ? 'Saved ✓ AI processing started' : (res.error || 'Failed to save.');
                                }
                                saveButton.disabled = false;
                            });
                        }
                        else {
                            handled = true;
                            if (statusEl) {
                                statusEl.textContent = response.ok ? 'Saved ✓ AI processing started' : (response.error || 'Failed to save.');
                            }
                            saveButton.disabled = false;
                        }
                    });
                }
                catch {
                    const res = await saveUrlDirectly(url);
                    if (statusEl) {
                        statusEl.textContent = res.ok ? 'Saved ✓ AI processing started' : (res.error || 'Failed to save.');
                    }
                    saveButton.disabled = false;
                }
            });
        });
    }
    if (openButton) {
        openButton.addEventListener('click', () => {
            chrome.tabs.create({ url: `${APP_URL}/dashboard` });
        });
    }
})();
