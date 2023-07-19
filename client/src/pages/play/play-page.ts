import { range } from '@roenlie/mimic-core/array';
import { EventOf } from '@roenlie/mimic-core/dom';
import { invariant } from '@roenlie/mimic-core/validation';
import { IconElement } from '@roenlie/mimic-elements/icon';
import { includeCE } from '@roenlie/mimic-lit/injectable';
import { sharedStyles } from '@roenlie/mimic-lit/styles';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { live } from 'lit/directives/live.js';
import { map } from 'lit/directives/map.js';

includeCE(IconElement);


declare global {
	interface HTMLElementTagNameMap {
		'dart-play-page': DartPlayElement;
	}
}

type Player = {
	id: string;
	name: string;
}

type Score = {
	total: number;
	sum: number;
	calculation: string;
}

type Participant = {
	player: Player;
	goal: number;
	score: Score[];
};


@customElement('dart-play-page')
export class DartPlayElement extends LitElement {

	@state() protected goal = 250;
	protected participants: Participant[] = [
		{
			player: {
				id:   crypto.randomUUID(),
				name: 'Kristoffer',
			},
			goal:  this.goal,
			score: [
				{
					sum:         0,
					total:       0,
					calculation: '',
				},
			],
		},
		{
			player: {
				id:   crypto.randomUUID(),
				name: 'Atle',
			},
			goal:  this.goal,
			score: [
				{
					sum:         0,
					total:       0,
					calculation: '',
				},
			],
		},
		{
			player: {
				id:   crypto.randomUUID(),
				name: 'Kjetil',
			},
			goal:  this.goal,
			score: [
				{
					sum:         0,
					total:       0,
					calculation: '',
				},
			],
		},
	];

	protected selected?: {player: Player; index: number;};

	protected handleGoalInput(ev: EventOf<HTMLInputElement>) {
		ev.target.value = ev.target.value
			.replace(/[^0-9]/g, '');

		this.goal = parseInt(ev.target.value || '0');
		this.participants.forEach(p => p.goal = this.goal);
		this.requestUpdate();
	}

	protected handleHeaderInput(
		participant: Participant,
		ev: EventOf<HTMLInputElement>,
	) {
		participant.player.name = ev.target.value;
	}

	protected handleScoreInput(
		participant: Participant,
		index: number,
		ev: EventOf<HTMLInputElement>,
	) {
		ev.target.value = ev.target.value.replace(/[^0-9/+()*-]/g, '');

		const calculation = ev.target.value;
		const sanitizedExpr = calculation
			.replace(/^0+/, '')           // remove all leading 0s
			.replace(/[^0-9/+()*-]/g, '') // remove all invalid chars
			.replace(/^[^(\d]+/, '')      // remove any leading non digits and non left parens
			.replace(/[^)\d]+$/, '');     // remove any trailing non digits and non right parens

		let sum = 0;
		try { sum = Math.floor(parseFloat(eval(sanitizedExpr) ?? 0)); }
		catch { /*  */ }

		participant.score[index] = {
			...participant.score[index] ?? {},
			calculation,
			sum,
			total: 0,
		};

		participant.score.forEach((score, i) => {
			// find first previous with a valid score.
			const previous = participant.score
				.findLast((s, sI) => sI < i && s.total <= this.goal);

			if (!previous)
				score.total = 0;
			else
				score.total = previous.total;

			//if ((score.total + score.sum) <= participant.goal)
			score.total += score.sum;
		});

		this.ensureCorrectRowAmount();
	}

	protected handleScoreFocus(
		participant: Participant,
		index: number,
	) {
		this.selected = {
			player: participant.player,
			index,
		};

		this.ensureCorrectRowAmount();
	}

	protected handleScoreBlur() {
		this.selected = undefined;
	}

