/**
 * SuperSave Main-World Clipboard Interceptor
 * Runs in the webpage's MAIN execution world to intercept modern
 * asynchronous Clipboard API calls (e.g. Pinterest, Instagram, Reddit, Amazon, X/Twitter)
 */

(() => {
  if ((window as any).__supersave_interceptor_loaded) return;
  (window as any).__supersave_interceptor_loaded = true;

  function broadcastCopiedText(text: string) {
    if (!text || typeof text !== 'string') return;
    const trimmed = text.trim();
    if (trimmed.length > 5 && (trimmed.includes('http://') || trimmed.includes('https://') || trimmed.includes('pin.it'))) {
      window.postMessage({ type: 'SUPERSAVE_CLIPBOARD_WRITE', text: trimmed }, '*');
    }
  }

  // 1. Intercept navigator.clipboard.writeText
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = function (text: string | any) {
      try {
        broadcastCopiedText(String(text || ''));
      } catch (_) {}
      return originalWriteText(text);
    };
  }

  // 2. Intercept navigator.clipboard.write (ClipboardItem)
  if (navigator.clipboard && typeof navigator.clipboard.write === 'function') {
    const originalWrite = navigator.clipboard.write.bind(navigator.clipboard);
    navigator.clipboard.write = function (data: any) {
      try {
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item && item.types) {
              for (const type of item.types) {
                if (typeof type === 'string' && type.includes('text')) {
                  item.getType(type).then((blob: Blob) => {
                    return blob.text();
                  }).then((extractedText: string) => {
                    broadcastCopiedText(extractedText);
                  }).catch(() => {});
                }
              }
            }
          }
        }
      } catch (_) {}
      return originalWrite(data);
    };
  }

  // 3. Intercept legacy document.execCommand('copy')
  if (typeof document.execCommand === 'function') {
    const originalExecCommand = document.execCommand.bind(document);
    document.execCommand = function (commandId: string, showUI?: boolean, value?: string) {
      if (typeof commandId === 'string' && commandId.toLowerCase() === 'copy') {
        try {
          let text = '';
          const active = document.activeElement as any;
          if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
            const start = active.selectionStart ?? 0;
            const end = active.selectionEnd ?? 0;
            if (end > start) {
              text = active.value.substring(start, end);
            } else {
              text = active.value;
            }
          }
          if (!text && window.getSelection) {
            text = window.getSelection()?.toString() || '';
          }
          broadcastCopiedText(text);
        } catch (_) {}
      }
      return originalExecCommand(commandId, showUI, value);
    };
  }
})();

