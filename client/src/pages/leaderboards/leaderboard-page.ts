import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';


declare global { interface HTMLElementTagNameMap {
	'dart-leaderboard-page': DartLeaderboardPage;
} }


@customElement('dart-leaderboard-page')
export class DartLeaderboardPage extends LitElement {

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
