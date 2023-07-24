import { CustomEventOf, emitEvent, EventOf } from '@roenlie/mimic-core/dom';
import { invariant } from '@roenlie/mimic-core/validation';
import { onEnter } from '@roenlie/mimic-lit/directives';
import { sharedStyles } from '@roenlie/mimic-lit/styles';
import { css, html, LitElement } from 'lit';
import { customElement, property, queryAll, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { live } from 'lit/directives/live.js';
import { map } from 'lit/directives/map.js';
import { repeat } from 'lit/directives/repeat.js';
import { when } from 'lit/directives/when.js';

import { Participant, Player, Score, User } from '../../app/client-db.js';
import { createUserDialog } from './create-user-dialog.js';
import DartDropdownElement, { DartDropdownItemElement } from './dropdown-element.js';
import { MimicDB } from './mimic-db.js';


declare global { interface HTMLElementTagNameMap {
	'dart-scoreboard': DartScoreboardElement;
}}


@customElement('dart-scoreboard')
export default class DartScoreboardElement extends LitElement {

	//#region Properties
	@property({ type: Number }) public goal: number = 0;
	@property({ type: Array }) public participants: Participant[] = [];
	@state() protected users: User[] = [];
	@queryAll('article ol') protected listEls: HTMLOListElement[];
	protected selected?: {player: Player; columnIndex: number; rowIndex: number;};
	//#endregion


	//#region Public Api
	public focusHeaderField(column: number) {
		this.getHeaderField(column)?.focus();
	}

	public focusListField(column: number, row: number) {
		this.getListField(column, row)?.focus();
	}
	//#endregion


	//#region Lifecycle
	public override connectedCallback(): void {
		super.connectedCallback();
		this.retrieveUsers();
	}
	//#endregion


	//#region Logic
	protected getHeaderField(columnIndex: number): HTMLInputElement | null {
		const playerId = this.participants[columnIndex]?.player.id ?? '';

		return this.renderRoot.querySelector<HTMLInputElement>(
			'[name="header|' + playerId + '"]',
		);
	}

	protected getListField(columnIndex: number, rowIndex: number): HTMLInputElement | null {
		const playerId = this.participants[columnIndex]?.player.id ?? '';

		return this.renderRoot.querySelector<HTMLInputElement>(
			'[name="field|' + playerId + '|' + rowIndex + '"]',
		);
	}

	protected nextIsInvalid(next: { columnIndex: number; rowIndex: number; }) {
		if (!next)
			return true;
		if (this.participants[next.columnIndex]?.placement)
			return true;

		return !this.participants[next.columnIndex];
	}

	protected moveListFocus(direction: 'backwards' | 'forwards'): boolean {
		if (!this.selected)
			this.focusListField(0, 0);

		invariant(this.selected);

		type Next = Parameters<typeof this.nextIsInvalid>[0];

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
				} while (this.nextIsInvalid(next));

				return next;
			};

			const next = findNextBackwards(this.selected.columnIndex, this.selected.rowIndex);
			if (next) {
				this.focusListField(next.columnIndex, next.rowIndex);

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
				} while (this.nextIsInvalid(next));

				return next;
			};

			const next = findNextForwards(this.selected.columnIndex, this.selected.rowIndex);
			if (next) {
				this.focusListField(next.columnIndex, next.rowIndex);

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

	protected sanitizeCalculation(input: string) {
		const sanitizedExpr = input
			.replace(/^0+/, '')           // remove all leading 0s
			.replace(/[^0-9/+()*-]/g, '') // remove all invalid chars
			.replace(/^[^(\d]+/, '')      // remove any leading non digits and non left parens
			.replace(/[^)\d]+$/, '');     // remove any trailing non digits and non right parens

		return sanitizedExpr;
	}

	protected async retrieveUsers() {
		const users = await MimicDB.connect('dart')
			.collection(User)
			.getAll();

		this.users = users;
	}
	//#endregion


	//#region Handlers
	protected handleHeaderInput(
		participant: Participant,
		ev: EventOf<HTMLInputElement>,
	) {
		participant.player.id = '';
		participant.player.name = ev.target.value;
		this.requestUpdate();
	}

	protected handleHeaderSelect(
		participant: Participant,
		index: number,
		ev: CustomEventOf<any, DartDropdownItemElement>,
	) {
		const value = ev.target.value as User;

		participant.player = {
			id:   value.id,
			name: value.username,
		};

		const path = ev.composedPath();
		const dropdown = path.find((el): el is DartDropdownElement => el instanceof DartDropdownElement);
		if (dropdown)
			dropdown.disabled = true;

		this.requestUpdate();
		setTimeout(() => {
			if (index === (this.participants.length - 1))
				this.focusListField(0, 0);
			else
				this.focusHeaderField(index + 1);
		});
	}

	protected handleHeaderClear(
		participant: Participant,
		index: number,
		ev: CustomEventOf<any, DartDropdownItemElement>,
	) {
		participant.player = {
			id:   crypto.randomUUID(),
			name: '',
		};

		const path = ev.composedPath();
		const dropdown = path.find((el): el is DartDropdownElement => el instanceof DartDropdownElement);
		if (dropdown)
			dropdown.disabled = false;

		this.requestUpdate();
		setTimeout(() => this.focusHeaderField(index));
	}

	protected handleHeaderKeydown(ev: KeyboardEvent) {
		if (ev.key === 'Tab' && !ev.shiftKey) {
			ev.stopPropagation();

			const target = ev.target as HTMLInputElement | undefined;
			const playerId = target?.name.split('|').at(-1);
			const playerIndex = this.participants.findIndex(p => p.player.id === playerId);

			if (playerIndex === (this.participants.length - 1)) {
				ev.preventDefault();
				this.moveListFocus('forwards');
				this.moveListFocus('backwards');
			}
		}
	}

	protected handleScoreInput(
		participant: Participant,
		index: number,
		ev: EventOf<HTMLInputElement>,
	) {
		ev.target.value = ev.target.value.replace(/[^0-9/+()*-]/g, '');

		const calculation = ev.target.value;
		const sanitizedExpr = this.sanitizeCalculation(calculation);

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

	protected handleScoreBlur(participant: Participant, score: Score) {
		this.selected = undefined;
		score.calculation = this.sanitizeCalculation(score.calculation);

		// If this participant reaches the goal on blur.
		// Give them a placement.
		// Else remove any placement they had been mistakenly given,
		if (participant.score.at(-1)?.total === participant.goal) {
			if (!participant.placement) {
				participant.placement = this.participants
					.reduce((pre, cur) => pre < cur.placement ? cur.placement : pre, 0) + 1;
			}
		}
		else {
			participant.placement = 0;
		}

		this.participants
			.filter(par => par.placement)
			.sort((a, b) => a.placement - b.placement)
			.forEach((par, i) => par.placement = i + 1);
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
				this.focusHeaderField(this.participants.length - 1);
		}
		else {
			this.moveListFocus('forwards');
		}
	}

	protected handleListScroll(ev: Event) {
		const target = ev.target as HTMLOListElement;
		for (const listEl of this.listEls)
			listEl.scrollTop = target.scrollTop;
	}

	protected relaxedStringCompare(strA: string, strB: string) {
		const [ uUpper, nameUpper ] = [ strA.toUpperCase(), strB.toUpperCase() ];

		return uUpper.startsWith(nameUpper) ||
			uUpper.endsWith(nameUpper) ||
			uUpper.includes(nameUpper);
	}
	//#endregion


	//#region Template
	protected HeaderDropdownTemplate(par: Participant, index: number, items: () => User[]) {
		return html`
		<dart-dropdown
			openOnInput
			closeOnSelect
			showClearWhenDisabled
			placeholder =${ 'Player ' + (index + 1) }
			name        =${ 'header|' + par.player.id }
			.value      =${ par.player.name }
			@clear      =${ this.handleHeaderClear.bind(this, par, index) }
			@input      =${ this.handleHeaderInput.bind(this, par) }
			@select-item=${ this.handleHeaderSelect.bind(this, par, index) }
			@keydown    =${ this.handleHeaderKeydown.bind(this) }
		>
			${ repeat(
				items()
					.filter(u => !this.participants.find(p => p.player.id === u.id))
					.filter(u => this.relaxedStringCompare(u.username, par.player.name)),
				u => u,
				u => html`
				<dart-dropdown-item .value=${ u }>${ u.username }</dart-dropdown-item>
				`,
			) }

			<dart-dropdown-item
				slot="action"
				@click=${ createUserDialog.bind(this, index) }
				${ onEnter(createUserDialog.bind(this, index)) }
			>
				Create user
			</dart-dropdown-item>
		</dart-dropdown>
		`;
	}

	protected static HeaderDropdownStyle = css`
	dart-dropdown::part(input-container) {
		border: none;
	}
	dart-dropdown::part(input-dropdown) {
		border-top: 1px solid black;
	}
	`;

	public override render() {
		return html`
		<div class="table" @focusout=${ () => setTimeout(() => void this.requestUpdate()) }>
			${ repeat(this.participants, par => par, (par, pId) => html`
			<article
				class=${ classMap({
					winner: par.score.some(s => s.total === this.goal),
				}) }
			>
				<header>
					<span class="placement">
						${ when(par.placement, () => html`
						<img src=${ '/Dart/rank_' + par.placement + '.png' }
						></img>
						`) }
					</span>

					${ this.HeaderDropdownTemplate(par, pId, () => this.users) }

					<button
						tabindex="-1"
						@click=${ () => emitEvent(this, 'remove-player', { detail: { index: pId } }) }
					>
						<mm-icon url="/Dart/x-lg.svg"></mm-icon>
					</button>
				</header>

				<output
					class=${ classMap({
						modified: !!(this.selected?.rowIndex !== undefined &&
							((par.score[this.selected?.rowIndex]?.sum ?? 0) > 0)),
					}) }
				>
					${ (() => {
						const closest = this.findClosestTotal(par);

						return `${ closest } (${ closest - par.goal })`;
					})() }
				</output>

				<ol>
					<li class="info">
						<span>R</span>
						<span>Calc</span>
						<span>Sum</span>
					</li>
				</ol>

				<ol @keydown=${ this.handleListKeydown } @scroll=${ this.handleListScroll }>
					${ map(par.score, (score, sId) => html`
					<li class=${ classMap({ invalid: score.total > this.goal }) }>
						<span>${ sId + 1 }</span>
						<input
							name=${ 'field|' + par.player.id + '|' + sId }
							tabindex="-1"
							.value=${ live(score.calculation) }
							@input=${ this.handleScoreInput.bind(this, par, sId) }
							@focus=${ this.handleScoreFocus.bind(this, par, pId, sId) }
							@blur=${ this.handleScoreBlur.bind(this, par, score) }
						/>
						<output>${ score.sum }</output>
					</li>
					`) }
				</ol>
			</article>
			`) }
		</div>
		`;
	}

	public static override styles = [
		sharedStyles,
		DartScoreboardElement.HeaderDropdownStyle,
		css`
		:host {
			display: grid;
			padding: 8px;
		}
		.table {
			--borderr: 4px;
			overflow: hidden;
			position: relative;
			display: grid;
			grid-auto-flow: column;
			grid-auto-columns: 1fr;
			border: 2px solid rgb(0 0 0 / 70%);
			box-shadow: 0px 0px 4px 1px rgb(0 0 0 / 50%);
			border-radius: var(--borderr);
			background-color: rgb(255 255 255);
		}
		article {
			overflow: hidden;
			display: grid;
			grid-template-rows: repeat(3, max-content) 1fr;
		}
		article:not(:first-of-type) {
			border-left: 2px solid black;
		}
		article.winner {
			background-color: lightgreen;
		}
		article header {
			display: grid;
			grid-template-columns: 30px 1fr 30px;
			gap: 4px;
			border-bottom: 2px solid  black;
			height: 30px;
			padding-right: 4px;
		}
		article:focus-within header {
			background-color: rgb(255, 213, 108);
		}
		article header .placement {
			display: grid;
			place-items: center;
		}
		article header .placement img {
			width: 25px;
		}
		article header button {
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
			overflow: auto;
			--scrollbar-width: 0px;
			display: grid;
			grid-auto-flow: row;
			grid-auto-rows: max-content;
		}
		article ol li {
			all: unset;
			display: grid;
			grid-template-columns: 20px 1fr 50px;
		}
		article ol li.invalid {
			color: red;
		}
		article:not(.winner) ol li:nth-child(even) {
			background-color: rgb(180 204 185 / 25%);
		}
		article ol li.info {
			font-size: 12px;
			border-bottom: 1px solid black;
			background-color: rgb(180 204 185);
		}
		article ol li>*:first-child {
			border-right: 1px solid black;
			font-size: 10px;
		}
		article ol li>*:last-child {
			border-left: 1px solid black;
		}
		article ol li output,
		article ol li span {
			overflow: hidden;
			display: inline-grid;
			align-items: center;
			justify-content: center;
			color: rgb(0 0 0);
		}
		article ol li input {
			all: unset;
			min-width: 100%;
			text-align: center;
			padding: 2px;
			box-sizing: border-box;
		}
		article ol li input:focus-within {
			box-shadow: inset 0 0 2px black;
		}
		article>output {
			display: grid;
			place-items: center;
			border-bottom: 2px solid black;
			height: 40px;
			font-size: 22px;
		}
		article:not(.winner) output.modified:has(~ol:focus-within) {
			background-color: yellow;
		}
	`,
	];
	//#endregion

}
