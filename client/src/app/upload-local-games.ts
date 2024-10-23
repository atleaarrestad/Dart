import { maybe } from '@roenlie/mimic-core/async';

import { SERVER_ENDPOINT } from '../api/constants.js';
import { $GameOut } from '../api/game-model.js';
import { $PlayerResults } from '../api/game-model.js';
import { Game } from './client-db.js';
import { MimicDB } from './mimic-db.js';

export const uploadLocalGames = async () => {
	const coll = MimicDB.connect('dart').collection(Game);
	const localGames = await coll.getAll();

	const url = new URL('api/dartgame/add', SERVER_ENDPOINT);
	var gamesWithResults = [];
	for await (const game of localGames) {
		const body: $GameOut = {
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

		const [ playerResults ]  = await maybe<$PlayerResults>(
			fetch(url, {
				method: 'POST',
				body: JSON.stringify(body),
				headers: {
					'Content-Type': 'application/json',
				},
			}).then(r => r.json())
			.then(r => $PlayerResults.parse(r.playerResults)),
		);

		if (playerResults != null) {
			coll.delete(game.id);
			gamesWithResults.push({game, playerResults});
		}
	}

	return gamesWithResults;
};
