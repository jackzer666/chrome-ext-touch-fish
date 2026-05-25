<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  createDomainRule,
  getDomainRuleKey,
  type DomainFeatureKey,
  type DomainRule,
  domainMatches,
  normalizeDomainInput,
  normalizeDomainRules,
  parsePageHostname,
  readSettings,
  writeSettings
} from "../settings";

const enabled = ref(true);
const activeTabId = ref<number | null>(null);
const currentHostname = ref("");
const domainInput = ref("");
const domains = ref<DomainRule[]>([]);

const currentDomainLabel = computed(() => currentHostname.value || "当前页面不支持");
const secondLevelHostname = computed(() => {
  const parts = currentHostname.value.split(".").filter(Boolean);
  return parts.length >= 2 ? parts.slice(-2).join(".") : currentHostname.value;
});
const normalizedInput = computed(() => normalizeDomainInput(domainInput.value));
const normalizedInputLabel = computed(() => (normalizedInput.value.domain ? getDomainRuleKey(normalizedInput.value) : ""));
const currentDomainAdded = computed(() =>
  domains.value.some((rule) => getDomainRuleKey(rule) === getDomainRuleKey(normalizedInput.value))
);
const addButtonText = computed(() => (currentDomainAdded.value ? "规则已添加" : "添加规则"));

const reloadActiveTab = () => {
  if (activeTabId.value !== null) {
    chrome.tabs.reload(activeTabId.value);
  }
};

const setDomainInput = (value: string) => {
  domainInput.value = value;
};

const addDomain = async () => {
  if (!normalizedInput.value.domain || currentDomainAdded.value) {
    return;
  }

  domains.value = normalizeDomainRules([
    ...domains.value,
    createDomainRule(getDomainRuleKey(normalizedInput.value))
  ]);
  await writeSettings({ domains: domains.value });
  reloadActiveTab();
};

const removeDomain = async (rule: DomainRule) => {
  const removedCurrentDomain = domainMatches(currentHostname.value, rule);
  domains.value = normalizeDomainRules(domains.value.filter((item) => getDomainRuleKey(item) !== getDomainRuleKey(rule)));
  await writeSettings({ domains: domains.value });

  if (removedCurrentDomain) {
    reloadActiveTab();
  }
};

const toggleDomainFeature = async (rule: DomainRule, feature: DomainFeatureKey) => {
  const changedCurrentDomain = domainMatches(currentHostname.value, rule);
  domains.value = normalizeDomainRules(
    domains.value.map((item) => {
      if (getDomainRuleKey(item) !== getDomainRuleKey(rule)) {
        return item;
      }

      return {
        ...item,
        [feature]: !item[feature]
      };
    })
  );
  await writeSettings({ domains: domains.value });

  if (changedCurrentDomain) {
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
  domainInput.value = currentHostname.value;

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

    <section class="addSection" aria-label="添加域名规则">
      <div class="domainChoices">
        <button
          class="choice"
          type="button"
          :disabled="!currentHostname"
          @click="setDomainInput(currentHostname)"
        >
          完整域名
        </button>
        <button
          class="choice"
          type="button"
          :disabled="!secondLevelHostname"
          @click="setDomainInput(`*.${secondLevelHostname}`)"
        >
          二级域名
        </button>
      </div>
      <div class="addRow">
        <input
          v-model="domainInput"
          class="domainInput"
          type="text"
          placeholder="example.com 或 *.example.com"
          aria-label="域名规则"
        >
        <button class="primary" type="button" :disabled="!normalizedInput.domain || currentDomainAdded" @click="addDomain">
          {{ addButtonText }}
        </button>
      </div>
      <p v-if="normalizedInputLabel" class="domainHint">将添加：{{ normalizedInputLabel }}</p>
    </section>

    <section class="listSection" aria-label="已启用域名">
      <div class="listHeader">
        <h2>启用名单</h2>
        <span>{{ domains.length }}</span>
      </div>
      <ul v-if="domains.length > 0" class="domainList">
        <li v-for="rule in domains" :key="getDomainRuleKey(rule)" class="domainItem">
          <div class="domainInfo">
            <span class="domainName">{{ getDomainRuleKey(rule) }}</span>
            <div class="featureToggles" aria-label="域名功能">
              <label class="featureToggle">
                <input
                  :checked="rule.blockMedia"
                  type="checkbox"
                  :aria-label="`${rule.domain} 图片替换`"
                  @change="toggleDomainFeature(rule, 'blockMedia')"
                >
                <span>图片替换</span>
              </label>
              <label class="featureToggle">
                <input
                  :checked="rule.dimPage"
                  type="checkbox"
                  :aria-label="`${rule.domain} 降低亮度`"
                  @change="toggleDomainFeature(rule, 'dimPage')"
                >
                <span>降低亮度</span>
              </label>
            </div>
          </div>
          <button class="remove" type="button" @click="removeDomain(rule)">移除</button>
        </li>
      </ul>
      <p v-else class="empty">暂无域名</p>
    </section>
  </main>
</template>
