<script>
export let syncing = false;
export let disabled = false;
</script>

<svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class:syncing
    class:disabled
>
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 12c0-2.37.95-4.64 2.64-6.32C6.32 3.95 8.59 3 11 3c4.97 0 9 4.03 9 9M22 12c0 2.37-.95 4.64-2.64 6.32C17.68 20.05 15.41 21 13 21c-4.97 0-9-4.03-9-9"/>
</svg>

<style>
.syncing {
    animation: spin 1.5s linear infinite;
    transform-origin: center;
}

.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>