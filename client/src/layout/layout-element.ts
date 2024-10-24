import { MMIcon } from '@roenlie/mimic-elements/icon';
import { sharedStyles } from '@roenlie/mimic-lit/styles';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

MMIcon;


declare global {
	interface HTMLElementTagNameMap {
		'dart-layout': DartLayoutElement;
	}
}


@customElement('dart-layout')
export class DartLayoutElement extends LitElement {

	public override render() {
		return html`
		<nav>
			<a href="/Dart/play">
				<mm-icon url="/Dart/target.svg"></mm-icon>
				<span>Play</span>
			</a>
			<a href="/Dart/leaderboard">
				<mm-icon url="/Dart/trophy.svg"></mm-icon>
				<span>Score</span>
			</a>
			<a href="/Dart/game-log">
				<mm-icon url="/Dart/open-book.svg"></mm-icon>
				<span>Log</span>
			</a>
		</nav>

		<main>
			<slot></slot>
		</main>

		<div class="version-watermark">
			${ APP_VERSION }
		</div>
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		:host {
			overflow: hidden;
			display: grid;
			grid-template-columns: max-content 1fr;
			grid-template-rows: 1fr;

			background-color: rgb(255, 252, 239);
		}
		nav {
			display: flex;
			flex-flow: column nowrap;
			align-items: center;
			width: 75px;
			border-right: 2px solid rgb(0 0 0 / 70%);
			padding-block: 12px;
			gap: 12px;
		}
		a {
			display: grid;
			place-items: center;
			gap: 4px;
			border: 2px solid transparent;
			padding: 6px;
			border-radius: 8px;
		}
		a:hover {
			outline: 2px solid rgb(80 108 127 / 75%);
			border-color: rgb(69 170 184 / 75%);
		}
		main {
			display: grid;
			overflow: hidden;
		}
		.version-watermark {
			position: fixed;
			opacity: 0.2;
			bottom: 5px;
			right: 5px;
			font-size: 8px;
			font-weight: bold;
		}
	`,
	];

}
