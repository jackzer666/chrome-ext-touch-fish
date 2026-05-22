<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  domainListMatches,
  domainMatches,
  normalizeDomains,
  parsePageHostname,
  readSettings,
  writeSettings
} from "../settings";

const enabled = ref(true);
const activeTabId = ref<number | null>(null);
const currentHostname = ref("");
const domains = ref<string[]>([]);

const currentDomainLabel = computed(() => currentHostname.value || "当前页面不支持");
const currentDomainAdded = computed(
  () => Boolean(currentHostname.value) && domainListMatches(currentHostname.value, domains.value)
);
const addButtonText = computed(() => (currentDomainAdded.value ? "当前域名已添加" : "添加当前域名"));

const reloadActiveTab = () => {
  if (activeTabId.value !== null) {
    chrome.tabs.reload(activeTabId.value);
  }
};

const addCurrentDomain = async () => {
  if (!currentHostname.value || currentDomainAdded.value) {
    return;
  }

  domains.value = normalizeDomains([...domains.value, currentHostname.value]);
  await writeSettings({ domains: domains.value });
  reloadActiveTab();
};

const removeDomain = async (domain: string) => {
  const removedCurrentDomain = domainMatches(currentHostname.value, domain);
  domains.value = normalizeDomains(domains.value.filter((item) => item !== domain));
  await writeSettings({ domains: domains.value });

  if (removedCurrentDomain) {
    reloadActiveTab();
  }
};

const toggleEnabled = async () => {
  await writeSettings({ enabled: enabled.value });
  reloadActiveTab();
};

onMounted(async () => {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTabId.value = activeTab?.id ?? null;
  currentHostname.value = parsePageHostname(activeTab?.url || "");

  const settings = await readSettings();
  enabled.value = settings.enabled;
  domains.value = settings.domains;
});
</script>

<template>
  <main class="popup">
    <header class="header">
      <div>
        <h1>摸鱼遮罩</h1>
        <p class="domain">{{ currentDomainLabel }}</p>
      </div>
      <label class="switch" title="启用或停用插件">
        <input v-model="enabled" type="checkbox" aria-label="启用插件" @change="toggleEnabled">
        <span></span>
      </label>
    </header>

    <button class="primary" type="button" :disabled="!currentHostname || currentDomainAdded" @click="addCurrentDomain">
      {{ addButtonText }}
    </button>

    <section class="listSection" aria-label="已启用域名">
      <div class="listHeader">
        <h2>启用名单</h2>
        <span>{{ domains.length }}</span>
      </div>
      <ul v-if="domains.length > 0" class="domainList">
        <li v-for="domain in domains" :key="domain" class="domainItem">
          <span class="domainName">{{ domain }}</span>
          <button class="remove" type="button" @click="removeDomain(domain)">移除</button>
        </li>
      </ul>
      <p v-else class="empty">暂无域名</p>
    </section>
  </main>
</template>
