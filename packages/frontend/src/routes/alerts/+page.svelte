<script lang="ts">
import { goto } from '$app/navigation';
import { onMount } from 'svelte';

onMount(() => {
    // Redirect to home page since alerts are now handled in the settings modal and alerts module
    goto('/');
});
</script>

<div>Redirecting...</div>