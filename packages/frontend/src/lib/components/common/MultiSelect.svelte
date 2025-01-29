<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  interface Item {
    id: string;
    name: string;
  }

  export let items: Item[] = [];
  export let selectedItems: Item[] = [];
  export let placeholder = 'Select items';

  let inputValue = '';
  let showDropdown = false;
  let filteredItems: Item[] = [];

  const dispatch = createEventDispatcher<{
    change: Item[];
  }>();

  $: {
    filteredItems = items.filter(item =>
      item.name.toLowerCase().includes(inputValue.toLowerCase())
    );
  }

  function toggleItem(item: Item) {
    const index = selectedItems.findIndex(selectedItem => selectedItem.id === item.id);
    if (index === -1) {
      selectedItems = [...selectedItems, item];
    } else {
      selectedItems = selectedItems.filter(selectedItem => selectedItem.id !== item.id);
    }
    dispatch('change', selectedItems);
  }

  function handleInputFocus() {
    showDropdown = true;
  }

  function handleInputBlur() {
    setTimeout(() => {
      showDropdown = false;
    }, 200);
  }

  function removeSelectedItem(item: Item) {
    selectedItems = selectedItems.filter(selectedItem => selectedItem.id !== item.id);
    dispatch('change', selectedItems);
  }
</script>

<div class="multi-select">
  <div class="selected-items">
    {#each selectedItems as item}
      <span class="selected-item">
        {item.name}
        <button on:click={() => removeSelectedItem(item)}>×</button>
      </span>
    {/each}
  </div>
  <input
    type="text"
    bind:value={inputValue}
    {placeholder}
    on:focus={handleInputFocus}
    on:blur={handleInputBlur}
  />
  {#if showDropdown}
    <ul class="dropdown" transition:fade={{ duration: 100 }}>
      {#each filteredItems as item}
        <li
          class:selected={selectedItems.some(selectedItem => selectedItem.id === item.id)}
          on:click={() => toggleItem(item)}
        >
          {item.name}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .multi-select {
    position: relative;
    width: 100%;
    font-family: Arial, sans-serif;
  }

  .selected-items {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 5px;
  }

  .selected-item {
    background-color: #e0e0e0;
    border-radius: 16px;
    padding: 2px 8px;
    font-size: 14px;
    display: flex;
    align-items: center;
  }

  .selected-item button {
    background: none;
    border: none;
    color: #666;
    font-size: 16px;
    cursor: pointer;
    margin-left: 5px;
  }

  input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
  }

  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: white;
    border: 1px solid #ccc;
    border-top: none;
    max-height: 200px;
    overflow-y: auto;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  li {
    padding: 10px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  li:hover {
    background-color: #f0f0f0;
  }

  .selected {
    background-color: #e0e0e0;
  }
</style>
