<script lang="ts">
	// import { chatStreaming } from '$lib/stores/appstate';
	import rehypeHighlight from 'rehype-highlight';
	import rehypeKatex from 'rehype-katex';
	import rehypeStringify from 'rehype-stringify';
	import remarkBreaks from 'remark-breaks';
	import remarkGfm from 'remark-gfm';
	import remarkMath from 'remark-math';
	import remarkParse from 'remark-parse';
	import remarkRehype from 'remark-rehype';
	import { unified } from 'unified';

	import dbg from 'debug';
	const debug = dbg('app:ui:components:MarkdownMessage');

	export let message: MessageInterface;

	import type { Element, Root } from 'hast';
	import { visit } from 'unist-util-visit';

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

					const newChildren = [
						// @ts-ignore
						h('code ', { class: [...node.properties.className, 'click-formula'] }, node.children[0].value),
						h(
							'code',
							{ class: ['click-formula'], style: 'display: none;' },
							// @ts-ignore
							node.children[0].value
						)
					];
					const newNode = h(
						'span .click-formula',
						{
							ondblclick: `
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

	function rehypeSelectAll() {
		return function (tree: Root) {
			visit(tree, 'element', function (node) {
				if (node.tagName === 'code') {
					if (
						node.properties.className &&
						Array.isArray(node.properties.className) &&
						!node.properties.className?.includes('code-select')
					) {
						const newNode = {
							...node,
							properties: {
								...node.properties,
								className: [...(node.properties.className || []), 'code-select'],
								tabindex: '0', // Make the element focusable
								onkeydown: `
								console.log('keydown', event);
								if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
									event.preventDefault();
									const range = document.createRange();
									range.selectNodeContents(this);
									const selection = window.getSelection();
									selection.removeAllRanges();
									selection.addRange(range);
								}
							`
							}
						};
						Object.assign(node, newNode);
					}
				}
			});
		};
	}

	function rehypeCopyButton() {
		return function (tree: Root) {
			visit(tree, 'element', function (node) {
				if (
					node.tagName === 'pre' &&
					(!Array.isArray(node.properties.className) || !node.properties.className.includes('copy-button'))
				) {
					let className = (node.children as Element[])[0].properties.className;
					let language = 'unknown';

					if (typeof className === 'string') className = className.split(' ');
					if (Array.isArray(className)) {
						for (const cls of className) {
							if (typeof cls === 'string' && cls.startsWith('language-')) {
								language = cls.slice(9);
								break;
							}
						}
					}

					if (language == 'math') return;

					const copyButton: Element = h(
						'.btn btn-ghost  .rounded-md size-5 p-0 mr-1 min-h-fit',
						{
							onClick: `
const preElement = this.closest('pre');
if (preElement) {
	navigator.clipboard.writeText(preElement.childNodes[1].textContent);
}`
						},
						[
							s(
								'svg',
								{
									xmlns: 'http://www.w3.org/2000/svg',
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

					const header = h('div', { class: 'flex justify-between items-center bg-base-300' }, [
						s('span', { class: 'text-sm text-gray-500' }, language),
						copyButton
					]);

					// There may be a more elegant way to implement this!

					const newNode = h('pre .relative .copy-button .p-1 .bg-base-300 .mb-2 .whitespace-pre-wrap');
					newNode.children = [header, ...node.children];

					Object.assign(node, newNode);
				}
			});
		};
	}

	function getMarkdown(msg: MessageInterface) {
		// The cache should be invalidated by the code that modifies the text.
		if (msg.markdownCache) return msg.markdownCache;

		// This is a bit of a hack to support the OpenAI markdown syntax.
		let convertedMsg = msg.text
			.replace(/\\\((.*?)\\\)/g, '$$ $1 $$')
			.replace(/\\\[\n([\s\S]*?)\n(\s*)\\\]/g, '$$$$\n$1\n$2$$$$'); // Preserve leading whitespace before closing $$
		debug('msg.text', msg.text);
		debug('convertedMsg', convertedMsg);
		debug('parseMarkdown start');
		const res = unified()
			.use(remarkParse)
			.use(remarkBreaks)
			.use(remarkGfm)
			.use(remarkMath)
			.use(remarkRehype, { allowDangerousHtml: true })
			.use(rehypeHighlight, { detect: true })
			.use(rehypeCopyButton)
			.use(rehypeSelectAll)
			.use(rehypeClickFormulas)
			.use(rehypeKatex)
			.use(rehypeStringify)
			.processSync(convertedMsg);
		const str = res.toString();
		msg.markdownCache = str;
		debug('parseMarkdown end');
		return str;
	}
</script>

<div class="prose grow pt-2 text-message">
	{@html getMarkdown(message)}
</div>
