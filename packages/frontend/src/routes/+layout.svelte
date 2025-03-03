<script lang="ts">
import DashboardContent from '../components/DashboardContent.svelte';
import DashboardSidebar from '../components/DashboardSidebar.svelte';
import SettingsModal from '../components/SettingsModal.svelte';
import { onMount, onDestroy } from 'svelte';
import { initSocket, closeSocket, connected } from '../stores/socket';
import { registerServiceWorker } from '../lib/offline';
import { syncStores, messageActions, kudosActions, members, type Member, type Kudos } from '../stores/appStore';
import { dashboardStore } from '../stores/dashboardStore';
import { isOnline, isSyncing, connectionStatus } from '../stores/connectionStore';
import gearIcon from '../assets/icons/gear.svg';
import questionIcon from '../assets/icons/question.svg';
import WifiIcon from '../components/WifiIcon.svelte';
import SyncIcon from '../components/SyncIcon.svelte';
import HelpOverlay from '../components/dashboard/HelpOverlay.svelte';

let connectionState = $connectionStatus;
let online = $isOnline;
let syncing = $isSyncing;

// Subscribe to connection status to ensure reactivity
$: {
    connectionState = $connectionStatus;
    online = $isOnline;
    syncing = $isSyncing;
    console.log('[Layout] Connection state:', { online, syncing, connectionState });
}

let isSettingsModalOpen = false;

let currentTime = new Date();
const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
});
const dateFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
});

// Update time every second
const timeInterval = setInterval(() => {
    currentTime = new Date();
}, 1000);

let previousConnectionState = false;
let syncInProgress = false;
let initialSyncComplete = false;

// Handle connection state changes
$: if ($connected !== previousConnectionState) {
    if ($connected) {
        console.log('[Layout] Socket connection established');
        // Only sync when connection is restored and we've done initial sync
        if (initialSyncComplete) {
            console.log('[Layout] Triggering sync after reconnection');
            syncData(false);
        }
    } else {
        console.log('[Layout] Socket connection lost');
    }
    previousConnectionState = $connected;
}

// Handle online/offline state changes
$: if (online !== undefined) {
    console.log('[Layout] Online state changed:', online);
}

// Handle syncing state changes
$: if (syncing !== undefined) {
    console.log('[Layout] Syncing state changed:', syncing);
}

async function handleSync() {
    if (!online || syncing) return;
    await syncData(true);
}

async function syncData(forceSync = false) {
    if (syncInProgress) return;
    
    try {
        syncInProgress = true;
        isSyncing.set(true);
        console.log('Starting data sync...');
        await syncStores(forceSync);
        console.log('Data sync complete');
        if (!initialSyncComplete) {
            initialSyncComplete = true;
        }
    } catch (error) {
        console.error('Sync error:', error);
        isOnline.set(false); // If sync fails, we might be offline
    } finally {
        syncInProgress = false;
        isSyncing.set(false);
    }
}


onMount(async () => {
    console.log('Layout component mounted');
    
    // Initialize WebSocket connection
    try {
        console.log('Initializing socket connection...');
        // Use the server IP address for production
        const socketUrl = window.location.hostname === 'localhost'
            ? 'ws://localhost:3000'
            : window.location.protocol === 'https:'
                ? `wss://${window.location.hostname}/socket.io`
                : `ws://${window.location.hostname}:3000`;
        const socket = initSocket(socketUrl);
        console.log('Socket initialization requested', socket.id);

        // Set up socket event listeners
        socket.on('messageRead', ({ messageId, message }) => {
            console.log('Message marked as read:', messageId);
            messageActions.markAsRead(messageId, message);
        });

        socket.on('kudosUpdate', (newKudos: Kudos) => {
            console.log('Kudos update received:', newKudos);
            kudosActions.add(newKudos);
            
            // Update members store with new kudos
            members.update((currentMembers: Member[]) => {
                return currentMembers.map((member: Member) => {
                    const updatedMember = { ...member };
                    
                    // Update kudos given
                    if (newKudos.from[0]?.id === member.id) {
                        updatedMember.kudosGiven = [newKudos, ...(member.kudosGiven || [])];
                    }
                    
                    // Update kudos received
                    if (newKudos.to.some((recipient: { id: string }) => recipient.id === member.id)) {
                        updatedMember.kudosReceived = [newKudos, ...(member.kudosReceived || [])];
                    }
                    
                    return updatedMember;
                });
            });
        });
    } catch (error) {
        console.error('Failed to initialize socket:', error);
    }

    // Register service worker for offline support
    try {
        await registerServiceWorker();
        console.log('Service worker registered successfully');
    } catch (error) {
        console.error('Failed to register service worker:', error);
    }

    // Initial data sync
    await syncData(false);
});

onDestroy(() => {
    console.log('Layout component unmounting');
    closeSocket();
    clearInterval(timeInterval);
});
</script>

