import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';


declare global {
	interface HTMLElementTagNameMap {
		'dart-scoreboard-page': DartScoreboardPage;
	}
}


@customElement('dart-scoreboard-page')
export class DartScoreboardPage extends LitElement {

	public override render() {
		return html`
		`;
	}

	public static override styles = [
		css`
		:host {
			display: grid;
		}
	`,
	];

}
