<script>
	let { message } = $props();
</script>

{#if $message}
	<p class={$message.type === 'error' ? 'text-destructive' : 'text-success'}>
		{$message ? $message.text : ''}
	</p>
{/if}
