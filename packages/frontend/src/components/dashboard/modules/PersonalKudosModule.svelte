<script lang="ts">
    import type { ModuleConfig } from '../../../types/dashboard';

    export let config: ModuleConfig;
    export let isExpanded: boolean;

    // Mock data - replace with actual data from a store/service
    const kudos = [
        {
            id: 1,
            from: 'John Smith',
            message: 'Thanks for helping me with the 3D printer setup!',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            type: 'helpful'
        },
        {
            id: 2,
            from: 'Sarah Johnson',
            message: 'Great work on the woodworking project, very impressive!',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
            type: 'skilled'
        }
    ];

    let newKudos = {
        to: '',
        message: '',
        type: 'helpful'
    };

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

    function handleSubmit() {
        // TODO: Implement kudos submission
        console.log('Submit kudos:', newKudos);
        newKudos = {
            to: '',
            message: '',
            type: 'helpful'
        };
    }
</script>

<div class="kudos-module" class:expanded={isExpanded}>
    {#if !isExpanded}
        <div class="kudos-preview">
            <div class="kudos-count">
                {kudos.length} recent {kudos.length === 1 ? 'kudos' : 'kudos'}
            </div>
            {#if kudos.length > 0}
                <div class="latest-kudos">
                    <span class="from">From {kudos[0].from}</span>
                    <p class="message">{kudos[0].message}</p>
                </div>
            {/if}
        </div>
    {:else}
        <div class="kudos-expanded">
            <section class="received-kudos">
                <h3>Recent Kudos Received</h3>
                <div class="kudos-list">
                    {#each kudos as kudo (kudo.id)}
                        <div class="kudos-item">
                            <div class="kudos-header">
                                <span class="from">From {kudo.from}</span>
                                <span class="timestamp">{formatTimestamp(kudo.timestamp)}</span>
                            </div>
                            <p class="message">{kudo.message}</p>
                            <span class="type">{kudo.type}</span>
                        </div>
                    {/each}
                </div>
            </section>

            <section class="give-kudos">
                <h3>Give Kudos</h3>
                <form class="kudos-form" on:submit|preventDefault={handleSubmit}>
                    <div class="form-group">
                        <label for="to">To</label>
                        <input
                            type="text"
                            id="to"
                            bind:value={newKudos.to}
                            placeholder="Member name"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="type">Type</label>
                        <select id="type" bind:value={newKudos.type} required>
                            <option value="helpful">Helpful</option>
                            <option value="skilled">Skilled</option>
                            <option value="innovative">Innovative</option>
                            <option value="collaborative">Collaborative</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="message">Message</label>
                        <textarea
                            id="message"
                            bind:value={newKudos.message}
                            placeholder="What did they do?"
                            rows="3"
                            required
                        ></textarea>
                    </div>

                    <button type="submit" class="submit-button">
                        Give Kudos
                    </button>
                </form>
            </section>
        </div>
    {/if}
</div>

<style>
    .kudos-module {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .kudos-preview {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .kudos-count {
        font-weight: 600;
        color: #9C27B0;
        font-size: 1.1rem;
    }

    .latest-kudos {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .latest-kudos .from {
        font-weight: 500;
        color: #333;
        display: block;
        margin-bottom: 0.5rem;
    }

    .latest-kudos .message {
        color: #666;
        font-size: 0.9rem;
        margin: 0;
        line-height: 1.4;
    }

    .kudos-expanded {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding: 1rem;
        height: 100%;
        overflow-y: auto;
    }

    section h3 {
        margin: 0 0 1rem 0;
        color: #333;
        font-size: 1.1rem;
    }

    .kudos-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .kudos-item {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .kudos-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .kudos-header .from {
        font-weight: 500;
        color: #333;
    }

    .kudos-header .timestamp {
        font-size: 0.8rem;
        color: #666;
    }

    .kudos-item .message {
        margin: 0.5rem 0;
        color: #444;
        line-height: 1.4;
    }

    .kudos-item .type {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: #E1BEE7;
        color: #4A148C;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 500;
    }

    .kudos-form {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    label {
        font-weight: 500;
        color: #333;
    }

    input,
    select,
    textarea {
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 1rem;
        transition: border-color 0.2s;
    }

    input:focus,
    select:focus,
    textarea:focus {
        border-color: #9C27B0;
        outline: none;
    }

    .submit-button {
        padding: 1rem;
        background: #9C27B0;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .submit-button:hover {
        background: #7B1FA2;
        transform: translateY(-2px);
    }

    /* Scrollbar styling */
    .kudos-expanded::-webkit-scrollbar {
        width: 6px;
    }

    .kudos-expanded::-webkit-scrollbar-track {
        background: transparent;
    }

    .kudos-expanded::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
    }

    .kudos-expanded::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.2);
    }
</style>