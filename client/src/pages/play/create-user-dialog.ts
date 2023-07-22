import { DialogElement } from '@roenlie/mimic-elements/dialog';
import { includeCE } from '@roenlie/mimic-lit/injectable';
import { css, html } from 'lit';

includeCE(DialogElement);


export const createUserDialog = (element: HTMLElement) => {
	const dialogEl = document.createElement('mm-dialog');
	dialogEl.modal = true;
	dialogEl.closeOnBlur = true;
	dialogEl.createConfig(() => {})
		.actions(() => {})
		.template({
			render: () => html`
			HEI HERE YOU CREATE USER
			`,
			style: css`
			.base {
				--mm-dialog-color: var(--on-surface);
				--mm-dialog-background-color: hotpink;
				--mm-dialog-border-color: var(--outline-decoration-secondary-gradient);
			}
			`,
		});

	element.shadowRoot?.append(dialogEl);
};
