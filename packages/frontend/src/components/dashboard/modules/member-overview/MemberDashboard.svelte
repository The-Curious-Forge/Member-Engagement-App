<script lang="ts">
    import type { Member } from '../../../../stores/appStore';
    import type { ModuleConfig } from '../../../../types/dashboard';
    import SignInOutForm from './SignInOutForm.svelte';
    import MessagesView from './MessagesView.svelte';
    import StatsView from './StatsView.svelte';
    import KudosForm from './KudosForm.svelte';
    import HelpView from './HelpView.svelte';
    import BaseModule from '../../BaseModule.svelte';

    export let member: Member;
    export let onBack: () => void;

    // Module configurations
    const modules: Array<{
        id: string;
        title: string;
        component: any;
        position: { x: number; y: number; width: number; height: number };
        isExpandable: boolean;
    }> = [
        {
            id: 'sign-in-out',
            title: member.isActive ? 'Sign Out' : 'Sign In',
            component: SignInOutForm,
            position: { x: 0, y: 1, width: 2, height: 2 },
            isExpandable: true
        },
        {
            id: 'messages',
            title: 'Messages',
            component: MessagesView,
            position: { x: 2, y: 1, width: 2, height: 2 },
            isExpandable: true
        },
        {
            id: 'stats',
            title: 'Stats',
            component: StatsView,
            position: { x: 4, y: 1, width: 2, height: 1 },
            isExpandable: true
        },
        {
            id: 'kudos',
            title: 'Send Kudos',
            component: KudosForm,
            position: { x: 4, y: 2, width: 2, height: 2 },
            isExpandable: true
        },
        {
            id: 'help',
            title: 'Help',
            component: HelpView,
            position: { x: 0, y: 3, width: 2, height: 1 },
            isExpandable: false
        }
    ];

    // Grid configuration
    const GRID_COLS = 6;
    const GRID_ROWS = 4;
    const GRID_GAP = 16;

    function formatDate(date: Date | undefined): string {
        if (!date) return '';
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }
</script>

<div class="member-dashboard">
    <div class="dashboard-header">
        <button class="back-button" on:click={onBack}>
            ← Back to Members
        </button>
        <div class="member-info">
            {#if member.headshot}
                <img
                    src={member.headshot}
                    alt={member.name}
                    class="member-avatar"
                />
            {/if}
            <div class="member-details">
                <h2>{member.name}</h2>
                <div class="member-status">
                    {#if member.isActive}
                        <span class="status active">Signed In</span>
                        {#if member.currentArea}
                            <p class="current-area">Currently in: {member.currentArea}</p>
                        {/if}
                        {#if member.signInTime}
                            <p class="sign-in-time">Since {formatDate(member.signInTime)}</p>
                        {/if}
                    {:else}
                        <span class="status">Signed Out</span>
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <div 
        class="dashboard-grid"
        style="
            --grid-cols: {GRID_COLS};
            --grid-rows: {GRID_ROWS};
            --grid-gap: {GRID_GAP}px;
        "
    >
        {#each modules as moduleConfig}
            <BaseModule
                config={{
                    id: moduleConfig.id,
                    title: moduleConfig.title,
                    defaultSize: {
                        width: moduleConfig.position.width,
                        height: moduleConfig.position.height
                    },
                    defaultPosition: {
                        x: moduleConfig.position.x,
                        y: moduleConfig.position.y
                    },
                    isExpandable: moduleConfig.isExpandable
                }}
                position={moduleConfig.position}
                isEditMode={false}
            >
                <svelte:component 
                    this={moduleConfig.component}
                    {member}
                    onComplete={onBack}
                />
            </BaseModule>
        {/each}
    </div>
</div>

<style>
    .member-dashboard {
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        padding: 1.25rem;
        background: #f8f9fa00;
        position: relative;
    }

    .dashboard-header {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .back-button {
        align-self: flex-start;
        padding: 0.5rem 1rem;
        background: transparent;
        border: 1px solid transparent;
        color: #4CAF50;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border-radius: 6px;
        transition: all 0.2s ease;
    }

    .back-button:hover {
        color: #388E3C;
        background: rgba(76, 175, 80, 0.08);
        transform: translateX(-2px);
    }

    .member-info {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        padding: 1.5rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;
    }

    .member-info:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
    }

    .member-avatar {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s ease;
    }

    .member-info:hover .member-avatar {
        transform: scale(1.05);
    }

    .member-details {
        flex: 1;
    }

    h2 {
        margin: 0;
        color: #2c3e50;
        font-size: 1.5rem;
        font-weight: 600;
        letter-spacing: -0.01em;
    }

    .member-status {
        margin-top: 0.75rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
    }

    .status {
        display: inline-flex;
        align-items: center;
        padding: 0.35rem 1rem;
        border-radius: 2rem;
        background: #f0f0f0;
        font-size: 0.875rem;
        font-weight: 500;
        color: #666;
        border: 1px solid rgba(0, 0, 0, 0.05);
        transition: all 0.2s ease;
    }

    .status.active {
        background: #4CAF50;
        color: white;
        border-color: transparent;
        box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
    }

    .current-area {
        margin: 0;
        font-size: 0.9rem;
        color: #666;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .current-area::before {
        content: '•';
        color: #999;
    }

    .sign-in-time {
        margin: 0;
        font-size: 0.875rem;
        color: #4CAF50;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .sign-in-time::before {
        content: '•';
        color: #999;
    }

    .dashboard-grid {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(var(--grid-cols), 1fr);
        grid-template-rows: auto repeat(var(--grid-rows), 1fr);
        gap: var(--grid-gap);
        padding: var(--grid-gap);
        position: relative;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        width: 100%;
        height: 100%;
        min-height: 0;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(0, 0, 0, 0.08);
        animation: slideUp 0.4s ease-out;
    }

    @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 768px) {
        .dashboard-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
        }
    }
</style>