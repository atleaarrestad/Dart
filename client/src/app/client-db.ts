import { $UserDTO } from '../api/users-model.js';
import { MimicDB, MimicSchema } from './mimic-db.js';


export type Round = {
	sum: number;
	calculation: string;
}


export type Player = {
	user: User;
	placement: number;
	round: Round[];
};


export class User extends MimicSchema<User> implements $UserDTO {

	public static override dbIdentifier = 'users';
	public static override dbKey = 'id';
	public id: string;
	public name: string;
	public alias: string;
	public rfid: string;
	public rank: number;
	public mmr: number;
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
	public ranked: boolean;

}


export const defaultUser = () => new User({
	id:    crypto.randomUUID(),
	state: 'unregistered',
	name:  '',
	alias: '',
	rfid:  crypto.randomUUID(),
	mmr:   0,
	rank:  0,
});


MimicDB.setup('dart', (setup) => {
	setup.createCollection(User, 'users', { autoIncrement: true })
		.createIndex('id', 'id')
		.createIndex('name', 'name')
		.createIndex('state', 'state')
		.createIndex('alias', 'alias')
		.mutate(() => {});

	setup.createCollection(Game, 'games', { autoIncrement: true })
		.createIndex('state', 'state')
		.mutate(() => {});
});
