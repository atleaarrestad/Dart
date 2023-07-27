import { z } from 'zod';


export type $GameDTO = z.infer<typeof $GameDTO>;
export const $GameDTO = z.object({
	goal:      z.number(),
	playerIDs: z.array(z.string()),
	rounds:    z.array(z.object({
		playerScores: z.array(z.number()),
	})),
});
