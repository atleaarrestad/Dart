import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';


declare global { interface HTMLElementTagNameMap {
	'dart-scoreboard-column': DartScoreboardColumnElement;
} }


@customElement('dart-scoreboard-column')
export default class DartScoreboardColumnElement extends LitElement {

	public override render() {
		return html`
			<div>new-component</div>
		`;
	}

	public static override styles = [
		css`
		:host { }
		`,
	];

}
