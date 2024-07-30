import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
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