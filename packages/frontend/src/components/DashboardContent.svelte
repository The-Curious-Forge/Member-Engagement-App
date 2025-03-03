<script lang="ts">
import { connected } from '../stores/socket';
import { onDestroy } from 'svelte';

</script>

<main class="dashboard-content">
    <!-- Main Content -->
    <div class="content">
        <slot />
    </div>
</main>

<style>
    .dashboard-content {
        flex: 1;
        overflow-y: auto;
        position: relative;
        height: calc(100vh - var(--footer-height));
        display: flex;
        flex-direction: column;
    }

    .content {
        width: 100%;
        height: 100%;
        flex: 1;
        display: flex;
        flex-direction: column;
    }
</style>