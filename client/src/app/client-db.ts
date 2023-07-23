import { MimicDB, MimicSchema } from '../pages/play/mimic-db.js';


export class User extends MimicSchema<User> {

	public static override dbIdentifier = 'users';
	public static override dbKey = 'id';
	public id: string;
	public username: string;
	public alias: string;

}

export class Game extends MimicSchema<Game> {

	public static override dbIdentifier = 'games';
	public static override dbKey = 'id';

	public id: string;
	public goal: number;
	public datetime: Date;
	public participants: Participant[];

}

export type Player = {
	id: string;
	name: string;
}

export type Score = {
	total: number;
	sum: number;
	calculation: string;
}

export type Participant = {
	player: Player;
	goal: number;
	placement: number;
	score: Score[];
};


MimicDB.setup('dart', (setup) => {
	setup.createCollection(User, 'users', { autoIncrement: true })
		.createIndex('username', 'username', { unique: true })
		.createIndex('id', 'id', { unique: true })
		.createIndex('alias', 'alias')
		.mutate(() => {});

	setup.createCollection(Game, 'games', { autoIncrement: true })
		.mutate(() => {});
});
