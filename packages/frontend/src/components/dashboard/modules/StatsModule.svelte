<script lang="ts">
    import type { ModuleConfig } from '../../../types/dashboard';

    export let config: ModuleConfig;
    export let isExpanded: boolean;

    // Mock data - replace with actual data from a store/service
    const stats = {
        hoursThisMonth: 42,
        totalHours: 256,
        projectsCompleted: 8,
        skillsLearned: 5,
        visitsByDay: [
            { day: 'Mon', hours: 4 },
            { day: 'Tue', hours: 6 },
            { day: 'Wed', hours: 3 },
            { day: 'Thu', hours: 8 },
            { day: 'Fri', hours: 5 },
            { day: 'Sat', hours: 2 },
            { day: 'Sun', hours: 0 }
        ],
        topSkills: [
            { name: '3D Printing', hours: 45 },
            { name: 'Woodworking', hours: 38 },
            { name: 'Laser Cutting', hours: 25 },
            { name: 'Electronics', hours: 18 }
        ]
    };

    // Calculate max hours for bar chart scaling
    const maxHours = Math.max(...stats.visitsByDay.map(d => d.hours));
</script>

<div class="stats-module" class:expanded={isExpanded}>
    {#if !isExpanded}
        <div class="quick-stats">
            <div class="stat-item">
                <span class="label">Hours this month</span>
                <span class="value">{stats.hoursThisMonth}</span>
            </div>
            <div class="stat-item">
                <span class="label">Projects completed</span>
                <span class="value">{stats.projectsCompleted}</span>
            </div>
            <div class="stat-item">
                <span class="label">Skills learned</span>
                <span class="value">{stats.skillsLearned}</span>
            </div>
        </div>
    {:else}
        <div class="detailed-stats">
            <section class="stats-section">
                <h3>Activity Overview</h3>
                <div class="overview-stats">
                    <div class="stat-card">
                        <span class="label">Total Hours</span>
                        <span class="value">{stats.totalHours}</span>
                    </div>
                    <div class="stat-card">
                        <span class="label">This Month</span>
                        <span class="value">{stats.hoursThisMonth}</span>
                    </div>
                    <div class="stat-card">
                        <span class="label">Projects</span>
                        <span class="value">{stats.projectsCompleted}</span>
                    </div>
                </div>
            </section>

            <section class="stats-section">
                <h3>Weekly Activity</h3>
                <div class="bar-chart">
                    {#each stats.visitsByDay as day}
                        <div class="bar-container">
                            <div 
                                class="bar" 
                                style="height: {(day.hours / maxHours) * 100}%"
                                data-hours={day.hours}
                            ></div>
                            <span class="day-label">{day.day}</span>
                        </div>
                    {/each}
                </div>
            </section>

            <section class="stats-section">
                <h3>Top Skills</h3>
                <div class="skills-list">
                    {#each stats.topSkills as skill}
                        <div class="skill-item">
                            <div class="skill-info">
                                <span class="skill-name">{skill.name}</span>
                                <span class="skill-hours">{skill.hours}h</span>
                            </div>
                            <div class="skill-bar">
                                <div 
                                    class="skill-progress"
                                    style="width: {(skill.hours / stats.topSkills[0].hours) * 100}%"
                                ></div>
                            </div>
                        </div>
                    {/each}
                </div>
            </section>
        </div>
    {/if}
</div>

<style>
    .stats-module {
        height: 100%;
        padding: 1rem;
    }

    .quick-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 1rem;
        height: 100%;
    }

    .stat-item {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .stat-item .label {
        font-size: 0.875rem;
        color: #666;
        margin-bottom: 0.5rem;
    }

    .stat-item .value {
        font-size: 1.5rem;
        font-weight: 600;
        color: #2196F3;
    }

    .detailed-stats {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        height: 100%;
        overflow-y: auto;
    }

    .stats-section {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .stats-section h3 {
        margin: 0 0 1rem 0;
        color: #333;
        font-size: 1.1rem;
    }

    .overview-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
    }

    .stat-card {
        background: #f5f5f5;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
    }

    .stat-card .label {
        font-size: 0.875rem;
        color: #666;
        display: block;
        margin-bottom: 0.5rem;
    }

    .stat-card .value {
        font-size: 1.5rem;
        font-weight: 600;
        color: #2196F3;
    }

    .bar-chart {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        height: 200px;
        padding-top: 2rem;
    }

    .bar-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    .bar {
        width: 24px;
        background: #2196F3;
        border-radius: 4px;
        transition: height 0.3s ease;
        position: relative;
    }

    .bar::before {
        content: attr(data-hours);
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.75rem;
        color: #666;
    }

    .day-label {
        font-size: 0.875rem;
        color: #666;
    }

    .skills-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .skill-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .skill-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .skill-name {
        font-weight: 500;
        color: #333;
    }

    .skill-hours {
        font-size: 0.875rem;
        color: #666;
    }

    .skill-bar {
        height: 8px;
        background: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
    }

    .skill-progress {
        height: 100%;
        background: #2196F3;
        border-radius: 4px;
        transition: width 0.3s ease;
    }

    /* Scrollbar styling */
    .detailed-stats::-webkit-scrollbar {
        width: 6px;
    }

    .detailed-stats::-webkit-scrollbar-track {
        background: transparent;
    }

    .detailed-stats::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
    }

    .detailed-stats::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.2);
    }
</style>