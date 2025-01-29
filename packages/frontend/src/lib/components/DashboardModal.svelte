<script lang="ts">
import { createEventDispatcher, onMount } from 'svelte';
import { memberStore } from '../stores/members/memberStore';
import { kudosStore } from '../stores/kudos/kudosStore';
import { messageStore } from '../stores/messages/messageStore';
import getSignedInDuration, { formatDuration } from '../utils/timeUtils';
import { fade, slide } from 'svelte/transition';
import MemberSelector from './common/MemberSelector.svelte';
import GiveKudosModal from './dashboard/GiveKudosModal.svelte';
import { airtableStore } from '../stores/airtable/airtableStore';
import { apiService } from '../services/apiService';
import type { Member, Activity, MemberMessage } from '$lib/types';

const dispatch = createEventDispatcher();

export let member: Member | null;
export let show = false;

let signingIn = false;

$: storeData = $airtableStore?.[0];
$: activities = storeData?.activities || [];
$: memberTypes = storeData?.memberTypes || [];
$: topActivities = member?.topActivities ? processTopActivities(member.topActivities) : [];
$: sortedActivities = activities.sort((a, b) => {
  const aIndex = topActivities.indexOf(a.name);
  const bIndex = topActivities.indexOf(b.name);
  if (aIndex === -1 && bIndex === -1) return 0;
  if (aIndex === -1) return 1;
  if (bIndex === -1) return -1;
  return aIndex - bIndex;
});

$: {
  if (member) {
    console.log('Member data received in DashboardModal:', member);
    console.log('topActivities:', member.topActivities);
    console.log('qualifications:', member.updatedQualifications);
    console.log('Number of activities:', activities.length);
  }
}

function processTopActivities(topActivities: (string | null)[]): string[] {
  return topActivities.filter((activity): activity is string => activity !== null);
}

function getMemberTypes(member: Member): string {
  if (!member) return 'Standard';
  
  // Handle array of member types with group property
  if (member.memberTypes && Array.isArray(member.memberTypes)) {
    // Sort by sortingOrder if available
    const sortedTypes = [...member.memberTypes].sort((a, b) => 
      (a.sortingOrder || 99) - (b.sortingOrder || 99)
    );
    return sortedTypes.map(type => type.group).join(', ');
  }
  
  // Fallback to single memberType if available
  if (member.memberType) {
    return member.memberType;
  }

  return 'Standard';
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString();
}

async function handleSignIn(memberTypeId: string) {
  if (!member || signingIn) return;
  
  signingIn = true;
  try {
    const response = await apiService.post('/signIn', {
      memberId: member.id,
      memberTypeId
    });
    
    if (response.status === 200) {
      console.log('Sign in successful:', response.data);
      // Wait a moment for the socket event to be processed
      setTimeout(() => {
        signingIn = false;
        dispatch('close');
      }, 500);
    }
  } catch (error) {
    console.error('Error signing in:', error);
    signingIn = false;
  }
}

onMount(() => {
  if (member?.isSignedIn && activities.length > 0) {
    activities.forEach(activity => {
      if (activity?.id) {
        // Initialize any activity-specific logic here
      }
    });
  }
  console.log('Current member types:', memberTypes);
});
</script>

<div class="dashboard-modal" class:show transition:fade>
  {#if member}
    <div class="modal-content">
      <h2>{member.name || `${member.firstName} ${member.lastName}`}</h2>
      
      <div class="member-info">
        <img 
          src={member.headshot || member.profileImage || '/assets/default_profile.jpg'} 
          alt="{member.name || 'Member'}'s profile"
          class="profile-image"
        />
        
        <div class="member-details">
          <p><strong>Member Type:</strong> {getMemberTypes(member)}</p>
          {#if member.forgeLevel}
            <p><strong>Forge Level:</strong> {member.forgeLevel}</p>
          {/if}
          {#if member.totalHours}
            <p><strong>Total Hours:</strong> {member.totalHours}</p>
          {/if}
          {#if member.memberBio}
            <p><strong>Bio:</strong> {member.memberBio}</p>
          {/if}
          {#if member.updatedQualifications}
            <p><strong>Qualifications:</strong> {member.updatedQualifications}</p>
          {/if}
          {#if member.weeklyStreak}
            <p><strong>Weekly Streak:</strong> {member.weeklyStreak}</p>
          {/if}
          {#if member.totalPoints?.[0]}
            <p><strong>Total Points:</strong> {member.totalPoints[0]}</p>
          {/if}
        </div>
      </div>

      {#if member.memberTypes && member.memberTypes.length > 0}
        <div class="sign-in-section">
          <h3>Sign In As</h3>
          <div class="sign-in-buttons">
            {#each [...member.memberTypes].sort((a, b) => (a.sortingOrder || 99) - (b.sortingOrder || 99)) as type}
              <button 
                class="sign-in-button" 
                on:click={() => handleSignIn(type.id)}
                disabled={signingIn}
              >
                Sign In as {type.group}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      {#if member.messages && member.messages.length > 0}
        <div class="messages">
          <h3>Messages</h3>
          <div class="message-list">
            {#each member.messages as message}
              <div class="message-item">
                <div class="message-content">{message.message}</div>
                <div class="message-date">
                  {formatDate(message.messageDate)}
                  {#if message.readDate}
                    <span class="read-status">(Read: {formatDate(message.readDate)})</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if activities.length > 0}
        <div class="activities">
          <h3>Activities</h3>
          <div class="activity-list">
            {#each sortedActivities as activity}
              <div class="activity-item">
                <span class="activity-name">{activity.name}</span>
                {#if topActivities.includes(activity.name)}
                  <span class="favorite-badge">★</span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <div class="modal-actions">
        <button class="close-button" on:click={() => dispatch('close')} disabled={signingIn}>Close</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .dashboard-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .dashboard-modal.show {
    opacity: 1;
    pointer-events: auto;
  }

  .modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  }

  h2 {
    margin-top: 0;
    color: #333;
  }

  .member-info {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .profile-image {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
  }

  .member-details {
    flex: 1;
  }

  .member-details p {
    margin: 0.5rem 0;
  }

  .sign-in-section {
    margin: 1.5rem 0;
  }

  .sign-in-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .sign-in-button {
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background-color: #4a4a4a;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .sign-in-button:hover:not(:disabled) {
    background-color: #333;
  }

  .sign-in-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .messages {
    margin-top: 1.5rem;
  }

  .message-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .message-item {
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 4px;
  }

  .message-content {
    margin-bottom: 0.5rem;
    white-space: pre-wrap;
  }

  .message-date {
    font-size: 0.875rem;
    color: #6c757d;
  }

  .read-status {
    margin-left: 0.5rem;
    color: #28a745;
  }

  .activities {
    margin-top: 1.5rem;
  }

  .activity-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .activity-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    background-color: #f8f9fa;
    border-radius: 4px;
  }

  .favorite-badge {
    color: #ffd700;
  }

  .modal-actions {
    margin-top: 1.5rem;
    display: flex;
    justify-content: flex-end;
  }

  .close-button {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .close-button:hover:not(:disabled) {
    background-color: #5a6268;
  }

  .close-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
