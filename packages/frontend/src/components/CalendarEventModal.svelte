<script lang="ts">
    import { fade } from 'svelte/transition';
    import type { CalendarEvent } from '../stores/appStore';
    import QRCode from 'qrcode-svg';
    import { onMount } from 'svelte';
    import { getStudioStatus } from '../utils/eventUtils';

    export let event: CalendarEvent;
    export let onClose: () => void;

    let qrCodeSvg: string | null = null;
    let eventUrl: string | null = null;

    function extractUrl(description: string | undefined): string | null {
        if (!description) return null;
        
        // Try to find URL in anchor tag first
        const anchorRegex = /<a href="([^"]+)">/;
        const anchorMatch = description.match(anchorRegex);
        if (anchorMatch) return anchorMatch[1];
        
        // If no anchor tag, look for plain URL
        const urlRegex = /https?:\/\/[^\s<>"]+/;
        const urlMatch = description.match(urlRegex);
        return urlMatch ? urlMatch[0] : null;
    }

    function formatEventTime(dateStr: string | undefined): string {
        if (!dateStr) return 'All Day';
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    }

    function getEventDuration(event: CalendarEvent): string {
        if (!event.start.dateTime || !event.end.dateTime) return 'All Day';
        
        const start = new Date(event.start.dateTime);
        const end = new Date(event.end.dateTime);
        const durationMs = end.getTime() - start.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours === 0) {
            return `${minutes}min`;
        } else if (minutes === 0) {
            return `${hours}hr`;
        } else {
            return `${hours}hr ${minutes}min`;
        }
    }

    function cleanDescription(text: string | undefined): string {
        if (!text) return '';

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;

        function processNode(node: Node) {
            if (node.nodeType === Node.TEXT_NODE) {
                // Clean text content
                const text = node.textContent || '';
                node.textContent = text
                    .replace(/#[\w-]+/g, '') // Remove hashtags
                    .replace(/https?:\/\/[^\s<>"]+/g, '') // Remove plain URLs
                    .replace(/\s+/g, ' ') // Clean up whitespace
                    .trim();
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                
                // Remove anchor tags
                if (element.tagName.toLowerCase() === 'a') {
                    element.remove();
                    return;
                }

                // Process child nodes
                Array.from(element.childNodes)
                    .forEach(child => processNode(child));
            }
        }

        // Process all nodes
        Array.from(tempDiv.childNodes).forEach(node => processNode(node));

        // Convert newlines to <br> tags
        let result = tempDiv.innerHTML;
        result = result.replace(/\n/g, '<br>');
        
        return result.trim();
    }

    function extractHashtags(text: string | undefined): string[] {
        if (!text) return [];
        const hashtagRegex = /#([\w-]+)/g;
        const matches = text.match(hashtagRegex) || [];
        return matches.map(tag => {
            const tagText = tag.slice(1); // Remove #
            return tagText.charAt(0).toUpperCase() + tagText.slice(1);
        });
    }

    onMount(() => {
        const url = extractUrl(event.description);
        if (url) {
            eventUrl = url;
            const qr = new QRCode({
                content: url,
                padding: 4,
                width: 200,
                height: 200,
                color: "#000000",
                background: "#ffffff",
                ecl: "M"
            });
            qrCodeSvg = qr.svg();
        }
    });
</script>

<div class="modal-backdrop" on:click|self={onClose} transition:fade>
    <div class="modal-content">
        <div class="event-header">
            <h2>{event.summary}</h2>
            <button class="close-button" on:click={onClose}>×</button>
        </div>
        
        <div class="modal-body">
            <div class="event-details">
                <div class="detail-row">
                    <span class="detail-label">When:</span>
                    <span class="detail-value">{formatEventTime(event.start.dateTime || event.start.date)}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">{getEventDuration(event)}</span>
                </div>

                {#if event.description}
                    <div class="description">
                        {#if event.description}
                            {@const cleanedDescription = cleanDescription(event.description)}
                            {#if cleanedDescription}
                                <div class="description-content">
                                    {@html cleanedDescription}
                                </div>
                            {/if}
                            {@const studioStatus = getStudioStatus(event)}
                            {#if studioStatus}
                                <div class="studio-notice" data-content={studioStatus.status}>
                                    {studioStatus.message}
                                </div>
                            {/if}
                        {/if}
                    </div>
                {/if}
            </div>

            {#if qrCodeSvg}
                <div class="qr-section">
                    <h3>See more details here</h3>
                    <div class="qr-code">
                        {@html qrCodeSvg}
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        width: 90%;
        max-width: 800px;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .event-header {
        background: #4CAF50;
        color: white;
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .event-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .close-button {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
        line-height: 1;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
    }

    .close-button:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .modal-body {
        display: flex;
        gap: 2rem;
        padding: 1.5rem;
    }

    .event-details {
        flex: 1;
    }

    .detail-row {
        display: flex;
        margin-bottom: 1rem;
        align-items: baseline;
    }

    .detail-label {
        font-weight: 600;
        color: #666;
        width: 100px;
        flex-shrink: 0;
    }

    .detail-value {
        color: #333;
    }

    .description {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid #eee;
    }

    .description-content {
        margin: 0 0 1rem 0;
        line-height: 1.5;
        color: #333;
    }

    .description-content :global(p) {
        margin: 0 0 1rem 0;
    }

    .description-content :global(br) {
        margin-bottom: 0.5rem;
    }

    .description-content :global(ul),
    .description-content :global(ol) {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
    }

    .description-content :global(li) {
        margin-bottom: 0.25rem;
    }

    .description-content :global(strong),
    .description-content :global(b) {
        font-weight: 600;
    }

    .description-content :global(em),
    .description-content :global(i) {
        font-style: italic;
    }

    .description-content :global(h1),
    .description-content :global(h2),
    .description-content :global(h3),
    .description-content :global(h4),
    .description-content :global(h5),
    .description-content :global(h6) {
        margin: 1rem 0 0.5rem;
        font-weight: 600;
        line-height: 1.2;
    }

    .description-content :global(h1) { font-size: 1.5rem; }
    .description-content :global(h2) { font-size: 1.3rem; }
    .description-content :global(h3) { font-size: 1.2rem; }
    .description-content :global(h4) { font-size: 1.1rem; }
    .description-content :global(h5) { font-size: 1rem; }
    .description-content :global(h6) { font-size: 0.9rem; }

    .description-content :global(code) {
        font-family: monospace;
        background: #f5f5f5;
        padding: 0.1em 0.3em;
        border-radius: 3px;
        font-size: 0.9em;
    }

    .description-content :global(pre) {
        background: #f5f5f5;
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
        margin: 1rem 0;
    }

    .description-content :global(blockquote) {
        border-left: 4px solid #e5e7eb;
        margin: 1rem 0;
        padding-left: 1rem;
        color: #4b5563;
    }

    .studio-notice {
        margin-top: 0.75rem;
        padding: 0.75rem;
        border-radius: 6px;
        font-size: 0.875rem;
        line-height: 1.4;
        font-weight: 500;
    }

    .studio-notice[data-content="studio is unavailable"] {
        background: #fee2e2;
        color: #dc2626;
        border: 1px solid #fecaca;
    }

    .studio-notice[data-content="studio is partially available"] {
        background: #fef3c7;
        color: #d97706;
        border: 1px solid #fde68a;
    }

    .studio-notice[data-content="studio is available"] {
        background: #dcfce7;
        color: #16a34a;
        border: 1px solid #bbf7d0;
    }

    .qr-section {
        width: 250px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        background: #f9f9f9;
        border-radius: 8px;
    }

    .qr-section h3 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        color: #333;
        text-align: center;
    }

    .qr-code {
        margin-bottom: 1rem;
    }

    .event-link {
        color: #4CAF50;
        text-decoration: none;
        font-weight: 500;
        padding: 0.5rem 1rem;
        border: 1px solid #4CAF50;
        border-radius: 4px;
        transition: all 0.2s;
    }

    .event-link:hover {
        background: #4CAF50;
        color: white;
    }

    @media (max-width: 640px) {
        .modal-content {
            width: 95%;
            margin: 1rem;
        }

        .modal-body {
            flex-direction: column;
        }

        .qr-section {
            width: 100%;
        }

        .detail-row {
            flex-direction: column;
        }

        .detail-label {
            width: auto;
            margin-bottom: 0.25rem;
        }
    }
</style>