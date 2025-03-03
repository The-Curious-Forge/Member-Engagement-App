<script lang="ts">
    import { kudos } from '../../../stores/appStore';
    import type { ModuleConfig } from '../../../types/dashboard';
    import type { Kudos } from '../../../stores/appStore';
    
    export let config: ModuleConfig;
    export let isExpanded: boolean;

    // Sort all kudos by date
    $: sortedKudos = [...$kudos].sort((a: Kudos, b: Kudos) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
    });

    // Get 10 most recent kudos for collapsed view
    $: recentKudos = sortedKudos.slice(0, 10);

    function formatTime(date: Date): string {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 60) {
            return `${minutes}m ago`;
        }
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours}h ago`;
        }
        
        return date.toLocaleDateString();
    }

    function formatRecipients(recipients: Array<{ id: string; name: string }>, expanded: boolean = false): string {
        if (recipients.length === 1) return recipients[0].name;
        if (recipients.length === 2) return `${recipients[0].name} and ${recipients[1].name}`;
        if (expanded) {
            return recipients.map(r => r.name).join(', ');
        }
        return `${recipients[0].name} and ${recipients.length - 1} others`;
    }
</script>

<div class="kudos-module">
    {#if !isExpanded}
        <!-- Collapsed View -->
        <div class="kudos-summary">
            {#if $kudos.length > 0}
                <div class="latest-kudos">
                    {#each recentKudos as kudos}
                        <div class="kudos-preview">
                            <p class="kudos-text">
                                <span class="sender">{kudos.from[0].name}</span> →
                                <span class="recipient">{formatRecipients(kudos.to)}</span>
                            </p>
                            <p class="kudos-message">{kudos.message}</p>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="no-kudos">
                    <p>No recent kudos</p>
                </div>
            {/if}
        </div>
    {:else}
        <!-- Expanded View -->
        <div class="kudos-list">
            {#if sortedKudos.length > 0}
                <div class="kudos-grid">
                    {#each sortedKudos as kudos}
                        <div class="kudos-card">
                            <div class="kudos-header">
                                <div class="participants">
                                    <span class="sender">{kudos.from[0].name}</span>
                                    <span class="arrow">→</span>
                                    <span class="recipients">{formatRecipients(kudos.to, true)}</span>
                                </div>
                                <span class="time">{formatTime(new Date(kudos.date))}</span>
                            </div>
                            <p class="message">{kudos.message}</p>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="no-kudos">
                    <p>No kudos to display</p>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .kudos-module {
        height: 100%;
        overflow: hidden;
    }

    .kudos-summary {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .latest-kudos {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
    }

    .kudos-preview {
        background: #ffffff;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border: 1px solid #e0e0e0;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        cursor: pointer;
    }

    .kudos-preview:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .kudos-text {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
    }

    .sender, .recipient {
        font-weight: 500;
        color: #333;
    }

    .kudos-message {
        margin: 0;
        font-size: 0.875rem;
        color: #666;
        line-height: 1.4;
    }

    .kudos-count {
        text-align: center;
        margin-top: 1rem;
    }

    .count {
        font-size: 1.5rem;
        font-weight: 600;
        color: #4CAF50;
    }

    .label {
        display: block;
        font-size: 0.875rem;
        color: #666;
    }

    .kudos-list {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .kudos-grid {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        height: 100%;
        overflow-y: auto;
    }

    .kudos-card {
        background: #ffffff;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border: 1px solid #e0e0e0;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .kudos-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .kudos-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #eee;
    }

    .participants {
        font-size: 0.875rem;
        color: #333;
    }

    .sender, .recipients {
        font-weight: 500;
    }

    .arrow {
        color: #666;
        margin: 0 0.5rem;
    }

    .time {
        font-size: 0.75rem;
        color: #666;
        font-weight: 500;
    }

    .message {
        margin: 0;
        font-size: 0.875rem;
        color: #333;
        line-height: 1.5;
    }

    .no-kudos {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 2rem;
    }
</style>