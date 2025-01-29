<script lang="ts">
  import { airtableStore } from '../stores/airtable/airtableStore';
  import type { Member } from '$lib/types';

  $: storeData = $airtableStore?.[0];
  $: memberOfTheMonth = storeData?.memberOfTheMonth;
</script>

{#if memberOfTheMonth}
<h2 style="text-align: center; margin: 30px 0px;">Member of the Month</h2>
  <div class="member-of-the-month">
    <div class="member-info">
      <img src={memberOfTheMonth.headshot || '/assets/default_profile.jpg'} alt="{memberOfTheMonth.name || 'Member'}'s headshot" />
      <div>
      <h3>{memberOfTheMonth.name || `${memberOfTheMonth.firstName} ${memberOfTheMonth.lastName}`}</h3>
      <p>{memberOfTheMonth.recognitionReason || ''}</p>
      </div>
    </div>
  </div>
{/if}

<style>
  .member-of-the-month {
    background-color: #9a850d;
    color: #fff;
    border-radius: 8px;
    padding: 16px;
  }

  .member-info {
    display: flex;
    align-items: center;
  }

  img {
    width: 100px;
    height: 100px;
    border-radius: 8px;
    margin-right: 12px;
    object-fit: cover;
  }

  h2 {
    font-size: 1.2em;
    margin-bottom: 12px;
  }

  h3 {
    font-size: 1.1em;
    margin: 0;
  }

  p {
    font-size: 0.9em;
  }
</style>
