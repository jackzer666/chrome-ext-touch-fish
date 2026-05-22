(function () {
  "use strict";

  const shared = window.TOUCH_FISH_SHARED;

  const enabledToggle = document.getElementById("enabledToggle");
  const currentDomainEl = document.getElementById("currentDomain");
  const addDomainButton = document.getElementById("addDomain");
  const domainList = document.getElementById("domainList");
  const domainCount = document.getElementById("domainCount");
  const emptyState = document.getElementById("emptyState");

  let activeTabId = null;
  let currentHostname = "";
  let domains = [];

  function reloadActiveTab() {
    if (activeTabId !== null) {
      chrome.tabs.reload(activeTabId);
    }
  }

  function renderList() {
    domainList.textContent = "";
    domainCount.textContent = String(domains.length);
    emptyState.hidden = domains.length > 0;

    domains.forEach((domain) => {
      const item = document.createElement("li");
      item.className = "domainItem";

      const name = document.createElement("span");
      name.className = "domainName";
      name.textContent = domain;

      const removeButton = document.createElement("button");
      removeButton.className = "remove";
      removeButton.type = "button";
      removeButton.textContent = "移除";
      removeButton.dataset.domain = domain;

      item.append(name, removeButton);
      domainList.appendChild(item);
    });
  }

  function renderAddButton() {
    const hasCurrentDomain = currentHostname && shared.domainListMatches(currentHostname, domains);
    addDomainButton.disabled = !currentHostname || hasCurrentDomain;
    addDomainButton.textContent = hasCurrentDomain ? "当前域名已添加" : "添加当前域名";
  }

  async function addCurrentDomain() {
    if (!currentHostname || shared.domainListMatches(currentHostname, domains)) {
      return;
    }

    domains = shared.normalizeDomains([...domains, currentHostname]);
    await shared.writeSettings({ domains });
    renderList();
    renderAddButton();
    reloadActiveTab();
  }

  async function removeDomain(domain) {
    const removedCurrentDomain = shared.domainMatches(currentHostname, domain);
    domains = shared.normalizeDomains(domains.filter((item) => item !== domain));
    await shared.writeSettings({ domains });
    renderList();
    renderAddButton();

    if (removedCurrentDomain) {
      reloadActiveTab();
    }
  }

  async function toggleEnabled() {
    await shared.writeSettings({ enabled: enabledToggle.checked });
    reloadActiveTab();
  }

  async function init() {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTabId = activeTab?.id ?? null;
    currentHostname = shared.parsePageHostname(activeTab?.url || "");
    currentDomainEl.textContent = currentHostname || "当前页面不支持";

    const settings = await shared.readSettings();
    enabledToggle.checked = settings.enabled;
    domains = settings.domains;

    renderList();
    renderAddButton();
  }

  domainList.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const removeButton = event.target.closest(".remove");
    if (removeButton?.dataset.domain) {
      removeDomain(removeButton.dataset.domain);
    }
  });
  addDomainButton.addEventListener("click", addCurrentDomain);
  enabledToggle.addEventListener("change", toggleEnabled);
  init();
})();
