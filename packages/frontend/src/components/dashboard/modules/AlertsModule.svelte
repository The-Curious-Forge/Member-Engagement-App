<script lang="ts">
    import { activeAirtableAlerts, type AirtableAlert } from '../../../stores/appStore';
    import type { ModuleConfig } from '../../../types/dashboard';
    import QRCode from 'qrcode-svg';
    
    export let config: ModuleConfig;
    export let isExpanded: boolean;

    function convertMarkdownToHtml(text: string): string {
        // Convert line breaks
        let html = text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
        
        // Wrap in paragraphs if not already
        if (!html.startsWith('<p>')) {
            html = '<p>' + html;
        }
        if (!html.endsWith('</p>')) {
            html = html + '</p>';
        }
        
        // Convert bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return html;
    }

    function generateQRCode(url: string): string {
        const qr = new QRCode({
            content: url,
            padding: 0,
            width: 256,
            height: 256,
            color: "#000000",
            background: "#ffffff",
            ecl: "M"
        });
        const svg = qr.svg();
        // Add viewBox attribute to make the SVG scale properly
        return svg.replace('<svg', '<svg viewBox="0 0 256 256"');
    }

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

<div class="alerts-module">
    <div class="alerts-list">
        {#if $activeAirtableAlerts.length > 0}
            {#each $activeAirtableAlerts as alert}
                <div class="alert-item" class:warning={alert.type === 'warning'}>
                    <div class="alert-icon">
                        {#if alert.type === 'warning'}
                            ⚠️
                        {:else}
                            <span class="info-icon">ℹ</span>
                        {/if}
                    </div>
                    <div class="alert-content">
                        <div class="alert-main-content">
                            <div class="alert-message">
                                {@html convertMarkdownToHtml(alert.content || alert.message || '')}
                            </div>
                            <span class="alert-time">
                                {formatTime(alert.timestamp)}
                                {#if alert.expirationDate}
                                    • Expires {formatTime(alert.expirationDate)}
                                {/if}
                            </span>
                        </div>
                        <div class="alert-media">
                            {#if alert.attachment}
                                <div class="alert-attachment">
                                    <img src={alert.attachment} alt="Alert attachment" />
                                </div>
                            {/if}
                            {#if alert.qrLink}
                                <div class="alert-qr">
                                    <a href={alert.qrLink} target="_blank" rel="noopener noreferrer">
                                        {@html generateQRCode(alert.qrLink)}
                                    </a>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        {:else}
            <div class="no-alerts">
                <p>No active alerts</p>
            </div>
        {/if}
    </div>
</div>

<style>
    .alerts-module {
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 0;
        margin: 0;
    }

    .alerts-list {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        padding: 0;
        margin: 0;
    }

    :global(.alerts-module .content-wrapper) {
        padding: 0;
    }

    .alert-item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem;
        background: #FFFDE7;
        border-bottom: 1px solid rgba(251, 192, 45, 0.1);
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        width: 100%;
        box-sizing: border-box;
        margin: 0;
    }

    .alert-item:first-child {
        border-top-left-radius: 0.5rem;
        border-top-right-radius: 0.5rem;
    }

    .alert-item:last-child {
        border-bottom-left-radius: 0.5rem;
        border-bottom-right-radius: 0.5rem;
        border-bottom: none;
    }

    .alert-item:hover {
        background: #FFFEF2;
    }

    .alert-item.warning {
        background: #FFEBEE;
        border-bottom: 1px solid rgba(244, 67, 54, 0.1);
        color: #D32F2F;
    }

    .alert-item.warning:hover {
        background: #FFF1F2;
    }

    .alert-item.warning .alert-message {
        color: #D32F2F;
    }

    .alert-item.warning .alert-time {
        color: #E57373;
    }

    .alert-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        font-size: 1.25rem;
        line-height: 1;
    }

    .info-icon {
        color: #FBC02D;
        font-size: 1.5rem;
    }

    .alert-item.warning .info-icon {
        color: #D32F2F;
    }

    .alert-content {
        flex: 1;
        min-width: 0;
        display: flex;
        gap: 1rem;
        align-items: flex-start;
    }

    .alert-main-content {
        flex: 1;
        min-width: 0;
    }

    .alert-media {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        align-items: center;
        margin-left: auto;
        min-width: 120px;
    }

    .alert-item:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .alert-item.warning:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(255, 152, 0, 0.1);
    }

    .alert-message {
        margin: 0 0 0.375rem 0;
        font-size: 0.9375rem;
        color: #1a1a1a;
        line-height: 1.4;
        font-weight: 500;
    }

    .alert-message :global(a) {
        color: inherit;
        text-decoration: underline;
        text-decoration-thickness: 1px;
        text-underline-offset: 2px;
    }

    .alert-message :global(a:hover) {
        text-decoration-thickness: 2px;
        opacity: 0.8;
    }

    .alert-message :global(strong),
    .alert-message :global(b) {
        font-weight: 600;
    }

    .alert-message :global(em),
    .alert-message :global(i) {
        font-style: italic;
    }

    .alert-message :global(ul),
    .alert-message :global(ol) {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
    }

    .alert-message :global(li) {
        margin: 0.25rem 0;
    }

    .alert-message :global(code) {
        background: rgba(0, 0, 0, 0.05);
        padding: 0.125rem 0.25rem;
        border-radius: 3px;
        font-family: monospace;
        font-size: 0.875em;
    }

    .alert-message :global(p) {
        margin: 0.5rem 0;
    }

    .alert-message :global(p:first-child) {
        margin-top: 0;
    }

    .alert-message :global(p:last-child) {
        margin-bottom: 0;
    }

    .alert-attachment {
        width: 100px;
        height: 100px;
        border-radius: 0.5rem;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .alert-attachment img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .alert-qr {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
    }

    .alert-qr {
        width: 100px;
        height: 100px;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        box-sizing: border-box;
    }

    .alert-qr :global(svg) {
        width: 100%;
        height: 100%;
        display: block;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }

    .qr-link {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: #f5f5f5;
        border-radius: 0.25rem;
        color: #333;
        text-decoration: none;
        font-size: 0.75rem;
        transition: all 0.2s ease;
        white-space: nowrap;
    }

    .qr-link:hover {
        background: #e0e0e0;
        transform: translateY(-1px);
    }

    .alert-time {
        font-size: 0.8125rem;
        color: #666;
        font-weight: 400;
    }

    .no-alerts {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #666;
        font-style: italic;
        font-size: 0.9375rem;
    }
</style>