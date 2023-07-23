import { CustomEventOf, EventOf } from '@roenlie/mimic-core/dom';
import { onEnter } from '@roenlie/mimic-lit/directives';
import { css, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

import { Participant, User } from '../../app/client-db.js';
import { createUserDialog } from './create-user-dialog.js';
import { DartDropdownItemElement } from './dropdown-element.js';
import { DartPlayElement } from './play-page.js';


export class HeaderDropdown {

	constructor(
		public handleInput: (ev: EventOf<HTMLInputElement>) => void,
		public handleSelectItem: (ev: CustomEventOf<any, DartDropdownItemElement>) => void,
		public handleClear: (ev: CustomEventOf<any, DartDropdownItemElement>) => void,
		public handleKeydown: (ev: KeyboardEvent) => void,
	) {}

	public render = (host: DartPlayElement, par: Participant, index: number, items: () => User[]) => {
		return html`
		<dart-dropdown
			openOnInput
			closeOnSelect
			placeholder =${ 'Player ' + (index + 1) }
			name        =${ 'header|' + par.player.id }
			.value      =${ par.player.name }
			@input      =${ this.handleInput }
			@keydown    =${ this.handleKeydown }
			@select-item=${ this.handleSelectItem }
			@clear      =${ this.handleClear }
		>
			${ repeat(items().filter(u => {
				const [ uUpper, nameUpper ] = [
					u.username.toUpperCase(),
					par.player.name.toUpperCase(),
				];

				return uUpper.startsWith(nameUpper) ||
					uUpper.endsWith(nameUpper) ||
					uUpper.includes(par.player.name.toUpperCase());
			}), u => u, (u) => html`
			<dart-dropdown-item .value=${ u }>${ u.username }</dart-dropdown-item>
			`) }

			<dart-dropdown-item
				slot="action"
				@click=${ createUserDialog.bind(host) }
				${ onEnter(createUserDialog.bind(host)) }
			>
				Create user
			</dart-dropdown-item>
		</dart-dropdown>
		`;
	};

	public static styles = css`
	dart-dropdown::part(input-container) {
		border: none;
	}
	dart-dropdown::part(input-dropdown) {
		border-top: 1px solid black;
	}
	`;

}
