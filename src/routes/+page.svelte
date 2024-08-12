<script lang="ts">
	import { goto } from '$app/navigation';

	export let data;

	if (data.dbUser) {
		goto('/chat');
	} else {
		goto('/login');
	}

	// console.log('page data', data);
</script>

<!-- <form method="POST" action="auth/?/logout">
	<button>Log out</button>
</form> -->

<pre>{JSON.stringify(data, null, 2)}</pre>
