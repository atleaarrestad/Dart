import { range } from '@roenlie/mimic-core/array';
import { EventOf } from '@roenlie/mimic-core/dom';
import { DialogElement } from '@roenlie/mimic-elements/dialog';
import { IconElement } from '@roenlie/mimic-elements/icon';
import { sharedStyles } from '@roenlie/mimic-lit/styles';
import { css, html, LitElement } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { Game, Participant } from '../../app/client-db.js';
import { MimicDB } from './mimic-db.js';
import DartScoreboardElement from './scoreboard-element.js';

[ IconElement, DartScoreboardElement, DialogElement ];


declare global {
	interface HTMLElementTagNameMap { 'dart-play-page': DartPlayElement; }
}


@customElement('dart-play-page')
export class DartPlayElement extends LitElement {

	@state() protected gameId = crypto.randomUUID();
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
		if (this.participants[index]?.score.some(s => s.calculation)) {
			const remove = confirm('Player has recorded score in the active game. '
				+ 'Are you sure you wish to remove them?');

			if (!remove)
				return;
		}


		this.participants.splice(index, 1);
		this.participants = [ ...this.participants ];

		setTimeout(() => {
			this.scoreboardEl.focusHeaderField(this.participants.length - 1);
		});
	}

	protected handleClickRestartGame() {
		const activeGame = this.participants.some(par => par.score.some(s => s.calculation));
		if (activeGame) {
			const reset = confirm('Game currently in progress. Are you sure you wish to reset?');
			if (!reset)
				return;
		}

		if (activeGame)
			this.handleClickSaveGame();

		this.participants.forEach(par => {
			par.placement = 0;
			par.score = [
				...range(0, 2).map(() => ({
					sum:         0,
					total:       0,
					calculation: '',
				})),
			];
		});
		this.participants = [ ...this.participants ];
		this.gameId = crypto.randomUUID();

		setTimeout(() => {
			this.scoreboardEl.focusListField(0, 0);
		});
	}

	protected async handleClickSaveGame() {
		if (this.participants.every(par => par.score.length <= 2)) {
			alert('Cannot save a game with less than 2 rounds played.');

			return;
		}

		let setDialogText: (text: string) => void = () => {};
		let closeDialog: () => void = () => {};

		const dialogEl = document.createElement('mm-dialog');
		dialogEl.createConfig(() => {
			return {
				text: 'Saving game progress.',
			};
		}).actions((dialog, state) => {
			return {
				editText: (text: string) => {
					state.text = text;
				},
			};
		}).template({
			initialize: (dialog, state, actions) => {
				setDialogText = actions.editText;
				closeDialog = () => dialog.close();
			},
			render: (dialog, state) => html`
			<div>
				${ state.text }
			</div>
			`,
			style: css`
			.base {
				bottom: 20vh;
				--mm-dialog-color: black;
				--mm-dialog-background-color: rgb(180, 204, 185);
				--mm-dialog-border-color: rgb(67, 76, 68);
			}
			.dialog {
				border-radius: 6px;
				place-items: center;
				width: 250px;
			}
			`,
		});

		this.renderRoot.append(dialogEl);

		await MimicDB.connect('dart')
			.collection(Game)
			.put(new Game({
				id:           this.gameId,
				goal:         this.goal,
				participants: this.participants,
				datetime:     new Date(),
			}), this.gameId);

		setTimeout(() => {
			setDialogText('Game saved successfully');
			setTimeout(() => closeDialog(), 2000);
		}, 500);
	}

	protected handlePageKeydown = (ev: KeyboardEvent) => {
		if (ev.shiftKey && ev.code === 'KeyC') {
			ev.preventDefault();
			this.handleClickRestartGame();
		}

		if (ev.shiftKey && ev.code === 'KeyS') {
			ev.preventDefault();
			this.handleClickSaveGame();
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
				<button
					class="header-action"
					@click=${ this.handleClickRestartGame }
				>
					<mm-icon
						url="/Dart/trashcan.svg"
					></mm-icon>
					<span>Reset game</span>
				</button>

				<button
					class="header-action"
					@click=${ this.handleClickSaveGame }
				>
					<mm-icon
						url="/Dart/cloud.svg"
					></mm-icon>
					<span>Save game</span>
				</button>

				<button
					class="header-action"
					@click=${ this.handleClickAddPlayer }
				>
					<mm-icon
						url="/Dart/man.svg"
					></mm-icon>
					<span>Add Player</span>
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
			grid-template-columns: 100px 220px 1fr;
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
		.page-header .settings input {
			width: 100%;
		}
		.page-header .shortcuts .group {
			display: grid;
			grid-template-columns: 60px max-content;
		}
		.page-header .actions {
			display: flex;
			flex-flow: row wrap;
			gap: 12px;
		}
		button.header-action {
			display: grid;
			grid-template-columns: max-content 1fr;
			gap: 4px;
			width: max-content;
			height: max-content;
			align-items: center;
			background-color: rgb(160, 227, 254);
			cursor: pointer;
			padding: 4px;
			border-radius: 6px;
			border: 1px solid rgb(45, 69, 71);
		}
		button.header-action:focus-visible,
		button.header-action:hover {
			box-shadow: 0px 0px 3px black;
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
