<script lang="ts">
import { messagesStore } from '../stores/messagesStore';
import type { Message } from '$lib/types';

$: appNotifications = $messagesStore.filter(message => message.appNotification);
</script>

<div class="app-notifications">
  {#if appNotifications.length === 0}
  {:else}
    <ul class="notifications-list">
      {#each appNotifications as message}
        <li>
          <p>{message.text}</p>
          <small>{new Date(message.createdAt).toLocaleString()}</small>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .app-notifications {
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;
  }

  .notifications-list {
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
