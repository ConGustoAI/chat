<script lang="ts">
	import classList from 'hast-util-class-list';
	import { isElement } from 'hast-util-is-element';
	import rehypeExternalLinks from 'rehype-external-links';
	import rehypeHighlight from 'rehype-highlight';
	import rehypeKatex from 'rehype-katex';
	import rehypeStringify from 'rehype-stringify';
	import remarkBreaks from 'remark-breaks';
	import remarkGfm from 'remark-gfm';
	import remarkMath from 'remark-math';
	import remarkParse from 'remark-parse';
	import remarkRehype from 'remark-rehype';

	import latex from 'highlight.js/lib/languages/latex';
	import { common } from 'lowlight';

	import { unified } from 'unified';

	import dbg from 'debug';
	const debug = dbg('app:ui:components:MarkdownMessage');

	export let message: MessageInterface;

	import type { Element, Root } from 'hast';
	import { visit } from 'unist-util-visit';

	import { assert } from '$lib/utils';
	import { h, s } from 'hastscript';
	import type { Node } from 'unist';

	// Make math blocks clickable to toggle display or raw content.
	function nodeClickFormulasBlock(node: Element): Element[] | Element {
		assert(node.tagName === 'pre', 'nodeClickFormulasBlock expects a pre element');
		// pre -> code[math-{inline,display}] -> text

		const code = node.children.find((c: Node) => isElement(c, 'code'));
		if (code) {
			const cl = classList(code);
			if (!cl.contains('math-inline') && !cl.contains('math-display')) return node;
			if (code.children.length !== 1 || code.children[0].type !== 'text') {
				debug('clickFormula', 'Invalid child type, expected text', { node, code });
				return node;
			}

			const sibling = h('pre', { style: { display: 'none' } }, [
				h('code', { className: ['language-latex'] }, code.children)
			]);

			const newCode = h('pre', [code]);

			node.properties.ondblclick = `
								this.childNodes.forEach((node) => {
									console.log('click-formula');
									node.style.display = node.style.display != 'none' ? 'none' : 'block';
								});
							`;
			node.children = [sibling, newCode];
			node.tagName = 'div';
			return [sibling, newCode]; // will be added to the pre array.
		}
		return node;
	}

	// Make inline math clickable to toggle display or raw content.
	function nodeClickFormulasInline(node: Element) {
		// p -> ... code[math-inline]  ... -> text
		assert(!isElement(node, 'pre'), 'nodeClickFormulasInline expects a non-block element');

		for (const [idx, child] of node.children.entries()) {
			if (isElement(child, 'code') && classList(child).contains('math-inline')) {
				if (child.children.length !== 1) {
					debug('clickFormula', 'Invalid number of children, expected at least 1', { node, child });
					continue;
				}

				if (child.children[0].type !== 'text') {
					debug('clickFormula', 'Invalid child type, expected text', { node, child });
					continue;
				}

				const newNode = h(
					'span',
					{
						ondblclick: `
								this.childNodes.forEach((node) => {
									console.log('click-formula');
									node.style.display = node.style.display != 'none' ? 'none' : 'inline';
								});`
					},
					[child, h('code', { className: ['language-latex'], style: { display: 'none' } }, child.children[0].value)]
				);

				child.children[0].value = child.children[0].value.replace(/(?<!\\)_/g, '\\_');

				node.children[idx] = newNode;
			}
		}
		// We convert <p> ... <code> ... </p> to <p> ... <span><code></span> ... </p>
		// So we destructively consue the inputs, as the outputs are not longer "p with code".
		return [];
	}

	// Converted from lucide
	const copySVG = s(
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
	);

	function nodeCopyButton(node: Element): Element | Element[] {
		assert(node.tagName === 'pre', 'nodeCopyButton expects a pre element');
		assert(node.children.length === 1, 'nodeCopyButton expects a pre element with a single child');
		const child = node.children[0] as Element;
		assert(child.tagName === 'code', 'nodeCopyButton expects a pre element with a code child');
		const cl = classList(child);

		// // Skip math blocks, they will be rendered as formulas.
		if (cl.contains('math-inline') || cl.contains('math-display')) return node;

		let language = 'unknown';

		cl.forEach((c: string) => {
			if (c.startsWith('language-')) {
				language = c.slice(9);
			}
		});

		const copyButton: Element = h(
			'div',
			{
				className: ['btn', 'btn-ghost', 'rounded-md', 'size-5', 'p-0', 'mr-1', 'min-h-fit'],
				title: 'Copy to clipboard',
				onClick: `
								const preElement = this.closest('pre');
								if (preElement) {
									navigator.clipboard.writeText(preElement.childNodes[1].textContent);
								}`
			},
			[copySVG]
		);
		const header = h('div', { className: ['flex', 'justify-between', 'items-center', 'bg-base-300'] }, [
			h('span', { class: 'text-sm text-gray-500 px-2 py-1' }, language),
			copyButton
		]);

		// Note: child is copied to avoid a cycle
		const childCopy = { ...child };
		// we set 'display: none;' in the click handler, remove it from the copy.
		childCopy.properties = {
			...childCopy.properties,
			style: undefined
		};

		const newPreWithCode = h('pre', { className: 'whitespace-pre-wrap' }, [childCopy]);

		child.tagName = 'div';
		child.children = [header, newPreWithCode];

		node.tagName = 'div';
		node.properties.className = ['rounded-botom-md', 'bg-base-200', 'mt-2'];

		return newPreWithCode;
	}

	function selectAll(node: Element): Element {
		assert(isElement(node, 'pre'), 'selectAll expects a pre element');
		const child = node.children[0] as Element;
		assert(isElement(child, 'code'), 'selectAll expects a pre element with a code child');
		child.properties = {
			...child.properties,
			tabindex: '0',
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
		};
		return node;
	}

	// Add some shrinkable space on the left side of math blocks.
	function offsetFormulas(node: Element): Element {
		if (node.children.length === 1 && isElement(node.children[0], 'code')) {
			const code = node.children[0] as Element;
			if (classList(code).contains('math-display')) {
				const newPre = h('pre', { ...node.properties }, [...node.children]);
				node.children = [
					h('div', { className: ['flex', 'justify-start', 'w-full', 'min-w-0', 'shrink'] }, [
						[h('div .max-w-32 .min-w-0 .shrink-1 .grow'), newPre]
					])
				];
				return newPre;
			}
		}
		return node;
	}

	function rehypeApplyMods() {
		return function (tree: Root) {
			let preWithCode: Element[] = []; // <pre> elements with with a single <code> inside.
			let inlineCode: Element[] = []; // <p> elements that contain <code> and possibly other stuff.
			// modifying the tree as it's being traversed is a big PITA
			// (I've tried) so we collect all the nodes we want to modify first.
			visit(tree, 'element', function (node) {
				if (isElement(node, 'pre') && node.children.length === 1 && isElement(node.children[0], 'code')) {
					preWithCode.push(node);
				}

				if (!isElement(node, 'pre')) {
					const code = node.children.find((c: Node) => isElement(c, 'code'));
					if (code) inlineCode.push(node);
				}
			});

			// Process the collected nodes, modifying them in place, and returning new nodes.
			preWithCode = preWithCode.flatMap(nodeClickFormulasBlock);
			inlineCode = inlineCode.flatMap(nodeClickFormulasInline);
			preWithCode = preWithCode.flatMap(nodeCopyButton);
			preWithCode = preWithCode.flatMap(offsetFormulas);
			preWithCode = preWithCode.flatMap(selectAll);
		};
	}

	function getMarkdown(msg: MessageInterface) {
		// The cache should be invalidated by the code that modifies the text.
		if (msg.markdownCache) return msg.markdownCache;

		// This is a bit of a hack to support the OpenAI markdown syntax.
		// We convert \( ... \) to $ ... $ and \[ ... \] to $$ ... $$.
		let convertedMsg = msg.text
			.replace(/\\\((.*?)\\\)/g, '$$$1$$')
			// Some LLMs output \[ ... \] without newlines, which does not get parsed as a math block.
			.replace(/^\\\[(.*?)\\\]$/gm, '\n$$$$\n$1\n$$$$\n')
			// Keep whitespace intact when converting other [\ ... \] math blocks.
			.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');

		// debug('msg.text', msg.text);
		// debug('convertedMsg', convertedMsg);

		const timestamp = Date.now();
		const res = unified()
			.use(remarkParse)
			.use(remarkMath)
			.use(remarkBreaks)
			.use(remarkGfm)
			.use(remarkRehype, { allowDangerousHtml: true })
			.use(rehypeApplyMods)
			.use(rehypeHighlight, { detect: true, languages: { ...common, latex } })
			.use(rehypeKatex)
			.use(rehypeExternalLinks, { target: '_blank' })
			.use(rehypeStringify)
			.processSync(convertedMsg);

		const str = res.toString();
		msg.markdownCache = str;
		const processingTime = Date.now() - timestamp;
		debug('parseMarkdown processing time', processingTime + 'ms');
		return str;
	}
</script>

<div class="prose w-full grow pt-2 text-message">
	{@html getMarkdown(message)}
</div>