	protected handleHeaderKeydown(ev: KeyboardEvent) {
		if (ev.key === 'Tab' && !ev.shiftKey) {
			const target = ev.target as HTMLInputElement | undefined;
			const playerId = target?.name.split('|').at(-1);

			const playerIndex = this.participants.findIndex(p => p.player.id === playerId);
			if (playerIndex === (this.participants.length - 1)) {
				this.renderRoot.querySelector<HTMLInputElement>(
					'[name="field|' + this.participants[0]?.player.id + '|0"]',
				)?.focus();

				ev.preventDefault();
			}
		}
	}

	protected handleListKeydown(ev: KeyboardEvent) {
		if (ev.key === 'Tab')
			this.handleListTabKeydown(ev);
		if (ev.key === 'Enter')
			this.handleListEnterKeydown(ev);
	}

	protected handleListEnterKeydown(ev: KeyboardEvent) {
		ev.preventDefault();

		invariant(this.selected, 'No input selected.');

		const participant = this.participants
			.find(p => p.player.id === this.selected?.player.id)!;
		invariant(participant, 'Cannot get participant for id: ' + this.selected.player.id);

		const playerIndex = this.participants.findIndex(p => p === participant);
		if (playerIndex === (this.participants.length - 1)) {
			this.moveTableFocus({
				playerId: this.selected.player.id,
				rowIndex: this.selected.index,
			}, 'left', this.participants.length);

			this.moveTableFocus({
				playerId: this.selected.player.id,
				rowIndex: this.selected.index,
			}, 'down');
		}
		else {
			this.moveTableFocus({
				playerId: this.selected.player.id,
				rowIndex: this.selected.index,
			}, 'right');
		}
	}

	protected handleListTabKeydown(ev: KeyboardEvent) {
		ev.preventDefault();

		invariant(this.selected, 'No input selected.');

		const participant = this.participants
			.find(p => p.player.id === this.selected?.player.id)!;
		invariant(participant, 'Cannot get participant for id: ' + this.selected.player.id);

		const playerIndex = this.participants.findIndex(p => p === participant);

		// Move backwards
		if (ev.shiftKey) {
			if (playerIndex === 0 && this.selected.index === 0) {
				const lastPlayerId = this.participants.at(-1)?.player.id;
				this.renderRoot.querySelector<HTMLInputElement>(
					'[name="' + 'header|' + lastPlayerId + '"]',
				)?.focus();
			}
			else if (playerIndex === 0) {
				this.moveTableFocus({
					playerId: this.selected.player.id,
					rowIndex: this.selected.index,
				}, 'up');

				this.moveTableFocus({
					playerId: this.selected.player.id,
					rowIndex: this.selected.index,
				}, 'right', this.participants.length);
			}
			else {
				this.moveTableFocus({
					playerId: this.selected.player.id,
					rowIndex: this.selected.index,
				}, 'left');
			}
		}
		// Move forwards
		else {
			if (playerIndex === (this.participants.length - 1)) {
				this.moveTableFocus({
					playerId: this.selected.player.id,
					rowIndex: this.selected.index,
				}, 'left', this.participants.length);

				this.moveTableFocus({
					playerId: this.selected.player.id,
					rowIndex: this.selected.index,
				}, 'down');
			}
			else {
				this.moveTableFocus({
					playerId: this.selected.player.id,
					rowIndex: this.selected.index,
				}, 'right');
			}
		}
	}

	protected handleClickAddPlayer() {
		const longestScore = this.participants.reduce((prev, cur) => {
			return cur.score.length > prev ? cur.score.length : prev;
		}, 0);

		this.participants.push({
			goal:   this.goal,
			player: {
				id:   crypto.randomUUID(),
				name: '',
			},
			score: range(longestScore)
				.map(() => ({ calculation: '', sum: 0, total: 0 })),
		});

		this.requestUpdate();
	}

	protected handleClickRemovePlayer(participant: Participant) {
		const index = this.participants.findIndex(p => p.player.id === participant.player.id);
		if (index >= 0) {
			this.participants.splice(index, 1);
			this.requestUpdate();
		}
	}

