<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { ModuleConfig, ModulePosition } from '../../types/dashboard';
    
    export let config: ModuleConfig;
    export let position: ModulePosition;
    export let isEditMode: boolean = false;
    export let isExpanded: boolean = false;
    export let onBack: (() => void) | undefined = undefined;
    
    const dispatch = createEventDispatcher();
    let moduleElement: HTMLElement | null = null;
    let originalRect: DOMRect | null = null;

    // Store the module's original position when expanding
    function updateOriginalRect() {
        if (moduleElement) {
            originalRect = moduleElement.getBoundingClientRect();
        }
    }

    function handleMoveStart(event: MouseEvent) {
        if (!isEditMode) return;
        event.preventDefault();
        event.stopPropagation();
        dispatch('move', { moduleId: config.id, event });
    }
    
    function handleResize(event: MouseEvent) {
        if (!isEditMode) return;
        event.preventDefault();
        event.stopPropagation();
        dispatch('resize', { moduleId: config.id, event });
    }
    
    function handleToggleExpand(event: MouseEvent) {
        // Don't expand if in edit mode or module isn't expandable
        if (isEditMode || !config.isExpandable) return;
        
        // If it's a button click, stop propagation to prevent double-triggering
        const isButtonClick = (event.target as HTMLElement).closest('.control-button');
        if (isButtonClick) {
            event.stopPropagation();
        } else if (!isExpanded) {
            // Only update rect when expanding via module click
            updateOriginalRect();
        }
        
        dispatch('toggle-expand', { moduleId: config.id });
    }

    // Calculate transform values for smooth expansion
    $: transformStyle = (() => {
        if (!moduleElement || !originalRect) return '';
        
        if (isExpanded) {
            // Use 90% of viewport dimensions for expanded state
            const expandedWidth = window.innerWidth * 0.9;
            const expandedHeight = window.innerHeight * 0.9;
            
            // Calculate position to center the expanded module
            const targetX = (window.innerWidth - expandedWidth) / 2;
            const targetY = (window.innerHeight - expandedHeight) / 2;
            
            // Calculate translation to move from original position to target
            const translateX = targetX - originalRect.left;
            const translateY = targetY - originalRect.top;

            return `
                position: fixed;
                width: ${expandedWidth}px;
                height: ${expandedHeight}px;
                transform: translate(${translateX}px, ${translateY}px);
            `;
        }
        
        // Reset all properties when collapsed
        return `
            position: relative;
            width: 100%;
            height: 100%;
            transform: none;
        `;
    })();

    $: gridArea = `${position.y + 1} / ${position.x + 1} / span ${position.height} / span ${position.width}`;
    
    // Update module classes when state changes
    $: moduleClasses = [
        'module',
        isEditMode && 'edit-mode',
        isExpanded && 'expanded',
        config.isExpandable && 'expandable'
    ].filter(Boolean).join(' ');
</script>

<div
    class={moduleClasses}
    style="
        grid-area: {gridArea};
        {transformStyle}
        {config.styles?.background ? `background: ${config.styles.background};` : ''}
        {config.styles?.border ? `border: ${config.styles.border};` : ''}
    "
    data-module-id={config.id}
    on:mousedown={handleMoveStart}
    bind:this={moduleElement}
