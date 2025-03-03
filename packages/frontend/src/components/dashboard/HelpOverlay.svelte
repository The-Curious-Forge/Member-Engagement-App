<script lang="ts">
    import { onMount } from 'svelte';
    import { dashboardStore, moduleConfigs } from '../../stores/dashboardStore';
    import type { ModuleID } from '../../types/dashboard';

    // Grid configuration (must match Dashboard.svelte)
    const GRID_GAP = 24; // pixels between grid cells
    const FOOTER_HEIGHT = 48; // pixels, must match layout.svelte

    // Grid cell dimensions
    let cellWidth = 0;
    let cellHeight = 0;
    let gridElement: HTMLElement | null = null;

    // Calculate grid cell size
    function updateGridCellSize() {
        if (!gridElement) return;
        const rect = gridElement.getBoundingClientRect();
        const GRID_COLS = 8;
        const GRID_ROWS = 8;
        
        cellWidth = (rect.width - (GRID_COLS + 1) * GRID_GAP) / GRID_COLS;
        // Subtract footer height from available space
        const availableHeight = rect.height - FOOTER_HEIGHT;
        cellHeight = (availableHeight - (GRID_ROWS - 1) * GRID_GAP) / GRID_ROWS;
    }

    onMount(() => {
        // Find the dashboard grid element
        gridElement = document.querySelector('.dashboard-grid');
        if (gridElement) {
            updateGridCellSize();
            window.addEventListener('resize', updateGridCellSize);
        }

        return () => {
            window.removeEventListener('resize', updateGridCellSize);
        };
    });

    // Get module help content
    $: helpContent = Object.entries($moduleConfigs).reduce((acc, [id, config]) => {
        if (config.helpContent) {
            acc[id as ModuleID] = config.helpContent;
        }
        return acc;
    }, {} as Record<ModuleID, string>);

    // Calculate module position in pixels
    function getModuleStyle(moduleState: any) {
        if (!gridElement || cellWidth === 0 || cellHeight === 0) return '';

        const rect = gridElement.getBoundingClientRect();
        const x = rect.left + moduleState.position.x * (cellWidth + GRID_GAP) + GRID_GAP;
        const y = rect.top + moduleState.position.y * (cellHeight + GRID_GAP) + GRID_GAP;
        const width = moduleState.position.width * cellWidth + (moduleState.position.width - 1) * GRID_GAP;
        const height = moduleState.position.height * cellHeight + (moduleState.position.height - 1) * GRID_GAP;

        return `
            left: ${x}px;
            top: ${y}px;
            width: ${width}px;
            height: ${height}px;
        `;
    }
</script>

{#if $dashboardStore.isHelpMode}
    <div class="help-overlay" on:click|self={() => dashboardStore.toggleHelpMode()}>
        {#each Object.entries($dashboardStore.layout) as [moduleId, moduleState]}
            {@const config = $moduleConfigs[moduleId as ModuleID]}
            {#if config.helpContent}
                <div 
                    class="help-tooltip"
                    style={getModuleStyle(moduleState)}
                >
                    <div class="help-content">
                        <h4>{config.title}</h4>
                        <p>{config.helpContent}</p>
                    </div>
                </div>
            {/if}
        {/each}
    </div>
{/if}

<style>
    .help-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .help-tooltip {
        position: fixed;
        pointer-events: none;
    }

    .help-content {
        background: rgba(0, 0, 0, 0.75);
        border-radius: 16px;
        padding: 1.25rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        position: relative;
        animation: slideIn 0.3s ease;
        pointer-events: auto;
        height: 100%;
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(0, 0, 0, 0.03);
        backdrop-filter: blur(8px);
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .help-content h4 {
        margin: 0 0 0.75rem 0;
        color: #ffffff;
        font-size: 1.1rem;
        font-weight: 600;
        letter-spacing: -0.01em;
    }

    .help-content p {
        margin: 0;
        color: #ffffff;
        font-size: 0.95rem;
        line-height: 1.6;
        flex: 1;
    }
</style>