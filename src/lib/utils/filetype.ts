export async function typeFromFile(file: File): Promise<'image' | 'video' | 'audio' | 'text' | 'pdf'> {
	const mimeType = file.type;
	const filename = file.name;

	if (mimeType.startsWith('image/')) return 'image';
	if (mimeType.startsWith('video/')) return 'video';
	if (mimeType.startsWith('audio/')) return 'audio';

	if (mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
		return 'pdf';
	}

	// Check for common text MIME types
	if (
		mimeType.startsWith('text/') ||
		mimeType === 'application/json' ||
		mimeType === 'application/xml' ||
		mimeType === 'application/javascript'
	) {
		return 'text';
	}

	// Check file extension for common text file types
	const textExtensions = [
		'.txt',
		'.md',
		'.py',
		'.js',
		'.html',
		'.css',
		'.json',
		'.xml',
		'.csv',
		'.log',
		'.sh',
		'.bat',
		'.ts',
		'.jsx',
		'.tsx',
		'.scss',
		'.sass',
		'.less',
		'.yaml',
		'.yml',
		'.ini',
		'.conf',
		'.cfg',
		'.toml',
		'.sql',
		'.php',
		'.rb',
		'.java',
		'.c',
		'.cpp',
		'.h',
		'.hpp',
		'.go',
		'.rs',
		'.swift',
		'.kt',
		'.scala',
		'.lua',
		'.pl',
		'.r',
		'.m',
		'.f',
		'.f90',
		'.asm',
		'.s',
		'.dart',
		'.groovy',
		'.jl',
		'.nim',
		'.ml',
		'.hs',
		'.erl',
		'.ex',
		'.clj',
		'.cs',
		'.vb',
		'.ps1',
		'.psm1',
		'.psd1',
		'.ahk',
		'.au3',
		'.tcl',
		'.vbs',
		'.coffee',
		'.elm',
		'.fs',
		'.fsx',
		'.lisp',
		'.scm',
		'.rkt',
		'.v',
		'.vhd',
		'.vhdl',
		'.d',
		'.pas',
		'.lsp',
		'.el',
		'.prolog',
		'.forth',
		'.zig'
	];
	if (textExtensions.some((ext) => filename.toLowerCase().endsWith(ext))) {
		return 'text';
	}

	// Content-based check
	const isText = await isTextFile(file);
	if (isText) {
		return 'text';
	}

	throw new Error('Unknown media type: ' + mimeType);
}

async function isTextFile(file: File): Promise<boolean> {
	const blob = file.slice(0, 100 * 1024); // Read first 100KB of the file
	const text = await blob.text();

	// Check if the content is valid UTF-8 text
	// This regex matches common control characters that shouldn't appear in text files
	// eslint-disable-next-line no-control-regex
	const controlCharsRegex = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/;
	return !controlCharsRegex.test(text);
}