<div class="app-layout">
    <DashboardContent>
        <slot />
    </DashboardContent>
    <footer class="app-footer" class:edit-mode={$dashboardStore.isEditMode}>
        <div class="footer-left">
            <div class="datetime">
                <div class="time">{timeFormatter.format(currentTime)}</div>
                <div class="date">{dateFormatter.format(currentTime)}</div>
            </div>
            {#if $dashboardStore.isEditMode}
                <div class="edit-instructions">
                    Drag modules to reposition them. Use the resize handle in the bottom-right corner to adjust size.
                </div>
            {/if}
        </div>
        <div class="footer-right">
            {#if $dashboardStore.isEditMode}
                <div class="edit-controls">
                    <button
                        class="edit-button reset"
                        on:click={() => dashboardStore.resetLayout()}
                    >
                        Reset Layout
                    </button>
                    <button
                        class="edit-button save"
                        on:click={() => {
                            dashboardStore.toggleEditMode();
                            isSettingsModalOpen = true;
                        }}
                    >
                        Save Layout
                    </button>
                </div>
            {:else}
                <div class="footer-buttons">
                    <div class="connection-status-group">
                        <button
                            class="icon-button connection-status"
                            class:online={$isOnline}
                            class:offline={!$isOnline}
                            title={$isOnline ? 'Online' : 'Offline'}
                        >
                            <div class="connection-icon-wrapper">
                                <WifiIcon online={$isOnline} />
                            </div>
                        </button>
                        <button
                            class="icon-button sync-status"
                            on:click={handleSync}
                            title={$isOnline ? ($isSyncing ? 'Syncing...' : 'Click to sync') : 'Cannot sync while offline'}
                            disabled={!$isOnline || $isSyncing}
                        >
                            <div class="sync-icon-wrapper">
                                <SyncIcon syncing={$isSyncing} disabled={!$isOnline} />
                            </div>
                        </button>
                    </div>
                    <button
                        class="icon-button help-button"
                        on:click={() => dashboardStore.toggleHelpMode()}
                        class:active={$dashboardStore.isHelpMode}
                        title="Toggle Help Mode"
                    >
                        <img src={questionIcon} alt="Help" class="icon" />
                    </button>
                    <button class="icon-button settings-button" on:click={() => isSettingsModalOpen = true}>
                        <img src={gearIcon} alt="Settings" class="icon" />
                    </button>
                </div>
            {/if}
        </div>
    </footer>
</div>

<SettingsModal bind:isOpen={isSettingsModalOpen} />
<HelpOverlay />

<style>
    :root {
        --footer-height: 48px;
    }

    .app-layout {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
        background-color: #f5f5f5;
        position: relative;
    }

    .app-layout > :global(*:first-child) {
        flex: 1;
        min-height: 0;
    }

    /* Ensure DashboardContent takes remaining space */
    :global(.dashboard-content) {
        height: calc(100vh - var(--footer-height)) !important;
    }

    .app-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: var(--footer-height);
        background-color: #ffffff;
        border-top: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 var(--grid-gap, 24px);
        box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
        z-index: 100;
    }

    .app-footer.edit-mode {
        background-color: #f8f9fa;
        border-top: 2px solid #4CAF50;
    }

    .footer-left {
        display: flex;
        align-items: center;
        gap: 2rem;
    }

    .footer-right {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .datetime {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 1rem;
    }

    .time {
        font-size: 1.1rem;
        font-weight: 500;
        color: #333;
    }

    .date {
        font-size: 0.9rem;
        color: #666;
        border-left: 1px solid #e0e0e0;
        padding-left: 1rem;
    }

    .edit-instructions {
        font-size: 0.875rem;
        color: #666;
    }

    .edit-controls {
        display: flex;
        gap: 0.5rem;
    }

    .edit-button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.25rem;
        font-weight: 500;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        background: #4CAF50;
        color: white;
    }

    .edit-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .edit-button.reset {
        background: #f44336;
    }

    .edit-button.reset:hover {
        background: #d32f2f;
    }

    .edit-button.save {
        background: #4CAF50;
    }

    .edit-button.save:hover {
        background: #388E3C;
    }

    /* Footer buttons */
    .footer-buttons {
        display: flex;
        gap: 0.5rem;
    }

    .connection-status-group {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .icon-button {
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        border-radius: 50%;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .icon-button:hover:not(:disabled) {
        background-color: #f0f0f0;
    }

    .icon-button:disabled {
        cursor: not-allowed;
    }

    /* Default icon styles */
    .icon-button:not(.connection-status) .icon {
        width: 24px;
        height: 24px;
        color: #666;
        transition: all 0.3s ease;
    }

    .connection-icon-wrapper,
    .sync-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .help-button.active {
        background-color: #4CAF50;
    }

    .help-button.active .icon {
        color: white;
    }

    :global(body) {
        margin: 0;
        padding: 0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        line-height: 1.5;
        color: #333;
    }

    :global(*) {
        box-sizing: border-box;
    }

    :global(button) {
        font-family: inherit;
    }
</style>