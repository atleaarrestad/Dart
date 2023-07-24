import { range } from '@roenlie/mimic-core/array';
import { EventOf } from '@roenlie/mimic-core/dom';
import { IconElement } from '@roenlie/mimic-elements/icon';
import { sharedStyles } from '@roenlie/mimic-lit/styles';
import { css, html, LitElement } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { Participant } from '../../app/client-db.js';
import DartScoreboardElement from './scoreboard-element.js';

[ IconElement, DartScoreboardElement ];


declare global {
	interface HTMLElementTagNameMap { 'dart-play-page': DartPlayElement; }
}


@customElement('dart-play-page')
export class DartPlayElement extends LitElement {

	@state() protected goal = 250;
	@query('dart-scoreboard') protected scoreboardEl: DartScoreboardElement;
	@state() protected participants: Participant[] = [
		...range(0, 2).map(() => ({
			player: {
				id:   crypto.randomUUID(),
				name: '',
			},
			goal:      this.goal,
			placement: 0,
			score:     [
				...range(0, 2).map(() => ({
					sum:         0,
					total:       0,
					calculation: '',
				})),
			],
		})),
	];

	//#region Lifecycle
	public override connectedCallback(): void {
		super.connectedCallback();
		window.addEventListener('keydown', this.handlePageKeydown);
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();
		window.removeEventListener('keydown', this.handlePageKeydown);
	}
	//#endregiona


	//#region Handlers
	protected handleGoalInput(ev: EventOf<HTMLInputElement>) {
		ev.target.value = ev.target.value
			.replace(/[^0-9]/g, '');

		this.goal = parseInt(ev.target.value || '0');
		this.participants.forEach(p => p.goal = this.goal);
		this.requestUpdate();
	}

	protected handleClickAddPlayer() {
		const longestScore = Math.max(
			2, this.participants.reduce((p, c) => Math.max(p, c.score.length), 0),
		);

		this.participants.push({
			goal:      this.goal,
			placement: 0,
			player:    {
				id:   crypto.randomUUID(),
				name: '',
			},
			score: range(longestScore)
				.map(() => ({ calculation: '', sum: 0, total: 0 })),
		});
		this.participants = [ ...this.participants ];

		setTimeout(() => {
			this.scoreboardEl.focusHeaderField(this.participants.length - 1);
		});
	}

	protected handleClickRemovePlayer(index: number) {
		this.participants.splice(index, 1);
		this.participants = [ ...this.participants ];

		setTimeout(() => {
			this.scoreboardEl.focusHeaderField(this.participants.length - 1);
		});
	}

	protected handlePageKeydown = (ev: KeyboardEvent) => {
		if (ev.shiftKey && ev.code === 'KeyC') {
			ev.preventDefault();

			this.participants.forEach(par => {
				par.placement = 0;
				par.score = [
					{
						calculation: '',
						sum:         0,
						total:       0,
					},
				];
			});
			this.participants = [ ...this.participants ];

			setTimeout(() => {
				this.scoreboardEl.focusListField(0, 0);
			});
		}

		if (ev.shiftKey && (ev.key === '?' || ev.key === '+')) {
			ev.preventDefault();
			this.handleClickAddPlayer();
		}

		if (ev.shiftKey && (ev.key === '_' || ev.key === '-')) {
			ev.preventDefault();
			this.handleClickRemovePlayer(this.participants.length - 1);
		}
	};
	//#endregion


	//#region Template
	public override render() {
		return html`
		<div class="page-header">
			<div class="settings">
				<div>Goal:</div>
				<input
					.value=${ this.goal.toString() }
					@input=${ this.handleGoalInput }
				/>
			</div>

			<div class="shortcuts">
				<div class="group">
					<span>shift +</span>
					<span>Add new player</span>
				</div>
				<div class="group">
					<span>shift -</span>
					<span>Remove last player</span>
				</div>
				<div class="group">
					<span>shift c</span>
					<span>Clear score</span>
				</div>
			</div>

			<div class="actions">
				<div>Add Player</div>
				<button
					class="add-player"
					@click=${ this.handleClickAddPlayer }
				>
					<mm-icon
						url="/Dart/plus-lg.svg"
					></mm-icon>
				</button>
			</div>
		</div>

		<dart-scoreboard
			.goal=${ this.goal }
			.participants=${ this.participants }
			@remove-player=${
				(ev: CustomEvent<{index: number}>) =>
					this.handleClickRemovePlayer(ev.detail.index)
			}
		></dart-scoreboard>
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		:host {
			overflow: hidden;
			display: grid;
			grid-template-rows: max-content 1fr;
			gap: 12px;
			margin-block: 12px;
			margin-inline: 14px;
		}
		.page-header {
			display: grid;
			grid-auto-flow: column;
			grid-auto-columns: 1fr;
			border: 2px solid rgb(0 0 0 / 70%);
			box-shadow: 0px 0px 4px 1px rgb(0 0 0 / 50%);
			border-radius: 4px;
			background-color: rgb(255 255 255);
			margin: 8px;
		}
		.page-header>div:not(:first-child) {
			border-left: 1px solid black;
		}
		.page-header>div {
			display: grid;
			padding-block: 4px;
			padding-inline: 8px;
		}
		.page-header .shortcuts .group {
			display: grid;
			grid-template-columns: 60px max-content;
		}
		.page-header .actions {
			place-items: center;
		}
		button.add-player {
			width: max-content;
			place-self: start center;
			display: grid;
			place-items: center;
			cursor: pointer;
			padding: 4px;
			border-radius: 6px;
			border: 1px solid transparent;
			background-color: lightgreen;
		}
		button.add-player:hover {
			color: white;
			background-color: darkgreen;
			border-color: rgb(30 30 30 / 50%);
		}
		button.add-player:focus-visible {
			border-color: rgb(30 30 30 / 50%);
		}
	`,
	];
	//#endregion

}
