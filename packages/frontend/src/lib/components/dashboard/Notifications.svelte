<script lang="ts">
import { airtableStore } from '../../stores/airtable/airtableStore';
import type { Message } from '$lib/types';

$: notifications = $airtableStore[0]?.messages.filter(message => message.appNotification) || [];
</script>

<div class="notifications">
  {#if notifications.length === 0}
    <p>No notifications</p>
  {:else}
    <ul>
      {#each notifications as notification}
        <li>
          <p>{notification.text}</p>
          <small>{new Date(notification.createdAt).toLocaleString()}</small>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .notifications {
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;
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

  p {
    margin: 0 0 0.5rem 0;
    color: #495057;
  }

  small {
    color: #6c757d;
  }
</style>
