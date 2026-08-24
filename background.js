const CATALOG_URL = "https://raw.githubusercontent.com/crazyspike14k/steam-geforce-catalog/main/catalog.json";
const CACHE_KEY = "gfnCatalog";
const REFRESH_INTERVAL_MINUTES = 1440;

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("refresh-catalog", { periodInMinutes: REFRESH_INTERVAL_MINUTES });
  refreshCatalog();
});

chrome.runtime.onStartup.addListener(refreshCatalog);
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "refresh-catalog") refreshCatalog();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "get-catalog") return;

  chrome.storage.local.get(CACHE_KEY, (result) => {
    sendResponse({ catalog: result[CACHE_KEY] || null });
  });
  return true;
});

async function refreshCatalog() {
  try {
    const response = await fetch(CATALOG_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`Catalog HTTP ${response.status}`);

    const catalog = await response.json();
    if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) {
      throw new Error("Format de catalog invalid");
    }

    await chrome.storage.local.set({ [CACHE_KEY]: catalog });
  } catch (error) {
    console.warn("Catalogul GeForce NOW nu a putut fi actualizat.", error);
  }
}