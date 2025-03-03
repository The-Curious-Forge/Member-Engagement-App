<script lang="ts">
    import type { ModuleConfig } from '../../../types/dashboard';

    export let config: ModuleConfig;
    export let isExpanded: boolean;

    // Mock data - replace with actual data from a store/service
    const messages = [
        {
            id: 1,
            from: 'Admin',
            subject: 'Welcome to the Space',
            preview: 'Welcome to The Curious Forge! Here are some tips to get started...',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
            unread: true
        },
        {
            id: 2,
            from: 'System',
            subject: 'Safety Training Required',
            preview: 'Please complete your annual safety training by...',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            unread: true
        }
    ];

    const unreadCount = messages.filter(m => m.unread).length;

    function formatTimestamp(date: Date): string {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'just now';
    }

    function handleMessageClick(id: number) {
        // TODO: Implement message view/reply logic
        console.log('View message:', id);
    }
</script>

<div class="messages-module" class:expanded={isExpanded}>
    {#if !isExpanded}
        <div class="preview">
            <div class="unread-count">
                {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
            </div>
            {#if messages.length > 0}
                <div class="latest-message">
                    <span class="from">{messages[0].from}</span>
                    <span class="preview">{messages[0].preview}</span>
                </div>
            {/if}
        </div>
    {:else}
        <div class="message-list">
            {#each messages as message (message.id)}
                <button
                    class="message-item"
                    class:unread={message.unread}
                    on:click={() => handleMessageClick(message.id)}
                >
                    <div class="message-header">
                        <span class="from">{message.from}</span>
                        <span class="timestamp">{formatTimestamp(message.timestamp)}</span>
                    </div>
                    <div class="subject">{message.subject}</div>
                    <div class="preview">{message.preview}</div>
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .messages-module {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .preview {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .unread-count {
        font-weight: 600;
        color: #2196F3;
        font-size: 1.1rem;
    }

    .latest-message {
        background: white;
        padding: 0.75rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .latest-message .from {
        font-weight: 500;
        color: #333;
        display: block;
        margin-bottom: 0.25rem;
    }

    .latest-message .preview {
        color: #666;
        font-size: 0.9rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .message-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
        overflow-y: auto;
    }

    .message-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem;
        background: white;
        border: 1px solid #eee;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .message-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .message-item.unread {
        background: #E3F2FD;
        border-color: #BBDEFB;
    }

    .message-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .message-header .from {
        font-weight: 600;
        color: #333;
    }

    .message-header .timestamp {
        font-size: 0.8rem;
        color: #666;
    }

    .subject {
        font-weight: 500;
        color: #444;
    }

    .preview {
        color: #666;
        font-size: 0.9rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    /* Scrollbar styling */
    .message-list::-webkit-scrollbar {
        width: 6px;
    }

    .message-list::-webkit-scrollbar-track {
        background: transparent;
    }

    .message-list::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
    }

    .message-list::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.2);
    }
</style>