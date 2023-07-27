import { maybe } from '@roenlie/mimic-core/async';

import { SERVER_ENDPOINT } from './constants.js';
import { $GameIn } from './game-model.js';


export const getMostRecentGames = async (amount: number) => {
	const url = new URL(
		`api/DartGame/GetMostRecent/${ amount }`,
		SERVER_ENDPOINT,
	);

	const [ games ] = await maybe<$GameIn[]>(
		fetch(url, { method: 'GET' })
			.then(r => r.json())
			.then(r => r.map((r: any) => $GameIn.parse(r))),
	);

	return games;
};
