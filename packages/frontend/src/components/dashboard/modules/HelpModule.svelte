<script lang="ts">
    import type { ModuleConfig } from '../../../types/dashboard';

    export let config: ModuleConfig;
    export let isExpanded: boolean;

    const helpTopics = [
        {
            id: 'getting-started',
            title: 'Getting Started',
            icon: '🚀',
            url: '/help/getting-started'
        },
        {
            id: 'safety',
            title: 'Safety Guidelines',
            icon: '🛡️',
            url: '/help/safety'
        },
        {
            id: 'equipment',
            title: 'Equipment Guide',
            icon: '🔧',
            url: '/help/equipment'
        },
        {
            id: 'faq',
            title: 'FAQ',
            icon: '❓',
            url: '/help/faq'
        }
    ];

    function handleTopicClick(url: string) {
        // TODO: Implement navigation or modal open
        console.log('Navigate to:', url);
    }

    function handleContactSupport() {
        // TODO: Implement support contact
        console.log('Contact support');
    }
</script>

<div class="help-module">
    <div class="topics-grid">
        {#each helpTopics as topic}
            <button
                class="topic-button"
                on:click={() => handleTopicClick(topic.url)}
            >
                <span class="topic-icon">{topic.icon}</span>
                <span class="topic-title">{topic.title}</span>
            </button>
        {/each}
    </div>

    <button class="support-button" on:click={handleContactSupport}>
        <span class="support-icon">👋</span>
        <span>Contact Support</span>
    </button>
</div>

<style>
    .help-module {
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }

    .topics-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        flex: 1;
    }

    .topic-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: white;
        border: 1px solid #eee;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
    }

    .topic-button:hover {
        background: #f8f8f8;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    }

    .topic-icon {
        font-size: 1.5rem;
    }

    .topic-title {
        font-size: 0.8rem;
        font-weight: 500;
        color: #333;
        line-height: 1.2;
    }

    .support-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: #00BCD4;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.9rem;
    }

    .support-button:hover {
        background: #00ACC1;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 188, 212, 0.2);
    }

    .support-icon {
        font-size: 1.1rem;
    }
</style>