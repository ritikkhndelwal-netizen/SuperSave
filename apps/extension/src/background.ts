(() => {
  async function getConfig(): Promise<{ appUrl: string; apiUrl: string }> {
    const sync = (await chrome.storage.sync.get(['appUrl', 'apiUrl'])) as { appUrl?: string; apiUrl?: string };
    return {
      appUrl: sync.appUrl || 'http://localhost:3000',
      apiUrl: sync.apiUrl || 'http://localhost:4000',
    };
  }

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
    const { appUrl } = await getConfig();
    const result = await saveUrlToApi(url);
    if (result.ok) {
      chrome.action.setBadgeText({ text: '✓' });
      chrome.action.setBadgeBackgroundColor({ color: '#7c3aed' });
      setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);
      chrome.tabs.create({ url: `${appUrl}/dashboard?saved=1` });
    } else {
      chrome.action.setBadgeText({ text: '✕' });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
      setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'SAVE_CURRENT_PAGE') return false;
    saveUrlToApi(String(message.url || ''), message.client_meta)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, error: err?.message || 'Could not save content.' }));
    return true;
  });

  async function saveUrlToApi(url: string, client_meta?: any) {
    if (!url || !url.startsWith('http')) {
      return { ok: false, error: 'Cannot save this URL type (must start with http/https).' };
    }
    const { apiUrl } = await getConfig();
    try {
      const response = await fetch(`${apiUrl}/api/content`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url, client_meta }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        return { ok: false, error: data?.error || `API error (${response.status})` };
      }
      return { ok: true, data };
    } catch {
      return { ok: false, error: `Cannot connect to API server at ${apiUrl}.` };
    }
  }
})();
