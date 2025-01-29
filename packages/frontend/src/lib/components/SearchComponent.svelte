<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { derived } from 'svelte/store';
  import { membersStore } from '../stores/membersStore';
  import { signedInStore } from '../stores/signedInStore';
  import type { Member } from '$lib/types';

  const dispatch = createEventDispatcher();

  export let searchQuery = '';
  let searchResults = [];
  let selectedIndex = -1;
  let searchInput: HTMLInputElement;

  // Create a derived store for preprocessed members
  const allMembers = derived(membersStore, $store => 
    $store.map(member => ({
      ...member,
      searchName: member.name?.toLowerCase() || ''
    }))
  );

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const debouncedSearch = debounce(() => {
    if (searchQuery.length < 2) {
      searchResults = [];
      selectedIndex = -1;
      return;
    }

    const query = searchQuery.toLowerCase();
    
    const filteredMembers = $allMembers.filter(member => 
      member.searchName.includes(query)
    );

    searchResults = filteredMembers.filter(member => 
      !$signedInStore.some(m => m.id === member.id)
    );

    selectedIndex = searchResults.length > 0 ? 0 : -1;
    console.log("Search results:", searchResults);
  }, 100);

  function handleSearch() {
    debouncedSearch();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (searchResults.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = (selectedIndex + 1) % searchResults.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = (selectedIndex - 1 + searchResults.length) % searchResults.length;
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex !== -1) {
          dispatch('select', searchResults[selectedIndex]);
        }
        break;
    }
  }

  function handleSelect(member: Member) {
    dispatch('select', member);
    searchQuery = '';
    searchResults = [];
    selectedIndex = -1;
  }

  export function focusSearch() {
    if (searchInput) {
      searchInput.focus();
    }
  }

  export function clearSearch() {
    searchQuery = '';
    searchResults = [];
    selectedIndex = -1;
  }
</script>

<div class="search-container">
  <div class="search-bar">
    <input 
      type="text" 
      bind:value={searchQuery}
      bind:this={searchInput}
      on:input={handleSearch}
      on:keydown={handleKeydown}
      placeholder="Search for your name to sign in..."
    />
  </div>
  {#if searchResults.length > 0}
    <ul class="search-results">
      {#each searchResults as result, index}
        <li 
          class:selected={index === selectedIndex}
          on:click={() => handleSelect(result)}
          on:mouseenter={() => selectedIndex = index}
        >
          {result.name}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .search-container {
    width: 100%;
    max-width: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  .search-bar {
    width: 100%;
  }

  .search-bar input {
    width: 100%;
    padding: 1vw;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 1.2vw;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    box-sizing: border-box;
  }

  .search-results {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    font-size: 1vw;
    list-style-type: none;
    padding: 0;
    margin-top: 0.5vw;
    background-color: #ffffff;
    border: 1px solid #ddd;
    border-radius: 5px;
    overflow-y: auto;
    max-height: 30vh;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    box-sizing: border-box;
  }

  .search-results li {
    cursor: pointer;
    padding: 0.8vw;
    border-bottom: 1px solid #eee;
  }

  .search-results li:last-child {
    border-bottom: none;
  }

  .search-results li:hover,
  .search-results li.selected {
    background-color: #f0f0f0;
  }
</style>
