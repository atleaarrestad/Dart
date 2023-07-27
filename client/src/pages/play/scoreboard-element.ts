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

import { addNewUser, getAllUsers } from '../../api/users-api.js';
import { defaultUser, Player, Round, User } from '../../app/client-db.js';
import { MimicDB } from '../../app/mimic-db.js';
import { createUserDialog } from './create-user-dialog.js';
import DartDropdownElement, { DartDropdownItemElement } from './dropdown-element.js';


declare global { interface HTMLElementTagNameMap {
	'dart-scoreboard': DartScoreboardElement;
}}


@customElement('dart-scoreboard')
export default class DartScoreboardElement extends LitElement {

	//#region Properties
	@property({ type: Number }) public goal: number = 0;
	@property({ type: Array }) public players: Player[] = [];
	@state() protected users: User[] = [];
	@queryAll('article ol') protected listEls: HTMLOListElement[];
	protected selected?: {columnIndex: number; rowIndex: number;};
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
		const playerId = this.players[columnIndex]?.user.id ?? '';

		return this.renderRoot.querySelector<HTMLInputElement>(
			'[name="header|' + playerId + '"]',
		);
	}

	protected getListField(columnIndex: number, rowIndex: number): HTMLInputElement | null {
		const playerId = this.players[columnIndex]?.user.id ?? '';

		return this.renderRoot.querySelector<HTMLInputElement>(
			'[name="field|' + playerId + '|' + rowIndex + '"]',
		);
	}

	protected nextIsInvalid(next: { columnIndex: number; rowIndex: number; }) {
		if (!next)
			return true;
		if (this.players[next.columnIndex]?.placement)
			return true;

		return !this.players[next.columnIndex];
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
							columnIndex: this.players.length - 1,
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
					const highestRowIndex = this.players
						.reduce((pre, cur) => cur.round.length > pre ? cur.round.length : pre, 0);

					if (next.columnIndex === this.players.length - 1 &&
						next.rowIndex === highestRowIndex
					) {
						// End of available fields. Exit.
						return undefined;
					}
					else if (next.columnIndex === this.players.length - 1 &&
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
		const longestScore = this.players.reduce((prev, cur) => {
			return Math.max(cur.round.filter(s => s.calculation).length, prev);
		}, 0);

		// Make sure all players have the same about of score entries.
		this.players.forEach(par => {
			while (par.round.length < longestScore)
				par.round.push({ calculation: '', sum: 0 });
		});

		// If there is not an empty line after the last line with calculations
		// Or if there is only one line present.
		// Increment all score entries by one.
		while (this.players.some(par => {
			return par.round.length < 2 || par.round.at(-1)?.calculation;
		})) {
			for (const player of this.players)
				player.round.push({ calculation: '', sum: 0 });
		}

		// while there are two rows after eachother with all entries empty,
		// and there are more than 2 lines
		// remove the last row.
		while (this.players.every(par => {
			return par.round.at(-1)?.calculation === '' &&
				par.round.at(-2)?.calculation === ''
				&& par.round.length > 2;
		})) {
			for (const player of this.players)
				player.round.pop();
		}

		// Make sure all rows except the last two have atleast '0' calculation
		for (const player of this.players) {
			player.round
				.slice(0, -2)
				.forEach(score => !score.calculation && (score.calculation = '0'));
		}

		this.requestUpdate();
	}

	protected findClosestTotal(player: Player, toRound?: number) {
		const scores = toRound !== undefined
			? player.round.slice(0, toRound)
			: player.round;

		const total = scores.reduce((pre, cur) => {
			if (pre + cur.sum <= this.goal)
				pre += cur.sum;

			return pre;
		}, 0);

		return total;
	}

	protected sanitizeCalculation(input: string) {
		const sanitizedExpr = input
			.replace(/^(0+){2,}/, '')     // remove all leading 0s
			.replace(/[^0-9/+()*-]/g, '') // remove all invalid chars
			.replace(/^[^(\d]+/, '')      // remove any leading non digits and non left parens
			.replace(/[^)\d]+$/, '');     // remove any trailing non digits and non right parens

		return sanitizedExpr;
	}

	protected async retrieveUsers() {
		const collection = MimicDB.connect('dart').collection(User);

		const dbUsers = await getAllUsers();
		const localUsers = (await collection.getAll())
			.filter(user => user.state === 'local');

		const requests: Promise<any>[] = [];
		localUsers.forEach(user => {
			if (dbUsers.some(u => u.id === user.id)) {
				const request = collection.delete(user.id)
					.then(() => void localUsers
						.splice(localUsers.findIndex(u => u.id === user.id), 1));

				requests.push(request);
			}
			else {
				const request = addNewUser({
					username: user.name,
					alias:    user.alias,
					rfid:     user.rfid,
				}).then((user) => {
					if (!user)
						return;

					localUsers.splice(localUsers.findIndex(u => u.id === user.id), 1);
					collection.add(new User({ ...user, state: 'online' }), user.id);
				});

				requests.push(request);
			}
		});

		await Promise.all(requests);
		await Promise.all((await getAllUsers())
			.map(user => collection.put(new User({ ...user, state: 'online' }))));

		const users = await collection.getAll();

		console.log(users);

		this.users = users;
	}

	protected relaxedStringCompare(strA: string, strB: string) {
		const [ uUpper, nameUpper ] = [ strA.toUpperCase(), strB.toUpperCase() ];

		return uUpper.startsWith(nameUpper) ||
			uUpper.endsWith(nameUpper) ||
			uUpper.includes(nameUpper);
	}

	protected isScoreInvalid(player: Player, round: number) {
		let total = this.findClosestTotal(player, round);
		total += (player.round[round]?.sum ?? 0);

		return total > this.goal;
	}

	protected calculatePlacements() {
		let length = 0;
		for (const player of this.players) {
			player.placement = 0;
			let lastIndex = player.round.findLastIndex(s => s.calculation);
			if (lastIndex > -1)
				lastIndex += 1;

			length = Math.max(length, lastIndex);
		}

		let placement = 1;
		for (let i = 0; i < length; i++) {
			let assignedPlacement = false;

			this.players.forEach(player => {
				const total = this.findClosestTotal(player, i + 1);
				if (total === this.goal && player.placement === 0) {
					player.placement = placement;
					assignedPlacement = true;
				}
			});

			if (assignedPlacement)
				placement++;
		}
	}
	//#endregion


	//#region Handlers
	protected handleHeaderInput(
		player: Player,
		ev: EventOf<HTMLInputElement>,
	) {
		const value = ev.target.value;
		player.user = new User({
			id:    crypto.randomUUID(),
			state: 'unregistered',
			name:  value,
			alias: value,
			rfid:  crypto.randomUUID(),
			mmr:   0,
			rank:  0,
		});

		this.requestUpdate();
	}

	protected handleHeaderSelect(
		player: Player,
		index: number,
		ev: CustomEventOf<any, DartDropdownItemElement>,
	) {
		const value = ev.target.value as User;
		player.user = value;

		const path = ev.composedPath();
		const dropdown = path.find((el): el is DartDropdownElement =>
			el instanceof DartDropdownElement);

		if (dropdown)
			dropdown.disabled = true;

		this.requestUpdate();
		setTimeout(() => {
			if (index === (this.players.length - 1))
				this.focusListField(0, 0);
			else
				this.focusHeaderField(index + 1);
		});

		emitEvent(this, 'select-player');
	}

	protected handleHeaderClear(
		player: Player,
		index: number,
		ev: CustomEventOf<any, DartDropdownItemElement>,
	) {
		player.user = defaultUser();

		const path = ev.composedPath();
		const dropdown = path.find((el): el is DartDropdownElement =>
			el instanceof DartDropdownElement);

		if (dropdown)
			dropdown.disabled = false;

		this.requestUpdate();
		setTimeout(() => this.focusHeaderField(index));

		emitEvent(this, 'select-player');
	}

	protected handleHeaderKeydown(ev: KeyboardEvent) {
		if (ev.key === 'Tab' && !ev.shiftKey) {
			ev.stopPropagation();

			const target = ev.target as HTMLInputElement | undefined;
			const playerId = target?.name.split('|').at(-1);
			const playerIndex = this.players.findIndex(p => p.user.id === playerId);

			if (playerIndex === (this.players.length - 1)) {
				ev.preventDefault();
				this.moveListFocus('forwards');
				this.moveListFocus('backwards');
			}
		}
	}

	protected handleScoreInput(
		player: Player,
		index: number,
		ev: EventOf<HTMLInputElement>,
	) {
		ev.target.value = ev.target.value.replace(/[^0-9/+()*-]/g, '');

		const calculation = ev.target.value;
		const sanitizedExpr = this.sanitizeCalculation(calculation);

		let sum = 0;
		try { sum = Math.floor(parseFloat(eval(sanitizedExpr) ?? 0)); }
		catch { /*  */ }

		player.round[index] = { calculation, sum };

		this.ensureCorrectRowAmount();
	}

	protected handleScoreFocus(
		columnIndex: number,
		rowIndex: number,
	) {
		this.selected = { columnIndex, rowIndex };
		this.ensureCorrectRowAmount();
	}

	protected handleScoreBlur(score: Round) {
		this.selected = undefined;
		score.calculation = this.sanitizeCalculation(score.calculation);

		this.calculatePlacements();
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
				this.focusHeaderField(this.players.length - 1);
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
	//#endregion


	//#region Template
	protected HeaderDropdownTemplate(par: Player, index: number, items: () => User[]) {
		return html`
		<dart-dropdown
			openOnInput
			closeOnSelect
			showClearWhenDisabled
			placeholder =${ 'Player ' + (index + 1) }
			name        =${ 'header|' + par.user.id }
			.value      =${ par.user.alias }
			@clear      =${ this.handleHeaderClear.bind(this, par, index) }
			@input      =${ this.handleHeaderInput.bind(this, par) }
			@select-item=${ this.handleHeaderSelect.bind(this, par, index) }
			@keydown    =${ this.handleHeaderKeydown.bind(this) }
		>
			${ repeat(
				items()
					.filter(u => !this.players.find(p => p.user.id === u.id))
					.filter(u => this.relaxedStringCompare(u.alias, par.user.alias)),
				u => u,
				u => html`
				<dart-dropdown-item .value=${ u }>${ u.alias }</dart-dropdown-item>
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
			${ repeat(this.players, par => par, (par, pId) => html`
			<article
				class=${ classMap({
					winner: this.findClosestTotal(par) === this.goal,
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
							((par.round[this.selected?.rowIndex]?.sum ?? 0) > 0)),
					}) }
				>
					${ (() => {
						const closest = this.findClosestTotal(par);

						return `${ closest } (${ closest - this.goal })`;
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
					${ map(par.round, (score, sId) => html`
					<li class=${ classMap({ invalid: this.isScoreInvalid(par, sId) }) }>
						<span>${ sId + 1 }</span>
						<input
							name=${ 'field|' + par.user.id + '|' + sId }
							tabindex="-1"
							.value=${ live(score.calculation) }
							@input=${ this.handleScoreInput.bind(this, par, sId) }
							@focus=${ this.handleScoreFocus.bind(this, pId, sId) }
							@blur=${ this.handleScoreBlur.bind(this, score) }
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
			overflow: hidden;
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
