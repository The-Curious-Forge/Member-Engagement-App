<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';

  export let isOpen: boolean;
  export let onSignOutAllClick: () => void;
  
  const dispatch = createEventDispatcher();
  let pin = '';
  let errorMessage = '';
  let showPinInput = true;
  let showSettings = false;
  let modalContent: HTMLDivElement;

  const correctPin = import.meta.env.VITE_SETTINGS_PIN || '1234';

  onMount(() => {
    if (isOpen && modalContent) {
      modalContent.focus();
    }
  });

  $: if (isOpen && modalContent) {
    modalContent.focus();
  }

  function closeModal() {
    showPinInput = true;
    showSettings = false;
    pin = '';
    errorMessage = '';
    dispatch('close');
  }

  function handleNumberClick(number: number) {
    if (pin.length < 4) {
      pin += number.toString();
    }
    if (pin.length === 4) {
      handleSubmit();
    }
  }

  function handleDelete() {
    pin = pin.slice(0, -1);
  }

  function handleSubmit() {
    if (pin === correctPin) {
      errorMessage = '';
      showPinInput = false;
      showSettings = true;
    } else {
      errorMessage = 'Incorrect PIN. Please try again.';
      pin = '';
    }
  }

  function handleSignOutAll() {
    onSignOutAllClick();
    closeModal();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    } else if (showPinInput) {
      if (event.key >= '0' && event.key <= '9') {
        handleNumberClick(parseInt(event.key));
      } else if (event.key === 'Backspace') {
        handleDelete();
      } else if (event.key === 'Enter') {
        handleSubmit();
      }
    }
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" on:click={closeModal}>
    <div
      class="modal-content"
      on:click|stopPropagation
      bind:this={modalContent}
      tabindex="0"
      on:keydown={handleKeydown}
    >
      {#if showPinInput}
        <h2>Enter PIN</h2>
        <div class="pin-display">
          {#each Array(4) as _, i}
            <div class="pin-slot">{pin[i] ? '•' : ''}</div>
          {/each}
        </div>
        <div class="number-grid">
          {#each Array(9) as _, i}
            <button class="number-button" on:click={() => handleNumberClick(i + 1)}>{i + 1}</button>
          {/each}
          <button class="number-button" on:click={() => handleDelete()}>Del</button>
          <button class="number-button" on:click={() => handleNumberClick(0)}>0</button>
          <button class="number-button" on:click={handleSubmit}>Enter</button>
        </div>
        {#if errorMessage}
          <p class="error">{errorMessage}</p>
        {/if}
      {:else if showSettings}
        <h2>Settings</h2>
        <button class="sign-out-all-button" on:click={handleSignOutAll}>Sign Out All Members</button>
        <button class="close-button" on:click={closeModal}>Close</button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
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
  }

  .modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 5px;
    width: 300px;
  }

  h2 {
    margin-top: 0;
    margin-bottom: 20px;
    text-align: center;
  }

  .pin-display {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }

  .pin-slot {
    width: 30px;
    height: 30px;
    border: 1px solid #ccc;
    margin: 0 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
  }

  .number-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }

  .number-button {
    padding: 10px;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    cursor: pointer;
    font-size: 18px;
  }

  .number-button:hover {
    background-color: #e0e0e0;
  }

  .error {
    color: red;
    margin-top: 10px;
    text-align: center;
  }

  .sign-out-all-button, .close-button {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    color: white;
    border: none;
    cursor: pointer;
  }

  .sign-out-all-button {
    background-color: #dc3545;
  }

  .sign-out-all-button:hover {
    background-color: #c82333;
  }

  .close-button {
    background-color: #6c757d;
  }

  .close-button:hover {
    background-color: #5a6268;
  }
</style>
