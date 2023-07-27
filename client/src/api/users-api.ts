import { maybe } from '@roenlie/mimic-core/async';

import { SERVER_ENDPOINT } from './constants.js';
import { $NewUserOut, $UserDTO } from './users-model.js';


export const getAllUsers = async () => {
	const url = new URL('api/user/getall', SERVER_ENDPOINT);

	const [ users ] = await maybe<$UserDTO[]>(
		fetch(url)
			.then(r => r.json())
			.then((r: $UserDTO[]) => r.map(r => $UserDTO.parse(r))),
	);

	return users;
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
		fetch(url)
			.then(r => r.json())
			.then(r => $UserDTO.parse(r)),
	);


	return user;
};
