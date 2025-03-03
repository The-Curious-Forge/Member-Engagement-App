<script lang="ts">
    import { onMount } from 'svelte';
    import { dashboardStore, moduleConfigs } from '../../stores/dashboardStore';
    import { members } from '../../stores/appStore';
    import BaseModule from './BaseModule.svelte';
    import HelpOverlay from './HelpOverlay.svelte';
    import type { ModulePosition, DashboardLayout, ModuleConfig, ModuleProps, ModuleComponent, ModuleState } from '../../types/dashboard';
    import { ModuleID, DashboardView } from '../../types/dashboard';
    import type { ComponentType, SvelteComponent } from 'svelte';

    // Get selected member data
    $: selectedMember = $dashboardStore.selectedMemberId ?
        $members.find(m => m.id === $dashboardStore.selectedMemberId) : null;
    
    // Import main dashboard modules
    import { default as MemberOverviewModule } from './modules/MemberOverviewModule.svelte';
    import RecentKudosModule from './modules/RecentKudosModule.svelte';
    import TodayEventsModule from './modules/TodayEventsModule.svelte';
    import MemberOfMonthModule from './modules/MemberOfMonthModule.svelte';
    import ProjectOfMonthModule from './modules/ProjectOfMonthModule.svelte';
    import AlertsModule from './modules/AlertsModule.svelte';
    // @ts-ignore
    import MentorsModule from './modules/MentorsModule.svelte';
    
    // Import personal dashboard modules
    import SignInOutModule from './modules/SignInOutModule.svelte';
    import MessagesModule from './modules/MessagesModule.svelte';
    import StatsModule from './modules/StatsModule.svelte';
    import PersonalKudosModule from './modules/PersonalKudosModule.svelte';
    import FeedbackModule from './modules/FeedbackModule.svelte';
    import HelpModule from './modules/HelpModule.svelte';
    
    // Module content mapping
    const moduleContent: Record<ModuleID, any> = {
        // Main Dashboard Modules
        [ModuleID.MemberOverview]: MemberOverviewModule,
        [ModuleID.RecentKudos]: RecentKudosModule,
        [ModuleID.TodayEvents]: TodayEventsModule,
        [ModuleID.MemberOfMonth]: MemberOfMonthModule,
        [ModuleID.ProjectOfMonth]: ProjectOfMonthModule,
        [ModuleID.Alerts]: AlertsModule,
        [ModuleID.Mentors]: MentorsModule,
    
        // Personal Dashboard Modules
        [ModuleID.SignInOut]: SignInOutModule,
        [ModuleID.Messages]: MessagesModule,
        [ModuleID.Stats]: StatsModule,
        [ModuleID.PersonalKudos]: PersonalKudosModule,
        [ModuleID.Feedback]: FeedbackModule,
        [ModuleID.Help]: HelpModule
    };

    // Type guard for ModuleID
    function isModuleId(id: string): id is ModuleID {
        return Object.values(ModuleID).includes(id as ModuleID);
    }

    // Drag and drop state management
    // - draggedModuleId: Tracks which module is being moved
    // - dragStartPosition: Initial mouse position for calculating movement
    // - isDragging: Prevents other interactions during drag
    let draggedModuleId: ModuleID | null = null;
    let dragStartPosition: { x: number, y: number } | null = null;
    let isDragging = false;

    // Grid cell size state
    let cellWidth = 0;
    let cellHeight = 0;

    // Calculate grid cell size on mount and window resize
    function updateGridCellSize() {
        if (typeof window !== 'undefined') {
            const availableHeight = window.innerHeight - GRID_GAP * 2 - 48; // Account for footer
            cellWidth = (window.innerWidth - (GRID_COLS + 1) * GRID_GAP) / GRID_COLS;
            cellHeight = (availableHeight - (GRID_ROWS - 1) * GRID_GAP) / GRID_ROWS;
        }
    }

    // Grid configuration
    // Using a 6x6 grid to allow for flexible module layouts:
    // - Small modules: 1x1 (alerts, mentors)
    // - Medium modules: 2x1 (member search), 1x2 (recent kudos)
    // - Large modules: 2x2 (recognition), 3x2 (active members)
    const GRID_COLS = 8;
    const GRID_ROWS = 8;
    const GRID_GAP = 24; // pixels between grid cells

    // Handle module move start
    function handleMoveStart(event: CustomEvent) {
        if (!$dashboardStore.isEditMode) return;
        
        const { moduleId, event: mouseEvent } = event.detail;
        draggedModuleId = moduleId as ModuleID;
        dragStartPosition = {
            x: mouseEvent.clientX,
            y: mouseEvent.clientY
        };
        isDragging = true;
        
        // Add move event listeners and set styles with SSR check
        if (typeof window !== 'undefined') {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMoveEnd);

            // Prevent text selection during drag
            if (typeof document !== 'undefined') {
                document.body.style.userSelect = 'none';
                document.body.style.cursor = 'move';
            }
        }
    }

    // Clean up move event listeners and styles
    function handleMoveEnd() {
        if (!isDragging) return;

        isDragging = false;
        draggedModuleId = null;
        dragStartPosition = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMoveEnd);

        // Reset styles with SSR check
        if (typeof document !== 'undefined') {
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        }
    }

    // Handle module movement on the grid
    function handleMouseMove(event: MouseEvent) {
        if (!isDragging || !draggedModuleId || !dragStartPosition) return;
        if (cellWidth <= 0 || cellHeight <= 0) return;

        // Calculate mouse movement delta
        const deltaX = event.clientX - dragStartPosition.x;
        const deltaY = event.clientY - dragStartPosition.y;

        // Get current module position and size
        const draggedModule = $dashboardStore.layout[draggedModuleId];
        const currentPosition = draggedModule.position;

        // Convert pixel movement to grid cells
        const newX = Math.max(0, Math.min(GRID_COLS - currentPosition.width,
            Math.round(currentPosition.x + deltaX / cellWidth)));
        const newY = Math.max(0, Math.min(GRID_ROWS - currentPosition.height,
            Math.round(currentPosition.y + deltaY / cellHeight)));

        // Only proceed if position has changed
        if ((newX !== currentPosition.x || newY !== currentPosition.y) &&
            Number.isFinite(newX) && Number.isFinite(newY)) {

            // Check for collisions with other modules
            const newLayout = { ...$dashboardStore.layout };
            const draggedArea = {
                x: newX,
                y: newY,
                width: currentPosition.width,
                height: currentPosition.height
            };

            // Move other modules out of the way
            Object.entries(newLayout).forEach(([id, module]: [string, ModuleState]) => {
                if (id === draggedModuleId) return;

                const moduleArea = module.position;
                if (hasOverlap(draggedArea, moduleArea)) {
                    // Calculate new position for overlapped module
                    const direction = getDisplacementDirection(draggedArea, moduleArea);
                    const newPosition = calculateNewPosition(moduleArea, direction, newLayout);
                    
                    if (newPosition) {
                        newLayout[id] = {
                            ...module,
                            position: newPosition
                        };
                    }
                }
            });

            // Update dragged module position
            newLayout[draggedModuleId] = {
                ...draggedModule,
                position: {
                    ...currentPosition,
                    x: newX,
                    y: newY
                }
            };

            // Update all positions at once
            Object.entries(newLayout).forEach(([id, module]) => {
                dashboardStore.updateModulePosition(id as ModuleID, module.position);
            });

            dragStartPosition = {
                x: event.clientX,
                y: event.clientY
            };
        }
    }

    // Helper functions for collision detection and module displacement
    function hasOverlap(area1: ModulePosition, area2: ModulePosition): boolean {
        return !(
            area1.x + area1.width <= area2.x ||
            area1.x >= area2.x + area2.width ||
            area1.y + area1.height <= area2.y ||
            area1.y >= area2.y + area2.height
        );
    }

    function getDisplacementDirection(draggedArea: ModulePosition, moduleArea: ModulePosition) {
        const centerDraggedX = draggedArea.x + draggedArea.width / 2;
        const centerDraggedY = draggedArea.y + draggedArea.height / 2;
        const centerModuleX = moduleArea.x + moduleArea.width / 2;
        const centerModuleY = moduleArea.y + moduleArea.height / 2;

        const dx = centerModuleX - centerDraggedX;
        const dy = centerModuleY - centerDraggedY;

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        }
        return dy > 0 ? 'down' : 'up';
    }

    function calculateNewPosition(
        moduleArea: ModulePosition,
        direction: string,
        layout: DashboardLayout
    ): ModulePosition | null {
        const newPosition = { ...moduleArea };

        switch (direction) {
            case 'right':
                newPosition.x = moduleArea.x + 1;
                break;
            case 'left':
                newPosition.x = moduleArea.x - 1;
                break;
            case 'down':
                newPosition.y = moduleArea.y + 1;
                break;
            case 'up':
                newPosition.y = moduleArea.y - 1;
                break;
        }

        // Check if new position is within grid bounds
        if (newPosition.x < 0 || newPosition.x + moduleArea.width > GRID_COLS ||
            newPosition.y < 0 || newPosition.y + moduleArea.height > GRID_ROWS) {
            return null;
        }

        // Check if new position overlaps with any other modules
        for (const [id, module] of Object.entries(layout) as [string, ModuleState][]) {
            if (id !== draggedModuleId && hasOverlap(newPosition, module.position)) {
                return null;
            }
        }

        return newPosition;
    }

    // Resize state management
    let resizeModuleId: ModuleID | null = null;
    let resizeStartPosition: { x: number, y: number } | null = null;
    let resizeStartDimensions: { width: number, height: number } | null = null;
    let isResizing = false;

    // Handle module resize start
    function handleResize(event: CustomEvent) {
        if (!$dashboardStore.isEditMode) return;
        
        const { moduleId, event: mouseEvent } = event.detail;
        const module = $dashboardStore.layout[moduleId as ModuleID];
        if (!module) return;

        resizeModuleId = moduleId as ModuleID;
        resizeStartPosition = {
            x: mouseEvent.clientX,
            y: mouseEvent.clientY
        };
        resizeStartDimensions = {
            width: module.position.width,
            height: module.position.height
        };
        isResizing = true;

        // Add resize event listeners
        if (typeof window !== 'undefined') {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);

            // Prevent text selection during resize
            if (typeof document !== 'undefined') {
                document.body.style.userSelect = 'none';
                document.body.style.cursor = 'se-resize';
            }
        }
    }

    // Handle module resize movement
    function handleResizeMove(event: MouseEvent) {
        if (!isResizing || !resizeModuleId || !resizeStartPosition || !resizeStartDimensions) return;
        if (cellWidth <= 0 || cellHeight <= 0) return;

        // Calculate size change in grid cells
        const deltaX = event.clientX - resizeStartPosition.x;
        const deltaY = event.clientY - resizeStartPosition.y;
        
        // Get current module position
        const currentModule = $dashboardStore.layout[resizeModuleId];
        const currentX = currentModule.position.x;
        const currentY = currentModule.position.y;

        // Calculate new dimensions while ensuring module stays within grid
        const newWidth = Math.max(1, Math.round(resizeStartDimensions.width + deltaX / cellWidth));
        const newHeight = Math.max(1, Math.round(resizeStartDimensions.height + deltaY / cellHeight));

        // Only allow resize if module would stay within grid bounds
        if (currentX + newWidth > GRID_COLS || currentY + newHeight > GRID_ROWS) {
            return;
        }

        // Update module size if changed
        if (newWidth !== resizeStartDimensions.width ||
            newHeight !== resizeStartDimensions.height) {
            dashboardStore.resizeModule(resizeModuleId, {
                width: newWidth,
                height: newHeight
            });
        }
    }

    // Clean up resize event listeners
    function handleResizeEnd() {
        if (!isResizing) return;

        isResizing = false;
        resizeModuleId = null;
        resizeStartPosition = null;
        resizeStartDimensions = null;

        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);

        // Reset styles
        if (typeof document !== 'undefined') {
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        }
    }

    // Module state management
    let memberOverviewConfig: ModuleConfig | null = null;
    let memberOverviewOnBack: (() => void) | undefined = undefined;
    let todayEventsConfig: ModuleConfig | null = null;

    function handleModuleUpdate(event: CustomEvent<{ moduleId: ModuleID; title: string; onBack?: () => void }>) {
        if (event.detail.moduleId === ModuleID.MemberOverview) {
            const { title, onBack } = event.detail;
            memberOverviewConfig = { ...$moduleConfigs[ModuleID.MemberOverview], title };
            memberOverviewOnBack = onBack;
        } else if (event.detail.moduleId === ModuleID.TodayEvents) {
            const { title } = event.detail;
            todayEventsConfig = { ...$moduleConfigs[ModuleID.TodayEvents], title };
        }
    }

    // Handle module expand/collapse
    function handleToggleExpand(event: CustomEvent) {
        if ($dashboardStore.isEditMode) return;
        
        const { moduleId } = event.detail;
        dashboardStore.toggleExpand(moduleId as ModuleID);
    }

    // Initialize grid and set up event listeners
    onMount(() => {
        // Initial grid cell size calculation
        updateGridCellSize();

        // Handle window resize
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', updateGridCellSize);
        }

        // Clean up event listeners on component destroy
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('resize', updateGridCellSize);
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMoveEnd);
            }
        };
    });

    // Handle clicks on the dashboard background to close expanded modules
    function handleDashboardClick(event: MouseEvent) {
        // Only handle clicks on the dashboard background when a module is expanded
        if (event.target === event.currentTarget && Object.values($dashboardStore.layout).some(m => m.isExpanded)) {
            // Find and collapse all expanded modules
            Object.entries($dashboardStore.layout).forEach(([id, module]) => {
                if (module.isExpanded) {
                    dashboardStore.toggleExpand(id as ModuleID);
                }
            });
        }
    }
