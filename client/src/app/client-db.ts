import { MimicDB, MimicSchema } from './mimic-db.js';


export class User extends MimicSchema<User> {

	public static override dbIdentifier = 'users';
	public static override dbKey = 'id';
	public id: string;
	public name: string;
	public alias: string;
	public state: 'unregistered' | 'local' | 'online';

}

export class Game extends MimicSchema<Game> {

	public static override dbIdentifier = 'games';
	public static override dbKey = 'id';

	public id: string;
	public goal: number;
	public datetime: Date;
	public players: Player[];
	public state: 'local' | 'online';

}

export type Round = {
	sum: number;
	calculation: string;
}

export type Player = {
	user: User;
	placement: number;
	round: Round[];
};


MimicDB.setup('dart', (setup) => {
	setup.createCollection(User, 'users', { autoIncrement: true })
		.createIndex('id', 'id', { unique: true })
		.createIndex('name', 'name', { unique: true })
		.createIndex('state', 'state')
		.createIndex('alias', 'alias')
		.mutate(() => {});

	setup.createCollection(Game, 'games', { autoIncrement: true })
		.createIndex('state', 'state')
		.mutate(() => {});
});
