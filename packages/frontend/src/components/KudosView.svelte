<script lang="ts">
import { socket } from '../stores/socket';
import { kudos } from '../stores/appStore';
import type { Kudos } from '../stores/appStore';

let isOnline = false;

// Subscribe to socket connection status
socket.subscribe(socketInstance => {
    isOnline = socketInstance?.connected ?? false;
});

// Format timestamp for display
function formatTimestamp(date: string): string {
    try {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            console.log('Invalid date input:', date);
            return 'Invalid date';
        }

        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(parsedDate);
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'Invalid date';
    }
}
</script>

<div class="kudos-view">
    <div class="kudos-container">
        <!-- Kudos Feed -->
        <div class="kudos-feed">
            <h2>Recent Kudos</h2>
            {#if $kudos.length === 0}
                <p class="no-kudos">No kudos yet!</p>
            {:else}
                <div class="kudos-list">
                    {#each $kudos as kudosItem}
                        <div class="kudos-card">
                            <div class="kudos-header">
                                <span class="from-member">{kudosItem.from[0]?.name || 'Unknown'}</span>
                                <span class="arrow">→</span>
                                <span class="to-member">{kudosItem.to[0]?.name || 'Unknown'}</span>
                            </div>
                            <p class="kudos-message">{kudosItem.message}</p>
                            <div class="kudos-footer">
                                <span class="timestamp">{formatTimestamp(kudosItem.date)}</span>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>

    {#if !isOnline}
        <div class="offline-notice">
            <p>You are currently offline. Kudos will sync when connection is restored.</p>
        </div>
    {/if}
</div>

<style>
    .kudos-view {
        padding: 2rem;
    }

    .kudos-container {
        max-width: 800px;
        margin: 0 auto;
    }

    h2 {
        margin-bottom: 1.5rem;
    }

    .kudos-feed {
        background: white;
        padding: 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .kudos-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .kudos-card {
        padding: 1rem;
        border: 1px solid #ddd;
        border-radius: 0.5rem;
        background: #f9f9f9;
    }

    .kudos-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        font-weight: 500;
    }

    .arrow {
        color: #666;
    }

    .kudos-message {
        margin: 0.5rem 0;
        line-height: 1.4;
    }

    .kudos-footer {
        margin-top: 0.5rem;
        font-size: 0.9rem;
        color: #666;
    }

    .no-kudos {
        text-align: center;
        color: #666;
        padding: 2rem;
    }

    .offline-notice {
        margin-top: 2rem;
        padding: 1rem;
        background-color: #fff3e0;
        border-radius: 0.5rem;
        text-align: center;
        color: #e65100;
        max-width: 800px;
        margin-left: auto;
        margin-right: auto;
    }
</style>