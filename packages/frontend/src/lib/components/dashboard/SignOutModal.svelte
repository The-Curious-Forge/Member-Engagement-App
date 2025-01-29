<script lang="ts">
import { activitiesStore } from '../../stores/activitiesStore';
import { members } from '../../stores/membersStore';
import type { Member } from '../../stores/membersStore';

export let selectedActivities = {};
export let handleSignOut: () => Promise<void>;
export let setActiveModal: (modal: string) => void;
export let currentMember: Member;

$: topActivities = currentMember?.topActivities
  ? processTopActivities(currentMember.topActivities)
  : [];

function processTopActivities(topActivitiesString: string): string[] {
  const activityCounts = new Map();
  const activities = topActivitiesString.split(',').map(a => a.trim());
  
  activities.forEach(activity => {
    activityCounts.set(activity, (activityCounts.get(activity) || 0) + 1);
  });

  return Array.from(activityCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([activity]) => activity);
}
</script>

<h3>Sign Out</h3>
<div class="top-activities">
  <h4>Your Top Activities</h4>
  {#if topActivities.length === 0}
    <p>No top activities available.</p>
  {:else}
    <ul>
      {#each topActivities as activity}
        <li>{activity}</li>
      {/each}
    </ul>
  {/if}
</div>
<div class="activities">
  <h4>Select Activities</h4>
  {#if $activitiesStore.length === 0}
    <p>No activities available.</p>
  {:else}
    {#each $activitiesStore as activity}
      <div class="activity-item">
        <label for={activity.id}>{activity.activity}</label>
        <input 
          type="range" 
          id={activity.id}
          bind:value={selectedActivities[activity.id]} 
          min="0" 
          max="100" 
          step="1"
        >
        <span>{selectedActivities[activity.id] || 0} minutes</span>
      </div>
    {/each}
  {/if}
</div>
<button on:click={handleSignOut}>Sign Out</button>
<button on:click={() => setActiveModal('main')}>Back</button>

<style>
  .top-activities {
    margin-bottom: 20px;
  }

  .top-activities ul {
    list-style-type: none;
    padding: 0;
  }

  .top-activities li {
    background-color: #f0f0f0;
    padding: 5px 10px;
    margin-bottom: 5px;
    border-radius: 3px;
  }

  .activities {
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .activity-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }

  .activity-item label {
    flex: 1;
    margin-right: 10px;
  }

  .activity-item input[type="range"] {
    flex: 2;
  }

  .activity-item span {
    flex: 0 0 80px;
    text-align: right;
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
