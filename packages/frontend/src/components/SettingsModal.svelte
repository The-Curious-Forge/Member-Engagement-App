<script lang="ts">
    import { dashboardStore } from '../stores/dashboardStore';
    import SystemAlertsSection from './SystemAlertsSection.svelte';
    export let isOpen = false;

    function handleClose() {
        isOpen = false;
    }

    function startEditMode() {
        dashboardStore.toggleEditMode();
        isOpen = false;
    }
</script>

<div class="modal-overlay" class:visible={isOpen} on:click={handleClose}>
    <div class="modal-content" on:click|stopPropagation>
        <div class="modal-header">
            <h2>Dashboard Settings</h2>
            <button class="close-button" on:click={handleClose}>&times;</button>
        </div>
        <div class="modal-body">
            <section class="settings-section">
                <h3>Layout</h3>
                <button
                    class="layout-button"
                    on:click={startEditMode}
                >
                    Edit Layout
                </button>
                <p class="help-text">
                    Customize your dashboard by rearranging and resizing modules.
                </p>
            </section>

            <SystemAlertsSection />
        </div>
    </div>
</div>

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
    }

    .modal-overlay.visible {
        opacity: 1;
        pointer-events: auto;
    }

    .modal-content {
        background: white;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translate(-50%, -50%) scale(0.95);
        transition: transform 0.2s ease;
        pointer-events: auto;
        position: fixed;
        top: 50%;
        left: 50%;
    }

    .modal-overlay.visible .modal-content {
        transform: translate(-50%, -50%) scale(1);
    }

    .modal-header {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #333;
    }

    .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #666;
        cursor: pointer;
        padding: 0.5rem;
        margin: -0.5rem;
        border-radius: 4px;
        transition: background-color 0.2s;
    }

    .close-button:hover {
        background-color: #f0f0f0;
    }

    .modal-body {
        padding: 1.5rem;
    }

    .settings-section {
        margin-bottom: 2rem;
    }

    .settings-section:last-child {
        margin-bottom: 0;
    }

    .settings-section h3 {
        margin: 0 0 1rem;
        font-size: 1rem;
        color: #333;
    }

    .layout-button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
        font-size: 0.875rem;
        background: #4CAF50;
        color: white;
        width: 100%;
        margin-bottom: 0.5rem;
    }

    .layout-button:hover {
        background: #388E3C;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .help-text {
        font-size: 0.875rem;
        color: #666;
        margin: 0;
        line-height: 1.4;
    }
</style>