(() => {
  const localCatalog = globalThis.GFN_CATALOG || {};
  let catalog = localCatalog;

  scanSteamGames();
    chrome.runtime.sendMessage({ type: "get-catalog" }, (response) => {
      if (chrome.runtime.lastError || !response?.catalog) return;
      catalog = response.catalog;
      scanPage();
    });

    const observer = new MutationObserver(() => scanPage());
    observer.observe(document.body, { childList: true, subtree: true });

    function scanPage() {
      const appPageId = getAppIdFromUrl(window.location.href);
      if (appPageId) {
        addPageBadge(appPageId);
      } else {
        addListIcons();
      }
    }

    function addPageBadge(appId) {
      const title = document.querySelector(".apphub_AppName")
        || document.querySelector(".game_name")
        || document.querySelector("#appHubAppName")
        || document.querySelector("h1");
      if (!title) return;

      let badge = document.querySelector(".gfn-steam-badge.is-page-badge");
      if (!badge) {
        badge = document.createElement("div");
        title.insertAdjacentElement("beforebegin", badge);
      }
      updatePageBadge(badge, catalog[appId]);
    }

    function addListIcons() {
      const cards = new Set();
      document.querySelectorAll('a[href*="/app/"]').forEach((link) => {
        const appId = getAppIdFromUrl(link.href);
        const card = link.closest(".search_result_row, .small_cap, .tab_item, .ds_card, .salepreview") || link.parentElement;
        if (!appId || !card || cards.has(card)) return;
        cards.add(card);

        const imageLink = [...card.querySelectorAll('a[href*="/app/"]')]
          .find((candidate) => hasGameImage(candidate)) || link;
        if (!hasGameImage(imageLink)) return;

        const existingIcon = imageLink.querySelector(".gfn-steam-icon");
        if (existingIcon) {
          updateListIcon(existingIcon, catalog[appId]);
          return;
        }

        imageLink.classList.add("gfn-steam-image-link");
        const icon = document.createElement("span");
        updateListIcon(icon, catalog[appId]);
        imageLink.appendChild(icon);
      });
    }

    function updatePageBadge(badge, entry) {
      const state = entry ? (entry.available ? "is-available" : "is-unavailable") : "is-unknown";
      badge.className = `gfn-steam-badge is-page-badge ${state}`;
      badge.setAttribute("role", "status");
      if (entry?.available) {
        badge.innerHTML = '<span class="gfn-dot"></span><span class="gfn-status-text">Disponibil in GeForce NOW</span><a class="gfn-open-button" href="https://play.geforcenow.com/" target="_blank" rel="noopener">Deschide in GeForce NOW</a>';
      } else if (entry) {
        badge.innerHTML = '<span class="gfn-dot"></span><span class="gfn-status-text">Nu apare in GeForce NOW</span><a class="gfn-open-button" href="https://play.geforcenow.com/" target="_blank" rel="noopener">Deschide GeForce NOW</a>';
      } else {
        badge.innerHTML = '<span class="gfn-dot"></span><span class="gfn-status-text">Disponibilitatea nu este confirmata local</span><a class="gfn-open-button" href="https://play.geforcenow.com/" target="_blank" rel="noopener">Verifica in GeForce NOW</a>';
      }
    }

    function getAppIdFromUrl(url) {
      const match = url.match(/\/app\/(\d+)/);
      return match ? match[1] : null;
    }
  })();
    if (chrome.runtime.lastError || !response?.catalog) return;
    catalog = response.catalog;
    scanSteamGames();
  });

  const observer = new MutationObserver(() => scanSteamGames());
  observer.observe(document.body, { childList: true, subtree: true });

  function scanSteamGames() {
    const appPageId = getSteamAppId();
    if (appPageId) {
      const title = document.querySelector(".apphub_AppName")
        || document.querySelector(".game_name")
        || document.querySelector("#appHubAppName");
      if (title && !document.querySelector(".gfn-steam-badge.is-page-badge")) {
        const badge = createBadge(catalog[appPageId], true);
        badge.classList.add("is-page-badge");
        title.insertAdjacentElement("beforebegin", badge);
      }
      const pageBadge = document.querySelector(".gfn-steam-badge.is-page-badge");
      if (pageBadge) updateBadge(pageBadge, catalog[appPageId], true);
    }

    document.querySelectorAll('a[href*="/app/"]').forEach((link) => {
      const appId = getAppIdFromUrl(link.href);
      if (!appId || link.closest(".gfn-steam-game")) return;

      const container = link.closest(".search_result_row, .small_cap, .tab_item, .ds_card, .salepreview, .game_page_autocollapse") || link.parentElement;
      if (!container) return;
      container.classList.add("gfn-steam-game");
      const badge = createBadge(catalog[appId], false);
      container.appendChild(badge);
    });
  }

  function updateListIcon(icon, entry) {
    icon.className = `gfn-steam-icon ${entry?.available ? "is-available" : "is-unknown"}`;
    icon.title = entry?.available
      ? "Disponibil in GeForce NOW"
      : "Disponibilitate GeForce NOW neconfirmata";
    icon.setAttribute("aria-label", icon.title);
    icon.textContent = "G";
  }

  function hasGameImage(link) {
    if (link.querySelector("img, [style*='background-image']")) return true;
    return getComputedStyle(link).backgroundImage !== "none";
  }

  function createBadge(entry, isPageBadge) {
    const badge = document.createElement("div");
    badge.className = `gfn-steam-badge ${isPageBadge ? "is-page-badge" : "is-list-badge"}`;
    badge.setAttribute("role", "status");
    updateBadge(badge, entry, isPageBadge);
    return badge;
  }

  function updateBadge(badge, entry, isPageBadge) {
    const state = entry ? (entry.available ? "is-available" : "is-unavailable") : "is-unknown";
    badge.className = `gfn-steam-badge ${isPageBadge ? "is-page-badge" : "is-list-badge"} ${state}`;
    const label = entry?.available
      ? "Disponibil in GeForce NOW"
      : entry
        ? "Nu apare in GeForce NOW"
        : "Disponibilitate neconfirmata";
    badge.innerHTML = `<span class="gfn-dot"></span><span class="gfn-status-text">${label}</span><a class="gfn-open-button" href="https://play.geforcenow.com/" target="_blank" rel="noopener">Deschide</a>`;
  }

  function getSteamAppId() {
    return getAppIdFromUrl(window.location.href);
  }

  function getAppIdFromUrl(url) {
    const match = url.match(/\/app\/(\d+)/);
    return match ? match[1] : null;
  }
})();
(() => {
  const appId = getSteamAppId();
  if (!appId || document.querySelector(".gfn-steam-badge")) return;

  showBadge(globalThis.GFN_CATALOG?.[appId]);

  chrome.runtime.sendMessage({ type: "get-catalog" }, (response) => {
    if (chrome.runtime.lastError) return;
    const catalog = response?.catalog;
    if (catalog) updateBadge(catalog[appId]);
  });

  function showBadge(entry) {
    const badge = document.createElement("div");
    badge.className = "gfn-steam-badge";
    badge.setAttribute("role", "status");

    insertBadge(badge);
    updateBadge(entry);
  }

  function updateBadge(entry) {
    const badge = document.querySelector(".gfn-steam-badge");
    if (!badge) return;

    const state = entry ? (entry.available ? "is-available" : "is-unavailable") : "is-unknown";
    badge.className = `gfn-steam-badge ${state}`;
    if (entry?.available) {
      badge.innerHTML = '<span class="gfn-dot"></span><span class="gfn-status-text">Disponibil in GeForce NOW</span><a class="gfn-open-button" href="https://play.geforcenow.com/" target="_blank" rel="noopener">Deschide in GeForce NOW</a>';
    } else if (entry) {
      badge.innerHTML = '<span class="gfn-dot"></span><span class="gfn-status-text">Nu apare in catalogul GeForce NOW</span><a class="gfn-open-button" href="https://play.geforcenow.com/" target="_blank" rel="noopener">Deschide GeForce NOW</a>';
    } else {
      badge.innerHTML = '<span class="gfn-dot"></span><span class="gfn-status-text">Disponibilitatea nu este confirmata local</span><a class="gfn-open-button" href="https://play.geforcenow.com/" target="_blank" rel="noopener">Verifica in GeForce NOW</a>';
    }
  }

  function insertBadge(badge) {
  const target = document.querySelector(".apphub_AppName")
    || document.querySelector(".game_name")
    || document.querySelector("#appHubAppName");

  if (target) {
    target.insertAdjacentElement("beforebegin", badge);
  } else {
    document.body.prepend(badge);
  }
  }

  function getSteamAppId() {
    const match = window.location.pathname.match(/\/app\/(\d+)/);
    return match ? match[1] : null;
  }
})();
