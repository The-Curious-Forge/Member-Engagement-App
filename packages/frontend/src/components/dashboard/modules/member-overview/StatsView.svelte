<script lang="ts">
    import type { Member } from '../../../../stores/appStore';

    export let member: Member;

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
</script>

<div class="stats-grid">
    <div class="stat-card">
        <span class="stat-value">{Number(member.totalHours || 0).toFixed(2)}</span>
        <span class="stat-label">Total Hours</span>
    </div>
    <div class="stat-card">
        <span class="stat-value">{Number(member.totalPoints || 0).toFixed(2)}</span>
        <span class="stat-label">Total Points</span>
    </div>
    <div class="stat-card">
        <span class="stat-value">{Number(member.weeklyStreak || 0).toFixed(2)}</span>
        <span class="stat-label">Weekly Streak</span>
    </div>
</div>

<div class="activities-section">
    <h4>Top 5 Activities</h4>
    <ul class="activities-list">
        {#each topFiveActivities as activity}
            <li>{activity}</li>
        {/each}
    </ul>
</div>

<div class="kudos-summary">
    <div class="kudos-stat">
        <span class="stat-value">{member.kudosReceived?.length || 0}</span>
        <span class="stat-label">Kudos Received</span>
    </div>
    <div class="kudos-stat">
        <span class="stat-value">{member.kudosGiven?.length || 0}</span>
        <span class="stat-label">Kudos Given</span>
    </div>
</div>

<style>
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .stat-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 600;
        color: #4CAF50;
    }

    .stat-label {
        display: block;
        font-size: 0.9rem;
        color: #666;
        margin-top: 0.25rem;
    }

    .activities-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
    }

    .activities-list li {
        background: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.9rem;
        color: #333;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .kudos-summary {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-top: 2rem;
    }

    .kudos-stat {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    @media (max-width: 768px) {
        .stats-grid {
            grid-template-columns: 1fr;
        }

        .kudos-summary {
            grid-template-columns: 1fr;
        }
    }
</style>