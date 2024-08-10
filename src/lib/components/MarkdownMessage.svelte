<script lang="ts">
	import 'highlight.js/styles/github-dark.min.css';
	import 'katex/dist/katex.min.css';

	import rehypeHighlight from 'rehype-highlight';
	import rehypeKatex from 'rehype-katex';
	import rehypeStringify from 'rehype-stringify';
	import remarkGfm from 'remark-gfm';
	import remarkMath from 'remark-math';
	import remarkParse from 'remark-parse';
	import remarkRehype from 'remark-rehype';
	import { unified } from 'unified';

	import { common } from 'lowlight';

	export let message: MessageInterface;

	import type { Element, Node, Root } from 'hast';
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

					const header = h('div', { class: 'flex justify-between items-center bg-secondary-content' }, [
						s('span', { class: 'text-sm text-gray-500' }, language),
						copyButton
					]);

					// There may be a more elegant way to implement this!

					const newNode = h('pre .relative copy-button');
					newNode.children = [header, ...node.children];

					Object.assign(node, newNode);
				}
			});
		};
	}

	function parseMarkdown(text: string) {
		const res = unified()
			.use(remarkParse)
			.use(remarkGfm)
			.use(remarkMath)
			.use(remarkRehype, { allowDangerousHtml: true })
			.use(rehypeHighlight, { detect: true })
			.use(rehypeCopyButton)
			.use(rehypeClickFormulas)
			.use(rehypeKatex)
			.use(rehypeStringify)
			.processSync(text);
		return res.toString();
	}
</script>

<div class="prose max-w-none grow pt-2">
	{@html parseMarkdown(message.text)}
</div>
