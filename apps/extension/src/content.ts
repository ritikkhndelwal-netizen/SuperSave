(() => {
  const BUTTON_ID = 'super-save-action';
  const HOSTS = ['instagram.com', 'youtube.com'];

  function supported() {
    return HOSTS.some((host) => location.hostname === host || location.hostname.endsWith(`.${host}`));
  }

  function makeButton() {
    if (document.getElementById(BUTTON_ID)) return;
    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.textContent = '🔖 Save to SuperSave';
    button.style.cssText =
      'all:initial;box-sizing:border-box;position:fixed;right:18px;bottom:20px;z-index:2147483647;padding:11px 14px;border-radius:999px;background:linear-gradient(135deg,#ba82ff,#8752e9);color:#fff;font:700 12px Inter,Arial,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.25);cursor:pointer;';
    button.addEventListener('click', () =>
      chrome.runtime.sendMessage({ type: 'SAVE_CURRENT_PAGE', url: location.href }, (response) => {
        button.textContent = response?.ok ? '✓ Saved to SuperSave' : 'Try again';
        window.setTimeout(() => {
          button.textContent = '🔖 Save to SuperSave';
        }, 2200);
      })
    );
    document.documentElement.appendChild(button);
  }

  function enhanceShareMenus() {
    const menus = Array.from(document.querySelectorAll('[role="menu"], [role="dialog"], [data-menu]'));
    menus.forEach((menu) => {
      if (menu.querySelector('[data-super-save-action]')) return;
      const shareText = `${menu.textContent || ''}`.toLowerCase();
      if (!shareText.includes('share')) return;
      const action = document.createElement('button');
      action.setAttribute('data-super-save-action', '1');
      action.type = 'button';
      action.textContent = '🔖 Save to SuperSave';
      action.style.cssText =
        'display:block;width:100%;padding:10px 14px;border:0;border-radius:8px;background:transparent;color:inherit;text-align:left;font:600 13px Inter,Arial,sans-serif;cursor:pointer;';
      action.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'SAVE_CURRENT_PAGE', url: location.href });
        action.textContent = '✓ Saved to SuperSave';
      });
      menu.appendChild(action);
    });
  }

  if (supported()) {
    makeButton();
    const observer = new MutationObserver(() => {
      makeButton();
      enhanceShareMenus();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    enhanceShareMenus();
  }
})();
