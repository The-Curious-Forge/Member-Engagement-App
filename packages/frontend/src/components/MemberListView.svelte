<script lang="ts">
import { base } from '$app/paths';
import { members, activeMembers } from '../stores/appStore';
import type { Member } from '../stores/appStore';
import { writable } from 'svelte/store';
import { slide } from 'svelte/transition';
import MemberDashboardModal from './MemberDashboardModal.svelte';
import { connectionStatus } from '../stores/connectionStore';

const searchQuery = writable('');
const DEFAULT_AVATAR = '/default_profile.jpg';

// Reactive image source handling
function createImageSource(member: Member) {
    let src = member.headshot || DEFAULT_AVATAR;
    let imgElement: HTMLImageElement | null = null;
    let isDefaultAvatar = false;

    return {
        setElement: (el: HTMLImageElement) => {
            imgElement = el;
            imgElement.src = src;
        },
        handleError: () => {
            if (imgElement && !isDefaultAvatar) {
                isDefaultAvatar = true;
                imgElement.src = DEFAULT_AVATAR;
            }
        }
    };
}
let selectedMember: Member | null = null;

// Filter members based on search query
$: filteredMembers = $members.filter(member =>
    member.name.toLowerCase().includes($searchQuery.toLowerCase())
);

// Filter active and inactive members
$: signedInMembers = $activeMembers
    .filter(member =>
        member.name.toLowerCase().includes($searchQuery.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

$: signedOutMembers = filteredMembers
    .filter(m => !m.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));

// Format timestamp for display
function formatTimestamp(date: Date | undefined): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(new Date(date));
}

function handleMemberClick(member: Member) {
    // Get the full member data from the members store
    const fullMember = $members.find(m => m.id === member.id);
    if (fullMember) {
        selectedMember = fullMember;
    }
}

function closeModal() {
    selectedMember = null;
}
</script>

<div class="member-list-view">
    <div class="connection-status {$connectionStatus.type}">
        {$connectionStatus.message}
    </div>
    <div class="search-container">
        <input 
            type="text" 
            placeholder="Search members..." 
            bind:value={$searchQuery}
            class="search-input"
        />
    </div>

    <div class="lists-container">
        <div class="member-list">
            <h2>Signed Out Members ({signedOutMembers.length})</h2>
            <div class="members-grid">
                {#each signedOutMembers as member}
                    {@const imageSource = createImageSource(member)}
                    <div
                        class="member-card simple"
                        on:click={() => handleMemberClick(member)}
                        role="button"
                        tabindex="0"
                        transition:slide|local={{ duration: 300, axis: 'y', easing: (t) => 1 - Math.pow(1 - t, 4) }}
                        key={member.id}
                    >
                        <div class="member-info">
                            <img
                                use:imageSource.setElement
                                alt={member.name}
                                class="member-avatar"
                                on:error={imageSource.handleError}
                            />
                            <div class="member-details">
                                <h3 class="member-name">{member.name}</h3>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>

        <div class="member-list">
            <h2>Signed In Members ({signedInMembers.length})</h2>
            <div class="members-grid">
                {#each signedInMembers as member}
                    {@const imageSource = createImageSource(member)}
                    <div
                        class="member-card active"
                        on:click={() => handleMemberClick(member)}
                        role="button"
                        tabindex="0"
                        transition:slide|local={{ duration: 300, axis: 'y', easing: (t) => 1 - Math.pow(1 - t, 4) }}
                        key={member.id}
                    >
                        <div class="member-info">
                            <img
                                use:imageSource.setElement
                                alt={member.name}
                                class="member-avatar"
                                on:error={imageSource.handleError}
                            />
                            <div class="member-details">
                                <h3 class="member-name">{member.name}</h3>
                                <p class="member-types">
                                    {member.currentMemberType?.group || 'Unknown Type'}
                                </p>
                                <p class="sign-in-time">
                                    {formatTimestamp(member.signInTime)}
                                </p>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>

{#if selectedMember}
    <MemberDashboardModal 
        member={selectedMember} 
        onClose={closeModal}
    />
{/if}

<style>
    .member-list-view {
        padding: 2rem;
    }

    .connection-status {
        margin-bottom: 1rem;
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        font-size: 0.9rem;
        text-align: center;
    }

    .connection-status.success {
        background-color: #e8f5e9;
        color: #2e7d32;
        border: 1px solid #a5d6a7;
    }

    .connection-status.warning {
        background-color: #fff3e0;
        color: #ef6c00;
        border: 1px solid #ffcc80;
    }

    .connection-status.info {
        background-color: #e3f2fd;
        color: #1565c0;
        border: 1px solid #90caf9;
    }

    .search-container {
        margin-bottom: 2rem;
    }

    .search-input {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        border: 2px solid #eee;
        border-radius: 0.5rem;
        transition: border-color 0.2s;
    }

    .search-input:focus {
        outline: none;
        border-color: #4CAF50;
    }

    .lists-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
    }

    .member-list {
        min-width: 0;
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #f9f9f9;
        padding: 1.5rem;
        border-radius: 0.75rem;
    }

    .member-list h2 {
        margin-bottom: 1rem;
        font-size: 1.25rem;
        color: #333;
    }

    .members-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-height: calc(100vh - 250px);
        overflow-y: auto;
        padding-right: 1rem;
    }

    .member-card {
        background: white;
        border-radius: 0.5rem;
        padding: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .member-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .member-card.active {
        border: 2px solid #4CAF50;
    }

    .member-card.simple {
        border: 1px solid #eee;
    }

    .member-info {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .member-avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        object-fit: cover;
    }

    .member-details {
        flex: 1;
        min-width: 0;
    }

    .member-name {
        margin: 0;
        font-size: 1rem;
        font-weight: 500;
        color: #333;
    }

    .member-types {
        margin: 0.25rem 0;
        font-size: 0.9rem;
        color: #666;
    }

    .sign-in-time {
        margin: 0.25rem 0 0;
        font-size: 0.8rem;
        color: #4CAF50;
    }

    @media (max-width: 768px) {
        .lists-container {
            grid-template-columns: 1fr;
        }
    }
</style>