	protected moveTableFocus(
		from: {playerId: string; rowIndex: number;},
		direction: 'left' | 'right' | 'up' | 'down',
		step = 1,
	) {
		const fromRowIndex = from.rowIndex;
		const fromColumnIndex = this.participants
			.findIndex(p => p.player.id === from.playerId);

		if (fromColumnIndex < 0)
			throw new Error('Could not get playerId: ' + from.playerId);

		const toRowIndex = direction === 'up'
			? Math.max(0, fromRowIndex - step)
			: direction === 'down'
				? fromRowIndex + step
				: fromRowIndex;

		let toColumnIndex = fromColumnIndex;
		if (direction === 'left')
			toColumnIndex = Math.max(0, fromColumnIndex - step);
		else if (direction === 'right')
			toColumnIndex = Math.min(this.participants.length - 1, fromColumnIndex + step);

		const playerId = this.participants[toColumnIndex]?.player;
		invariant(playerId, 'Player in column: ' + toColumnIndex + ' could not be found');

		const inputEl = this.renderRoot.querySelector(
			'[name="' + 'field|' + playerId.id + '|' + toRowIndex + '"]',
		) as HTMLInputElement | undefined;

		inputEl?.focus();
	}

	protected ensureCorrectRowAmount() {
		const longestScore = this.participants.reduce((prev, cur) => {
			return cur.score.length > prev ? cur.score.length : prev;
		}, 0);

		// Make sure all participants have the same about of score entries.
		this.participants.forEach(par => {
			const lastTotal = par.score.at(-1)?.total ?? 0;

			while (par.score.length < longestScore) {
				par.score.push({
					calculation: '',
					sum:         0,
					total:       lastTotal,
				});
			}
		});

		// If there is not an empty line after the last line with calculations
		// Or if there is only one line present.
		// Increment all score entries by one.
		while (this.participants.some(par => {
			return par.score.length < 2 || par.score.at(-1)?.calculation;
		})) {
			this.participants.forEach(par => {
				const lastTotal = par.score.at(-1)?.total ?? 0;
				par.score.push({
					calculation: '',
					sum:         0,
					total:       lastTotal,
				});
			});
		}

		// while there are two rows after eachother with all entries empty,
		// and there are more than 2 lines
		// remove the last row.
		while (this.participants.every(par => {
			return par.score.at(-1)?.calculation === '' &&
				par.score.at(-2)?.calculation === ''
				&& par.score.length > 2;
		}))
			this.participants.forEach(par => par.score.pop());

		this.requestUpdate();

		this.updateComplete.then(() => {
			if (this.selected)
				return;

			const firstPlayerId = this.participants[0]?.player.id;
			const firstInputEl = this.renderRoot.querySelector(
				'[name="' + 'field|' + firstPlayerId + '|0"]',
			) as HTMLInputElement | undefined;

			firstInputEl?.focus();
		});
	}

	protected findClosestTotal(participant: Participant) {
		return participant.score
			.findLast(s => s.total <= participant.goal)?.total ?? 0;
	}

