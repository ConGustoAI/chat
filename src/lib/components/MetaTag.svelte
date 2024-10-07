<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';

	let {
		title,
		description = "",
		url = undefined,
		image_url = undefined,
		image_width = 1200,
		image_height = 630
	}: {
		title: string;
		description?: string;
		url?: string;
		image_url?: string;
		image_width?: number;
		image_height?: number;
	} = $props();
	// export let article_published_time: string | undefined = undefined;
	// export let article_author: string | undefined = undefined;
	// export let article_publisher: string | undefined = undefined;

	// $: canonicalFallback = canonicalUrl + ($page.url.pathname !== '/' ? $page.url.pathname : '');
</script>

<!-- <svelte:head>
	{#if article_author}
		<meta property="article:author" content={article_author} />
	{/if}
	{#if article_publisher}
		<meta property="article:publisher" content={article_publisher} />
	{/if}
	{#if article_published_time}
		<meta property="article:published_time" content={article_published_time} />
	{/if}
</svelte:head> -->
<!-- canonical={canonical || canonicalFallback} -->
<MetaTags
	{title}
	{description}
	canonical={url}
	openGraph={{
		siteName: '👍 Congusto Chat',
		type: 'website',
		url: url,
		title: title,
		description: description,
		images: image_url
			? [
					{
						url: image_url,
						width: image_width,
						height: image_height
					}
				]
			: undefined
	}}
	twitter={image_url
		? {
				cardType: 'summary_large_image',
				title: title,
				description: description,
				image: image_url
			}
		: undefined} />
