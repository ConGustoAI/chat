import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ClassValue } from 'tailwind-variants';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function capitalize(str: string) {
	return str[0].toUpperCase() + str.slice(1);
}

export function getIncrementedName(baseName: string, existingNames: string[]): string {
	let counter = 1;
	let name = `${baseName}${counter.toString().padStart(2, '0')}`;
	while (existingNames.includes(name)) {
		counter++;
		name = `${baseName}${counter.toString().padStart(2, '0')}`;
	}
	return name;
}

export function undefineExtras<T extends object>(
	obj: T
): Omit<T, 'createdAt' | 'updatedAt' | 'status' | 'statusMessage' | 'updateTimer'> {
	return {
		...obj,
		createdAt: undefined,
		updatedAt: undefined,
		status: undefined,
		statusMessage: undefined,
		updateTimer: undefined
	};
}
