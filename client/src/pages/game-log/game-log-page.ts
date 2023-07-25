import { range } from '@roenlie/mimic-core/array';
import { sharedStyles } from '@roenlie/mimic-lit/styles';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';

import { Game } from '../../app/client-db.js';
import { MimicDB } from '../play/mimic-db.js';


@customElement('dart-game-log-page')
export class DartGameLogPage extends LitElement {

	@state() protected games: Game[] = [];
	@state() protected selectedGame?: Game;

	public override connectedCallback(): void {
		super.connectedCallback();

		MimicDB.connect('dart')
			.collection(Game)
			.getAll()
			.then(games => {
				this.games = games
					.sort((a, b) => b.datetime.valueOf() - a.datetime.valueOf())
					.slice(0, 20);
			});
	}

	protected handleSelectGame(game: Game) {
		this.selectedGame = game;
	}


	public override render() {
		return html`
		<game-list>
			<ol>
				${ map(this.games, game => html`
				<li @click=${ this.handleSelectGame.bind(this, game) }>
					${ game.datetime.toISOString().split('T')[0] }
				</li>
				`) }
			</ol>
		</game-list>

		<game-info>
		${ when(this.selectedGame, () => {
			const game = this.selectedGame!;
			const roundCount = game.participants.reduce((p, c) => Math.max(p, c.score.length), 0);

			return html`
			<game-details>
				<div>
					GameID: ${ game.id }
				</div>
				<div>
					Game DateTime: ${ game.datetime.toISOString().split('.')[0]?.replace('T', ' ') }
				</div>
				<div>
					Game Goal: ${ game.goal }
				</div>
			</game-details>
			<player-details>
				<details-header>
					<div>Round</div>
					${ map(game.participants, par => html`
					<header-field>
						<div>
							placement: ${ par.placement > 0 ? par.placement : 'DNF' }
						</div>
						<div>
							${ par.player.name }
						</div>
					</header-field>
					`) }
				</details-header>

				<details-body>
					${ map(range(roundCount), round => html`
					<body-row>
						<div>${ round }</div>
						${ map(game.participants, par => html`
						<row-field>
							${ par.score[round]?.sum ?? 0 }
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
			display: grid;
			grid-template-columns: max-content 1fr;
		}
		game-list {
			display: grid;
			justify-content: center;
			border-right: 1px solid black;
			padding-block: 8px;
			padding-inline: 12px;
		}
		ol {
			all: unset;
			display: grid;
			grid-auto-flow: row;
			grid-auto-rows: max-content;
			align-items: center;
			gap: 4px;
		}
		li {
			all: unset;
			border: 1px solid black;
			padding: 4px;
			background-color: rgb(180, 204, 185);
			cursor: pointer;
			user-select: none;
			border-radius: 4px;
		}
		game-info {
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
