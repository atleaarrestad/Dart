import { Game, User } from './client-db.js';


export class DartEngine {

	protected game: Game = new Game({
		datetime: new Date(),
		goal:     301,
		id:       crypto.randomUUID(),
		players:  [
			{
				placement: 0,
				round:     [],
				user:      new User({
					alias: '',
					id:    crypto.randomUUID(),
					name:  '',
					state: 'unregistered',
				}),
			},
		],
		state: 'local',
	});


}
