import { z } from 'zod';


export type $UserDTO = z.infer<typeof $UserDTO>;
export const $UserDTO = z.object({
	id:    z.string(),
	name:  z.string(),
	alias: z.string(),
	rfid:  z.string(),
	rank:  z.number(),
	mmr:   z.number(),
});


export type $NewUserOut = z.infer<typeof $NewUserOut>;
export const $NewUserOut = z.object({
	username: z.string(),
	alias:    z.string(),
	rfid:     z.string(),
});


export type $UpdateUserOut = z.infer<typeof $UpdateUserOut>;
export const $UpdateUserOut = z.object({
	id:          z.string(),
	newUsername: z.string(),
	newAlias:    z.string(),
	newRfid:     z.string(),
});


export type $DeleteUserOut = z.infer<typeof $DeleteUserOut>;
export const $DeleteUserOut = z.object({
	username: z.string(),
});
