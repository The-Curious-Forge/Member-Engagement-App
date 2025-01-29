<script lang="ts">
import { airtableStore } from '../../stores/airtable/airtableStore';
import { get } from 'svelte/store';
import type { Member, Kudos } from '$lib/types';
import { kudosStore } from '../../stores/kudos/kudosStore';
import MemberSelector from '../common/MemberSelector.svelte';

export let show = false;
export let fromMemberId: string;

let selectedMembers: Member[] = [];
let message = '';
let sending = false;
let error = '';

async function handleSubmit() {
  if (!message.trim()) {
    error = 'Please enter a message';
    return;
  }

  if (selectedMembers.length === 0) {
    error = 'Please select at least one recipient';
    return;
  }

  sending = true;
  error = '';

  try {
    await kudosStore.sendKudos({
      fromMemberId,
      toMemberIds: selectedMembers.map(m => m.id),
      message: message.trim(),
      createdAt: new Date().toISOString(),
    });

    show = false;
    message = '';
    selectedMembers = [];
  } catch (err) {
    console.error('Error sending kudos:', err);
    error = 'Failed to send kudos. Please try again.';
  } finally {
    sending = false;
  }
}

function handleClose() {
  show = false;
  message = '';
  selectedMembers = [];
  error = '';
}
</script>

{#if show}
<div class="modal-backdrop" on:click={handleClose}>
  <div class="modal" on:click|stopPropagation>
    <h2>Give Kudos</h2>
    
    <div class="form-group">
      <label for="recipients">Recipients</label>
      <MemberSelector 
        members={$airtableStore[0]?.members || []}
        bind:selectedMembers
        excludeIds={[fromMemberId]}
      />
    </div>

    <div class="form-group">
      <label for="message">Message</label>
      <textarea
        id="message"
        bind:value={message}
        placeholder="Write your kudos message..."
        rows="4"
      ></textarea>
    </div>

    {#if error}
      <div class="error">{error}</div>
    {/if}

    <div class="actions">
      <button class="secondary" on:click={handleClose}>Cancel</button>
      <button 
        class="primary" 
        on:click={handleSubmit} 
        disabled={sending}
      >
        {sending ? 'Sending...' : 'Send Kudos'}
      </button>
    </div>
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

  .modal {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: #343a40;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #495057;
    font-weight: 500;
  }

  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    resize: vertical;
    font-family: inherit;
  }

  textarea:focus {
    outline: none;
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }

  .error {
    color: #dc3545;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .primary {
    background-color: #007bff;
    color: white;
  }

  .primary:hover:not(:disabled) {
    background-color: #0056b3;
  }

  .secondary {
    background-color: #6c757d;
    color: white;
  }

  .secondary:hover {
    background-color: #5a6268;
  }
</style>
