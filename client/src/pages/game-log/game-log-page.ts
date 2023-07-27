import { range } from '@roenlie/mimic-core/array';
import { sharedStyles } from '@roenlie/mimic-lit/styles';
import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';

import { getMostRecentGames } from '../../api/game-api.js';
import { defaultUser, Game, User } from '../../app/client-db.js';
import { MimicDB } from '../../app/mimic-db.js';
import { uploadLocalGames } from '../../app/upload-local-games.js';


@customElement('dart-game-log-page')
export class DartGameLogPage extends LitElement {

	@state() protected games: Game[] = [];
	@state() protected selectedGame?: Game;

	public override connectedCallback(): void {
		super.connectedCallback();

		uploadLocalGames().then(() => {
			getMostRecentGames(20).then(async games => {
				if (!games)
					return;

				const coll = MimicDB.connect('dart').collection(User);
				const users = await coll.getAll();

				this.games = games.map(game => {
					const transformed: Game = {
						datetime: new Date(game.date),
						goal:     game.goal,
						id:       game.id,
						ranked:   true,
						state:    'online',
						players:  game.playerIDs.map((playerId, pId) => {
							return {
								placement: game.playerResults[pId]!.placement,
								user:      users.find(u => u.id === playerId) ?? defaultUser(),
								round:     game.rounds.map(r => ({
									calculation: r.playerScores[pId]!.toString(),
									sum:         r.playerScores[pId]!,
								})),
							};
						}),
					};

					return transformed;
				});
			});
		});
	}

	protected handleSelectGame(game: Game) {
		this.selectedGame = game;
	}

	protected prettifyDate(date: Date) {
		return date.toISOString().split('.')[0]?.replace('T', ' ') ?? '';
	}


	public override render() {
		return html`
		<game-list>
			<ol>
				${ map(this.games, game => html`
				<li @click=${ this.handleSelectGame.bind(this, game) }>
					${ this.prettifyDate(game.datetime) }
				</li>
				`) }
			</ol>
		</game-list>

		<game-info>
		${ when(this.selectedGame, () => {
			const game = this.selectedGame!;
			const roundCount = game.players.reduce((p, c) => Math.max(p, c.round.length), 0);

			return html`
			<game-details>
				<div>
					GameID: ${ game.id }
				</div>
				<div>
					Game DateTime: ${ this.prettifyDate(game.datetime) }
				</div>
				<div>
					Game Goal: ${ game.goal }
				</div>
			</game-details>
			<player-details>
				<details-header>
					<div>Round</div>
					${ map(game.players, par => html`
					<header-field>
						<div>
							placement: ${ par.placement > 0 ? par.placement : 'DNF' }
						</div>
						<div>
							${ par.user.name }
						</div>
					</header-field>
					`) }
				</details-header>

				<details-body>
					${ map(range(roundCount), round => html`
					<body-row>
						<div>${ round }</div>
						${ map(game.players, par => html`
						<row-field>
							${ par.round[round]?.sum ?? 0 }
						</row-field>
						`) }
					</body-row>
					`) }
				</details-body>
			</player-details>
		`;
		}) }
		</game-info>
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		:host {
			overflow: hidden;
			display: grid;
			grid-template-columns: 150px 1fr;
		}
		game-list {
			overflow: hidden;
			display: grid;
			justify-content: center;
			border-right: 1px solid black;
		}
		ol {
			all: unset;
			overflow: auto;
			display: grid;
			grid-auto-flow: row;
			grid-auto-rows: max-content;
			align-items: center;
			gap: 4px;
			padding-block: 8px;
			padding-inline: 12px;
		}
		li {
			all: unset;
			border: 1px solid black;
			padding: 4px;
			background-color: rgb(180, 204, 185);
			cursor: pointer;
			user-select: none;
			border-radius: 4px;
			display: grid;
			text-align: center;
		}
		game-info {
			overflow: auto;
			display: grid;
			grid-auto-flow: row;
			grid-auto-rows: max-content;
			padding: 12px;
		}
		player-details {
			display: grid;
			grid-template-rows: max-content 1fr;
			border: 2px solid black;
			border-radius: 4px;
			padding: 8px;
		}
		details-header {
			display: grid;
			grid-template-columns: 55px;
			grid-auto-flow: column;
			grid-auto-columns: 1fr;
		}
		details-body {
			display: grid;
			grid-auto-flow: row;
			grid-auto-rows: max-content;
		}
		body-row {
			display: grid;
			grid-template-columns: 55px;
			grid-auto-flow: column;
			grid-auto-columns: 1fr;
		}
		header-field,
		row-field {
			overflow: hidden;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'dart-game-log-page': DartGameLogPage;
	}
}
