<script lang="ts">
import type { Message } from '../../stores/messagesStore';

export let member;
export let filteredMessages: Message[] = [];
export let handleMarkAsRead: (messageId: string) => Promise<void>;
</script>

<div class="left-panel">
  <h1 style="font-size: 4rem;">Hey <span style="color: #A4450A;">{member.name}</span> 👋</h1>
  <div class="forge-level-badge">Forge Level {member.forgeLevl}</div>
  <h2>Your Messages ({filteredMessages.length})</h2>
  <div class="messages">
    {#if filteredMessages.length === 0}
      <p>No messages available.</p>
    {:else}
      {#each filteredMessages as message}
        <div class="message">
          <p>{message.message}</p>
          <small>{new Date(message.messageDate).toLocaleString()}</small>
          {#if !message.readDate}
            <button on:click={() => handleMarkAsRead(message.id)}>Mark as Read</button>
          {:else}
            <small>Read on: {new Date(message.readDate).toLocaleString()}</small>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
  <h2>Your Stats <!-- Add relevant stats here --></h2>
</div>

<style>
  .left-panel {
    flex: 3;
    padding: 20px 70px;
    overflow-y: auto;
  }

  .forge-level-badge {
    display: inline-block;
    background-color: #FFA500;
    color: white;
    padding: 5px 10px;
    border-radius: 15px;
    font-weight: bold;
    margin-bottom: 15px;
  }

  .messages {
    display: flex;
    gap: 30px;
  }

  .message {
    flex: 1;
    padding: 30px;
    background-color: #ffffff;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .message p {
    margin: 0;
  }

  .message small {
    color: #666;
  }
</style>
