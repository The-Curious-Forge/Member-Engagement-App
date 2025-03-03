<script lang="ts">
    import { members, messageActions, systemAlertActions } from '../../../../stores/appStore';
    import type { Member, Kudos, Message } from '../../../../stores/appStore';
    import { marked } from 'marked';
    import { slide } from 'svelte/transition';
    import QRCode from 'qrcode-svg';
    import { isOnline } from '../../../../stores/connectionStore';

    let online: boolean;
    isOnline.subscribe(value => {
        online = value;
    });

    function handleQRClick(event: MouseEvent, url: string | undefined) {
        if (!online || !url) {
            event.preventDefault();
            systemAlertActions.add('warning', 'This link cannot be opened while offline');
            return;
        }
    }

    // Add offline styles
    const offlineStyles = `
        .offline {
            cursor: not-allowed;
            opacity: 0.7;
            pointer-events: all;
        }
        .offline:hover {
            transform: none !important;
        }
    `;

    function generateQRCode(url: string): string {
        const qr = new QRCode({
            content: url,
            padding: 0,
            width: 256,
            height: 256,
            color: "#000000",
            background: "#ffffff",
            ecl: "M"
        });
        const svg = qr.svg();
        return svg.replace('<svg', '<svg viewBox="0 0 256 256"');
    }

    export let member: Member;

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
                messageActions.markAsRead(messageId, data.message);
            } else {
                throw new Error('Failed to mark message as read');
            }
        } catch (error) {
            console.error('Mark as read error:', error);
            systemAlertActions.add('error', 'Failed to mark message as read. Please try again.');
        }
    }

    // Calculate top 5 activities
    $: topFiveActivities = member?.topActivities && member.topActivities.length > 0 ?
        Array.from(
            member.topActivities.reduce((acc: Map<string, number>, activities: string) => {
                if (activities) {
                    activities.split(',').forEach(activity => {
                        const trimmed = activity.trim();
                        if (trimmed) {
                            acc.set(trimmed, (acc.get(trimmed) || 0) + 1);
                        }
                    });
                }
                return acc;
            }, new Map<string, number>())
        )
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5)
        .map(([activity]) => activity)
        : [];

    // Subscribe to members store to get real-time updates
    $: currentMember = $members.find(m => m.id === member.id) || member;

    // Initialize message arrays
    let unreadMessages: Message[] = [];
    let readMessages: Message[] = [];

    // Reactive declarations for message lists with proper sorting and logging
    $: {
        console.log('Member messages before update:', currentMember.messages);
        console.log('Current message arrays:', { unreadMessages, readMessages });
        
        // Explicitly create new arrays to ensure reactivity
        unreadMessages = (currentMember.messages || [])
            .filter(m => !m.read)
            .sort((a, b) => new Date(b.messageDate).getTime() - new Date(a.messageDate).getTime());
            
        readMessages = (currentMember.messages || [])
            .filter(m => m.read)
            .sort((a, b) => new Date(b.messageDate).getTime() - new Date(a.messageDate).getTime());
        
        console.log('New filtered messages:', {
            unreadMessages,
            readMessages,
            readStates: currentMember.messages?.map(m => ({ id: m.id, read: m.read }))
        });
    }
    $: kudosReceived = currentMember.kudosReceived || [];
    $: kudosGiven = currentMember.kudosGiven || [];
</script>

