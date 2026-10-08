(() => {
  const APP_URL = 'http://localhost:3000';
  const API_URL = 'http://localhost:4000';

  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'super-save-page',
      title: 'Save to SuperSave',
      contexts: ['page', 'link'],
    });
  });

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const url = info.linkUrl || info.pageUrl || tab?.url;
    if (!url) return;
    const result = await saveUrlToApi(url);
    if (result.ok) {
      chrome.tabs.create({ url: `${APP_URL}/dashboard?saved=1` });
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'SAVE_CURRENT_PAGE') return false;
    saveUrlToApi(String(message.url || ''))
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, error: err?.message || 'Could not save content.' }));
    return true;
  });

  async function saveUrlToApi(url: string) {
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
      return { ok: true, data };
    } catch {
      return { ok: false, error: 'Cannot connect to API server at http://localhost:4000.' };
    }
  }
})();
