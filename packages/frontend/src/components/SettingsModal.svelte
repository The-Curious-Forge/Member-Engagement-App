<script lang="ts">
    import { dashboardStore, dashboardSettings, moduleConfigs } from '../stores/dashboardStore';
    import { ModuleID } from '../types/dashboard';
    import SystemAlertsSection from './SystemAlertsSection.svelte';
    export let isOpen = false;

    let selectedModuleForEdit: ModuleID | null = null;
    let helpTextInput = '';
    let maintenanceMessageInput = '';

    function handleClose() {
        isOpen = false;
        selectedModuleForEdit = null;
    }

    function startEditMode() {
        dashboardStore.toggleEditMode();
        isOpen = false;
    }

    function toggleMaintenanceMode(moduleId: ModuleID) {
        dashboardSettings.toggleMaintenanceMode(moduleId);
    }

    function startEditingModule(moduleId: ModuleID) {
        selectedModuleForEdit = moduleId;
        const config = $moduleConfigs[moduleId];
        helpTextInput = config.helpContent || '';
        maintenanceMessageInput = config.maintenanceMessage || 'Coming Soon';
    }

    function saveModuleSettings() {
        if (!selectedModuleForEdit) return;
        
        dashboardSettings.updateHelpText(selectedModuleForEdit, helpTextInput);
        dashboardSettings.updateMaintenanceMessage(selectedModuleForEdit, maintenanceMessageInput);
        selectedModuleForEdit = null;
    }

    function cancelEdit() {
        selectedModuleForEdit = null;
        helpTextInput = '';
        maintenanceMessageInput = '';
    }

    function resetModuleSettings(moduleId: ModuleID) {
        dashboardSettings.resetModuleSettings(moduleId);
        if (selectedModuleForEdit === moduleId) {
            selectedModuleForEdit = null;
        }
    }

    // Get all modules for the current view
    $: currentModules = Object.values($moduleConfigs).filter(config => {
        // Filter based on current dashboard view
        const isPersonalModule = [
            ModuleID.SignInOut,
            ModuleID.Messages,
            ModuleID.Stats,
            ModuleID.PersonalKudos,
            ModuleID.Feedback,
            ModuleID.Help
        ].includes(config.id as ModuleID);
        
        // Show all modules for now - could be filtered by current view
        return true;
    });
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

            <section class="settings-section">
                <h3>Module Settings</h3>
                {#if selectedModuleForEdit}
                    <div class="module-edit-form">
                        <h4>Editing: {$moduleConfigs[selectedModuleForEdit]?.title}</h4>
                        
                        <div class="form-group">
                            <label for="help-text">Help Text:</label>
                            <textarea
                                id="help-text"
                                bind:value={helpTextInput}
                                placeholder="Enter help text for this module..."
                                rows="3"
                            ></textarea>
                        </div>

                        <div class="form-group">
                            <label for="maintenance-message">Maintenance Message:</label>
                            <input
                                type="text"
                                id="maintenance-message"
                                bind:value={maintenanceMessageInput}
                                placeholder="Coming Soon"
                            />
                        </div>

                        <div class="form-actions">
                            <button class="save-button" on:click={saveModuleSettings}>Save</button>
                            <button class="cancel-button" on:click={cancelEdit}>Cancel</button>
                        </div>
                    </div>
                {:else}
                    <div class="modules-list">
                        {#each currentModules as module}
                            <div class="module-item" class:maintenance={module.isInMaintenance}>
                                <div class="module-info">
                                    <h4>{module.title}</h4>
                                    <p class="module-status">
                                        {#if module.isInMaintenance}
                                            <span class="status-badge maintenance">Maintenance Mode</span>
                                        {:else}
                                            <span class="status-badge active">Active</span>
                                        {/if}
                                    </p>
                                </div>
                                <div class="module-controls">
                                    <button
                                        class="control-btn edit-btn"
                                        on:click={() => startEditingModule(module.id as ModuleID)}
                                        title="Edit module settings"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        class="control-btn toggle-btn"
                                        class:maintenance={module.isInMaintenance}
                                        on:click={() => toggleMaintenanceMode(module.id as ModuleID)}
                                        title={module.isInMaintenance ? 'Disable maintenance mode' : 'Enable maintenance mode'}
                                    >
                                        {module.isInMaintenance ? '🔓' : '🔧'}
                                    </button>
                                    <button
                                        class="control-btn reset-btn"
                                        on:click={() => resetModuleSettings(module.id as ModuleID)}
                                        title="Reset to defaults"
                                    >
                                        🔄
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
                <p class="help-text">
                    Toggle maintenance mode to show "Coming Soon" overlay. Edit help text and maintenance messages for each module.
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
        visibility: hidden;
        transition: opacity 0.2s ease, visibility 0.2s ease;
    }

    .modal-overlay.visible {
        opacity: 1;
        pointer-events: auto;
        visibility: visible;
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

    .modules-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

    .module-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #f9f9f9;
        transition: all 0.2s ease;
    }

    .module-item.maintenance {
        background: #f5f5f5;
        border-color: #ccc;
        opacity: 0.8;
    }

    .module-info h4 {
        margin: 0 0 0.25rem;
        font-size: 1rem;
        color: #333;
    }

    .module-status {
        margin: 0;
        font-size: 0.8rem;
    }

    .status-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .status-badge.active {
        background: #e8f5e8;
        color: #2e7d2e;
    }

    .status-badge.maintenance {
        background: #fff3cd;
        color: #856404;
    }

    .module-controls {
        display: flex;
        gap: 0.5rem;
    }

    .control-btn {
        width: 32px;
        height: 32px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        transition: all 0.2s ease;
    }

    .control-btn:hover {
        background: #f0f0f0;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .toggle-btn.maintenance {
        background: #fff3cd;
        border-color: #ffeaa7;
    }

    .module-edit-form {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 8px;
        border: 1px solid #e9ecef;
        margin-bottom: 1rem;
    }

    .module-edit-form h4 {
        margin: 0 0 1rem;
        color: #333;
        font-size: 1.1rem;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #555;
        font-size: 0.875rem;
    }

    .form-group textarea,
    .form-group input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.875rem;
        font-family: inherit;
        resize: vertical;
        transition: border-color 0.2s ease;
    }

    .form-group textarea:focus,
    .form-group input:focus {
        outline: none;
        border-color: #4CAF50;
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
    }

    .form-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
    }

    .save-button,
    .cancel-button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .save-button {
        background: #4CAF50;
        color: white;
    }

    .save-button:hover {
        background: #388E3C;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .cancel-button {
        background: #f0f0f0;
        color: #666;
        border: 1px solid #ddd;
    }

    .cancel-button:hover {
        background: #e5e5e5;
        color: #444;
    }
</style>