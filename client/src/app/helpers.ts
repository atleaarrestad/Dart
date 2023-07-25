import { nameof } from '@roenlie/mimic-core/function';


export const writeToObject = (
	target: object,
	path: string,
	value: any,
) => {
	let rec = target as Record<keyof any, any>;

	const segments = path.split('.');
	for (let i = 0; i < segments.length - 1; i++) {
		const segment = segments[i]!;
		if (!rec[segment])
			return false;

		rec = rec[segment];
	}

	rec[segments[segments.length - 1]!] = value;

	return true;
};


export const readFromObject = <T>(
	source: Record<keyof any, any>,
	path: string,
): T => {
	if (!path)
		throw new Error('path must be non-empty', { cause: path });

	let rec = source;
	for (const segment of path.split('.')) {
		// If there is no object to traverse for a given segment,
		// it must be an optional property, and so undefined is a valid path value.
		if (typeof rec !== 'object' || rec === null)
			return undefined as any;

		rec = rec[segment];
	}

	return rec as any;
};


export const uniqueByPropVal = <T extends Record<keyof any, any>>(arr: T[], prop: (item: T) => any) => {
	const path = nameof(prop, true);
	const map = new Map<any, T>();

	for (const entry of arr)
		map.set(readFromObject(entry, path), entry);

	const uniques: T[] = [];
	for (const item of map)
		uniques.push(item[1]);

	map.clear();

	return uniques;
};
