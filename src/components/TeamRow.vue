<template>
  <article
    class="team-row"
    :class="rankClass"
  >
    <div class="team-row__rank">
      {{ rank }}
    </div>

    <div class="team-row__name">
      <button
        v-if="!editing"
        type="button"
        class="team-row__name-btn"
        :title="t('actions.editTeamName')"
        @click="startEditing"
      >
        <span class="team-row__name-text">{{ team.name }}</span>
        <v-icon
          size="x-small"
          class="team-row__edit-hint"
        >
          $pencil
        </v-icon>
      </button>
      <v-text-field
        v-else
        v-model="editName"
        density="compact"
        hide-details
        autofocus
        :aria-label="t('actions.editTeamName')"
        @blur="saveName"
        @keyup.enter="saveName"
        @keydown.esc="cancelEditing"
      />
    </div>

    <button
      v-if="!editingCount"
      type="button"
      class="team-row__count-btn"
      :title="t('actions.setCount')"
      :aria-label="`${t('actions.setCount')} (${team.counter})`"
      @click="startCountEdit"
    >
      <ShotOdometer
        :value="team.counter"
        class="team-row__count"
      />
    </button>
    <input
      v-else
      ref="countInput"
      v-model="countValue"
      class="team-row__count-input"
      type="text"
      inputmode="numeric"
      :aria-label="t('actions.setCount')"
      @blur="saveCount"
      @keyup.enter="saveCount"
      @keydown.esc="cancelCountEdit"
    >

    <div class="team-row__actions">
      <v-btn
        class="team-row__minus"
        variant="tonal"
        icon
        :disabled="team.counter === 0"
        :aria-label="t('actions.removeShot')"
        @click="emit('decrement')"
      >
        <v-icon>$minus</v-icon>
      </v-btn>
      <div class="team-row__plus-wrap">
        <v-btn
          class="team-row__plus"
          color="primary"
          variant="flat"
          icon
          :aria-label="t('actions.addShot')"
          @click="onPlus"
        >
          <v-icon>$plus</v-icon>
        </v-btn>
        <span
          v-if="burstId"
          :key="burstId"
          class="team-row__burst"
          aria-hidden="true"
        >
          <i
            v-for="n in 8"
            :key="n"
            :style="{ '--angle': `${n * 45}deg` }"
          />
        </span>
      </div>
    </div>

    <v-menu content-class="sc-menu">
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          class="team-row__more"
          variant="text"
          icon
          size="small"
          :aria-label="t('actions.teamOptions', { name: team.name })"
        >
          <v-icon>$dotsVertical</v-icon>
        </v-btn>
      </template>
      <v-list
        density="compact"
        bg-color="transparent"
      >
        <v-list-item @click="startEditing">
          <template #prepend>
            <v-icon size="small">
              $pencil
            </v-icon>
          </template>
          <v-list-item-title>{{ t('actions.rename') }}</v-list-item-title>
        </v-list-item>
        <v-list-item
          class="text-error"
          @click="emit('delete')"
        >
          <template #prepend>
            <v-icon size="small">
              $delete
            </v-icon>
          </template>
          <v-list-item-title>{{ t('actions.delete') }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </article>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

import ShotOdometer from '@/components/ShotOdometer.vue';

const props = defineProps({
  team: { type: Object, required: true },
  rank: { type: Number, required: true },
});

const emit = defineEmits(['increment', 'decrement', 'rename', 'delete', 'set-count', 'count-invalid']);

const { t } = useI18n();

// Medals only exist once a team has scored — an all-zero board has no leader.
const rankClass = computed(() => {
  const scored = props.team.counter > 0;
  return {
    'team-row--gold': scored && props.rank === 1,
    'team-row--silver': scored && props.rank === 2,
    'team-row--bronze': scored && props.rank === 3,
  };
});

const editing = ref(false);
const editName = ref('');

const startEditing = () => {
  editName.value = props.team.name;
  editing.value = true;
};

const cancelEditing = () => {
  editing.value = false;
};

const saveName = () => {
  // Leave edit mode synchronously: @keyup.enter also triggers @blur, and
  // without this both would fire their own event.
  if (!editing.value) return;
  editing.value = false;

  const name = editName.value.trim();
  if (name === props.team.name) return;
  emit('rename', name);
};

// Click the number, type the new total — for "add 20 shots at once" moments.
const editingCount = ref(false);
const countValue = ref('');
const countInput = ref(null);

const startCountEdit = async () => {
  countValue.value = String(props.team.counter);
  editingCount.value = true;
  await nextTick();
  countInput.value?.select();
};

const cancelCountEdit = () => {
  editingCount.value = false;
};

const saveCount = () => {
  // Leave edit mode synchronously: @keyup.enter also triggers @blur, and
  // without this both would fire their own event.
  if (!editingCount.value) return;
  editingCount.value = false;

  const raw = countValue.value.trim();
  if (!/^\d{1,6}$/.test(raw)) {
    emit('count-invalid');
    return;
  }
  const value = Number(raw);
  if (value === props.team.counter) return;
  emit('set-count', value);
};

// Amber splash from the + button; re-keyed per tap so it restarts cleanly.
const burstId = ref(0);
let burstTimer = null;

const onPlus = () => {
  emit('increment');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  burstId.value = Date.now();
  clearTimeout(burstTimer);
  burstTimer = setTimeout(() => (burstId.value = 0), 600);
};

onBeforeUnmount(() => clearTimeout(burstTimer));
</script>

<style scoped>
/* All metrics come from --sc-* vars so the desktop density slider (see
   useBoardDensity.js) can scale the rows; fallbacks are the comfortable
   default size. */
.team-row {
  position: relative;
  display: grid;
  grid-template-areas: 'rank name count actions more';
  grid-template-columns: auto minmax(0, 1fr) auto auto auto;
  align-items: center;
  gap: 14px;
  padding: var(--sc-row-pad-y, 14px) var(--sc-row-pad-x, 18px);
  background: var(--sc-surface);
  border: 1px solid var(--sc-line);
  border-radius: var(--sc-row-radius, 18px);
}

/* The gold wash lives on a fading overlay instead of the row itself: class
   swaps mid-FLIP would otherwise snap colors and repaint while rows glide. */
.team-row::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  pointer-events: none;
  border: 1px solid rgba(255, 201, 60, 0.32);
  background: linear-gradient(90deg, rgba(255, 182, 39, 0.09), rgba(255, 182, 39, 0.02) 45%, transparent 75%);
  box-shadow: 0 0 34px rgba(255, 182, 39, 0.10);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.team-row--gold::after {
  opacity: 1;
}

/* Rank badge */
.team-row__rank {
  grid-area: rank;
  display: grid;
  place-items: center;
  width: var(--sc-rank, 44px);
  height: var(--sc-rank, 44px);
  border-radius: 50%;
  border: 1px solid var(--sc-line);
  background: var(--sc-surface-2);
  color: var(--sc-faded);
  font-family: var(--sc-display);
  font-size: var(--sc-rank-font, 1.15rem);
  line-height: 1;
}

.team-row--gold .team-row__rank {
  background: radial-gradient(circle at 30% 25%, #ffe08a, var(--sc-gold) 55%, #c98f00);
  border-color: transparent;
  color: var(--sc-amber-ink);
  box-shadow: 0 2px 14px rgba(255, 201, 60, 0.35);
}

.team-row--silver .team-row__rank {
  background: radial-gradient(circle at 30% 25%, #f2f6fb, var(--sc-silver) 55%, #8d99a8);
  border-color: transparent;
  color: #1c2129;
}

.team-row--bronze .team-row__rank {
  background: radial-gradient(circle at 30% 25%, #ecb489, var(--sc-bronze) 55%, #9c5f2c);
  border-color: transparent;
  color: #2a1505;
}

/* The pour — liquid gold edge on the leading row. Pulses opacity only, so it
   stays compositor-friendly while rows are animating past each other. */
.team-row--gold::before {
  content: '';
  position: absolute;
  left: -1px;
  top: 20%;
  bottom: 20%;
  width: 3px;
  border-radius: 3px;
  background: linear-gradient(180deg, #ffe08a, var(--sc-gold) 45%, #c98f00);
  box-shadow: 0 0 16px rgba(255, 201, 60, 0.45);
  animation: pour 2.8s ease-in-out infinite;
}

@keyframes pour {
  0%, 100% {
    opacity: 0.65;
  }
  50% {
    opacity: 1;
  }
}

/* Team name */
.team-row__name {
  grid-area: name;
  min-width: 0;
}

.team-row__name-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  padding: 3px 6px;
  margin: -3px -6px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.team-row__name-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: var(--sc-name-font, 1.08rem);
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.3;
}

.team-row__edit-hint {
  flex: none;
  opacity: 0;
  color: var(--sc-faded);
  transition: opacity 0.15s ease;
}

.team-row__name-btn:hover .team-row__edit-hint,
.team-row__name-btn:focus-visible .team-row__edit-hint {
  opacity: 0.7;
}

/* No hover on touch — keep a faint affordance instead */
@media (hover: none) {
  .team-row__edit-hint {
    opacity: 0.35;
  }
}

/* Counter — a button, because clicking it opens direct input */
.team-row__count-btn {
  grid-area: count;
  justify-self: start;
  display: flex;
  align-items: center;
  margin-right: 6px;
  padding: 2px 8px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: inherit;
  line-height: 1;
  cursor: pointer;
}

.team-row__count-btn:hover,
.team-row__count-btn:focus-visible {
  background: var(--sc-amber-soft);
}

/* Integer px sizes on purpose: the odometer translates its digit strip in em,
   and a fractional em leaks a sliver of the neighbouring digit. */
.team-row__count {
  font-size: var(--sc-count-font, 34px);
  color: var(--sc-cream);
  transition: color 0.5s ease;
}

.team-row--gold .team-row__count {
  color: var(--sc-gold);
  text-shadow: 0 0 18px rgba(255, 201, 60, 0.35);
}

.team-row__count-input {
  grid-area: count;
  justify-self: start;
  width: 6ch;
  margin-right: 6px;
  padding: 2px 8px;
  border: 1px solid var(--sc-amber);
  border-radius: 10px;
  background: var(--sc-surface-2);
  color: var(--sc-cream);
  font-family: var(--sc-display);
  font-size: calc(var(--sc-count-font, 34px) * 0.72);
  text-align: right;
  outline: none;
}

/* Actions */
.team-row__actions {
  grid-area: actions;
  display: flex;
  align-items: center;
  gap: var(--sc-actions-gap, 10px);
}

/* The extra .team-row__actions ancestor outscores Vuetify's own
   .v-btn--icon.v-btn--density-default sizing, which loads later. */
.team-row__actions .team-row__minus {
  width: var(--sc-minus, 42px);
  height: var(--sc-minus, 42px);
}

.team-row__minus :deep(.v-icon) {
  font-size: calc(var(--sc-minus, 42px) * 0.5);
}

.team-row__plus-wrap {
  position: relative;
  display: flex;
}

.team-row__actions .team-row__plus {
  width: var(--sc-plus, 54px);
  height: var(--sc-plus, 54px);
  box-shadow: 0 4px 18px rgba(255, 182, 39, 0.28);
  transition: transform 0.12s ease, box-shadow 0.2s ease;
}

.team-row__plus :deep(.v-icon) {
  font-size: calc(var(--sc-plus, 54px) * 0.52);
}

.team-row__actions .team-row__more {
  width: var(--sc-more, 40px);
  height: var(--sc-more, 40px);
}

.team-row__plus:active {
  transform: scale(0.92);
}

.team-row__more {
  grid-area: more;
  color: var(--sc-faded);
}

/* Splash burst */
.team-row__burst {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.team-row__burst i {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sc-amber);
  opacity: 0.9;
  transform: translate(-50%, -50%) rotate(var(--angle)) translateX(10px);
  animation: burst 0.5s ease-out forwards;
}

@keyframes burst {
  to {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(36px);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .team-row--gold::before {
    animation: none;
  }

  .team-row__burst i {
    animation: none;
    opacity: 0;
  }
}

/* Phones: rank + name + menu on the first line, then the counter as the hero
   with big thumb-sized buttons on the second. Phones are the tapping devices. */
@media (max-width: 640px) {
  .team-row {
    grid-template-areas:
      'rank name more'
      'count count actions';
    grid-template-columns: auto minmax(0, 1fr) auto;
    row-gap: 12px;
    column-gap: 10px;
    padding: 12px 14px 14px;
    border-radius: 16px;
  }

  .team-row__rank {
    width: 28px;
    height: 28px;
    font-size: 0.85rem;
  }

  .team-row__name-text {
    font-size: 1rem;
  }

  .team-row__count-btn {
    margin-right: 0;
    padding-left: 4px;
  }

  .team-row__count {
    font-size: 40px;
  }

  .team-row__count-input {
    font-size: 28px;
  }

  .team-row__actions {
    justify-content: flex-end;
    gap: 12px;
  }

  .team-row__actions .team-row__minus {
    width: 42px;
    height: 42px;
  }

  .team-row__actions .team-row__minus :deep(.v-icon) {
    font-size: 21px;
  }

  .team-row__actions .team-row__plus {
    width: 56px;
    height: 56px;
  }

  .team-row__actions .team-row__plus :deep(.v-icon) {
    font-size: 29px;
  }

  .team-row__more {
    justify-self: end;
  }
}
</style>
