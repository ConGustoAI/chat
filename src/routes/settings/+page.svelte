<script lang="ts">
	import type { PageData } from "./$types.js";
	// import ProfileForm from "./profile-form.svelte";

	export let data: PageData;
</script>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Profile</h3>
		<pre> {JSON.stringify(data, null, 2)} </pre>
		<!-- <p class="text-muted-foreground text-sm">This is how others will see you on the site.</p> -->
	</div>
	<div class="divider"></div>
	<!-- <ProfileForm data={data.form} /> -->
</div>