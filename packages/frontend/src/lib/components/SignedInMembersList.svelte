<script lang="ts">
import { signedInStore } from '../stores/signedInStore';
import { memberTypesStore } from '../stores/memberTypesStore';
import type { Member } from '$lib/types';
import { onMount } from 'svelte';

const defaultProfileImage = '/assets/default_profile.jpg';

export let onMemberClick: (member: Member) => void = () => {};
export let signingOutMember: { memberId: string, signInRecordId: string } | null = null;

// Define a mapping of member types to colors
const memberTypeColors = {
  'Member': '#A4450A',  // Gold
  'Staff': '#830406',    // Green
  'Volunteer': '#08748A', // Blue
  'Studio Guide': '#A08C06',    // Deep Orange
};

// Function to get color based on member type
function getMemberTypeColor(type: string): string {
  return memberTypeColors[type] || '#9E9E9E';  // Default to grey if type not found
}

// Function to get member type display name
function getMemberType(member: Member): string {
  if (!member) return 'Member';
  
  // If the member has a signedInType, use that
  if (member.signedInType) {
    const memberType = $memberTypesStore.find(type => type.id === member.signedInType);
    return memberType?.group || 'Member';
  }
  
  // Handle array of member types with group property
  if (member.memberTypes && Array.isArray(member.memberTypes)) {
    // Sort by sortingOrder if available
    const sortedTypes = [...member.memberTypes].sort((a, b) => 
      (a.sortingOrder || 99) - (b.sortingOrder || 99)
    );
    // Return the first (highest priority) type's group
    return sortedTypes[0]?.group || 'Member';
  }
  
  // Fallback to single memberType if available
  if (member.memberType) {
    return member.memberType;
  }

  return 'Member';
}

$: signedInMembers = $signedInStore;

$: {
  console.log('SignedInMembersList: signedInMembers updated', signedInMembers);
  // Log any duplicate memberId values
  const memberIds = signedInMembers.map(m => m.id);
  const duplicates = memberIds.filter((id, index) => memberIds.indexOf(id) !== index);
  if (duplicates.length > 0) {
    console.warn('Duplicate memberIds found:', duplicates);
  }
  
  // Log all keys to check for uniqueness
  const keys = signedInMembers.map(m => `${m.id}-${m.signInRecordId}-${m.signInTime}`);
  console.log('All keys:', keys);
  
  // Check for duplicate keys
  const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index);
  if (duplicateKeys.length > 0) {
    console.error('Duplicate keys found:', duplicateKeys);
  }

  // Log full member objects for debugging
  console.log('Full member objects:', signedInMembers);
}
</script>

<div class="signed-in-container">
  <h2 style="text-align: center;">Signed In</h2>
  {#if signedInMembers.length === 0}
    <p>No members currently signed in.</p>
  {:else}
    <ul class="signed-in-list">
      {#each signedInMembers as member (member.id + '-' + member.signInRecordId + '-' + member.signInTime)}
        {@const type = getMemberType(member)}
        <li 
          on:click={() => onMemberClick(member)}
          style="background-color: {getMemberTypeColor(type)};"
          class:signing-out={signingOutMember && signingOutMember.memberId === member.id}
          in:slide={{ duration: 300 }}
          out:slide={{ duration: 300 }}
        >
          <img src={member.headshot || member.profileImage || defaultProfileImage} alt={member.name || `${member.firstName} ${member.lastName}`} class="member-headshot" />
          <div class="member-info">
            <strong>{member.name || `${member.firstName} ${member.lastName}`}</strong>
            <span>{type} | {new Date(member.signInTime || member.lastSignIn || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          {#if signingOutMember && signingOutMember.memberId === member.id}
            <div class="signing-out-overlay">
              <span>Signing Out...</span>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .signed-in-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .signed-in-list {
    list-style-type: none;
    padding: 0;
    flex-grow: 1;
    overflow-y: auto;
  }

  .signed-in-list li {
    display: flex;
    align-items: center;
    margin-bottom: 1vw;
    padding: .75vw;
    border-radius: 15px;
    transition: background-color 0.3s ease, transform 0.3s ease;
    cursor: pointer;
  }

  .signed-in-list li:hover {
    filter: brightness(90%);
  }

  .member-headshot {
    width: 75px;
    height: 75px;
    border-radius: 15%;
    margin-right: 0.75vw;
    object-fit: cover;
  }

  .member-info {
    display: flex;
    flex-direction: column;
  }

  .member-info strong {
    font-size: 1.1vw;
    color: #ffffff;
  }

  .member-info span {
    font-size: 0.7vw;
    color: #ffffffc0;
  }

  .signing-out-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 15px;
  }

  .signing-out-overlay span {
    color: white;
    font-size: 1.2vw;
    font-weight: bold;
  }

  .signing-out {
    position: relative;
  }
</style>
