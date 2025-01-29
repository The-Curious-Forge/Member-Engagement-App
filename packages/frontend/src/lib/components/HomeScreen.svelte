<script lang="ts">
  import { airtableStore } from '../stores/airtable/airtableStore';
  import { signedInStore } from '../stores/signedInStore';
  import type { Member } from '$lib/types';
  import GiveKudosModal from './dashboard/GiveKudosModal.svelte';
  import KudosList from './KudosList.svelte';
  import MemberOfTheMonth from './MemberOfTheMonth.svelte';
  import AppNotifications from './AppNotifications.svelte';
  import SearchComponent from './SearchComponent.svelte';
  import SignedInMembersList from './SignedInMembersList.svelte';
  import DashboardModal from './DashboardModal.svelte';

  $: storeData = $airtableStore?.[0] || {
    members: [],
    memberTypes: [],
    activities: [],
    kudos: [],
    messages: [],
    signedInMembers: [],
    memberOfTheMonth: undefined,
  };

  let selectedMember: Member | null = null;
  let showDashboard = false;

  function findMemberById(memberId: string): Member | undefined {
    return storeData.members.find(m => m.id === memberId);
  }

  function getFullMemberData(member: Member): Member | undefined {
    return storeData.members.find(m => m.id === (member.memberId || member.id));
  }

  function handleMemberSelect(event: CustomEvent<Member>) {
    const member = event.detail;
    selectedMember = member;
    showDashboard = true;
  }

  function handleDashboardClose() {
    showDashboard = false;
    selectedMember = null;
  }
</script>

<div class="home-screen">
  <div class="content">
    <div class="left-panel">
      <MemberOfTheMonth />
      <KudosList viewAllLink="#kudos" />
    </div>

    <div class="center-panel">
      <AppNotifications />
      <SearchComponent on:select={handleMemberSelect} />
    </div>

    <div class="right-panel">
      <SignedInMembersList />
    </div>
  </div>

  {#if showDashboard && selectedMember}
    <DashboardModal 
      member={selectedMember}
      show={showDashboard}
      on:close={handleDashboardClose}
    />
  {/if}
</div>

<style>
  .home-screen {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .content {
    flex: 1;
    padding: 1rem;
    display: grid;
    grid-template-columns: 300px 1fr 300px;
    gap: 1rem;
    height: calc(100vh - 2rem);
    overflow: hidden;
  }

  .left-panel,
  .center-panel,
  .right-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
  }

  @media (max-width: 1200px) {
    .content {
      grid-template-columns: 1fr;
    }

    .left-panel,
    .center-panel,
    .right-panel {
      max-height: none;
    }
  }
</style>