>
    <div
        class="module-header"
        style="
            {config.styles?.headerBackground ? `background: ${config.styles.headerBackground};` : ''}
            {config.styles?.headerTextColor ? `color: ${config.styles.headerTextColor};` : ''}
        "
        on:click={handleToggleExpand}
    >
        <h3 style={config.styles?.headerTextColor ? `color: ${config.styles.headerTextColor};` : ''}>
            {@html config.title}
        </h3>
        <div class="module-controls">
            {#if onBack}
                <button
                    class="control-button back-button"
                    on:click={onBack}
                    title="Back"
                >
                    ← Back
                </button>
            {/if}
            {#if !isEditMode && config.isExpandable}
                <button
                    class="control-button expand-toggle"
                    on:click={handleToggleExpand}
                    title={isExpanded ? 'Collapse' : 'See More'}
                >
                    {isExpanded ? '×' : 'See More'}
                </button>
            {/if}
        </div>
    </div>
    
    <div class="module-content" class:edit-mode={isEditMode}>
        <div class="scroll-container">
            <div class="content-wrapper">
                <slot />
            </div>
        </div>
    </div>

    {#if isEditMode}
        <div
            class="resize-handle"
            on:mousedown={handleResize}
            title="Drag to resize"
        />
    {/if}
</div>

<style>
    .module {
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        height: 100%;
        max-height: 100%;
        min-height: 0;
        position: relative;
        border: 1px solid rgba(0, 0, 0, 0.08);
        align-self: stretch;
        justify-self: stretch;
        transition: all 0.2s ease;
    }

    /* Header hover effects for expandable modules */
    .module.expandable:not(.edit-mode):not(.expanded) .module-header {
        cursor: pointer;
    }

    .module.expandable:not(.edit-mode):not(.expanded) .module-header:hover {
        background: linear-gradient(120deg, #f0f1f2 0%, #f8f9fa 100%);
        transform: translateY(-1px);
    }
    
    .module.edit-mode {
        cursor: move;
        border: 2px solid transparent;
    }
    
    .module.edit-mode:hover {
        border-color: #4CAF50;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    /* Floating effect during drag */
    .module.edit-mode:active {
        transform: scale(1.02);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        z-index: 10;
    }
    
    .module.expanded {
        z-index: 200;
        position: fixed !important;
        top: 50%;
        left: 50%;
        transform: translate(-50%, calc(-50% - var(--footer-height) / 2)) !important;
        background: #ffffff;
        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
        pointer-events: auto;
        border: 1px solid rgba(0, 0, 0, 0.1);
        opacity: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        width: 90% !important;
        height: calc(90vh - var(--footer-height)) !important;
        margin-bottom: var(--footer-height);
        border-radius: 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .module.expanded .module-content {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .module.expanded .scroll-container {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    }

    .module.expanded .content-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    /* Ensure expanded module is clickable above overlay */
    .module.expanded .module-content {
        pointer-events: auto;
    }
    
    .module-header {
        display: flex;
        align-items: center;
        padding: 1rem 1.25rem;
        background: #f8f9fa;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        user-select: none;
        position: relative;
        overflow: hidden;
    }

    /* Add subtle shine effect to header */
    .module-header::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 50%;
        height: 100%;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
        );
        animation: shine 8s infinite;
    }

    @keyframes shine {
        0% { left: -100%; }
        20% { left: 200%; }
        100% { left: 200%; }
    }
    
    .module-header h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        flex: 1;
        color: #2c3e50;
        letter-spacing: -0.01em;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .module-header h3 :global(.status-text) {
        font-size: 0.9rem;
        font-weight: normal;
        color: #666;
    }

    .module-header h3 :global(.status-text.active) {
        color: #4CAF50;
    }

    .module-controls {
        display: flex;
        gap: 0.75rem;
    }
    
    .control-button {
        background: #f0f0f0;
        border: 1px solid #e0e0e0;
        padding: 0.5rem 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        font-size: 0.875rem;
        color: #666;
        font-weight: 500;
    }

    .control-button:hover {
        background: #e5e5e5;
        border-color: #d0d0d0;
        transform: translateY(-1px);
        color: #444;
    }

    .control-button.back-button {
        background: transparent;
        color: #666;
        border-color: transparent;
    }

    .control-button.back-button:hover {
        color: #ad4c02;
    }

    .control-button.expand-toggle {
        min-width: 80px;
    }

    .module.expanded .control-button.expand-toggle {
        min-width: unset;
        width: 32px;
        height: 32px;
        padding: 0;
        border-radius: 8px;
        font-size: 1.25rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f0f0f0;
        border: 1px solid #e0e0e0;
        color: #666;
        transition: all 0.2s ease;
    }

    .module.expanded .control-button.expand-toggle:hover {
        background: #e5e5e5;
        color: #333;
        transform: scale(1.05);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .module-content {
        flex: 1;
        position: relative;
        min-height: 0;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .scroll-container {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        min-height: 0;
    }

    .content-wrapper {
        padding: 1.25rem;
        color: #333;
        line-height: 1.5;
        letter-spacing: -0.01em;
    }

    /* Grey out content in edit mode */
    .module-content.edit-mode {
        opacity: 0.5;
        pointer-events: none;
        filter: grayscale(40%);
    }

    /* Expanded module content */
    .module.expanded .module-content {
        height: calc(100% - 3.5rem); /* Account for header in expanded state */
    }

    .module.expanded .scroll-container {
        height: 100%;
    }

    .module.expanded .content-wrapper {
        padding: 1.5rem 2rem;
        font-size: 1rem;
        min-height: 100%;
    }

    .module-header {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform-origin: 0 0;
        will-change: transform, padding;
        position: relative;
    }

    .module.expanded .module-header {
        padding: 1.5rem 2rem;
        background: #f8f9fa;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 4rem;
    }

    .module.expanded .module-header h3 {
        font-size: 1.5rem;
        color: #333;
        font-weight: 600;
        letter-spacing: -0.01em;
        margin: 0;
        flex: 1;
    }

    .module.expanded .module-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    
    .scroll-container::-webkit-scrollbar {
        width: 6px;
    }
    
    .scroll-container::-webkit-scrollbar-track {
        background: transparent;
    }
    
    .scroll-container::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        transition: background 0.2s ease;
    }
    
    .scroll-container::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.2);
    }

    .module.expanded .scroll-container::-webkit-scrollbar {
        width: 8px;
    }

    .module.expanded .scroll-container::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.15);
    }

    .module.expanded .scroll-container::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.25);
    }

    /* Resize handle in corner */
    .resize-handle {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 20px;
        height: 20px;
        cursor: se-resize;
        background: linear-gradient(135deg, transparent 50%, #4CAF50 50%);
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    .module.edit-mode:hover .resize-handle {
        opacity: 0.7;
    }

    .resize-handle:hover {
        opacity: 1 !important;
    }
</style>