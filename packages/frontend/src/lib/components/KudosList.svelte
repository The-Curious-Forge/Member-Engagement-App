<script lang="ts">
import { kudosStore } from '../stores/kudos/kudosStore';
import { membersStore } from '../stores/membersStore';
import type { Kudos, Member } from '$lib/types';

export let viewAllLink = "#";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
}

function getSenderName(kudos: Kudos): string {
  if (!kudos?.from?.[0]) {
    console.warn('Kudos has no sender:', kudos);
    return 'Unknown';
  }
  return kudos.from[0].name || 'Unknown';
}

function getRecipientNames(kudos: Kudos): string {
  if (!kudos?.to) {
    console.warn('Kudos has no recipients:', kudos);
    return 'Unknown';
  }

  const recipients = kudos.to
    .filter((member): member is { id: string; name: string } => member !== undefined && member.name !== undefined)
    .map(member => member.name);
  
  if (recipients.length === 0) {
    console.warn('Kudos has no valid recipients:', kudos);
    return 'Unknown';
  }

  return recipients.join(', ');
}

$: kudosList = $kudosStore || [];
</script>

<div class="kudos-list">
  <h2>Recent Kudos</h2>
  {#if kudosList.length === 0}
    <p>No kudos yet</p>
  {:else}
    <ul>
      {#each kudosList.slice(0, 5) as kudos}
        <li>
          <div class="kudos-header">
            <strong>{getSenderName(kudos)}</strong> gave kudos to <strong>{getRecipientNames(kudos)}</strong>
          </div>
          <div class="kudos-message">{kudos.message || ''}</div>
          <div class="kudos-date">{formatDate(kudos.date || kudos.createdAt)}</div>
        </li>
      {/each}
    </ul>
    {#if kudosList.length > 5}
      <a href={viewAllLink} class="view-all">View all kudos</a>
    {/if}
  {/if}
</div>

<style>
  .kudos-list {
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;
  }

  h2 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #343a40;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    padding: 1rem;
    margin-bottom: 1rem;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  .kudos-header {
    margin-bottom: 0.5rem;
  }

  .kudos-message {
    color: #495057;
    margin-bottom: 0.5rem;
  }

  .kudos-date {
    font-size: 0.875rem;
    color: #6c757d;
  }

  .view-all {
    display: block;
    text-align: center;
    margin-top: 1rem;
    color: #007bff;
    text-decoration: none;
  }

  .view-all:hover {
    text-decoration: underline;
  }
</style>
