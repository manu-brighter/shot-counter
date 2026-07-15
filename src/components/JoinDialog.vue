<template>
  <v-dialog
    :model-value="modelValue"
    max-width="420"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="sc-dialog-card">
      <v-card-title>{{ t('joinDialog.title') }}</v-card-title>
      <v-card-text>
        <div
          v-if="!info && !failed"
          class="join-loading"
        >
          <v-progress-circular
            indeterminate
            color="primary"
          />
        </div>

        <template v-else-if="urls.length">
          <p class="join-hint">
            {{ t('joinDialog.scanHint') }}
          </p>
          <!-- Locally generated QR markup, no user input involved. -->
          <!-- eslint-disable vue/no-v-html -->
          <div
            class="join-qr"
            v-html="qrSvg"
          />
          <!-- eslint-enable vue/no-v-html -->
          <p class="join-url">
            {{ activeUrl }}
          </p>
          <v-chip-group
            v-if="urls.length > 1"
            v-model="selected"
            class="join-networks"
            mandatory
            column
          >
            <v-chip
              v-for="(url, index) in urls"
              :key="url"
              :value="index"
              size="small"
              variant="outlined"
            >
              {{ info.ips[index] }}
            </v-chip>
          </v-chip-group>
          <p class="join-note">
            {{ t('joinDialog.note') }}
          </p>
        </template>

        <p v-else>
          {{ t('joinDialog.unavailable') }}
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          {{ t('actions.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { renderSVG } from 'uqr';

import { API_BASE } from '@/composables/useTeams';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
});

const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();

const info = ref(null);
const failed = ref(false);
const selected = ref(0);

const urls = computed(() => (info.value?.ips ?? []).map((ip) => `http://${ip}:${info.value.port}`));
const activeUrl = computed(() => urls.value[selected.value] ?? urls.value[0] ?? '');

const qrSvg = computed(() => {
  if (!activeUrl.value) return '';
  return renderSVG(activeUrl.value, {
    ecc: 'M',
    border: 2,
    blackColor: '#141009',
    whiteColor: '#f6eedc',
  });
});

const load = async () => {
  info.value = null;
  failed.value = false;
  selected.value = 0;
  try {
    const res = await fetch(`${API_BASE}/api/server-info`);
    if (!res.ok) throw new Error(await res.text());
    info.value = await res.json();
  } catch (err) {
    console.error('Error fetching server info:', err);
    failed.value = true;
  }
};

watch(() => props.modelValue, (open) => {
  if (open) load();
});
</script>

<style scoped>
.join-loading {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}

.join-hint {
  margin-bottom: 16px;
}

.join-qr {
  max-width: 240px;
  margin: 0 auto;
  padding: 12px;
  border-radius: 16px;
  background: var(--sc-cream);
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.35);
}

.join-qr :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}

.join-url {
  margin: 14px 0 4px;
  text-align: center;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--sc-cream);
  overflow-wrap: anywhere;
}

.join-networks {
  justify-content: center;
}

.join-note {
  margin-top: 14px;
  font-size: 0.85rem;
}
</style>
