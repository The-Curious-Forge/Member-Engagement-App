<script lang="ts">
    import type { ModuleConfig } from '../../../types/dashboard';
    import { onMount } from 'svelte';
    import { mentorsStore, type Mentor } from '../../../stores/mentorsStore';

    export let config: ModuleConfig;
    export let isExpanded: boolean;

    let mentors: Mentor[] = [];
    mentorsStore.subscribe(value => {
        mentors = value;
    });

    $: availableMentors = mentors.filter(m => m.available);

    onMount(() => {
        mentorsStore.fetchMentors();
    });

    async function handleRequestMentor(mentorId: string) {
        // TODO: Implement mentor request logic
        console.log('Request mentor:', mentorId);
    }
</script>

<div class="mentors-module" class:expanded={isExpanded}>
    {#if !isExpanded}
        <div class="mentors-preview">
            {#if availableMentors.length > 0}
                <div class="mentor-list">
                    {#each availableMentors.slice(0, 2) as mentor}
                        <div class="mentor-badge">
                            <div class="mentor-info-preview">
                                <img 
                                    src={mentor.headshot || '/default_profile.jpg'} 
                                    alt={mentor.name}
                                    class="headshot"
                                />
                                <div class="text-info">
                                    <span class="mentor-name">{mentor.name}</span>
                                    <span class="expertise">{mentor.expertise}</span>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {:else}
        <div class="mentors-expanded">
            {#each mentors as mentor (mentor.id)}
                <div class="mentor-card" class:unavailable={!mentor.available}>
                    <div class="mentor-info-expanded">
                        <img 
                            src={mentor.headshot || '/default_profile.jpg'} 
                            alt={mentor.name}
                            class="headshot"
                        />
                        <div class="text-info">
                            <h3>{mentor.name}</h3>
                            <div class="mentor-details">
                                <div class="expertise-tags">
                                    <span class="tag">{mentor.expertise}</span>
                                </div>
                                <div class="contact-info">
                                    {#if mentor.email}
                                        <div class="contact-item">
                                            <span class="label">Email:</span>
                                            <span class="value">{mentor.email}</span>
                                        </div>
                                    {/if}
                                    {#if mentor.phone}
                                        <div class="contact-item">
                                            <span class="label">Phone:</span>
                                            <span class="value">{mentor.phone}</span>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        class="request-button"
                        disabled={!mentor.available}
                        on:click={() => handleRequestMentor(mentor.id)}
                    >
                        {mentor.available ? 'Request Help' : 'Unavailable'}
                    </button>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .mentors-module {
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 1rem;
    }

    .mentors-preview {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .mentor-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .mentor-badge {
        background: white;
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .mentor-info-preview {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .mentor-info-expanded {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
    }

    .headshot {
        width: 40px;
        height: 40px;
        border-radius: 20px;
        object-fit: cover;
    }

    .mentor-info-expanded .headshot {
        width: 60px;
        height: 60px;
        border-radius: 30px;
    }

    .text-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .mentor-name {
        font-weight: 500;
        color: #333;
    }

    .expertise {
        font-size: 0.8rem;
        color: #666;
        background: #f5f5f5;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
    }

    .mentors-expanded {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        overflow-y: auto;
    }

    .mentor-card {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .mentor-card.unavailable {
        opacity: 0.7;
    }

    .mentor-details {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 0.5rem;
    }

    .expertise-tags {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .contact-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.85rem;
    }

    .contact-item {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .contact-item .label {
        color: #666;
        font-weight: 500;
        min-width: 50px;
    }

    .contact-item .value {
        color: #333;
    }

    .tag {
        font-size: 0.8rem;
        background: #f5f5f5;
        color: #666;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
    }

    .request-button {
        padding: 0.5rem 1rem;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .request-button:hover:not(:disabled) {
        background: #388E3C;
        transform: translateY(-1px);
    }

    .request-button:disabled {
        background: #ccc;
        cursor: not-allowed;
    }

    /* Scrollbar styling */
    .mentors-expanded::-webkit-scrollbar {
        width: 6px;
    }

    .mentors-expanded::-webkit-scrollbar-track {
        background: transparent;
    }

    .mentors-expanded::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
    }

    .mentors-expanded::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.2);
    }
</style>