<script lang="ts">
export let officeMessage: string = '';
export let handleSendMessage: () => Promise<void>;
export let setActiveModal: (modal: string) => void;
</script>

<h3>Send Message to Office</h3>
<textarea bind:value={officeMessage} placeholder="Enter message for office"></textarea>
<button on:click={handleSendMessage} disabled={!officeMessage.trim()}>Send Message</button>
<button on:click={() => setActiveModal('main')}>Back</button>

<style>
  textarea {
    width: 100%;
    height: 100px;
    margin-bottom: 10px;
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

  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
</style>
