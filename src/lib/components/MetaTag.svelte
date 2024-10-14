<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';

	let {
		title,
		description = '',
		url = undefined,
	}: {
		title: string;
		description?: string;
		url?: string;
		image_url?: string;
		image_width?: number;
		image_height?: number;
	} = $props();
</script>

<MetaTags
	{title}
	{description}
	canonical={url}
	openGraph={{
		siteName: '👍 Congusto Chat',
		type: 'website',
		url: url,
		title: title,
		description: description
	}}
	twitter={{
		cardType: 'summary_large_image',
		title: title,
		description: description,
	}} />
