<script lang="ts">
    import type { ModuleConfig } from '../../../types/dashboard';

    export let config: ModuleConfig;
    export let isExpanded: boolean;

    let activity = '';
    let note = '';

    async function handleSignIn() {
        // TODO: Implement sign in logic
        console.log('Sign in:', { activity, note });
    }

    async function handleSignOut() {
        // TODO: Implement sign out logic
        console.log('Sign out');
    }
</script>

<div class="sign-in-out-module" class:expanded={isExpanded}>
    <div class="quick-actions">
        <button class="action-button sign-in" on:click={() => isExpanded = true}>
            Sign In
        </button>
        <button class="action-button sign-out" on:click={handleSignOut}>
            Sign Out
        </button>
    </div>

    {#if isExpanded}
        <form class="sign-in-form" on:submit|preventDefault={handleSignIn}>
            <div class="form-group">
                <label for="activity">Activity</label>
                <select id="activity" bind:value={activity} required>
                    <option value="">Select an activity...</option>
                    <option value="work">Work</option>
                    <option value="class">Class</option>
                    <option value="event">Event</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div class="form-group">
                <label for="note">Note (optional)</label>
                <textarea
                    id="note"
                    bind:value={note}
                    placeholder="What are you working on?"
                    rows="3"
                ></textarea>
            </div>

            <button type="submit" class="submit-button">
                Sign In
            </button>
        </form>
    {/if}
</div>

<style>
    .sign-in-out-module {
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .quick-actions {
        display: flex;
        gap: 1rem;
    }

    .action-button {
        flex: 1;
        padding: 1rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .sign-in {
        background: #4CAF50;
        color: white;
    }

    .sign-in:hover {
        background: #388E3C;
        transform: translateY(-2px);
    }

    .sign-out {
        background: #f44336;
        color: white;
    }

    .sign-out:hover {
        background: #d32f2f;
        transform: translateY(-2px);
    }

    .sign-in-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1.5rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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

    select,
    textarea {
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 1rem;
        transition: border-color 0.2s;
    }

    select:focus,
    textarea:focus {
        border-color: #4CAF50;
        outline: none;
    }

    .submit-button {
        padding: 1rem;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .submit-button:hover {
        background: #388E3C;
        transform: translateY(-2px);
    }

    /* Expanded state styles */
    .expanded .quick-actions {
        margin-bottom: 1rem;
    }
</style>