<script lang="ts">
import { onMount } from 'svelte';
import { alerts, type Alert, alertActions } from '../../stores/appStore';

onMount(async () => {
    try {
        const response = await fetch('/api/alerts');
        if (!response.ok) {
            throw new Error('Failed to fetch alerts');
        }
        const data = await response.json();
        // Convert backend alerts to frontend Alert type
        const frontendAlerts = data.alerts.map((alert: {
            id: string;
            type: Alert['type'];
            content: string;
            messageDate: string;
        }) => ({
            id: alert.id,
            type: alert.type,
            message: alert.content,
            timestamp: new Date(alert.messageDate)
        }));
        alerts.set(frontendAlerts);
    } catch (error) {
        console.error('Error fetching alerts:', error);
        alertActions.add('error', 'Failed to load system alerts');
    }
});
</script>

<div class="alerts-container">
    <h1>System Alerts</h1>
    
    {#if $alerts.length === 0}
        <p class="no-alerts">No active system alerts</p>
    {:else}
        <div class="alerts-list">
            {#each $alerts as alert}
                <div class="alert-item {alert.type}">
                    <div class="alert-header">
                        <span class="alert-type">{alert.type}</span>
                        <span class="timestamp">{alert.timestamp.toLocaleString()}</span>
                    </div>
                    <p class="message">{alert.message}</p>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .alerts-container {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
    }

    h1 {
        margin-bottom: 2rem;
        color: #333;
    }

    .no-alerts {
        text-align: center;
        color: #666;
        font-size: 1.1rem;
        padding: 2rem;
        background: #f5f5f5;
        border-radius: 0.5rem;
    }

    .alerts-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .alert-item {
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 0.5rem;
        padding: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .alert-item.error {
        border-color: #dc3545;
        background-color: #fff5f5;
    }

    .alert-item.warning {
        border-color: #ffc107;
        background-color: #fffbf0;
    }

    .alert-item.success {
        border-color: #28a745;
        background-color: #f0fff4;
    }

    .alert-item.info {
        border-color: #17a2b8;
        background-color: #f0f9ff;
    }

    .alert-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .alert-type {
        text-transform: capitalize;
        font-weight: 500;
    }

    .timestamp {
        color: #666;
        font-size: 0.9rem;
    }

    .message {
        margin: 0;
        color: #444;
        line-height: 1.5;
    }
</style>