</script>

<div
    class="dashboard"
    class:edit-mode={$dashboardStore.isEditMode}
    class:has-expanded={Object.values($dashboardStore.layout).some(m => m.isExpanded)}
    class:help-mode={$dashboardStore.isHelpMode}
    on:click={handleDashboardClick}
>
    {#if $dashboardStore.currentView === DashboardView.Personal && selectedMember}
        <div class="dashboard-header">
            <button
                class="back-button"
                on:click={() => dashboardStore.switchView(DashboardView.Main)}
            >
                ← Back to Main Dashboard
            </button>
            <div class="member-info">
                {#if selectedMember.headshot}
                    <img
                        src={selectedMember.headshot}
                        alt={selectedMember.name}
                        class="member-avatar"
                    />
                {/if}
                <div class="member-details">
                    <h1>{selectedMember.name}</h1>
                    <div class="member-stats">
                        <div class="stat">
                            <span class="label">Forge Level</span>
                            <span class="value">{selectedMember.forgeLevel || 1}</span>
                        </div>
                        <div class="stat">
                            <span class="label">Status</span>
                            <span class="value status" class:active={selectedMember.isActive}>
                                {selectedMember.isActive ? 'Signed In' : 'Signed Out'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}
    <div
        class="dashboard-grid"
            style="
                --grid-cols: {GRID_COLS};
                --grid-rows: {GRID_ROWS};
                --grid-gap: {GRID_GAP}px;
            "
        >
            {#each Object.entries($dashboardStore.layout) as [moduleId, moduleState]}
            {@const config = $moduleConfigs[moduleId as ModuleID]}
            {@const moduleConfig = moduleId === ModuleID.MemberOverview
                ? { ...config, title: memberOverviewConfig?.title || config.title }
                : moduleId === ModuleID.TodayEvents
                ? { ...config, title: todayEventsConfig?.title || config.title }
                : config}
            <BaseModule
                config={moduleConfig}
                position={moduleState.position}
                isEditMode={$dashboardStore.isEditMode}
                isExpanded={moduleState.isExpanded}
                on:move={handleMoveStart}
                on:resize={handleResize}
                on:toggle-expand={handleToggleExpand}
                onBack={moduleId === ModuleID.MemberOverview ? memberOverviewOnBack : undefined}
            >
                {#if moduleContent[moduleId as ModuleID]}
                    <svelte:component
                        this={moduleContent[moduleId as ModuleID]}
                        {config}
                        isExpanded={moduleState.isExpanded}
                        on:update={(e: CustomEvent<{ title: string; onBack?: () => void }>) => handleModuleUpdate({ ...e, detail: { ...e.detail, moduleId: moduleId as ModuleID } })}
                    />
                {:else}
                    <div class="module-placeholder">
                        <p>No content for {config.title}</p>
                    </div>
                {/if}
            </BaseModule>
        {/each}
    </div>
</div>

<style>
    .dashboard {
        height: calc(100% - var(--footer-height));
        width: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
        background: #ececec;
        padding-bottom: var(--grid-gap);
    }

    /* Overlay when a module is expanded */
    .dashboard.has-expanded::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 100;
        animation: fadeIn 0.2s ease;
        cursor: pointer;
        pointer-events: auto;
    }

    /* Ensure expanded modules appear above the overlay */
    .dashboard.has-expanded :global(.module.expanded) {
        z-index: 101;
        pointer-events: auto;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .dashboard.edit-mode .dashboard-grid {
        background: rgba(0, 0, 0, 0.05);
        border: 2px dashed #ccc;
    }

    /* Grid layout system */
    .dashboard-grid {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(var(--grid-cols), minmax(0, 1fr));
        grid-template-rows: repeat(var(--grid-rows), minmax(0, 1fr));
        gap: var(--grid-gap);
        padding: var(--grid-gap);
        position: relative;
        transition: all 0.3s ease;
        width: 100%;
        height: auto;
        min-height: 100%;
        margin-bottom: var(--footer-height);
        overflow: visible;
        pointer-events: all;
    }

    .dashboard-grid > :global(*) {
        pointer-events: all;
    }

    .module-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #666;
        font-style: italic;
        text-align: center;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
    }

    .dashboard-header {
        background: white;
        padding: 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .back-button {
        align-self: flex-start;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.5rem;
        background: #f5f5f5;
        color: #666;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .back-button:hover {
        background: #e0e0e0;
        transform: translateY(-1px);
    }

    .member-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        min-height: 60px;
    }

    .member-avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        object-fit: cover;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .member-details {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .member-details h1 {
        margin: 0;
        font-size: 1.5rem;
        color: #333;
    }

    .member-stats {
        display: flex;
        gap: 2rem;
        margin-right: 1rem;
    }

    .stat {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .stat .label {
        font-size: 0.875rem;
        color: #666;
    }

    .stat .value {
        font-size: 1rem;
        font-weight: 500;
        color: #333;
        padding: 0.25rem 0.75rem;
        background: #f5f5f5;
        border-radius: 1rem;
    }

    .stat .value.status {
        color: #666;
    }

    .stat .value.status.active {
        color: white;
        background: #4CAF50;
    }
</style>
