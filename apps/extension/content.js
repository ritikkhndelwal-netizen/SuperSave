"use strict";
/**
 * SuperSave Browser Extension — Content Script
 *
 * Reliable Media Capture Integrations:
 * 1. Dedicated Share Modal button (YouTube, Instagram, X/Twitter, etc.)
 * 2. Direct 1-Click Card Action Button (YouTube Home/Search feeds, X tweets, Instagram posts)
 * 3. In-page Toast notification with direct link to SuperSave dashboard
 */
(() => {
    const BUTTON_ATTR = 'data-supersave-injected';
    const TOAST_ID = 'supersave-floating-toast';
    const FLOATING_BTN_ID = 'supersave-floating-action';
    const STYLES_ID = 'supersave-injected-styles';
    // -------------------------------------------------------------
    // 0. Global CSS Injection for Native Buttons & Toast
    // -------------------------------------------------------------
    function injectGlobalStyles() {
        if (document.getElementById(STYLES_ID))
            return;
        const style = document.createElement('style');
        style.id = STYLES_ID;
        style.textContent = `
      /* YouTube Card Action Button */
      .supersave-yt-card-btn {
        display: inline-flex !important;
        align-items: center !important;
        gap: 5px !important;
        padding: 4px 10px !important;
        margin-right: 6px !important;
        border-radius: 14px !important;
        border: 1px solid rgba(186, 130, 255, 0.35) !important;
        background: rgba(135, 82, 233, 0.15) !important;
        color: #dcbfff !important;
        font-family: Roboto, "YouTube Sans", Arial, sans-serif !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.15s ease !important;
        user-select: none !important;
        vertical-align: middle !important;
        line-height: 1.4 !important;
      }
      .supersave-yt-card-btn:hover {
        background: linear-gradient(135deg, #ba82ff, #7444d7) !important;
        color: #ffffff !important;
        border-color: transparent !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 12px rgba(135, 82, 233, 0.4) !important;
      }

      /* YouTube Share Modal Button */
      .supersave-yt-share-btn {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        padding: 8px 16px !important;
        margin-left: 10px !important;
        border-radius: 18px !important;
        border: 1px solid #7c4ec2 !important;
        background: linear-gradient(135deg, #ba82ff, #7444d7) !important;
        color: #ffffff !important;
        font-family: Roboto, "YouTube Sans", Arial, sans-serif !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        box-shadow: 0 4px 14px rgba(116, 68, 215, 0.4) !important;
        transition: all 0.15s ease !important;
        white-space: nowrap !important;
        z-index: 9999 !important;
        flex-shrink: 0 !important;
      }
      .supersave-yt-share-btn:hover {
        transform: scale(1.02) !important;
        box-shadow: 0 6px 18px rgba(135, 82, 233, 0.6) !important;
      }

      /* Circular Share Target Icon in Carousel */
      .supersave-yt-target-item {
        display: inline-flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        cursor: pointer !important;
        margin-right: 14px !important;
        padding: 6px 8px !important;
        border-radius: 10px !important;
        user-select: none !important;
        flex-shrink: 0 !important;
      }
      .supersave-yt-target-item:hover .supersave-target-icon {
        transform: scale(1.08) !important;
      }

      /* Instagram Button */
      .supersave-ig-btn {
        all: initial !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        padding: 6px 12px !important;
        border-radius: 12px !important;
        background: linear-gradient(135deg, #e1306c, #833ab4) !important;
        color: #ffffff !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        box-shadow: 0 4px 12px rgba(131, 58, 180, 0.35) !important;
        margin: 6px 8px !important;
      }

      /* X/Twitter Button */
      .supersave-x-btn {
        display: inline-flex !important;
        align-items: center !important;
        gap: 4px !important;
        padding: 4px 10px !important;
        border-radius: 999px !important;
        background: rgba(186, 130, 255, 0.12) !important;
        border: 1px solid rgba(186, 130, 255, 0.3) !important;
        color: #dcbfff !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
      }
      .supersave-x-btn:hover {
        background: rgba(186, 130, 255, 0.25) !important;
        color: #ffffff !important;
      }
    `;
        (document.head || document.documentElement).appendChild(style);
    }
    // -------------------------------------------------------------
    // 1. Toast Notification System
    // -------------------------------------------------------------
    function showToast(title, message, dashboardUrl = 'http://localhost:3000/dashboard') {
        let toast = document.getElementById(TOAST_ID);
        if (!toast) {
            toast = document.createElement('div');
            toast.id = TOAST_ID;
            toast.style.cssText = `
        all: initial;
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
        display: flex;
        align-items: center;
        gap: 12px;
        background: #14101e;
        border: 1px solid #4a3271;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45), 0 0 20px rgba(186, 130, 255, 0.25);
        padding: 12px 18px;
        border-radius: 14px;
        color: #fff;
        opacity: 0;
        transform: translateY(16px);
        transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: auto;
      `;
            document.documentElement.appendChild(toast);
        }
        toast.innerHTML = `
      <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #ba82ff, #7444d7); display: grid; place-items: center; font-size: 16px; flex-shrink: 0; box-shadow: 0 4px 12px rgba(135, 82, 233, 0.4);">
        🔖
      </div>
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <span style="font-size: 13px; font-weight: 700; color: #f5edff; letter-spacing: -0.01em;">${title}</span>
        <span style="font-size: 11px; color: #a89db4;">${message}</span>
      </div>
      <a href="${dashboardUrl}" target="_blank" rel="noopener noreferrer" style="margin-left: 8px; padding: 6px 12px; border-radius: 8px; background: #261c36; border: 1px solid #483366; color: #dcbfff; font-size: 11px; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 4px; white-space: nowrap; transition: background 0.15s ease;">
        Open ↗
      </a>
    `;
        requestAnimationFrame(() => {
            if (toast) {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            }
        });
        window.clearTimeout(toast._timeout);
        toast._timeout = window.setTimeout(() => {
            if (toast) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(16px)';
                window.setTimeout(() => toast?.remove(), 300);
            }
        }, 4500);
    }
    // -------------------------------------------------------------
    // 1b. Smart Copy-to-Save Prompt on Clipboard Copy
    // -------------------------------------------------------------
    const COPY_PROMPT_ID = 'supersave-copy-prompt';
    function extractSaveUrl(text) {
        if (!text || typeof text !== 'string')
            return null;
        const match = text.trim().match(/https?:\/\/[^\s<>"'\)]+/i);
        if (!match)
            return null;
        const candidate = match[0];
        try {
            const parsed = new URL(candidate);
            if (parsed.hostname === 'localhost' ||
                parsed.hostname === '127.0.0.1' ||
                parsed.hostname === '0.0.0.0') {
                return null;
            }
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                return candidate;
            }
        }
        catch {
            return null;
        }
        return null;
    }
    function isValidSaveUrl(url) {
        return Boolean(extractSaveUrl(url));
    }
    function showCopyPrompt(rawText) {
        const url = extractSaveUrl(rawText);
        if (!url)
            return;
        let prompt = document.getElementById(COPY_PROMPT_ID);
        if (prompt) {
            if (prompt._url === url)
                return;
            prompt.remove();
        }
        prompt = document.createElement('div');
        prompt.id = COPY_PROMPT_ID;
        prompt._url = url;
        prompt.style.cssText = `
      all: initial;
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 2147483647;
      width: 370px;
      max-width: calc(100vw - 48px);
      background: #14101f;
      border: 1px solid #7c4ec2;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(186, 130, 255, 0.35);
      padding: 16px 18px;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      opacity: 0;
      transform: translateY(-16px);
      transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: auto;
      box-sizing: border-box;
    `;
        const displayUrl = url.length > 44 ? url.substring(0, 42) + '…' : url;
        prompt.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px;">
        <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #ba82ff, #7444d7); display: grid; place-items: center; font-size: 18px; flex-shrink: 0; box-shadow: 0 4px 14px rgba(135, 82, 233, 0.45);">
          🔖
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 13.5px; font-weight: 700; color: #f5edff; letter-spacing: -0.01em;">Save copied link to SuperSave?</div>
          <div style="font-size: 11px; color: #b1a6c0; margin-top: 3px; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayUrl}</div>
        </div>
        <button id="supersave-prompt-close" style="background: transparent; border: 0; color: #8d839a; font-size: 16px; cursor: pointer; padding: 2px 6px; border-radius: 6px;">✕</button>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="supersave-prompt-save" style="flex: 1; padding: 9px 14px; border-radius: 10px; border: 0; background: linear-gradient(135deg, #ba82ff, #7444d7); color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(135, 82, 233, 0.4); display: flex; align-items: center; justify-content: center; gap: 6px;">
          ⚡ Yes, Save & Extract
        </button>
        <button id="supersave-prompt-cancel" style="padding: 9px 14px; border-radius: 10px; border: 1px solid #362a4a; background: #1b1528; color: #cbbfe0; font-size: 12px; font-weight: 600; cursor: pointer;">
          Cancel
        </button>
      </div>
    `;
        document.documentElement.appendChild(prompt);
        requestAnimationFrame(() => {
            if (prompt) {
                prompt.style.opacity = '1';
                prompt.style.transform = 'translateY(0)';
            }
        });
        const dismissPrompt = () => {
            if (!prompt)
                return;
            prompt.style.opacity = '0';
            prompt.style.transform = 'translateY(-16px)';
            window.setTimeout(() => prompt?.remove(), 260);
        };
        prompt.querySelector('#supersave-prompt-close')?.addEventListener('click', dismissPrompt);
        prompt.querySelector('#supersave-prompt-cancel')?.addEventListener('click', dismissPrompt);
        prompt.querySelector('#supersave-prompt-save')?.addEventListener('click', () => {
            const saveBtn = prompt?.querySelector('#supersave-prompt-save');
            saveTargetUrl(url, saveBtn || undefined);
            window.setTimeout(dismissPrompt, 1200);
        });
        window.clearTimeout(prompt._timeout);
        prompt._timeout = window.setTimeout(dismissPrompt, 14000);
    }
    // -------------------------------------------------------------
    // 1c. Client-side DOM Metadata Capture (Pinterest & Rich SPAs)
    // -------------------------------------------------------------
    function extractCurrentPageMeta(targetUrl) {
        try {
            const isPinterest = window.location.hostname.includes('pinterest.') || (targetUrl && targetUrl.includes('pinterest.'));
            let title = document.title || '';
            let description = '';
            let thumbnail = '';
            let author = '';
            const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
            const ogDesc = document.querySelector('meta[property="og:description"], meta[name="description"]')?.content;
            const ogImage = document.querySelector('meta[property="og:image"]')?.content;
            if (ogTitle)
                title = ogTitle;
            if (ogDesc)
                description = ogDesc;
            if (ogImage)
                thumbnail = ogImage;
            // Deep Pinterest extraction if on Pinterest
            if (isPinterest) {
                // A. Title
                const pinTitleEl = document.querySelector('[data-test-id="pin-title"] h1, [data-test-id="pin-title"], h1[data-test-id*="title"], h1');
                if (pinTitleEl && pinTitleEl.textContent?.trim()) {
                    title = pinTitleEl.textContent.trim();
                }
                // B. Description
                const descEl = document.querySelector('[data-test-id="pin-description"], [data-test-id="closeup-description"], [data-test-id="truncated-description"]');
                if (descEl && descEl.textContent?.trim()) {
                    description = descEl.textContent.trim();
                }
                // C. Creator
                const authorEl = document.querySelector('[data-test-id="creator-profile-name"], [data-test-id="user-profile-name"], [data-test-id="pin-creator-profile"]');
                if (authorEl && authorEl.textContent?.trim()) {
                    author = authorEl.textContent.trim();
                }
                // D. High-Res Image
                const pinImg = document.querySelector('[data-test-id="pin-closeup-image"] img, div[data-test-id="visual-search-container"] img, img[src*="pinimg.com/originals/"], img[src*="pinimg.com/736x/"], img[srcset*="pinimg.com"]');
                if (pinImg?.src) {
                    thumbnail = pinImg.src;
                }
            }
            return {
                title: title.trim(),
                description: description.trim(),
                thumbnail: thumbnail.trim(),
                author: author.trim(),
            };
        }
        catch {
            return undefined;
        }
    }
    // -------------------------------------------------------------
    // 2. Core Save Dispatcher (Resilient with Direct API Fallback)
    // -------------------------------------------------------------
    function saveTargetUrl(url, buttonElement, clientMeta) {
        if (!url || !url.startsWith('http')) {
            url = window.location.href;
        }
        if (!clientMeta) {
            try {
                const parsed = new URL(url);
                if (parsed.hostname === window.location.hostname || url === window.location.href) {
                    clientMeta = extractCurrentPageMeta(url);
                }
            }
            catch (_) { }
        }
        const defaultBtnText = buttonElement ? buttonElement.innerHTML : '';
        if (buttonElement) {
            buttonElement.innerHTML = `<span>✦ Saving…</span>`;
            buttonElement.style.pointerEvents = 'none';
            buttonElement.style.opacity = '0.75';
        }
        const restoreButton = () => {
            if (buttonElement) {
                buttonElement.style.pointerEvents = 'auto';
                buttonElement.style.opacity = '1';
            }
        };
        const handleSuccess = () => {
            restoreButton();
            if (buttonElement) {
                buttonElement.innerHTML = `<span>✓ Saved!</span>`;
                window.setTimeout(() => {
                    buttonElement.innerHTML = defaultBtnText || `<span>🔖 Save</span>`;
                }, 2200);
            }
            showToast('Saved to SuperSave!', 'Gemini is extracting intelligence and generating notes.');
        };
        const handleFailure = (errMsg) => {
            restoreButton();
            if (buttonElement) {
                buttonElement.innerHTML = `<span>✕ Error</span>`;
                window.setTimeout(() => {
                    buttonElement.innerHTML = defaultBtnText || `<span>🔖 Save</span>`;
                }, 2200);
            }
            showToast('Save failed', errMsg || 'Could not connect to SuperSave API server at http://localhost:4000.');
        };
        const directApiSave = async () => {
            try {
                const resp = await fetch('http://localhost:4000/api/content', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ url, client_meta: clientMeta }),
                });
                if (resp.ok) {
                    handleSuccess();
                }
                else {
                    const errData = await resp.json().catch(() => null);
                    handleFailure(errData?.error || `API error (${resp.status})`);
                }
            }
            catch (err) {
                handleFailure(err?.message || 'Cannot connect to SuperSave API on port 4000.');
            }
        };
        try {
            if (chrome?.runtime?.sendMessage) {
                chrome.runtime.sendMessage({ type: 'SAVE_CURRENT_PAGE', url, client_meta: clientMeta }, (response) => {
                    if (chrome.runtime.lastError || !response) {
                        // Background worker may be asleep or context invalidated, fallback to direct fetch
                        directApiSave();
                    }
                    else if (response.ok) {
                        handleSuccess();
                    }
                    else {
                        handleFailure(response.error);
                    }
                });
            }
            else {
                directApiSave();
            }
        }
        catch {
            directApiSave();
        }
    }
    // -------------------------------------------------------------
    // 3. YouTube Integrations
    // -------------------------------------------------------------
    function enhanceYouTube() {
        injectGlobalStyles();
        // A. Native Share Modal Integration (Watch Page, Shorts, or Homepage Share Dialog)
        const shareDialogs = document.querySelectorAll('ytd-unified-share-panel-renderer, yt-copy-link-renderer, tp-yt-paper-dialog #copy-container');
        if (shareDialogs.length > 0) {
            // 1. Button next to the Copy URL Input
            const copyContainers = document.querySelectorAll('#copy-container, yt-copy-link-renderer #copy-container, [id="copy-container"]');
            copyContainers.forEach((copyContainer) => {
                if (copyContainer.querySelector('.supersave-yt-share-btn') || copyContainer.parentElement?.querySelector('.supersave-yt-share-btn')) {
                    return;
                }
                const urlInput = copyContainer.querySelector('#share-url') ||
                    document.querySelector('#share-url');
                const shareBtn = document.createElement('button');
                shareBtn.className = 'supersave-yt-share-btn';
                shareBtn.type = 'button';
                shareBtn.innerHTML = `<span>🔖 Save to SuperSave</span>`;
                shareBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const targetUrl = urlInput?.value || window.location.href;
                    saveTargetUrl(targetUrl, shareBtn);
                });
                // Insert into or next to copy-container
                const copyBtnWrap = copyContainer.querySelector('#copy-button');
                if (copyBtnWrap && copyBtnWrap.parentNode) {
                    copyBtnWrap.parentNode.insertBefore(shareBtn, copyBtnWrap.nextSibling);
                }
                else if (copyContainer.parentNode) {
                    copyContainer.parentNode.insertBefore(shareBtn, copyContainer.nextSibling);
                }
                else {
                    copyContainer.appendChild(shareBtn);
                }
            });
            // 2. Share Target Icon Carousel (Next to WhatsApp / Facebook)
            const targetContainers = document.querySelectorAll('#target-container, yt-third-party-share-target-section-renderer #target-container');
            targetContainers.forEach((targetContainer) => {
                if (targetContainer.querySelector('.supersave-yt-target-item'))
                    return;
                const targetItem = document.createElement('div');
                targetItem.className = 'supersave-yt-target-item';
                targetItem.innerHTML = `
          <div class="supersave-target-icon" style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #ba82ff, #703edb); display: grid; place-items: center; font-size: 22px; color: #fff; box-shadow: 0 6px 18px rgba(112, 62, 219, 0.4); transition: transform 0.15s ease;">
            🔖
          </div>
          <span style="font-size: 11px; color: var(--yt-spec-text-primary, #f1f1f1); font-weight: 600; font-family: Roboto, sans-serif;">SuperSave</span>
        `;
                targetItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const urlInput = document.querySelector('#share-url');
                    const targetUrl = urlInput?.value || window.location.href;
                    saveTargetUrl(targetUrl);
                });
                targetContainer.insertBefore(targetItem, targetContainer.firstChild);
            });
        }
        // B. Direct 1-Click Save Button on Video Cards & Shorts (Home Feed, Search Feed, Channels)
        const videoCards = document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer');
        videoCards.forEach((card) => {
            if (card.querySelector('.supersave-yt-card-btn'))
                return;
            // Mount inside metadata block below channel name & views
            const metaContainer = card.querySelector('ytd-video-meta-block') ||
                card.querySelector('#meta.ytd-rich-grid-media, #meta.ytd-video-renderer, #meta') ||
                card.querySelector('#details');
            if (!metaContainer)
                return;
            const cardBar = document.createElement('div');
            cardBar.className = 'supersave-card-bar';
            cardBar.style.cssText = 'margin-top: 6px; display: flex; align-items: center; clear: both; width: 100%;';
            const cardBtn = document.createElement('button');
            cardBtn.className = 'supersave-yt-card-btn';
            cardBtn.type = 'button';
            cardBtn.title = 'Save this video to SuperSave';
            cardBtn.innerHTML = `<span>🔖 Save to SuperSave</span>`;
            cardBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Extract video URL directly from card's anchor
                const anchor = card.querySelector('a#thumbnail, a#video-title-link, a.yt-simple-endpoint[href*="watch?v="], a.yt-simple-endpoint[href*="/shorts/"]');
                const targetUrl = anchor?.href || window.location.href;
                saveTargetUrl(targetUrl, cardBtn);
            });
            cardBar.appendChild(cardBtn);
            metaContainer.appendChild(cardBar);
        });
        // C. Watch Page Permanent Action Button (Under the Video Player)
        const topLevelButtons = document.querySelector('ytd-watch-metadata #top-level-buttons-computed, ytd-menu-renderer #top-level-buttons-computed');
        if (topLevelButtons && !topLevelButtons.querySelector('.supersave-yt-watch-btn')) {
            const watchBtn = document.createElement('button');
            watchBtn.className = 'supersave-yt-share-btn supersave-yt-watch-btn';
            watchBtn.type = 'button';
            watchBtn.innerHTML = `<span>🔖 SuperSave</span>`;
            watchBtn.style.margin = '0 8px';
            watchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                saveTargetUrl(window.location.href, watchBtn);
            });
            topLevelButtons.insertBefore(watchBtn, topLevelButtons.firstChild);
        }
    }
    // -------------------------------------------------------------
    // 4. Instagram Integrations
    // -------------------------------------------------------------
    function enhanceInstagram() {
        // A. Share Modal Dialog
        const dialogs = document.querySelectorAll('div[role="dialog"]:not([' + BUTTON_ATTR + '])');
        dialogs.forEach((dialog) => {
            const text = (dialog.textContent || '').toLowerCase();
            const isShareModal = text.includes('share to') ||
                text.includes('copy link') ||
                text.includes('share') ||
                dialog.querySelector('svg[aria-label*="Share"], svg[aria-label*="Copy"]');
            if (!isShareModal)
                return;
            dialog.setAttribute(BUTTON_ATTR, 'true');
            const actionRow = dialog.querySelector('div[style*="flex-direction: row"], div[class*="x9f619"][class*="xjbqb8w"]') || dialog.querySelector('div > div:last-child');
            if (actionRow && !dialog.querySelector('.supersave-ig-btn')) {
                const igBtn = document.createElement('button');
                igBtn.className = 'supersave-ig-btn';
                igBtn.type = 'button';
                igBtn.innerHTML = `<span>🔖 Save to SuperSave</span>`;
                igBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    let targetUrl = window.location.href;
                    const postAnchor = document.querySelector('article:hover a[href*="/p/"], article:hover a[href*="/reel/"], div:hover a[href*="/reel/"]');
                    if (postAnchor?.href) {
                        targetUrl = postAnchor.href;
                    }
                    saveTargetUrl(targetUrl, igBtn);
                });
                if (actionRow.firstChild) {
                    actionRow.insertBefore(igBtn, actionRow.firstChild);
                }
                else {
                    actionRow.appendChild(igBtn);
                }
            }
        });
        // B. Direct Post Action Bar (Beneath Photo/Video)
        const postActions = document.querySelectorAll('article section:not([' + BUTTON_ATTR + '])');
        postActions.forEach((section) => {
            if (section.querySelector('.supersave-ig-post-btn'))
                return;
            section.setAttribute(BUTTON_ATTR, 'true');
            const article = section.closest('article');
            const igPostBtn = document.createElement('button');
            igPostBtn.className = 'supersave-ig-btn supersave-ig-post-btn';
            igPostBtn.type = 'button';
            igPostBtn.innerHTML = `<span>🔖 Save</span>`;
            igPostBtn.style.fontSize = '11px';
            igPostBtn.style.padding = '4px 9px';
            igPostBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                let targetUrl = window.location.href;
                const link = article?.querySelector('a[href*="/p/"], a[href*="/reel/"]');
                if (link?.href)
                    targetUrl = link.href;
                saveTargetUrl(targetUrl, igPostBtn);
            });
            section.appendChild(igPostBtn);
        });
    }
    // -------------------------------------------------------------
    // 5. X / Twitter Integrations
    // -------------------------------------------------------------
    function enhanceTwitter() {
        // Injects directly into Tweet Action Bars (next to like, retweet, bookmark)
        const tweetActionBars = document.querySelectorAll('article[data-testid="tweet"] div[role="group"]:not([' + BUTTON_ATTR + '])');
        tweetActionBars.forEach((bar) => {
            bar.setAttribute(BUTTON_ATTR, 'true');
            if (bar.querySelector('.supersave-x-btn'))
                return;
            const tweetCard = bar.closest('article[data-testid="tweet"]');
            const xBtn = document.createElement('button');
            xBtn.className = 'supersave-x-btn';
            xBtn.type = 'button';
            xBtn.innerHTML = `<span>🔖 Save</span>`;
            xBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                let targetUrl = window.location.href;
                const timeAnchor = tweetCard?.querySelector('time')?.closest('a');
                if (timeAnchor?.href)
                    targetUrl = timeAnchor.href;
                saveTargetUrl(targetUrl, xBtn);
            });
            bar.appendChild(xBtn);
        });
    }
    // -------------------------------------------------------------
    // 6. Clean UI Orchestrator
    // -------------------------------------------------------------
    console.log('[SuperSave] Active on ' + window.location.hostname);
    // Clean up any previously injected in-page buttons
    function cleanupInjectedElements() {
        document.querySelectorAll('.supersave-pin-btn, #' + FLOATING_BTN_ID).forEach((el) => el.remove());
    }
    cleanupInjectedElements();
    let debounceTimer = null;
    function runAdapters() {
        const host = window.location.hostname;
        if (host.includes('youtube.com')) {
            enhanceYouTube();
        }
        else if (host.includes('instagram.com')) {
            enhanceInstagram();
        }
        else if (host.includes('twitter.com') || host.includes('x.com')) {
            enhanceTwitter();
        }
    }
    function scheduleRun() {
        if (debounceTimer)
            window.clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(runAdapters, 40);
    }
    // Initial execution
    runAdapters();
    // Capture clicks (e.g. clicking "Share", clicking menu items)
    document.addEventListener('click', () => {
        setTimeout(runAdapters, 30);
        setTimeout(runAdapters, 120);
        setTimeout(runAdapters, 300);
    }, true);
    // MutationObserver for dynamic SPAs & dialogs
    const observer = new MutationObserver(() => {
        scheduleRun();
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['opened', 'style', 'class', 'aria-hidden'],
    });
    // Heartbeat interval for smooth infinite scrolling
    window.setInterval(runAdapters, 1000);
    // -------------------------------------------------------------
    // 8. Smart Copy-to-Save Triggers (Clipboard & Native Copy Buttons)
    // -------------------------------------------------------------
    function injectMainWorldBridge() {
        try {
            const script = document.createElement('script');
            script.textContent = `
        (() => {
          if (window.__supersave_interceptor_loaded) return;
          window.__supersave_interceptor_loaded = true;

          function broadcast(text) {
            if (!text || typeof text !== 'string') return;
            const trimmed = text.trim();
            if (trimmed.length > 5 && (trimmed.includes('http://') || trimmed.includes('https://') || trimmed.includes('pin.it'))) {
              window.postMessage({ type: 'SUPERSAVE_CLIPBOARD_WRITE', text: trimmed }, '*');
            }
          }

          if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
            navigator.clipboard.writeText = function(text) {
              try { broadcast(String(text || '')); } catch (_) {}
              return orig(text);
            };
          }

          if (navigator.clipboard && typeof navigator.clipboard.write === 'function') {
            const origW = navigator.clipboard.write.bind(navigator.clipboard);
            navigator.clipboard.write = function(data) {
              try {
                if (Array.isArray(data)) {
                  for (const item of data) {
                    if (item && item.types) {
                      for (const t of item.types) {
                        if (typeof t === 'string' && t.includes('text')) {
                          item.getType(t).then(b => b.text()).then(txt => broadcast(txt)).catch(() => {});
                        }
                      }
                    }
                  }
                }
              } catch (_) {}
              return origW(data);
            };
          }

          if (typeof document.execCommand === 'function') {
            const origExec = document.execCommand.bind(document);
            document.execCommand = function(cmd, showUI, val) {
              if (typeof cmd === 'string' && cmd.toLowerCase() === 'copy') {
                try {
                  let text = '';
                  const active = document.activeElement;
                  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
                    const start = active.selectionStart ?? 0;
                    const end = active.selectionEnd ?? 0;
                    text = end > start ? active.value.substring(start, end) : active.value;
                  }
                  if (!text && window.getSelection) {
                    text = window.getSelection().toString() || '';
                  }
                  broadcast(text);
                } catch (_) {}
              }
              return origExec(cmd, showUI, val);
            };
          }
        })();
      `;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
        }
        catch (_) { }
    }
    injectMainWorldBridge();
    // A. Listen for postMessages from MAIN-world interceptor
    window.addEventListener('message', (event) => {
        if (event.source !== window)
            return;
        if (event.data?.type === 'SUPERSAVE_CLIPBOARD_WRITE') {
            const text = String(event.data.text || '').trim();
            const extracted = extractSaveUrl(text);
            if (extracted) {
                showCopyPrompt(extracted);
            }
        }
    });
    // B. Native DOM 'copy' event
    document.addEventListener('copy', () => {
        let copiedText = '';
        const active = document.activeElement;
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
            const start = active.selectionStart ?? 0;
            const end = active.selectionEnd ?? 0;
            if (end > start) {
                copiedText = active.value.substring(start, end);
            }
            else {
                copiedText = active.value;
            }
        }
        if (!copiedText) {
            copiedText = window.getSelection()?.toString() || '';
        }
        const extracted = extractSaveUrl(copiedText);
        if (extracted) {
            showCopyPrompt(extracted);
        }
    });
    // C. Click listener for any "Copy Link" buttons or share menus
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (!target)
            return;
        const clickable = target.closest('button, [role="button"], [role="menuitem"], a, #copy-button, ytd-button-renderer#copy-button, [data-test-id*="copy" i]');
        if (!clickable)
            return;
        const text = (clickable.textContent || '').trim().toLowerCase();
        const aria = (clickable.getAttribute('aria-label') || '').toLowerCase();
        const title = (clickable.getAttribute('title') || '').toLowerCase();
        const dataTestId = (clickable.getAttribute('data-test-id') || '').toLowerCase();
        const combined = `${text} ${aria} ${title} ${dataTestId}`;
        const isCopyTrigger = combined.includes('copy link') ||
            combined.includes('copy url') ||
            combined.includes('copy share link') ||
            combined.includes('copy video url') ||
            (combined.includes('copy') && (combined.includes('link') || combined.includes('url')));
        if (isCopyTrigger) {
            window.setTimeout(() => {
                // 1. Check clipboard directly if permitted
                if (navigator.clipboard && navigator.clipboard.readText) {
                    navigator.clipboard.readText().then((clipText) => {
                        const extracted = extractSaveUrl(clipText);
                        if (extracted) {
                            showCopyPrompt(extracted);
                        }
                    }).catch(() => { });
                }
                // 2. Check for nearby or modal URL input
                const shareInput = document.querySelector('#share-url, input[id*="share" i], input[value^="http"], input[readonly][value*="http"]');
                if (shareInput) {
                    const extracted = extractSaveUrl(shareInput.value);
                    if (extracted) {
                        showCopyPrompt(extracted);
                        return;
                    }
                }
                // 3. Check if inside a post card / dialog with a permalink
                const container = clickable.closest('article, [data-testid="tweet"], div[role="dialog"], [data-test-id="pin"]');
                if (container) {
                    const anchor = container.querySelector('a[href*="/p/"], a[href*="/reel/"], a[href*="/status/"], a[href*="/comments/"], a[href*="/dp/"], a[href*="/pin/"]');
                    if (anchor?.href) {
                        const extracted = extractSaveUrl(anchor.href);
                        if (extracted) {
                            showCopyPrompt(extracted);
                            return;
                        }
                    }
                }
            }, 120);
        }
    }, true);
    // End of content script
})();
