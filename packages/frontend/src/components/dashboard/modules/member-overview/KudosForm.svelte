<script lang="ts">
    import { members, kudosActions, systemAlertActions } from '../../../../stores/appStore';
    import type { Member } from '../../../../stores/appStore';
    import { socket } from '../../../../stores/socket';
    import { pendingActions, type PendingAction } from '../../../../lib/offline';
    import { pendingActionsCount } from '../../../../stores/connectionStore';

    export let member: Member;

    let kudosMessage = '';
    let selectedRecipients: Member[] = [];
    let searchTerm = '';
    let isOnline = false;

    // Subscribe to socket connection status
    socket.subscribe(socketInstance => {
        isOnline = socketInstance?.connected ?? false;
    });

    // Filter out the current member from the recipient list and apply search filter
    $: availableRecipients = $members
        .filter(m => m.id !== member.id)
        .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

    async function handleKudosSubmit() {
        if (!kudosMessage.trim() || selectedRecipients.length === 0) return;

        const apiData = {
            from: member.id,
            to: selectedRecipients.map(r => r.id),
            message: kudosMessage.trim()
        };

        try {
            if (navigator.onLine) {
                // Try to send directly to API when online
                try {
                    const response = await fetch('/api/kudos', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(apiData)
                    });

                    if (!response.ok) {
                        throw new Error('Failed to send kudos');
                    }

                    kudosMessage = '';
                    selectedRecipients = [];
                    systemAlertActions.add('success', 'Kudos sent successfully!');
                } catch (error) {
                    console.error('Online kudos failed, queueing for offline sync:', error);
                    // If online request fails, queue for offline sync
                    throw error;
                }
            } else {
                throw new Error('Offline');
            }
        } catch (error) {
            // Queue for offline processing (whether offline or online request failed)
            try {
                const action: Omit<PendingAction, 'id' | 'timestamp'> = {
                    type: 'kudos' as const,
                    data: apiData
                };

                await pendingActions.add(action);
                
                // Update UI optimistically with the full kudos object for display
                await kudosActions.add({
                    from: [{ id: member.id, name: member.name }],
                    to: selectedRecipients.map(r => ({ id: r.id, name: r.name })),
                    message: kudosMessage.trim()
                });

                // Update pending actions count
                const allPending = await pendingActions.getAll();
                pendingActionsCount.set(allPending.length);

                kudosMessage = '';
                selectedRecipients = [];
                systemAlertActions.add('info', 'Kudos will be sent when connection is restored.');
            } catch (offlineError) {
                console.error('Failed to queue kudos:', offlineError);
                systemAlertActions.add('error', 'Failed to send kudos. Please try again.');
            }
        }
    }
</script>

<div class="kudos-form">
    <textarea
        bind:value={kudosMessage}
        placeholder="Write your kudos message..."
        rows="3"
    ></textarea>

    <div class="recipients-selection">
        <div class="search-bar">
            <input
                type="text"
                bind:value={searchTerm}
                placeholder="Search members to send kudos to..."
                class="search-input"
            />
        </div>
        {#if selectedRecipients.length > 0}
            <div class="selected-recipients">
                <p class="selected-label">Selected ({selectedRecipients.length}):</p>
                <div class="selected-tags">
                    {#each selectedRecipients as recipient}
                        <button
                            class="selected-tag"
                            on:click={() => {
                                selectedRecipients = selectedRecipients.filter(r => r.id !== recipient.id);
                            }}
                        >
                            {recipient.name}
                            <span class="remove-tag">×</span>
                        </button>
                    {/each}
                </div>
            </div>
        {/if}
        <div class="recipients-grid">
            {#each availableRecipients as recipient}
                <button
                    class="recipient-card"
                    class:selected={selectedRecipients.includes(recipient)}
                    on:click={() => {
                        if (selectedRecipients.includes(recipient)) {
                            selectedRecipients = selectedRecipients.filter(r => r.id !== recipient.id);
                        } else {
                            selectedRecipients = [...selectedRecipients, recipient];
                        }
                    }}
                >
                    {recipient.name}
                </button>
            {/each}
        </div>
    </div>

    <button
        class="send-kudos-button"
        disabled={!kudosMessage.trim() || selectedRecipients.length === 0}
        on:click={handleKudosSubmit}
    >
        Send Kudos
    </button>
</div>

<style>
    .kudos-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        height: 100%;
    }

    textarea {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #ddd;
        border-radius: 0.5rem;
        resize: vertical;
        font-family: inherit;
        min-height: 100px;
    }

    textarea:focus {
        outline: none;
        border-color: #4CAF50;
    }

    .search-input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #ddd;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: border-color 0.2s;
    }

    .search-input:focus {
        outline: none;
        border-color: #4CAF50;
    }

    .selected-recipients {
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
    }

    .selected-label {
        color: #666;
        font-size: 0.9rem;
        margin: 0 0 0.5rem 0;
    }

    .selected-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .selected-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #E8F5E9;
        color: #2E7D32;
        border: 1px solid #4CAF50;
        border-radius: 20px;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .selected-tag:hover {
        background: #C8E6C9;
    }

    .remove-tag {
        font-size: 1.2rem;
        font-weight: bold;
        line-height: 1;
    }

    .recipients-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 0.5rem;
        max-height: 490px;
        overflow-y: auto;
        padding-top: 1rem;
    }

    .recipient-card {
        padding: 0.75rem;
        border: 2px solid #ddd;
        border-radius: 0.5rem;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
    }

    .recipient-card.selected {
        border-color: #4CAF50;
        background: #E8F5E9;
    }

    .recipient-card:hover {
        border-color: #4CAF50;
    }

    .send-kudos-button {
        width: 100%;
        padding: 0.75rem;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.2s;
        margin-top: auto;
    }

    .send-kudos-button:hover:not(:disabled) {
        background: #388E3C;
    }

    .send-kudos-button:disabled {
        background: #ccc;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        .recipients-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
</style>