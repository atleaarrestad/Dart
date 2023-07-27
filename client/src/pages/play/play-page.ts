import { range } from '@roenlie/mimic-core/array';
import { EventOf } from '@roenlie/mimic-core/dom';
import { DialogElement } from '@roenlie/mimic-elements/dialog';
import { IconElement } from '@roenlie/mimic-elements/icon';
import { sharedStyles } from '@roenlie/mimic-lit/styles';
import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { defaultUser, Game, Player } from '../../app/client-db.js';
import { MimicDB } from '../../app/mimic-db.js';
import { uploadLocalGames } from '../../app/upload-local-games.js';
import DartScoreboardElement from './scoreboard-element.js';

[ IconElement, DartScoreboardElement, DialogElement ];


declare global {
	interface HTMLElementTagNameMap { 'dart-play-page': DartPlayElement; }
}


@customElement('dart-play-page')
export class DartPlayElement extends LitElement {

	@query('dart-scoreboard') protected scoreboardEl: DartScoreboardElement;
	@state() protected gameId = crypto.randomUUID();
	@state() protected goal = 250;
	@state() protected ranked = false;
	@state() protected players: Player[] = [
		...range(0, 2).map(() => ({
			user:      defaultUser(),
			placement: 0,
			round:     [
				...range(0, 2).map(() => ({
					sum:         0,
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

	protected override willUpdate(props: PropertyValues): void {
		super.willUpdate(props);

		this.players.every(player => player.user.state === 'online')
			? this.ranked = true
			: this.ranked = false;
	}
	//#endregion


	//#region Handlers
	protected handleGoalInput(ev: EventOf<HTMLInputElement>) {
		ev.target.value = ev.target.value
			.replace(/[^0-9]/g, '');

		this.goal = parseInt(ev.target.value || '0');
		this.requestUpdate();
	}

	protected handleClickAddPlayer() {
		const longestScore = Math.max(
			2, this.players.reduce((p, c) => Math.max(p, c.round.length), 0),
		);

		this.players.push({
			placement: 0,
			user:      defaultUser(),
			round:     range(longestScore)
				.map(() => ({ calculation: '', sum: 0 })),
		});
		this.players = [ ...this.players ];

		setTimeout(() => {
			this.scoreboardEl.focusHeaderField(this.players.length - 1);
		});
	}

	protected handleClickRemovePlayer(ev: {detail: {index: number}}) {
		const index = ev.detail.index;
		if (this.players[index]?.round.some(s => s.calculation)) {
			const remove = confirm('Player has recorded score in the active game. '
				+ 'Are you sure you wish to remove them?');

			if (!remove)
				return;
		}

		this.players.splice(index, 1);
		this.players = [ ...this.players ];

		setTimeout(() => {
			this.scoreboardEl.focusHeaderField(this.players.length - 1);
		});
	}

	protected async handleClickRestartGame(force = false) {
		if (!force) {
			const activeGame = this.players.some(par => par.round.some(s => s.calculation));
			if (activeGame) {
				const reset = confirm('Game currently in progress. Are you sure you wish to reset?');
				if (!reset)
					return;
			}
		}

		this.players.forEach(par => {
			par.placement = 0;
			par.round = [
				...range(0, 2).map(() => ({
					sum:         0,
					calculation: '',
				})),
			];
		});
		this.players = [ ...this.players ];
		this.gameId = crypto.randomUUID();

		setTimeout(() => {
			this.scoreboardEl.focusListField(0, 0);
		});
	}

	protected async handleClickSubmitGame() {
		if (this.players.every(par => par.round.length <= 2)) {
			alert('Cannot submit a game with less than 2 rounds played.');

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
				id:       this.gameId,
				goal:     this.goal,
				players:  this.players,
				datetime: new Date(),
				state:    'local',
				ranked:   this.ranked,
			}), this.gameId);

		this.handleClickRestartGame(true);

		setTimeout(() => {
			setDialogText('Game saved successfully');

			setTimeout(() => {
				closeDialog();
				uploadLocalGames();
			}, 2000);
		}, 500);
	}

	protected handlePageKeydown = (ev: KeyboardEvent) => {
		if (ev.shiftKey && ev.code === 'KeyC') {
			ev.preventDefault();
			this.handleClickRestartGame();
		}

		if (ev.shiftKey && ev.code === 'KeyS') {
			ev.preventDefault();
			this.handleClickSubmitGame();
		}

		if (ev.shiftKey && (ev.key === '?' || ev.key === '+')) {
			ev.preventDefault();
			this.handleClickAddPlayer();
		}

		if (ev.shiftKey && (ev.key === '_' || ev.key === '-')) {
			ev.preventDefault();
			this.handleClickRemovePlayer({ detail: { index: this.players.length - 1 } });
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
					?disabled=${ !this.ranked }
					@click=${ this.handleClickSubmitGame }
				>
					<mm-icon
						url="/Dart/cloud.svg"
					></mm-icon>
					<span>Submit game</span>
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
			.players=${ this.players }
			@select-player=${ () => void this.requestUpdate() }
			@remove-player=${ this.handleClickRemovePlayer }
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
			text-align: center;
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
		button.header-action:disabled {
			opacity: 0.5;
		}
		button.header-action:focus-visible,
		button.header-action:hover {
			box-shadow: 0px 0px 3px black;
		}
	`,
	];
	//#endregion

}
