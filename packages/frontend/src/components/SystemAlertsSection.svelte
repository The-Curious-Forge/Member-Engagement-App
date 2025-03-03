<script lang="ts">
    import { systemAlerts, type SystemAlert } from '../stores/appStore';

    function formatTime(date: Date): string {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 60) {
            return `${minutes}m ago`;
        }
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours}h ago`;
        }
        
        return date.toLocaleDateString();
    }
</script>

<section class="settings-section">
    <h3>System Alerts</h3>
    <div class="alerts-list">
        {#if $systemAlerts.length === 0}
            <p class="no-alerts">No system alerts</p>
        {:else}
            {#each $systemAlerts as alert}
                <div class="alert-item {alert.type}">
                    <div class="alert-content">
                        <p class="alert-message">{alert.message}</p>
                        <span class="alert-time">{formatTime(alert.timestamp)}</span>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</section>

<style>
    .settings-section {
        margin-bottom: 2rem;
    }

    .settings-section h3 {
        margin: 0 0 1rem;
        font-size: 1rem;
        color: #333;
    }

    .alerts-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .alert-item {
        padding: 0.75rem;
        border-radius: 0.5rem;
        background: #f5f5f5;
        border-left: 4px solid #666;
    }

    .alert-item.error {
        background: #fff5f5;
        border-left-color: #dc3545;
    }

    .alert-item.warning {
        background: #fffbf0;
        border-left-color: #ffc107;
    }

    .alert-item.success {
        background: #f0fff4;
        border-left-color: #28a745;
    }

    .alert-item.info {
        background: #f0f9ff;
        border-left-color: #17a2b8;
    }

    .alert-content {
        flex: 1;
        min-width: 0;
    }

    .alert-message {
        margin: 0 0 0.25rem 0;
        font-size: 0.875rem;
        color: #333;
        line-height: 1.3;
    }

    .alert-time {
        font-size: 0.75rem;
        color: #666;
        display: block;
    }

    .no-alerts {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 0.5rem;
        margin: 0;
    }
</style>