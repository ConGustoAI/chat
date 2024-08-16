<script lang="ts">
	import { goto } from '$app/navigation';

	export let data;

	console.log('page data', data);
	goto('/chat');
</script>

<!-- <form method="POST" action="auth/?/logout">
	<button>Log out</button>
</form> -->

<pre>{JSON.stringify(data, null, 2)}</pre>
