import { EventOf } from '@roenlie/mimic-core/dom';
import { IconElement } from '@roenlie/mimic-elements/icon';
import { includeCE } from '@roenlie/mimic-lit/injectable';
import { sharedStyles } from '@roenlie/mimic-lit/styles';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
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

type Participant = {player: Player, score: Score[]};


@customElement('dart-play-page')
export class DartPlayElement extends LitElement {

	@state() protected goal = 250;
	@state() protected participants: Participant[] = [
		{
			player: {
				id:   'adwda',
				name: 'Kristoffer',
			},
			score: [
				{
					sum:         15,
					total:       15,
					calculation: '',
				},
				{
					sum:         15,
					total:       15,
					calculation: '',
				},
				{
					sum:         15,
					total:       15,
					calculation: '',
				},
				{
					sum:         15,
					total:       15,
					calculation: '',
				},
			],
		},
		{
			player: {
				id:   'adwda',
				name: 'Atle',
			},
			score: [
				{
					sum:         15,
					total:       15,
					calculation: '',
				},
				{
					sum:         15,
					total:       15,
					calculation: '',
				},
				{
					sum:         15,
					total:       15,
					calculation: '',
				},
				{
					sum:         15,
					total:       15,
					calculation: '',
				},
			],
		},
		{
			player: {
				id:   'adwda',
				name: 'Kjetil',
			},
			score: [
				{
					sum:         15,
					total:       15,
					calculation: '',
				},
				{
					sum:         15,
					total:       15,
					calculation: '',
				},
				{
					sum:         15,
					total:       15,
					calculation: '',
				},
				{
					sum:         15,
					total:       15,
					calculation: '',
				},
			],
		},
	];

	public override render() {
		return html`
		<div>
			<input
				pattern="[0-9]+"
				.value=${ this.goal.toString() }
				@input=${ (ev: EventOf<HTMLInputElement>) => {
					ev.target.value = ev.target.value
						.replace(/[^0-9.]/g, '')
						.replace(/(\..*)\./g, '$1');

					this.goal = parseInt(ev.target.value || '0');
				} }
			/>
		</div>

		<div class="table">
			${ map(this.participants, (participant, i) => html`
			<article class="player-column">
				<header>
					<input
						placeholder=${ 'Player ' + (i + 1) }
						.value=${ live(participant.player.name) }
					/>
					<button>
						<mm-icon
							url="/x-lg.svg"
						></mm-icon>
					</button>
				</header>

				<ol>
					${ map(participant.score, score => html`
					<li>
						<input .value=${ live(score.sum.toString()) } />
					</li>
					`) }
				</ol>

				<footer>
					${ participant.score.at(-1)?.total ?? 0 }
					(${ this.goal - (participant.score.at(-1)?.total ?? 0) })
				</footer>
			</article>
			`) }
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
			display: grid;
			grid-auto-flow: column;
			grid-auto-columns: 1fr;
		}
		article {
			--borderr: 4px;
			display: grid;
			grid-template-rows: max-content 1fr max-content;
			border-left: 1px solid black;
			border-top: 1px solid black;
			border-bottom: 1px solid black;
		}
		article:first-child {
			border-top-left-radius: var(--borderr);
			border-bottom-left-radius: var(--borderr);
		}
		article:last-child {
			border-top-right-radius: var(--borderr);
			border-bottom-right-radius: var(--borderr);
			border-right: 1px solid black;
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
		}
		article ol li:nth-child(even) {
			background-color: rgb(180 204 185 / 25%);
		}
		article ol li input {
			all: unset;
			min-width: 100%;
			text-align: center;
			padding: 2px;
			box-sizing: border-box;
		}
		article footer {
			border-top: 1px solid black;
			height: 30px;
		}
	`,
	];

}
