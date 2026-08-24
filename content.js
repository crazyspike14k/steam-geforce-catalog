(() => {
  const localCatalog = globalThis.GFN_CATALOG || {};
  let catalog = localCatalog;

  scanPage();
  chrome.runtime.sendMessage({ type: "get-catalog" }, (response) => {
    if (chrome.runtime.lastError || !response?.catalog) return;
    catalog = response.catalog;
    scanPage();
  });

  const observer = new MutationObserver(scanPage);
  observer.observe(document.body, { childList: true, subtree: true });

  function scanPage() {
    const appId = getAppId(window.location.href);
    if (appId) {
      addPageBadge(appId);
    } else {
      addListIcons();
    }
  }

  function addPageBadge(appId) {
    const title = document.querySelector(".apphub_AppName, .game_name, #appHubAppName, h1");
    if (!title) return;

    let badge = document.querySelector(".gfn-steam-badge.is-page-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "gfn-steam-badge is-page-badge";
      title.insertAdjacentElement("beforebegin", badge);
    }
    updatePageBadge(badge, catalog[appId]);
  }

  function addListIcons() {
    const processedCards = new Set();
    document.querySelectorAll('a[href*="/app/"]').forEach((link) => {
      const appId = getAppId(link.href);
      const card = link.closest(".search_result_row, .small_cap, .tab_item, .ds_card, .salepreview, .home_smallcap") || link.parentElement;
      if (!appId || !card || processedCards.has(card)) return;
      processedCards.add(card);

      const imageLink = [...card.querySelectorAll('a[href*="/app/"]')]
        .find((candidate) => hasGameImage(candidate)) || link;
      if (!hasGameImage(imageLink)) return;

      let icon = imageLink.querySelector(".gfn-steam-icon");
      if (!icon) {
        imageLink.classList.add("gfn-steam-image-link");
        icon = document.createElement("span");
        imageLink.appendChild(icon);
      }
      updateListIcon(icon, catalog[appId]);
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

  function updateListIcon(icon, entry) {
    icon.className = `gfn-steam-icon ${entry?.available ? "is-available" : "is-unknown"}`;
    icon.title = entry?.available ? "Disponibil in GeForce NOW" : "Disponibilitate GeForce NOW neconfirmata";
    icon.setAttribute("aria-label", icon.title);
    icon.textContent = "G";
  }

  function hasGameImage(link) {
    return Boolean(link.querySelector("img, [style*='background-image']") || getComputedStyle(link).backgroundImage !== "none");
  }

  function getAppId(url) {
    const match = url.match(/\/app\/(\d+)/);
    return match ? match[1] : null;
  }
})();
