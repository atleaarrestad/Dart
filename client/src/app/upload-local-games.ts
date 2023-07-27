import { maybe } from '@roenlie/mimic-core/async';

import { SERVER_ENDPOINT } from '../api/constants.js';
import { $GameOut } from '../api/game-model.js';
import { Game } from './client-db.js';
import { MimicDB } from './mimic-db.js';

export const uploadLocalGames = async () => {
	const coll = MimicDB.connect('dart').collection(Game);
	const localGames = await coll.getAll();

	const url = new URL('api/dartgame/add', SERVER_ENDPOINT);
	for await (const game of localGames) {
		const body: $GameDTO = {
			goal:      game.goal,
			playerIDs: game.players.map(player => player.user.id),
			rounds:    game.players.reduce((prev, cur) => {
				cur.round.forEach((round, rId) => {
					const score = prev[rId] ??= { playerScores: [] };
					score.playerScores.push(round.sum);
				});

				return prev;
			}, [] as {playerScores: number[]}[]),
		};

		const [ result ] = await maybe(
			fetch(url, {
				method:  'POST',
				body:    JSON.stringify(body),
				headers: {
					'Content-type': 'application/json',
				},
			}),
		);

		if (result?.ok)
			coll.delete(game.id);
	}
};
