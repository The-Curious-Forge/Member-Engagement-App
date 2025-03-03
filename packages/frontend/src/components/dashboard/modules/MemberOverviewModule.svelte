<script lang="ts">
    import type { ModuleConfig } from '../../../types/dashboard';
    import { ModuleID } from '../../../types/dashboard';
        
    // Custom styling for the member overview module
    const moduleStyles = {
        background: 'linear-gradient(145deg, #ffffff, #f0f7ff)',
        headerBackground: 'linear-gradient(120deg, #f0f7ff 0%, #ffffff 100%)',
        headerTextColor: '#1a365d',
        contentBackground: '#ffffff'
    };
    
    import type { Member } from '../../../stores/appStore';
    import MemberList from './member-overview/MemberList.svelte';
    import SignInOutForm from './member-overview/SignInOutForm.svelte';
    import MainView from './member-overview/MainView.svelte';
    import KudosForm from './member-overview/KudosForm.svelte';
    import { slide } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    import { dashboardStore } from '../../../stores/dashboardStore';
    
    export let config: ModuleConfig;
    const dispatch = createEventDispatcher();
    let selectedMember: Member | null = null;
    let activeTab: 'status' | 'main' | 'kudos' = 'status';

    function handleMemberSelect(member: Member) {
        selectedMember = member;
        // Set initial tab based on member status
        activeTab = member.isActive ? 'main' : 'status';
        dispatch('update', {
            title: member.name,
            onBack: handleBack
        });
    }

    function handleBack() {
        selectedMember = null;
        dispatch('update', {
            title: config.title,
            onBack: undefined
        });
    }
</script>

<div class="member-overview">
        {#if !selectedMember}
            <MemberList onMemberSelect={handleMemberSelect} />
        {:else}
            <div class="member-detail" transition:slide>
                <nav class="member-tabs" style="background: {moduleStyles.headerBackground}">
                    <button
                        class:active={activeTab === 'status'}
                        on:click={() => activeTab = 'status'}
                    >
                        {selectedMember.isActive ? 'Sign Out' : 'Sign In'}
                    </button>
                    <button
                        class:active={activeTab === 'main'}
                        on:click={() => activeTab = 'main'}
                    >
                        Overview
                    </button>
                    <button
                        class:active={activeTab === 'kudos'}
                        on:click={() => activeTab = 'kudos'}
                    >
                        Send Kudos
                    </button>
                </nav>

                <div class="member-content">
                    {#if activeTab === 'status'}
                        <div class="status-section">
                            <SignInOutForm
                                member={selectedMember}
                                onComplete={handleBack}
                            />
                        </div>
                    {:else if activeTab === 'main'}
                        <MainView member={selectedMember} />
                    {:else if activeTab === 'kudos'}
                        <KudosForm member={selectedMember} />
                    {/if}
                </div>
            </div>
        {/if}
</div>

<style>
    .member-overview {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .member-detail {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .member-tabs {
        display: flex;
        align-items: flex-end;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        padding: 0;
        gap: 0;
        height: 48px;
    }

    .member-tabs button {
        flex: 1;
        height: 100%;
        padding: 0 1rem;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: #1a365d;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
        position: relative;
        opacity: 0.7;
    }

    .member-tabs button:hover {
        opacity: 0.9;
        background: rgba(255, 255, 255, 0.5);
    }

    .member-tabs button.active {
        opacity: 1;
        border-bottom-color: #4CAF50;
        background: rgba(255, 255, 255, 0.8);
    }

    .member-tabs button.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: #4CAF50;
        box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
    }

    .member-content {
        flex: 1;
        overflow: auto;
        padding: 1.5rem;
    }

    .status-section {
        height: 100%;
        overflow: auto;
    }

    /* Scrollbar styling to match BaseModule */
    .member-content::-webkit-scrollbar {
        width: 6px;
    }
    
    .member-content::-webkit-scrollbar-track {
        background: transparent;
    }
    
    .member-content::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        transition: background 0.2s ease;
    }
    
    .member-content::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.2);
    }
</style>
