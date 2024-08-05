<script lang="ts">
	import 'katex/dist/katex.min.css';
	import 'highlight.js/styles/github-dark.min.css';
	import { Computer, Smile, type IconProps } from 'lucide-svelte';

	import rehypeStringify from 'rehype-stringify';
	import remarkParse from 'remark-parse';
	import remarkRehype from 'remark-rehype';
	import remarkMath from 'remark-math';
	import rehypeKatex from 'rehype-katex';
	import { unified } from 'unified';
	import rehypeHighlight from 'rehype-highlight';

	export let conversation: ConversationInterface;
	export let displayStyle: 'markdown' | 'markdown+' | 'raw';

	import { visit } from 'unist-util-visit';
	import type { Element, Root } from 'hast';

	import { h, s } from 'hastscript';

	function rehypeClickFormulas() {
		return function (tree: Root) {
			visit(tree, 'element', function (node) {
				if (
					node.tagName === 'code' &&
					node.properties.className &&
					Array.isArray(node.properties.className) &&
					(node.properties.className.includes('math-display') || node.properties.className.includes('math-inline')) &&
					!node.properties.className.includes('click-formula')
				) {
					const isMathInline = node.properties.className?.includes('math-inline');

					console.log(JSON.stringify(node, null, 2));
					const newChildren = [
						// @ts-ignore
						h('code', { class: [...node.properties.className, 'click-formula'] }, node.children[0].value),
						h(
							'code',
							{
								class: ['click-formula'],
								style: 'display: none;'
							},
							// @ts-ignore
							node.children[0].value
						)
					];
					const newNode = h(
						'span .click-formula',
						{
							onClick: `
							this.childNodes.forEach((node) => {
								console.log('click-formula');
								node.style.display = node.style.display != 'none' ? 'none' : '${isMathInline ? 'inline' : 'block'}';
							});
							`
						},
						newChildren
					);
					Object.assign(node, newNode);
				}
			});
		};
	}

	function rehypeCopyButton() {
		return function (tree: Root) {
			visit(tree, 'element', function (node) {
				if (['pre'].includes(node.tagName)) console.log(JSON.stringify(node, null, 2));
				if (
					['pre'].includes(node.tagName) &&
					(!Array.isArray(node.properties.className) || !node.properties.className.includes('copy-button'))
				) {
					// There may be a more elegant way to implement this!
					const copyButton: Element = h(
						'.btn .btn-sm .rounded-md .absolute .top-1',
						{
							style: 'top: 5px; right: 5px;',
							onClick: `
const preElement = this.closest('pre');
if (preElement) {
	navigator.clipboard.writeText(preElement.textContent);
}`
						},
						[
							s(
								'svg',
								{
									xmlns: 'http://www.w3.org/2000/svg',
									width: '18',
									height: '18',
									viewBox: '0 0 24 24',
									fill: 'none',
									stroke: 'currentColor',
									'stroke-width': '2',
									'stroke-linecap': 'round',
									'stroke-linejoin': 'round',
									class: 'lucide-icon lucide lucide-copy'
								},
								[
									s('rect', { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' }),
									s('path', { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' })
								]
							)
						]
					);

					const newNode = h('pre .relative .p-0 copy-button');
					newNode.children = [...node.children, copyButton];

					Object.assign(node, newNode);
				}
			});
		};
	}

	function parseMarkdown(text: string, style: typeof displayStyle) {
		if (style === 'raw') return `<pre>${text}</pre>`;
		const res = unified()
			.use(remarkParse)
			.use(remarkMath)
			.use(remarkRehype)
			.use(rehypeHighlight, { detect: true })
			.use(rehypeCopyButton)
			.use(rehypeClickFormulas)
			.use(rehypeKatex)
			.use(rehypeStringify)
			.processSync(text);
		return res.toString();
	}

	// $: {
	// 	await parseMarkdown(conversation);
	// }
</script>

<div class="flex max-w-full flex-col">
	{#if conversation?.messages}
		{#each conversation.messages as m}
			<div class="flex w-full items-start" class:bg-secondary-content={m.role == 'user'}>
				<div class="div items-start px-3 py-3">
					{#if m.role == 'user'}
						<Smile size="24" />
					{:else}
						<Computer size="24" />
					{/if}
				</div>
				<div class=" prose max-w-none grow pt-2">
					{@html parseMarkdown(m.text, displayStyle)}
				</div>
			</div>
		{/each}
	{/if}
</div>
