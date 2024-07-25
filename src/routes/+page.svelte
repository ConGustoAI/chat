<script lang="ts">

	export let data;
	console.log('data', data);
</script>


<form method="POST" action="auth/?/logout">
	<button>Log out</button>
</form>

<pre>{JSON.stringify(data, null, 2)}</pre>
