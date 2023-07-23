import { EventOf } from '@roenlie/mimic-core/dom';
import { DialogElement } from '@roenlie/mimic-elements/dialog';
import { includeCE } from '@roenlie/mimic-lit/injectable';
import { css, html } from 'lit';

import { User } from '../../app/client-db.js';
import { MimicDB } from './mimic-db.js';
import { DartPlayElement } from './play-page.js';

includeCE(DialogElement);


export function createUserDialog(this: DartPlayElement) {
	const dialogEl = document.createElement('mm-dialog');
	dialogEl.modal = true;
	dialogEl.closeOnBlur = true;
	dialogEl.createConfig(() => ({
		canSubmit: false,
		username:  '',
		alias:     '',
	})).actions((dialog, state) => {
		const isUsernameValid = async (username: string) => {
			const user = await MimicDB.connect('dart')
				.collection(User)
				.getByIndex('username', username);

			return !user;
		};

		const handleUsernameInput = async (ev: EventOf<HTMLInputElement>) => {
			const value = ev.target.value;
			const isValid = await isUsernameValid(value);
			if (isValid && value) {
				state.canSubmit = true;
				state.username = value;
			}
			else {
				state.canSubmit = false;
			}
		};

		const handleAliasInput = (ev: EventOf<HTMLInputElement>) => {
			state.alias = ev.target.value;
		};

		const submit = async () => {
			await MimicDB.connect('dart')
				.collection(User)
				.add(new User({
					id:       crypto.randomUUID(),
					alias:    state.alias,
					username: state.username,
				}));

			dialog.close();

			this.retrieveUsers();
		};

		return {
			isUsernameValid,
			handleUsernameInput,
			handleAliasInput,
			submit,
		};
	}).template({
		render: (dialog, state, actions) => html`
			<h3>
				Create a new Player
			</h3>
			<user-form>
				<input placeholder="username" @input=${ actions.handleUsernameInput } />
				<input placeholder="alias" @input=${ actions.handleAliasInput } />
				<form-actions>
					<button ?disabled=${ !state.canSubmit } @click=${ actions.submit }>Submit</button>
					<button @click=${ () => dialog.close() }>Cancel</button>
				</form-actions>
			</user-form>
			`,
		style: css`
			.base {
				--mm-dialog-color: var(--on-surface);
				--mm-dialog-background-color: rgb(95, 145, 149);
				--mm-dialog-border-color: rgb(30 30 30);
				margin-top: 20dvh;
			}
			.host {
				border-radius: 8px;
				gap: 0px;
			}
			h3 {
				place-self: center;
			}
			user-form {
				display: grid;
				gap: 12px;
				padding: 12px;
			}
			user-form input {
				outline: none;
				border: 1px solid rgb(30 30 30);
				border-radius: 2px;
				padding: 4px;
			}
			form-actions {
				display: grid;
				grid-auto-flow: column;
				grid-auto-columns: 1fr;
				gap: 8px;
			}
			form-actions button {
				display: grid;
				place-items: center;
				border: 1px solid rgb(30 30 30);
				border-radius: 2px;
				background-color: rgb(163, 193, 109);
				padding: 4px;
				cursor: pointer;
			}
			form-actions button:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
			form-actions button:hover:not(:disabled) {
				background-color: rgb(138, 163, 92);
			}
			form-actions button:focus-within:not(:disabled) {
				box-shadow: 0 0 2px black;
			}
			form-actions button:focus-within:active:not(:disabled) {
				box-shadow: 0 0 4px black;
			}
			`,
	});

	this.shadowRoot?.append(dialogEl);
}