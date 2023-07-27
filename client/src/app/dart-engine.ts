import { Game, User, defaultUser } from './client-db.js';


export class DartEngine {

	protected game: Game = new Game({
		ranked: false,
		datetime: new Date(),
		goal:     301,
		id:       crypto.randomUUID(),
		players:  [
			{
				placement: 0,
				round:     [],
				user:      defaultUser(),
			},
		],
		state: 'local',
	});


}
