<script lang="ts">
    import { activities, systemAlertActions } from '../../../../stores/appStore';
    import type { Member, Activity } from '../../../../stores/appStore';
    import { signIn, signOut } from '../../../../services/memberAuthService';
    import MainView from './MainView.svelte';
    import KudosForm from './KudosForm.svelte';

    export let member: Member;
    export let onComplete: () => void;

    let activityPercentages = new Map<string, number>();
    let activeTab: 'status' | 'main' | 'kudos' = 'status';

    // Initialize activity percentages
    $: if ($activities) {
        activityPercentages = new Map(
            $activities.map(activity => [activity.id, 0])
        );
    }

    // Calculate top 5 activities
    $: topFiveActivities = member?.topActivities && member.topActivities.length > 0 ?
        Array.from(
            member.topActivities.reduce((acc: Map<string, number>, activities: string) => {
                if (activities) {
                    activities.split(',').forEach(activity => {
                        const trimmed = activity.trim();
                        if (trimmed) {
                            acc.set(trimmed, (acc.get(trimmed) || 0) + 1);
                        }
                    });
                }
                return acc;
            }, new Map<string, number>())
        )
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5)
        .map(([activity]) => activity)
        : [];

    function adjustOtherSliders(changedId: string, newValue: number, newActivityPercentages: Map<string, number>) {
        const otherIds = Array.from(newActivityPercentages.keys()).filter(id => id !== changedId);
        let remainingPercentage = 100 - newValue;
        let adjustedActivityPercentages = new Map(newActivityPercentages);

        if (otherIds.length === 0) return;

        let totalOtherValues = otherIds.reduce((sum, id) => {
            const value = adjustedActivityPercentages.get(id) || 0;
            return value > 0 ? sum + value : sum;
        }, 0);

        if (totalOtherValues <= 0) {
            otherIds.forEach(id => {
                const activityValue = adjustedActivityPercentages.get(id);
                if (activityValue != null && activityValue > 0) {
                    adjustedActivityPercentages.set(id, Math.round(remainingPercentage / otherIds.filter(id => adjustedActivityPercentages.get(id) != null && (adjustedActivityPercentages.get(id) ?? 0) > 0).length));
                }
            });
            return;
        }

        otherIds.forEach(id => {
            const currentValue = adjustedActivityPercentages.get(id);
            if (typeof currentValue === 'number' && currentValue > 0) {
                let newPercentage = Math.round(((currentValue ?? 0) / totalOtherValues) * remainingPercentage);
                adjustedActivityPercentages.set(id, newPercentage);
            }
        });
            
        newActivityPercentages.clear();
        adjustedActivityPercentages.forEach((value, key) => newActivityPercentages.set(key, value));
    }

    function handleSliderChange(activityId: string, value: string) {
        const newValue = parseInt(value, 10);
        let newActivityPercentages = new Map(activityPercentages);

        if (newValue < 0) {
            newActivityPercentages.set(activityId, 0);
        } else if (newValue > 100) {
            newActivityPercentages.set(activityId, 100);
        } else {
            newActivityPercentages.set(activityId, newValue);
        }
        
        adjustOtherSliders(activityId, newValue, newActivityPercentages);
        activityPercentages = newActivityPercentages;
    }

    $: totalPercentage = Array.from(activityPercentages.values()).reduce((sum, val) => sum + val, 0);
    $: isSignOutValid = totalPercentage === 100;

    async function handleSignInOut() {
        try {
            if (member.isActive) {
                // For sign out, we need to submit activities
                if (totalPercentage === 0) {
                    systemAlertActions.add('error', 'Please allocate your time across activities before signing out.');
                    return;
                }
                if (totalPercentage > 100) {
                    systemAlertActions.add('error', 'Total time allocation cannot exceed 100%.');
                    return;
                }

                const activitiesData = Array.from(activityPercentages.entries())
                    .filter(([_, percentage]) => percentage > 0)
                    .map(([id, percentage]) => ({
                        id,
                        time: percentage / 100
                    }));

                // Validate data first
                const memberId = member.id;
                const signInRecordId = member.signInRecordId;
                
                if (!signInRecordId || !memberId) {
                    systemAlertActions.add('error', 'Missing required data for sign-out. Please try again.');
                    return;
                }

                onComplete();
                
                // Then perform sign-out in the background
                signOut(memberId, signInRecordId, activitiesData).catch(error => {
                    console.error('Sign out error:', error);
                    systemAlertActions.add('error', 'Failed to sign out. Please try again.');
                });
            } else {
                if (!member.currentMemberType?.id) {
                    systemAlertActions.add('error', 'No member type selected. Please try again.');
                    return;
                }

                // Capture values before closing modal
                const memberId = member.id;
                const memberTypeId = member.currentMemberType.id;

                onComplete();
                
                // Then perform sign-in in the background
                signIn(memberId, memberTypeId).catch(error => {
                    console.error('Sign in error:', error);
                    systemAlertActions.add('error', 'Failed to sign in. Please try again.');
                });
            }
        } catch (error) {
            console.error('Sign in/out error:', error);
            systemAlertActions.add('error', 'Failed to update sign in status. Please try again.');
        }
    }
</script>

