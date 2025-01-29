<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Member } from '../../stores/membersStore';

  export let members: Member[] = [];
  export let selectedMembers: Member[] = [];

  let searchTerm = '';
  const dispatch = createEventDispatcher();

  $: filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function selectMember(member: Member) {
    if (!selectedMembers.some(m => m.id === member.id)) {
      selectedMembers = [...selectedMembers, member];
      dispatch('change', selectedMembers);
    }
  }

  function removeMember(member: Member) {
    selectedMembers = selectedMembers.filter(m => m.id !== member.id);
    dispatch('change', selectedMembers);
  }
</script>

<div class="member-selector">
  <div class="search-section">
    <input
      type="text"
      placeholder="Search members..."
      bind:value={searchTerm}
    />
    <div class="member-list">
      {#each filteredMembers as member}
        <div
          class="member-item"
          on:click={() => selectMember(member)}
        >
          {member.name}
        </div>
      {/each}
    </div>
  </div>
  <div class="send-to-section">
    <h4>Send to:</h4>
    {#if selectedMembers.length === 0}
      <p class="info-message">You must select at least one member to give kudos to</p>
    {:else}
      <div class="selected-members">
        {#each selectedMembers as member}
          <div class="member-chip">
            {member.name}
            <button on:click={() => removeMember(member)}>×</button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .member-selector {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  input {
    padding: 8px;
    font-size: 16px;
  }

  .member-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #ccc;
  }

  .member-item {
    padding: 8px;
    cursor: pointer;
  }

  .member-item:hover {
    background-color: #f0f0f0;
  }

  .selected-members {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .member-chip {
    background-color: #e0e0e0;
    padding: 5px 10px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .member-chip button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    color: #666;
  }
</style>
