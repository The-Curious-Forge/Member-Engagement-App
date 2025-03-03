<script lang="ts">
    // No props or state needed for this static component
</script>

<div class="help-section">
    <h3>Help & FAQ</h3>
    <div class="faq-list">
        <div class="faq-item">
            <h4>How do I sign in?</h4>
            <p>Click the "Sign In" button in the left menu and then click "Sign In Now" to register your presence.</p>
        </div>
        <div class="faq-item">
            <h4>How do I send kudos?</h4>
            <p>Select "Send Kudos" from the menu, write your message, select one or more recipients, and click "Send Kudos".</p>
        </div>
        <div class="faq-item">
            <h4>What are points and how do I earn them?</h4>
            <p>Points are earned through various activities at The Curious Forge. You can earn points by attending classes, helping others, and participating in community events.</p>
        </div>
        <div class="faq-item">
            <h4>How do I view my messages?</h4>
            <p>Click "Your Messages" in the menu to see all messages. Unread messages appear at the top and can be marked as read.</p>
        </div>
        <div class="faq-item">
            <h4>Need more help?</h4>
            <p>Please ask a staff member for assistance with any questions not covered here.</p>
        </div>
    </div>
</div>

<style>
    .help-section {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    h3 {
        margin: 0;
        color: #333;
        font-size: 1.5rem;
    }

    .faq-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .faq-item {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .faq-item h4 {
        margin: 0 0 0.5rem 0;
        color: #333;
        font-size: 1.1rem;
    }

    .faq-item p {
        margin: 0;
        color: #666;
        line-height: 1.4;
    }
</style>