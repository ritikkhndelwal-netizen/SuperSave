"use strict";
/**
 * SuperSave Main-World Clipboard Interceptor
 * Runs in the webpage's MAIN execution world to intercept modern
 * asynchronous Clipboard API calls (e.g. Instagram, Reddit, Amazon, X/Twitter)
 * where navigator.clipboard.writeText is called directly.
 */
(() => {
    if (window.__supersave_interceptor_loaded)
        return;
    window.__supersave_interceptor_loaded = true;
    // 1. Intercept navigator.clipboard.writeText (used by Instagram, Twitter, Reddit, Amazon, etc.)
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
        navigator.clipboard.writeText = function (text) {
            try {
                if (text && typeof text === 'string') {
                    window.postMessage({ type: 'SUPERSAVE_CLIPBOARD_WRITE', text }, '*');
                }
            }
            catch (_) { }
            return originalWriteText(text);
        };
    }
    // 2. Intercept legacy document.execCommand('copy')
    if (typeof document.execCommand === 'function') {
        const originalExecCommand = document.execCommand.bind(document);
        document.execCommand = function (commandId, showUI, value) {
            if (typeof commandId === 'string' && commandId.toLowerCase() === 'copy') {
                try {
                    const selected = window.getSelection ? window.getSelection()?.toString() : '';
                    if (selected) {
                        window.postMessage({ type: 'SUPERSAVE_CLIPBOARD_WRITE', text: selected }, '*');
                    }
                }
                catch (_) { }
            }
            return originalExecCommand(commandId, showUI, value);
        };
    }
})();
