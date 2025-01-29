<script lang="ts">
export let memberSpecificTypes = [];
export let handleSignIn: (memberTypeId: string) => Promise<void>;
export let setActiveModal: (modal: string) => void;
</script>

<h3>Sign In</h3>
{#if memberSpecificTypes.length > 0}
  <div class="member-type-buttons">
    {#each memberSpecificTypes as type}
      <button class="full-width" on:click={() => handleSignIn(type.id)}>Sign In as a {type.group}</button>
    {/each}
  </div>
{:else}
  <p>No member types available. Please try again later.</p>
{/if}
<button class="full-width" on:click={() => setActiveModal('main')}>Back</button>

<style>
  .member-type-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .full-width {
    width: 100%;
  }

  button {
    padding: 20px;
    font-size: 1.5rem;
    background-color: #4a4a4a;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin-bottom: 10px;
  }

  button:hover {
    background-color: #333;
  }
</style>
