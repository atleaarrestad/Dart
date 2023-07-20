import { range } from '@roenlie/mimic-core/array';
import { EventOf } from '@roenlie/mimic-core/dom';
import { invariant } from '@roenlie/mimic-core/validation';
import { IconElement } from '@roenlie/mimic-elements/icon';
import { includeCE } from '@roenlie/mimic-lit/injectable';
import { sharedStyles } from '@roenlie/mimic-lit/styles';
import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
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
	placement: number;
	score: Score[];
};


@customElement('dart-play-page')
export class DartPlayElement extends LitElement {

	@state() protected goal = 250;
	protected selected?: {player: Player; columnIndex: number; rowIndex: number;};
	protected participants: Participant[] = [
		{
			player: {
				id:   crypto.randomUUID(),
				name: '',
			},
			goal:      this.goal,
			placement: 0,
			score:     [
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
				name: '',
			},
			goal:      this.goal,
			placement: 0,
			score:     [
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
				name: '',
			},
			goal:      this.goal,
			placement: 0,
			score:     [
				{
					sum:         0,
					total:       0,
					calculation: '',
				},
			],
		},
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
	//#endregion


	//#region Logic
	protected getHeaderField(columnIndex: number): HTMLInputElement | null
	protected getHeaderField(playerId: string): HTMLInputElement | null
	protected getHeaderField(columnOrId: number | string) {
		if (typeof columnOrId === 'number') {
			const playerId = this.participants[columnOrId]?.player.id ?? '';
			columnOrId = playerId;
		}

		return this.renderRoot.querySelector<HTMLInputElement>(
			'[name="header|' + columnOrId + '"]',
		);
	}

	protected getListField(columnIndex: number, rowIndex: number): HTMLInputElement | null
	protected getListField(playerId: string, rowIndex: number): HTMLInputElement | null
	protected getListField(columnOrId: number | string, rowIndex: number) {
		if (typeof columnOrId === 'number') {
			const playerId = this.participants[columnOrId]?.player.id ?? '';
			columnOrId = playerId;
		}

		return this.renderRoot.querySelector<HTMLInputElement>(
			'[name="field|' + columnOrId + '|' + rowIndex + '"]',
		);
	}

	protected moveListFocus(direction: 'backwards' | 'forwards'): boolean {
		if (!this.selected)
			this.getListField(0, 0)?.focus();

		invariant(this.selected);

		type Next = { columnIndex: number; rowIndex: number; };
		const nextIsInvalid = (next: Next) => {
			if (!next)
				return true;
			if (this.participants[next.columnIndex]?.placement)
				return true;

			return !this.participants[next.columnIndex];
		};

		if (direction === 'backwards') {
			const findNextBackwards = (startColIndex: number, startRowIndex: number) => {
				let next: Next = {
					columnIndex: startColIndex,
					rowIndex:    startRowIndex,
				};

				do {
					if (next.columnIndex === 0 && next.rowIndex === 0) {
						// End of available fields. Exit.
						return undefined;
					}
					else if (next.columnIndex === 0 && next.rowIndex > 0) {
						next = {
							columnIndex: this.participants.length - 1,
							rowIndex:    next.rowIndex - 1,
						};
					}
					else {
						next = {
							columnIndex: next.columnIndex - 1,
							rowIndex:    next.rowIndex,
						};
					}
				} while (nextIsInvalid(next));

				return next;
			};

			const next = findNextBackwards(this.selected.columnIndex, this.selected.rowIndex);
			if (next) {
				this.getListField(next.columnIndex, next.rowIndex)?.focus();

				return true;
			}
			else {
				return false;
			}
		}

		if (direction === 'forwards') {
			const findNextForwards = (startColIndex: number, startRowIndex: number) => {
				let next: Next = {
					columnIndex: startColIndex,
					rowIndex:    startRowIndex,
				};

				do {
					const highestRowIndex = this.participants
						.reduce((pre, cur) => cur.score.length > pre ? cur.score.length : pre, 0);

					if (next.columnIndex === this.participants.length - 1 &&
						next.rowIndex === highestRowIndex
					) {
						// End of available fields. Exit.
						return undefined;
					}
					else if (next.columnIndex === this.participants.length - 1 &&
						next.rowIndex < highestRowIndex
					) {
						next = {
							columnIndex: 0,
							rowIndex:    next.rowIndex + 1,
						};
					}
					else {
						next = {
							columnIndex: next.columnIndex + 1,
							rowIndex:    next.rowIndex,
						};
					}
				} while (nextIsInvalid(next));

				return next;
			};

			const next = findNextForwards(this.selected.columnIndex, this.selected.rowIndex);
			if (next) {
				this.getListField(next.columnIndex, next.rowIndex)?.focus();

				return true;
			}
			else {
				return false;
			}
		}

		return false;
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
	}

	protected findClosestTotal(participant: Participant) {
		return participant.score
			.findLast(s => s.total <= participant.goal)?.total ?? 0;
	}
	//#endregion


	//#region Handlers
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

			score.total += score.sum;
		});

		this.ensureCorrectRowAmount();
	}

	protected handleScoreFocus(
		participant: Participant,
		columnIndex: number,
		rowIndex: number,
	) {
		this.selected = {
			player: participant.player,
			columnIndex,
			rowIndex,
		};

		this.ensureCorrectRowAmount();
	}

	protected handleScoreBlur(participant: Participant) {
		this.selected = undefined;

		// If this participant reaches the goal on blur.
		// Give them a placement.
		// Else remove any placement they had been mistakenly given.
		if (participant.score.at(-1)?.total === participant.goal) {
			participant.placement = this.participants
				.reduce((pre, cur) => pre > cur.placement ? cur.placement : pre, 0) + 1;
		}
		else {
			participant.placement = 0;
		}
	}

	protected handleClickAddPlayer() {
		const longestScore = this.participants.reduce((prev, cur) => {
			return cur.score.length > prev ? cur.score.length : prev;
		}, 0);

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

		this.requestUpdate();

		this.updateComplete.then(() => {
			this.getHeaderField(this.participants.length - 1)?.focus();
		});
	}

	protected handleClickRemovePlayer(index: number) {
		this.participants.splice(index, 1);
		this.requestUpdate();

		this.updateComplete.then(() => {
			this.getHeaderField(this.participants.length - 1)?.focus();
		});
	}

	protected handleHeaderKeydown(ev: KeyboardEvent) {
		if (ev.key === 'Tab' && !ev.shiftKey) {
			const target = ev.target as HTMLInputElement | undefined;
			const playerId = target?.name.split('|').at(-1);

			const playerIndex = this.participants.findIndex(p => p.player.id === playerId);
			if (playerIndex === (this.participants.length - 1)) {
				ev.preventDefault();
				this.getListField(0, 0)?.focus();
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
		if (ev.shiftKey)
			this.moveListFocus('backwards');
		else
			this.moveListFocus('forwards');
	}

	protected handleListTabKeydown(ev: KeyboardEvent) {
		ev.preventDefault();

		if (ev.shiftKey) {
			const success = this.moveListFocus('backwards');
			if (!success)
				this.getHeaderField(this.participants.length - 1)?.focus();
		}
		else {
			this.moveListFocus('forwards');
		}
	}

	protected handlePageKeydown = (ev: KeyboardEvent) => {
		if (ev.shiftKey && ev.code === 'KeyC') {
			ev.preventDefault();

			this.participants.forEach(par => {
				par.score = [
					{
						calculation: '',
						sum:         0,
						total:       0,
					},
				];
			});
			this.getListField(0, 0)?.focus();
			this.requestUpdate();
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
			<div>
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
					<span>remove last player</span>
				</div>
				<div class="group">
					<span>shift c</span>
					<span>clear score</span>
				</div>
			</div>
		</div>

		<div class="table" @focusout=${ () => setTimeout(() => void this.requestUpdate()) }>
			${ map(this.participants, (participant, pId) => html`
			<article
				class=${ classMap({
					winner: participant.score.some(s => s.total === this.goal),
				}) }
			>
				<header>
					<input
						name=${ 'header|' + participant.player.id }
						placeholder=${ 'Player ' + (pId + 1) }
						.value=${ live(participant.player.name) }
						@input=${ this.handleHeaderInput.bind(this, participant) }
						@keydown=${ this.handleHeaderKeydown }
					/>
					<button
						tabindex="-1"
						@click=${ this.handleClickRemovePlayer.bind(this, pId) }
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
							@focus=${ this.handleScoreFocus.bind(this, participant, pId, sId) }
							@blur=${ this.handleScoreBlur.bind(this, participant) }
						/>
					</li>
					`) }
				</ol>

				<footer
					class=${ classMap({
						modified: !!(this.selected?.rowIndex !== undefined &&
							((participant.score[this.selected?.rowIndex]?.sum ?? 0) > 0)),
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
		.page-header {
			display: grid;
			grid-auto-flow: column;
			grid-auto-columns: max-content;
			gap: 12px;
			border: 1px solid black;
			border-radius: 4px;
			padding-block: 4px;
			padding-inline: 8px;
		}
		.page-header .group {
			display: grid;
			grid-template-columns: 60px max-content;
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
	//#endregion

}
