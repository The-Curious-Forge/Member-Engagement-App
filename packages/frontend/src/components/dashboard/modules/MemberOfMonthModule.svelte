<script lang="ts">
    import type { ModuleConfig } from '../../../types/dashboard';
    import { monthlyRecognition, pastMonthlyRecognitions } from '../../../stores/appStore';
    
    export let config: ModuleConfig;
    export let isExpanded: boolean;

    $: recognition = $monthlyRecognition;
    $: pastRecognitions = $pastMonthlyRecognitions;
</script>

<div class="recognition-card member">
    {#if recognition?.memberOfTheMonth}
        <div class="member-content">
            {#if isExpanded}
                <div class="expanded-view">
                    <div class="member-header-expanded">
                        {#if recognition.memberOfTheMonth.headshot}
                            <img
                                src={recognition.memberOfTheMonth.headshot}
                                alt={recognition.memberOfTheMonth.name}
                                class="member-avatar-expanded"
                            />
                        {/if}
                        <div class="member-info-expanded">
                            <h3 class="member-name-expanded">{recognition.memberOfTheMonth.name}</h3>
                            <p class="achievement-expanded">{recognition.recognitionReason}</p>
                            <div class="month-label">Current Member of the Month</div>
                        </div>
                    </div>

                    {#if pastRecognitions.length > 0}
                        <div class="past-recognitions">
                            <h4 class="past-title">Previous Members of the Month</h4>
                            <div class="past-members">
                                {#each pastRecognitions.filter(r => r.id !== recognition.id) as pastRecognition}
                                    <div class="past-member">
                                        <div class="past-member-header">
                                            <div class="past-member-info">
                                                {#if pastRecognition.memberOfTheMonth.headshot}
                                                    <img
                                                        src={pastRecognition.memberOfTheMonth.headshot}
                                                        alt={pastRecognition.memberOfTheMonth.name}
                                                        class="past-member-avatar"
                                                    />
                                                {/if}
                                                <div class="past-member-details">
                                                    <h5 class="past-member-name">
                                                        {pastRecognition.memberOfTheMonth.name}
                                                    </h5>
                                                    <span class="past-member-date">
                                                        {new Date(pastRecognition.month).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p class="past-member-reason">{pastRecognition.recognitionReason}</p>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            {:else}
                <div class="member-header">
                    <div class="member-avatar-container">
                        {#if recognition.memberOfTheMonth.headshot}
                            <img
                                src={recognition.memberOfTheMonth.headshot}
                                alt={recognition.memberOfTheMonth.name}
                                class="member-avatar"
                            />
                        {/if}
                        <div class="avatar-badge">★</div>
                    </div>
                    <div class="member-info">
                        <h4 class="member-name">{recognition.memberOfTheMonth.name}</h4>
                        <p class="achievement">{recognition.recognitionReason}</p>
                    </div>
                </div>
            {/if}
        </div>
    {:else}
        <p class="no-data">Member of the Month not Selected Yet</p>
    {/if}
</div>

<style>
    .recognition-card {
        background: white;
        border-radius: 0.5rem;
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .member-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    /* Collapsed view styles */
    .member-header {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .member-avatar-container {
        position: relative;
    }

    .member-avatar {
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #fff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .avatar-badge {
        position: absolute;
        bottom: -0.125rem;
        right: -0.125rem;
        background: rgb(200, 98, 3);
        color: white;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .member-info {
        flex: 1;
        min-width: 0;
    }

    .member-name {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #2c3e50;
    }

    .achievement {
        margin: 0;
        font-size: 0.875rem;
        color: #666;
        line-height: 1.4;
    }

    /* Expanded view styles */
    .expanded-view {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding: 1.5rem;
        height: 100%;
        overflow-y: auto;
    }

    .member-header-expanded {
        display: flex;
        align-items: center;
        gap: 2rem;
        padding: 1.5rem;
        background: linear-gradient(145deg, #fff5e6, #fff9f2);
        border-radius: 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        border: 1px solid rgb(200, 98, 3, 0.1);
    }

    .member-avatar-expanded {
        width: 8rem;
        height: 8rem;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid #fff;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .member-info-expanded {
        flex: 1;
        position: relative;
    }

    .member-name-expanded {
        margin: 0 0 0.5rem 0;
        font-size: 1.75rem;
        font-weight: 600;
        color: #2c3e50;
    }

    .achievement-expanded {
        font-size: 1.1rem;
        color: #4a5568;
        line-height: 1.6;
        margin: 0 0 1rem 0;
    }

    .month-label {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: rgb(200, 98, 3);
        color: white;
        border-radius: 1rem;
        font-size: 0.875rem;
        font-weight: 500;
    }

    /* Past recognitions styles */
    .past-recognitions {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .past-title {
        font-size: 1.25rem;
        color: #2c3e50;
        margin: 0;
        padding: 0 0.5rem;
    }

    .past-members {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
        padding: 0.5rem;
    }

    .past-member {
        background: white;
        border-radius: 1rem;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease-in-out;
    }

    .past-member:hover {
        transform: translateY(-2px);
    }

    .past-member-header {
        position: relative;
        padding-top: 75%; /* 4:3 Aspect ratio */
    }

    .past-member-info {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }

    .past-member-avatar {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .past-member-details {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 1rem;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
        color: white;
    }

    .past-member-name {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .past-member-date {
        font-size: 0.875rem;
        opacity: 0.9;
        margin-top: 0.25rem;
        display: block;
    }

    .past-member-reason {
        margin: 0;
        padding: 1rem;
        font-size: 0.875rem;
        color: #4a5568;
        line-height: 1.5;
        background: #f8f9fa;
    }

    .no-data {
        color: #666;
        font-style: italic;
        text-align: center;
        margin: 1rem 0;
    }
</style>