{#if member.isActive}
    <div class="activities-form">
        <p class="instructions">Please allocate your time across activities (total must be 100%):</p>
        
        <div class="activities-list scrollable">
            {#each $activities.sort((a, b) => {
                const aIndex = topFiveActivities.indexOf(a.activity);
                const bIndex = topFiveActivities.indexOf(b.activity);
                
                if (aIndex === -1 && bIndex === -1) return 0;
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
            }) as activity (activity.id)}
                <div class="activity-item">
                    <label for={activity.id}>{activity.activity}</label>
                    <div class="slider-group">
                        <input
                            type="range"
                            id={activity.id}
                            min="0"
                            max="100"
                            value={activityPercentages.get(activity.id) ?? 0}
                            on:input={(e: Event & { currentTarget: HTMLInputElement }) => handleSliderChange(activity.id, e.currentTarget.value)}
                        />
                        <span class="percentage-value">
                            {activityPercentages.get(activity.id) ?? 0}%
                        </span>
                    </div>
                </div>
            {/each}
        </div>
        <div class="activities-footer">
            <div class="footer-content">
                <button
                    class="action-button"
                    class:disabled={!isSignOutValid}
                    disabled={!isSignOutValid}
                    on:click={handleSignInOut}
                >
                    Sign Out Now
                </button>
                {#if totalPercentage > 100}
                    <span class="error-message">Total percentage cannot exceed 100%</span>
                {:else if totalPercentage < 100}
                    <span class="error-message">Please allocate 100% of your time</span>
                {/if}
            </div>
        </div>
    </div>
{:else}
    <div class="sign-in-section">
        {#if member.memberTypes.length > 1}
            <div class="member-types">
                <p class="instructions">Select your member type:</p>
                <div class="member-type-buttons">
                    {#each member.memberTypes as type}
                        <button
                            class="member-type-button"
                            class:selected={member.currentMemberType?.id === type.id}
                            on:click={() => member.currentMemberType = type}
                        >
                            {type.group}
                        </button>
                    {/each}
                </div>
            </div>
        {:else if member.memberTypes.length === 1 && !member.currentMemberType}
            {@const type = member.memberTypes[0]}
            {#if type}
                {(member.currentMemberType = type, '')}
            {/if}
        {/if}
        <button
            class="action-button"
            disabled={!member.currentMemberType}
            on:click={handleSignInOut}
        >
            Sign In
        </button>
        {#if member.memberTypes.length > 1 && !member.currentMemberType}
            <p class="error-message">Please select a member type</p>
        {/if}
    </div>
{/if}

<style>
    .activities-form {
        display: flex;
        flex-direction: column;
        height: 100%;
        position: relative;
    }

    .activities-list {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        padding: 0.5rem;
        padding-bottom: 5rem;
        height: 100%;
        overflow-y: auto;
    }

    .activities-footer {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 1rem;
        background: white;
        border-top: 1px solid rgba(0, 0, 0, 0.08);
        z-index: 10;
    }

    .footer-content {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .footer-content .error-message {
        margin: 0;
        flex: 1;
        text-align: left;
        font-size: 0.9rem;
        color: #666;
    }

    .action-button.disabled {
        background: #ccc;
        cursor: not-allowed;
    }

    .scrollable {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding-right: 0.5rem;
    }

    .scrollable::-webkit-scrollbar {
        width: 8px;
    }

    .scrollable::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }

    .scrollable::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 4px;
    }

    .scrollable::-webkit-scrollbar-thumb:hover {
        background: #999;
    }

    .instructions {
        margin: 0 0 1rem 0;
        color: #666;
    }

    .activity-item {
        padding: 1rem;
        background: #f9f9f9;
        border-radius: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .activity-item label {
        display: block;
        color: #333;
        font-weight: 500;
        font-size: 0.875rem;
        line-height: 1.2;
    }

    .slider-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .slider-group input[type="range"] {
        flex: 1;
        height: 8px;
        -webkit-appearance: none;
        background: #ddd;
        border-radius: 4px;
        outline: none;
    }

    .slider-group input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        background: #4CAF50;
        border-radius: 50%;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .slider-group input[type="range"]::-webkit-slider-thumb:hover {
        background: #388E3C;
    }

    .percentage-value {
        min-width: 3rem;
        text-align: right;
        font-weight: 500;
        color: #4CAF50;
        font-size: 0.875rem;
    }

    .error-message {
        color: #f44336;
        text-align: center;
        margin-top: 1rem;
        font-size: 0.9rem;
    }

    .action-button {
        padding: 1rem 2rem;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 0.5rem;
        font-size: 1.1rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .action-button:hover {
        background: #388E3C;
    }

    .sign-in-section {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        height: 100%;
    }

    .member-types {
        flex: 1;
    }

    .member-type-buttons {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-top: 1rem;
    }

    .member-type-button {
        padding: 1rem;
        border: 2px solid #ddd;
        border-radius: 8px;
        background: white;
        color: #333;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .member-type-button:hover {
        border-color: #4CAF50;
        background: #f5f5f5;
    }

    .member-type-button.selected {
        border-color: #4CAF50;
        background: #E8F5E9;
        color: #2E7D32;
    }
</style>