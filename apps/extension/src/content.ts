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
    if (document.getElementById(STYLES_ID)) return;
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
  function showToast(title: string, message: string, dashboardUrl = 'http://localhost:3000/dashboard') {
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

    window.clearTimeout((toast as any)._timeout);
    (toast as any)._timeout = window.setTimeout(() => {
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

  function showCopyPrompt(url: string) {
    if (!url || !url.startsWith('http')) return;

    let prompt = document.getElementById(COPY_PROMPT_ID);
    if (prompt) {
      if ((prompt as any)._url === url) return;
      prompt.remove();
    }

    prompt = document.createElement('div');
    prompt.id = COPY_PROMPT_ID;
    (prompt as any)._url = url;
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
      if (!prompt) return;
      prompt.style.opacity = '0';
      prompt.style.transform = 'translateY(-16px)';
      window.setTimeout(() => prompt?.remove(), 260);
    };

    prompt.querySelector('#supersave-prompt-close')?.addEventListener('click', dismissPrompt);
    prompt.querySelector('#supersave-prompt-cancel')?.addEventListener('click', dismissPrompt);

    prompt.querySelector('#supersave-prompt-save')?.addEventListener('click', () => {
      const saveBtn = prompt?.querySelector<HTMLButtonElement>('#supersave-prompt-save');
      saveTargetUrl(url, saveBtn || undefined);
      window.setTimeout(dismissPrompt, 1200);
    });

    window.clearTimeout((prompt as any)._timeout);
    (prompt as any)._timeout = window.setTimeout(dismissPrompt, 14000);
  }

  // -------------------------------------------------------------
  // 2. Core Save Dispatcher
  // -------------------------------------------------------------
  function saveTargetUrl(url: string, buttonElement?: HTMLElement) {
    if (!url || !url.startsWith('http')) {
      url = window.location.href;
    }

    const originalContent = buttonElement ? buttonElement.innerHTML : '';
    if (buttonElement) {
      buttonElement.innerHTML = `<span>✦ Saving…</span>`;
      buttonElement.style.pointerEvents = 'none';
      buttonElement.style.opacity = '0.75';
    }

    chrome.runtime.sendMessage({ type: 'SAVE_CURRENT_PAGE', url }, (response) => {
      if (buttonElement) {
        buttonElement.style.pointerEvents = 'auto';
        buttonElement.style.opacity = '1';
      }

      if (response?.ok) {
        if (buttonElement) {
          buttonElement.innerHTML = `<span>✓ Saved!</span>`;
          window.setTimeout(() => {
            buttonElement.innerHTML = originalContent;
          }, 2400);
        }
        showToast('Saved to SuperSave!', 'Gemini is analyzing video and generating notes.');
      } else {
        if (buttonElement) {
          buttonElement.innerHTML = `<span>✕ Error</span>`;
          window.setTimeout(() => {
            buttonElement.innerHTML = originalContent;
          }, 2400);
        }
        showToast('Save failed', response?.error || 'Could not connect to SuperSave API server.');
      }
    });
  }

  // -------------------------------------------------------------
  // 3. YouTube Integrations
  // -------------------------------------------------------------
  function enhanceYouTube() {
    injectGlobalStyles();

    // A. Native Share Modal Integration (Watch Page, Shorts, or Homepage Share Dialog)
    const shareDialogs = document.querySelectorAll<HTMLElement>(
      'ytd-unified-share-panel-renderer, yt-copy-link-renderer, tp-yt-paper-dialog #copy-container'
    );

    if (shareDialogs.length > 0) {
      // 1. Button next to the Copy URL Input
      const copyContainers = document.querySelectorAll<HTMLElement>(
        '#copy-container, yt-copy-link-renderer #copy-container, [id="copy-container"]'
      );
      copyContainers.forEach((copyContainer) => {
        if (copyContainer.querySelector('.supersave-yt-share-btn') || copyContainer.parentElement?.querySelector('.supersave-yt-share-btn')) {
          return;
        }

        const urlInput =
          copyContainer.querySelector<HTMLInputElement>('#share-url') ||
          document.querySelector<HTMLInputElement>('#share-url');

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
        } else if (copyContainer.parentNode) {
          copyContainer.parentNode.insertBefore(shareBtn, copyContainer.nextSibling);
        } else {
          copyContainer.appendChild(shareBtn);
        }
      });

      // 2. Share Target Icon Carousel (Next to WhatsApp / Facebook)
      const targetContainers = document.querySelectorAll<HTMLElement>(
        '#target-container, yt-third-party-share-target-section-renderer #target-container'
      );
      targetContainers.forEach((targetContainer) => {
        if (targetContainer.querySelector('.supersave-yt-target-item')) return;

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
          const urlInput = document.querySelector<HTMLInputElement>('#share-url');
          const targetUrl = urlInput?.value || window.location.href;
          saveTargetUrl(targetUrl);
        });

        targetContainer.insertBefore(targetItem, targetContainer.firstChild);
      });
    }

    // B. Direct 1-Click Save Button on Video Cards & Shorts (Home Feed, Search Feed, Channels)
    const videoCards = document.querySelectorAll<HTMLElement>(
      'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer'
    );

    videoCards.forEach((card) => {
      if (card.querySelector('.supersave-yt-card-btn')) return;

      // Mount inside metadata block below channel name & views
      const metaContainer =
        card.querySelector<HTMLElement>('ytd-video-meta-block') ||
        card.querySelector<HTMLElement>('#meta.ytd-rich-grid-media, #meta.ytd-video-renderer, #meta') ||
        card.querySelector<HTMLElement>('#details');

      if (!metaContainer) return;

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
        const anchor = card.querySelector<HTMLAnchorElement>(
          'a#thumbnail, a#video-title-link, a.yt-simple-endpoint[href*="watch?v="], a.yt-simple-endpoint[href*="/shorts/"]'
        );
        const targetUrl = anchor?.href || window.location.href;
        saveTargetUrl(targetUrl, cardBtn);
      });

      cardBar.appendChild(cardBtn);
      metaContainer.appendChild(cardBar);
    });

    // C. Watch Page Permanent Action Button (Under the Video Player)
    const topLevelButtons = document.querySelector<HTMLElement>(
      'ytd-watch-metadata #top-level-buttons-computed, ytd-menu-renderer #top-level-buttons-computed'
    );
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
    const dialogs = document.querySelectorAll<HTMLElement>(
      'div[role="dialog"]:not([' + BUTTON_ATTR + '])'
    );

    dialogs.forEach((dialog) => {
      const text = (dialog.textContent || '').toLowerCase();
      const isShareModal =
        text.includes('share to') ||
        text.includes('copy link') ||
        text.includes('share') ||
        dialog.querySelector('svg[aria-label*="Share"], svg[aria-label*="Copy"]');

      if (!isShareModal) return;
      dialog.setAttribute(BUTTON_ATTR, 'true');

      const actionRow = dialog.querySelector<HTMLElement>(
        'div[style*="flex-direction: row"], div[class*="x9f619"][class*="xjbqb8w"]'
      ) || dialog.querySelector<HTMLElement>('div > div:last-child');

      if (actionRow && !dialog.querySelector('.supersave-ig-btn')) {
        const igBtn = document.createElement('button');
        igBtn.className = 'supersave-ig-btn';
        igBtn.type = 'button';
        igBtn.innerHTML = `<span>🔖 Save to SuperSave</span>`;

        igBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          let targetUrl = window.location.href;
          const postAnchor = document.querySelector<HTMLAnchorElement>(
            'article:hover a[href*="/p/"], article:hover a[href*="/reel/"], div:hover a[href*="/reel/"]'
          );
          if (postAnchor?.href) {
            targetUrl = postAnchor.href;
          }

          saveTargetUrl(targetUrl, igBtn);
        });

        if (actionRow.firstChild) {
          actionRow.insertBefore(igBtn, actionRow.firstChild);
        } else {
          actionRow.appendChild(igBtn);
        }
      }
    });

    // B. Direct Post Action Bar (Beneath Photo/Video)
    const postActions = document.querySelectorAll<HTMLElement>(
      'article section:not([' + BUTTON_ATTR + '])'
    );
    postActions.forEach((section) => {
      if (section.querySelector('.supersave-ig-post-btn')) return;
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
        const link = article?.querySelector<HTMLAnchorElement>('a[href*="/p/"], a[href*="/reel/"]');
        if (link?.href) targetUrl = link.href;

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
    const tweetActionBars = document.querySelectorAll<HTMLElement>(
      'article[data-testid="tweet"] div[role="group"]:not([' + BUTTON_ATTR + '])'
    );

    tweetActionBars.forEach((bar) => {
      bar.setAttribute(BUTTON_ATTR, 'true');
      if (bar.querySelector('.supersave-x-btn')) return;

      const tweetCard = bar.closest('article[data-testid="tweet"]');
      const xBtn = document.createElement('button');
      xBtn.className = 'supersave-x-btn';
      xBtn.type = 'button';
      xBtn.innerHTML = `<span>🔖 Save</span>`;

      xBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        let targetUrl = window.location.href;
        const timeAnchor = tweetCard?.querySelector<HTMLAnchorElement>('time')?.closest('a');
        if (timeAnchor?.href) targetUrl = timeAnchor.href;

        saveTargetUrl(targetUrl, xBtn);
      });

      bar.appendChild(xBtn);
    });
  }

  // -------------------------------------------------------------
  // 6. Generic Floating Fallback Action Button
  // -------------------------------------------------------------
  function makeFloatingButton() {
    if (document.getElementById(FLOATING_BTN_ID)) return;

    const button = document.createElement('button');
    button.id = FLOATING_BTN_ID;
    button.type = 'button';
    button.innerHTML = `<span>🔖 Save to SuperSave</span>`;
    button.style.cssText = `
      all: initial;
      box-sizing: border-box;
      position: fixed;
      right: 20px;
      bottom: 24px;
      z-index: 2147483646;
      padding: 10px 15px;
      border-radius: 999px;
      background: linear-gradient(135deg, #ba82ff, #7444d7);
      color: #ffffff;
      font: 700 12px Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      box-shadow: 0 10px 28px rgba(116, 68, 215, 0.38);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: transform 0.18s ease, box-shadow 0.18s ease;
      opacity: 0.9;
    `;
    button.onmouseenter = () => {
      button.style.transform = 'translateY(-2px)';
      button.style.opacity = '1';
    };
    button.onmouseleave = () => {
      button.style.transform = 'translateY(0)';
      button.style.opacity = '0.9';
    };

    button.addEventListener('click', () => {
      saveTargetUrl(window.location.href, button);
    });

    document.documentElement.appendChild(button);
  }

  // -------------------------------------------------------------
  // 7. Orchestrator with Debounced MutationObserver & Click Captures
  // -------------------------------------------------------------
  console.log('[SuperSave] Active on ' + window.location.hostname);

  let debounceTimer: number | null = null;
  function runAdapters() {
    const host = window.location.hostname;

    if (host.includes('youtube.com')) {
      enhanceYouTube();
    } else if (host.includes('instagram.com')) {
      enhanceInstagram();
    } else if (host.includes('twitter.com') || host.includes('x.com')) {
      enhanceTwitter();
    }

    makeFloatingButton();
  }

  function scheduleRun() {
    if (debounceTimer) window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(runAdapters, 40);
  }

  // Initial execution
  runAdapters();

  // Capture clicks (e.g. clicking "Share", clicking menu items)
  document.addEventListener(
    'click',
    () => {
      setTimeout(runAdapters, 30);
      setTimeout(runAdapters, 120);
      setTimeout(runAdapters, 300);
    },
    true
  );

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
  // Listen to any copy event on the page
  document.addEventListener('copy', () => {
    window.setTimeout(async () => {
      try {
        const text = await navigator.clipboard.readText();
        const trimmed = (text || '').trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          showCopyPrompt(trimmed);
        }
      } catch {
        const selected = (window.getSelection()?.toString() || '').trim();
        if (selected.startsWith('http://') || selected.startsWith('https://')) {
          showCopyPrompt(selected);
        }
      }
    }, 120);
  });

  // Also listen for clicks on any "Copy" or "Copy Link" buttons (e.g. YouTube Share Dialog)
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const copyBtn = target.closest(
        '#copy-button, button[aria-label*="Copy" i], [aria-label*="copy link" i], [title*="Copy" i], ytd-button-renderer#copy-button'
      );
      if (copyBtn) {
        window.setTimeout(async () => {
          const shareInput = document.querySelector<HTMLInputElement>('#share-url');
          let url = shareInput?.value || '';
          if (!url && navigator.clipboard) {
            url = await navigator.clipboard.readText().catch(() => '');
          }
          if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            showCopyPrompt(url.trim());
          }
        }, 150);
      }
    },
    true
  );
})();
