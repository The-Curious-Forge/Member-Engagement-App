<script lang="ts">
    import { members, messageActions, systemAlertActions } from '../../../../stores/appStore';
    import type { Member } from '../../../../stores/appStore';
    import { marked } from 'marked';

    export let member: Member;

    // Subscribe to members store to get real-time updates
    $: currentMember = $members.find(m => m.id === member.id) || member;

    // Configure marked for safe HTML
    const markedOptions = {
        breaks: true,
        gfm: true
    };

    function parseMarkdown(content: string): string {
        try {
            return marked.parse(content, markedOptions) as string;
        } catch (error) {
            console.error('Error parsing markdown:', error);
            return content;
        }
    }

    function formatDate(date: Date | undefined): string {
        if (!date) return '';
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }

    async function markMessageAsRead(messageId: string) {
        try {
            const response = await fetch(`/api/messages/${messageId}/read`, {
                method: 'PUT'
            });
            const data = await response.json();
            if (data.success && data.message) {
                // Update store state with the returned message data
                messageActions.markAsRead(messageId, data.message);
            } else {
                throw new Error('Failed to mark message as read');
            }
        } catch (error) {
            console.error('Mark as read error:', error);
            systemAlertActions.add('error', 'Failed to mark message as read. Please try again.');
        }
    }
</script>

<div class="messages-container">
    {#key currentMember.id + currentMember.messages?.length}
    {#if !currentMember.messages?.length}
        <p class="no-data">No messages</p>
    {:else}
        {#if currentMember.messages.some(m => !m.read)}
            <div class="message-group">
                <h4>Unread Messages</h4>
                {#each currentMember.messages.filter(m => !m.read) as message}
                    <div class="message-card unread" class:important={message.important}>
                        <div class="message-header">
                            <p class="message-time">{formatDate(new Date(message.messageDate))}</p>
                        </div>
                        <p class="message-content">{@html parseMarkdown(message.content)}</p>
                        <button
                            class="mark-read-button"
                            on:click={() => markMessageAsRead(message.id)}
                        >
                            Mark as Read
                        </button>
                    </div>
                {/each}
            </div>
        {/if}
        
        {#if currentMember.messages.some(m => m.read)}
            <div class="message-group">
                <h4>Read Messages</h4>
                {#each currentMember.messages.filter(m => m.read) as message}
                    <div class="message-card" class:important={message.important}>
                        <div class="message-header">
                            <p class="message-time">{formatDate(new Date(message.messageDate))}</p>
                        </div>
                        <p class="message-content">{@html parseMarkdown(message.content)}</p>
                    </div>
                {/each}
            </div>
        {/if}
    {/if}
    {/key}
</div>

<style>
    .messages-container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        height: 100%;
        overflow-y: auto;
    }

    .message-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    h4 {
        margin: 0;
        color: #444;
        font-size: 1rem;
        font-weight: 500;
        padding: 0 1rem;
    }

    .message-card {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        border: 2px solid transparent;
    }

    .message-card.unread {
        border-left: 4px solid #4CAF50;
    }

    .message-card.important {
        border-color: #ff4444;
        background: #fff8f8;
    }

    .message-content {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
        color: #333;
    }

    .message-time {
        margin: 0;
        font-size: 0.8rem;
        color: #666;
    }

    .mark-read-button {
        margin-top: 0.5rem;
        padding: 0.5rem 1rem;
        background: none;
        border: 1px solid #4CAF50;
        color: #4CAF50;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .mark-read-button:hover {
        background: #4CAF50;
        color: white;
    }

    .no-data {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 2rem;
        margin: 0;
    }
</style>