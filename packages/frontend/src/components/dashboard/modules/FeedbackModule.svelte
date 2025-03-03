<script lang="ts">
    import type { ModuleConfig } from '../../../types/dashboard';

    export let config: ModuleConfig;
    export let isExpanded: boolean;

    let feedbackType = 'suggestion';
    let showForm = false;
    let message = '';

    const feedbackTypes = [
        { id: 'suggestion', label: 'Suggestion', icon: '💡' },
        { id: 'issue', label: 'Issue', icon: '⚠️' },
        { id: 'praise', label: 'Praise', icon: '👏' }
    ];

    function handleSubmit() {
        // TODO: Implement feedback submission
        console.log('Submit feedback:', { feedbackType, message });
        message = '';
        showForm = false;
    }
</script>

<div class="feedback-module">
    {#if !showForm}
        <button class="feedback-button" on:click={() => showForm = true}>
            Give Feedback
        </button>
    {:else}
        <form class="feedback-form" on:submit|preventDefault={handleSubmit}>
            <div class="type-selector">
                {#each feedbackTypes as type}
                    <label class="type-option">
                        <input
                            type="radio"
                            name="feedbackType"
                            value={type.id}
                            bind:group={feedbackType}
                        />
                        <span class="type-content">
                            <span class="type-icon">{type.icon}</span>
                            <span class="type-label">{type.label}</span>
                        </span>
                    </label>
                {/each}
            </div>

            <textarea
                bind:value={message}
                placeholder="What's on your mind?"
                rows="2"
                required
            ></textarea>

            <div class="form-actions">
                <button type="button" class="cancel-button" on:click={() => showForm = false}>
                    Cancel
                </button>
                <button type="submit" class="submit-button">
                    Send
                </button>
            </div>
        </form>
    {/if}
</div>

<style>
    .feedback-module {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
    }

    .feedback-button {
        width: 100%;
        padding: 1rem;
        background: #673AB7;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.9rem;
    }

    .feedback-button:hover {
        background: #5E35B1;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(103, 58, 183, 0.2);
    }

    .feedback-form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .type-selector {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
    }

    .type-option {
        cursor: pointer;
    }

    .type-option input {
        display: none;
    }

    .type-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem;
        background: #f5f5f5;
        border-radius: 6px;
        transition: all 0.2s;
    }

    .type-option input:checked + .type-content {
        background: #EDE7F6;
        box-shadow: 0 2px 4px rgba(103, 58, 183, 0.1);
    }

    .type-icon {
        font-size: 1.25rem;
    }

    .type-label {
        font-size: 0.75rem;
        color: #333;
        font-weight: 500;
    }

    textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.9rem;
        resize: none;
        transition: border-color 0.2s;
    }

    textarea:focus {
        border-color: #673AB7;
        outline: none;
    }

    .form-actions {
        display: flex;
        gap: 0.5rem;
    }

    .cancel-button,
    .submit-button {
        flex: 1;
        padding: 0.75rem;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.875rem;
    }

    .cancel-button {
        background: #f5f5f5;
        color: #666;
    }

    .cancel-button:hover {
        background: #e0e0e0;
    }

    .submit-button {
        background: #673AB7;
        color: white;
    }

    .submit-button:hover {
        background: #5E35B1;
        transform: translateY(-1px);
    }
</style>