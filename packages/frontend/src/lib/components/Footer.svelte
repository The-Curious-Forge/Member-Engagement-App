<script lang="ts">
import { createEventDispatcher } from 'svelte';

export let currentDateTime: Date;
export let lastSyncTime: Date | null;
export let isSyncing: boolean;
export let onSyncClick: () => void;

const dispatch = createEventDispatcher();

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatSyncTime(date: Date | null): string {
  if (!date) return 'Never';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function openSettingsModal() {
  dispatch('openSettings');
}
</script>

<footer>
  <div class="footer-content">
    <span class="date-time">{formatDateTime(currentDateTime)}</span>
    <div class="sync-container">
      <span class="last-sync-time">Last sync: {formatSyncTime(lastSyncTime)}</span>
      <button class="sync-button" on:click={onSyncClick} disabled={isSyncing}>
        <svg class:rotating={isSyncing} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
        </svg>
        {#if isSyncing}
          <span class="syncing-text">Syncing...</span>
        {/if}
      </button>
      <button class="settings-button" on:click={openSettingsModal}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
    </div>
  </div>
</footer>

<style>
  footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background-color: #000000;
    color: #ffffff;
    display: flex;
    align-items: center;
    padding: 0 20px;
  }

  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .date-time {
    font-size: 14px;
  }

  .sync-button, .settings-button {
    background: none;
    border: none;
    cursor: pointer;
    color: #ffffff;
    padding: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sync-container {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .last-sync-time {
    font-size: 12px;
    color: #ccc;
  }

  .sync-button:hover, .settings-button:hover {
    opacity: 0.8;
  }

  .sync-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .rotating {
    animation: rotate 2s linear infinite;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  .syncing-text {
    margin-left: 5px;
    font-size: 12px;
  }

  .settings-button {
    margin-left: 10px;
  }
</style>
