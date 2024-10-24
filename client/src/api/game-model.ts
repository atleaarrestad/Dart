import { z } from 'zod';


export type $GameOut = z.infer<typeof $GameOut>;
export const $GameOut = z.object({
	goal:      z.number(),
	playerIDs: z.array(z.string()),
	rounds:    z.array(z.object({
		playerScores: z.array(z.number()),
	})),
});


export type $GameIn = z.infer<typeof $GameIn>;
export const $GameIn = z.object({
	id:        z.string(),
	date:      z.string(),
	goal:      z.number(),
	playerIDs: z.array(z.string()),
	rounds:    z.array(z.object({
		playerScores: z.array(z.number()),
	})),
	playerResults: z.array(z.object({
		id:           z.string(),
		placement:    z.number(),
		totalScore:   z.number(),
		averageScore: z.number(),
		overshoots:   z.optional(z.number()),
		roundsPlayed: z.number(),
		hasFinished:  z.boolean(),
	})),
	winners: z.array(z.any()),
});

// The existing $GameIn.playerResults object def does not match the data structure for playerResults from 'api/dartgame/add'. Hence new definition.
export type $PlayerResults = z.infer<typeof $PlayerResults>;
export const $PlayerResults = z.array(z.object({
	id:           z.string(),
	placement:    z.number(),
	totalScore:   z.number(),
	averageScore: z.number(),
	overshoots:   z.optional(z.number()),
	roundsPlayed: z.number(),
	hasFinished:  z.boolean(),
	mmrChange:    z.number(),
	alias: 		  z.string(),
}));