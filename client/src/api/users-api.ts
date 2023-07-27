import { maybe } from '@roenlie/mimic-core/async';

import { SERVER_ENDPOINT } from './constants.js';
import { $NewUserOut, $UserDTO } from './users-model.js';


const testData = [
	{
		'id':    '64c01aa77521401c589a1b8a',
		'name':  'AtleAarrestad',
		'alias': 'Atul',
		'rfid':  '6969',
		'rank':  0,
		'mmr':   0,
	},
	{
		'id':    '64c124cf31129639ec451524',
		'name':  'KristofferRL',
		'alias': 'Roen',
		'rfid':  '696969',
		'rank':  0,
		'mmr':   0,
	},
	{
		'id':    '64c124cf31129639ec451534',
		'name':  'KristofferSelvær',
		'alias': 'Selvær',
		'rfid':  '69696969',
		'rank':  0,
		'mmr':   0,
	},
];


export const getAllUsers = async () => {
	const url = new URL('api/user/getall', SERVER_ENDPOINT);

	const [ users ] = await maybe<$UserDTO[]>(
		fetch(url, { method: 'GET' }).then(r => r.json()),
	);

	return (users ?? testData).map(user => $UserDTO.parse(user));
};


export const addNewUser = async (data: $NewUserOut): Promise<$UserDTO | null> => {
	$NewUserOut.parse(data);

	const url = new URL('api/user/add', SERVER_ENDPOINT);
	url.searchParams.append('username', data.username);
	url.searchParams.append('alias', data.alias);
	url.searchParams.append('rfid', data.rfid);

	const [ result ] = await maybe(
		fetch(url, { method: 'POST' })
			.then(r => r.json())
			.then(r => $UserDTO.parse(r)),
	);

	return result;
};

export const getUserById = async (id: string): Promise<$UserDTO | null> => {
	const url = new URL(`api/user/getbyid/${ id }`, SERVER_ENDPOINT);
	const [ user ] = await maybe<$UserDTO>(
		fetch(url, { method: 'GET' })
			.then(r => r.json())
			.then(r => $UserDTO.parse(r)),
	);


	return user;
};
