import { Route, Router } from '@vaadin/router';
import { css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';


declare global {
	interface HTMLElementTagNameMap {
		'dart-router': DartRouterElement;
	}
}


@customElement('dart-router')
export class DartRouterElement extends LitElement {

	public routes: Route[] = [
		{
			path:      '',
			component: 'dart-layout',
			action:    () => void import('../layout/layout-element.js'),
			children:  [
				{
					path:     '/',
					redirect: '/play',

				},
				{
					path:      '/play',
					component: 'dart-play-page',
					action:    () => void import('../pages/play/play-page.js'),
				},
				{
					path:      '/scoreboard',
					component: 'dart-scoreboard-page',
					action:    () => void import('../pages/scoreboard/scoreboard-page.js'),
				},
			],
		},
	];

	public router = new Router();

	public override connectedCallback(): void {
		super.connectedCallback();

		this.router.setRoutes(this.routes);
		this.router.setOutlet(this.renderRoot);
	}

	public static override styles = [
		css`
		:host {
			display: grid;
		}
	`,
	];

}