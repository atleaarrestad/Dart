import { emitEvent, EventOf } from '@roenlie/mimic-core/dom';
import { sharedStyles } from '@roenlie/mimic-lit/styles';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';


declare global { interface HTMLElementTagNameMap {
	'dart-dropdown': DartDropdownElement; 'dart-dropdown-item': DartDropdownItemElement;
} }


@customElement('dart-dropdown')
export class DartDropdownElement extends LitElement {

	@property() public value: string = '';
	@property() public name?: string;
	@property() public height?: string;
	@property() public placeholder?: string;
	@query('input') protected inputEl?: HTMLInputElement;
	public activeEl?: DartDropdownItemElement;
	protected resizeObs = new ResizeObserver(() => this.requestUpdate());
	protected get open() {
		//return this.inputEl?.matches(':focus-within');
		return true;
	}

	public override connectedCallback(): void {
		super.connectedCallback();

		this.updateComplete.then(() => {
			if (this.inputEl)
				this.resizeObs.observe(this.inputEl);
		});
	}

	protected handleInputKeydown(ev: KeyboardEvent) {
		if (ev.code === 'ArrowUp' || ev.code === 'ArrowDown') {
			ev.preventDefault();

			if (this.activeEl) {
				const nextEl = ev.code === 'ArrowUp'
					? this.activeEl.previousElementSibling
					: this.activeEl.nextElementSibling;

				if (nextEl instanceof DartDropdownItemElement) {
					this.activeEl.classList.toggle('active', false);
					this.activeEl = nextEl;
					this.activeEl.classList.toggle('active', true);

					this.activeEl.scrollIntoView({ block: 'nearest' });
				}
			}
		}

		if (ev.key === 'Enter') {
			if (this.activeEl)
				emitEvent(this.activeEl, 'select-item');
		}
	}

	protected handleDefaultSlotChange(ev: EventOf<HTMLSlotElement>) {
		const slotContent = ev.target.assignedElements();
		slotContent.forEach(el => el.classList.remove('active'));

		const previousExists = slotContent.some(el => el === this.activeEl);
		if (previousExists) {
			this.activeEl?.classList.toggle('active', true);
		}
		else {
			this.activeEl = undefined;

			const firstEl = slotContent.at(0) as DartDropdownItemElement | undefined;
			if (firstEl) {
				this.activeEl = firstEl;
				this.activeEl?.classList.toggle('active', true);
			}
		}

		this.activeEl?.scrollIntoView({ block: 'nearest' });
	}

	public override render() {
		return html`
		<input
			placeholder=${ ifDefined(this.placeholder) }
			.value=${ live(this.value) }
			@input=${ (ev: EventOf<HTMLInputElement>) => this.value = ev.target.value }
			@keydown=${ this.handleInputKeydown }
			@focus=${ () => void this.requestUpdate() }
		/>

		${ when(this.open, () => {
			const rects = this.inputEl?.getBoundingClientRect();

			return html`
			<div
				class="dropdown"
				style=${ styleMap({
					top:   rects?.bottom + 'px',
					left:  rects?.left + 'px',
					width: rects?.width + 'px',
				}) }
			>
				<ol>
					<slot @slotchange=${ this.handleDefaultSlotChange }></slot>
				</ol>

				<div class="action">
					<slot name="action"></slot>
				</div>
			</div>
			`;
		}) }
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		:host {
			position: relative;
			display: grid;
		}
		input {
			all: unset;
			width: 100%;
			text-align: center;
			border-radius: 2px;
			box-sizing: border-box;
		}
		.dropdown {
			overflow: hidden;
			position: fixed;
			display: grid;
			grid-template-rows: 1fr max-content;

			background-color: rgb(182, 215, 121);
			border-bottom-left-radius: 8px;
			border-bottom-right-radius: 8px;
			border: 1px solid black;
		}
		ol, li {
			all: unset;
		}
		ol {
			display: flex;
			flex-flow: column nowrap;
			overflow: auto;
			height: 150px;
		}
		.action {
			border-top: 1px solid black;
		}
		::slotted(*.active) {
			outline: 2px solid hotpink;
		}
		`,
	];

}


@customElement('dart-dropdown-item')
export class DartDropdownItemElement extends LitElement {

	public override render() {
		return html`
		<li>
			<slot></slot>
		</li>
		`;
	}

	public static override styles = [
		css`
		:host {
			display: block;
		}
		li {
			display: grid;
			padding-inline: 12px;
			cursor: pointer;
		}
		li:hover {
			background-color: rgb(138, 163, 92);
		}
	`,
	];

}
