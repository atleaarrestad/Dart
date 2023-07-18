import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';


@customElement('dart-table')
export class DartTableElement extends LitElement {

	public override render() {
		return html`

		`;
	}

	public static override styles = [
		css`
		:host {
			display: flex;
			background-color: grey;
			border: 1px solid black;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'dart-table': DartTableElement;
	}
}