<div class="overview-container">
    <!-- Key Stats Banner -->
    <div class="stats-banner">
        <div class="stat-item">
            <span class="stat-value">{Number(currentMember.totalHours || 0).toFixed(1)}</span>
            <span class="stat-label">Hours</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">{Number(currentMember.weeklyStreak || 0)}</span>
            <span class="stat-label">Week Streak</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">{Number(currentMember.totalPoints || 0).toFixed(0)}</span>
            <span class="stat-label">Forge Points</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">{currentMember.kudosReceived?.length || 0}</span>
            <span class="stat-label">Kudos</span>
        </div>
    </div>

    <div class="content-grid">
        <!-- Messages Section -->
        <div class="section messages-section full-width">
            <h3>Messages {#if unreadMessages.length}<span class="unread-badge">{unreadMessages.length}</span>{/if}</h3>
            <div class="scrollable-content">
                {#key currentMember.id + currentMember.messages?.length}
                {#if unreadMessages.length > 0}
                    {#each unreadMessages as message (message.id)}
                        <div class="message-card unread"
                             class:important={message.important}
                             transition:slide|local={{ duration: 300 }}>
                            <div class="message-header">
                                <span class="message-time">{formatDate(new Date(message.messageDate))}</span>
                                <button class="mark-read-button"
                                        on:click={() => markMessageAsRead(message.id)}
                                        disabled={message.read}>
                                    Mark Read
                                </button>
                            </div>
                            <div class="message-content">
                                <div class="message-text">
                                    {@html parseMarkdown(message.content)}
                                </div>
                                <div class="message-media">
                                    {#if message.attachment}
                                        <div class="message-attachment">
                                            <img src={message.attachment} alt="Message attachment" />
                                        </div>
                                    {/if}
                                    {#if message.qrLink}
                                        <div class="message-qr">
                                            <a href={message.qrLink}
                                               target="_blank"
                                               rel="noopener noreferrer"
                                               class="qr-container"
                                               class:offline={!online}
                                               on:click={(e) => handleQRClick(e, message.qrLink)}>
                                                {@html generateQRCode(message.qrLink)}
                                            </a>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/each}
                {/if}

                {#if readMessages.length > 0}
                    {#each readMessages.slice(0, 3) as message (message.id)}
                        <div class="message-card"
                             class:important={message.important}
                             transition:slide|local={{ duration: 300 }}>
                            <div class="message-header">
                                <span class="message-time">{formatDate(new Date(message.messageDate))}</span>
                            </div>
                            <div class="message-content">
                                <div class="message-text">
                                    {@html parseMarkdown(message.content)}
                                </div>
                                <div class="message-media">
                                    {#if message.attachment}
                                        <div class="message-attachment">
                                            <img src={message.attachment} alt="Message attachment" />
                                        </div>
                                    {/if}
                                    {#if message.qrLink}
                                        <div class="message-qr">
                                            <a href={message.qrLink}
                                               target="_blank"
                                               rel="noopener noreferrer"
                                               class="qr-container"
                                               class:offline={!online}
                                               on:click={(e) => handleQRClick(e, message.qrLink)}>
                                                {@html generateQRCode(message.qrLink)}
                                            </a>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/each}
                {:else if !unreadMessages.length}
                    <p class="no-data">No messages</p>
                {/if}
                {/key}
            </div>
        </div>

        <!-- Kudos Received Section -->
        <div class="section kudos-section">
                <h3>Kudos Received</h3>
                <div class="scrollable-content">
                    {#if kudosReceived.length > 0}
                        {#each kudosReceived as kudos}
                            <div class="kudos-card">
                                <div class="kudos-header">
                                    <span class="kudos-from">From: {kudos.from[0]?.name || 'Unknown'}</span>
                                    <span class="kudos-time">{formatDate(new Date(kudos.date))}</span>
                                </div>
                                <div class="kudos-content">
                                    {kudos.message}
                                </div>
                            </div>
                        {/each}
                    {:else}
                        <p class="no-data">No kudos received</p>
                    {/if}
                </div>
            </div>

            <!-- Kudos Given Section -->
            <div class="section kudos-section">
                <h3>Kudos Given</h3>
                <div class="scrollable-content">
                    {#if kudosGiven.length > 0}
                        {#each kudosGiven as kudos}
                            <div class="kudos-card">
                                <div class="kudos-header">
                                    <span class="kudos-to">To: {kudos.to[0]?.name || 'Unknown'}</span>
                                    <span class="kudos-time">{formatDate(new Date(kudos.date))}</span>
                                </div>
                                <div class="kudos-content">
                                    {kudos.message}
                                </div>
                            </div>
                        {/each}
                    {:else}
                        <p class="no-data">No kudos given</p>
                    {/if}
                </div>
            </div>
        </div>
    </div>

<style>
    .overview-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        height: 100%;
    }

    .stats-banner {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        padding: 1rem;
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        border-radius: 12px;
        color: white;
        box-shadow: 0 4px 6px rgba(76, 175, 80, 0.2);
    }

    .stat-item {
        text-align: center;
    }

    .stat-value {
        display: block;
        font-size: 1.75rem;
        font-weight: 600;
        line-height: 1.2;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .stat-label {
        font-size: 0.875rem;
        opacity: 0.9;
    }

    .content-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-areas:
            "messages messages"
            "kudos-received kudos-given";
        gap: 1.5rem;
        flex: 1;
        min-height: 0;
    }

    .messages-section {
        grid-area: messages;
    }

    .kudos-section:nth-of-type(1) {
        grid-area: kudos-received;
    }

    .kudos-section:nth-of-type(2) {
        grid-area: kudos-given;
    }

    .section {
        background: white;
        border-radius: 12px;
        padding: 1.25rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .scrollable-content {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding-right: 0.5rem;
    }

    h3 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        color: #2c3e50;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
    }

    .unread-badge {
        background: #ff4444;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        min-width: 1.5rem;
        text-align: center;
    }

    .message-card, .kudos-card {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
    }

    .message-card.unread {
        background: white;
        border-left: 3px solid #4CAF50;
    }

    .message-card.important {
        border: 1px solid #ff4444;
        background: #fff8f8;
    }

    .message-header, .kudos-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        font-size: 0.8rem;
        color: #666;
    }

    .message-content {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
    }

    .message-text {
        flex: 1;
        min-width: 0;
        color: #333;
        font-size: 0.9rem;
        line-height: 1.4;
    }

    .message-media {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        align-items: center;
        margin-left: auto;
    }

    .message-attachment {
        width: 100px;
        height: 100px;
        border-radius: 0.5rem;
        overflow: hidden;
    }

    .message-attachment img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .message-qr {
        width: 100px;
        height: 100px;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        box-sizing: border-box;
    }

    .qr-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
    }

    .qr-container:hover:not(.offline) {
        transform: scale(1.05);
    }

    .message-qr :global(svg) {
        width: 100%;
        height: 100%;
        display: block;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }

    .offline {
        cursor: not-allowed;
        opacity: 0.7;
        pointer-events: all;
    }

    .offline:hover {
        transform: none !important;
    }

    .mark-read-button {
        background: none;
        border: 1px solid #4CAF50;
        color: #4CAF50;
        padding: 0.25rem 0.75rem;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .mark-read-button:hover {
        background: #4CAF50;
        color: white;
    }

    .no-data {
        text-align: center;
        color: #666;
        font-style: italic;
        margin: 1rem 0;
    }

    /* Scrollbar styling */
    .scrollable-content::-webkit-scrollbar {
        width: 6px;
    }
    
    .scrollable-content::-webkit-scrollbar-track {
        background: transparent;
    }
    
    .scrollable-content::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        transition: background 0.2s ease;
    }
    
    .scrollable-content::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.2);
    }

    @media (max-width: 768px) {
        .kudos-grid {
            grid-template-columns: 1fr;
        }

        .stats-banner {
            grid-template-columns: repeat(2, 1fr);
        }
    }
</style>