	public override render() {
		return html`
		<div>
			<input
				.value=${ this.goal.toString() }
				@input=${ this.handleGoalInput }
			/>
		</div>

		<div class="table" @focusout=${ () => this.requestUpdate() }>
			${ map(this.participants, (participant, i) => html`
			<article
				class=${ classMap({
					winner: participant.score.some(s => s.total === this.goal),
				}) }
			>
				<header>
					<input
						name=${ 'header|' + participant.player.id }
						placeholder=${ 'Player ' + (i + 1) }
						.value=${ live(participant.player.name) }
						@input=${ this.handleHeaderInput.bind(this, participant) }
						@keydown=${ this.handleHeaderKeydown }
					/>
					<button
						tabindex="-1"
						@click=${ this.handleClickRemovePlayer.bind(this, participant) }
					>
						<mm-icon url="/x-lg.svg"></mm-icon>
					</button>
				</header>

				<ol @keydown=${ this.handleListKeydown }>
					${ map(participant.score, (score, sId) => html`
					<li class=${ classMap({ invalid: score.total > this.goal }) }>
						<output>${ score.sum }</output>
						<input
							name=${ 'field|' + participant.player.id + '|' + sId }
							tabindex="-1"
							.value=${ live(score.calculation) }
							@input=${ this.handleScoreInput.bind(this, participant, sId) }
							@focus=${ this.handleScoreFocus.bind(this, participant, sId) }
							@blur=${ this.handleScoreBlur }
						/>
					</li>
					`) }
				</ol>

				<footer
					class=${ classMap({
						modified: !!(this.selected?.index !== undefined &&
							((participant.score[this.selected?.index]?.sum ?? 0) > 0)),
					}) }
				>
					${ (() => {
						const closest = this.findClosestTotal(participant);

						return `${ closest } (${ closest - participant.goal })`;
					})() }
				</footer>
			</article>
			`) }

			<button
				class="add-player"
				@click=${ this.handleClickAddPlayer }
			>
				<mm-icon
					url="/plus-lg.svg"
				></mm-icon>
			</button>
		</div>
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		:host {
			display: grid;
			grid-template-rows: max-content 1fr;
			gap: 12px;
			margin-block: 12px;
			margin-inline: 22px;
		}
		.table {
			position: relative;
			display: grid;
			grid-auto-flow: column;
			grid-auto-columns: 1fr;
			padding-right: 30px;
		}
		article {
			--borderr: 4px;
			overflow: hidden;
			display: grid;
			grid-template-rows: max-content 1fr max-content;
			border-left: 1px solid black;
			border-top: 1px solid black;
			border-bottom: 1px solid black;
		}
		article:first-of-type {
			border-top-left-radius: var(--borderr);
			border-bottom-left-radius: var(--borderr);
		}
		article:last-of-type {
			border-top-right-radius: var(--borderr);
			border-bottom-right-radius: var(--borderr);
			border-right: 1px solid black;
		}
		article.winner {
			background-color: lightgreen;
		}
		article header {
			display: grid;
			grid-template-columns: 1fr max-content;
			gap: 4px;
			border-bottom: 1px solid  black;
			height: 30px;
			padding-right: 4px;
		}
		article header input {
			all: unset;
			width: 100%;
			text-align: center;
			border-radius: 2px;
			box-sizing: border-box;
		}
		article header input:focus-within {
			outline: 2px solid teal;
			outline-offset: -2px;
		}
		article header button {
			all: unset;
			place-self: center;
			display: grid;
			place-items: center;
			cursor: pointer;
			padding: 4px;
			border-radius: 6px;
			border: 1px solid transparent;
		}
		article header button:hover {
			color: white;
			background-color: darkred;
			border-color: rgb(30 30 30 / 50%);
		}
		article ol {
			all: unset;
			display: grid;
			grid-auto-flow: row;
			grid-auto-rows: max-content;
		}
		article ol li {
			all: unset;
			display: grid;
			grid-template-columns: 30% 1fr;
		}
		article ol li.invalid {
			color: red;
		}
		article ol li:nth-child(even) {
			background-color: rgb(180 204 185 / 25%);
		}
		article ol li output {
			overflow: hidden;
			display: inline-grid;
			align-items: center;
			justify-content: center;
			border-right: 1px solid black;
			opacity: 0.8;
		}
		article ol li input {
			all: unset;
			min-width: 100%;
			text-align: center;
			padding: 2px;
			box-sizing: border-box;
		}
		article footer {
			display: grid;
			place-items: center;
			border-top: 1px solid black;
			height: 40px;
			font-size: 22px;
		}
		article:not(.winner) ol:focus-within~footer.modified {
			background-color: yellow;
		}
		button.add-player {
			position: absolute;
			right: 0;
			color: green;
			font-size: 22px;
			cursor: pointer;
		}
		button.add-player {
			all: unset;
			position: absolute;
			right: 0px;
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
	`,
	];

}
