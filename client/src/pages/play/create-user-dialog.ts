import { type EventOf } from "@roenlie/mimic-core/dom";
import { DialogElement } from "@roenlie/mimic-elements/dialog";
import { css, html } from "lit";

import { User } from "../../app/client-db.js";
import { MimicDB } from "../../app/mimic-db.js";
import DartScoreboardElement from "./scoreboard-element.js";

[DialogElement];

export function createUserDialog(
  this: DartScoreboardElement,
  columnIndex: number
) {
  const dialogEl = document.createElement("mm-dialog");

  dialogEl.modal = true;
  dialogEl.closeOnBlur = true;

  dialogEl
    .createConfig(() => {
      return {
        submitting: false,
        canSubmit: false,
        name: "",
        alias: "",
      };
    })
    .actions((dialog, state) => {
      const isNameValid = async (username: string) => {
        const user = await MimicDB.connect("dart")
          .collection(User)
          .getByIndex("name", username);

        return !user;
      };

      const handleUsernameInput = async (ev: EventOf<HTMLInputElement>) => {
        const value = ev.target.value;
        const isValid = await isNameValid(value);
        if (isValid && value) {
          state.canSubmit = true;
          state.name = value;
        } else {
          state.canSubmit = false;
        }
      };

      const handleAliasInput = (ev: EventOf<HTMLInputElement>) => {
        state.alias = ev.target.value;
      };

      const submit = async () => {
        try {
          state.submitting = true;

          await MimicDB.connect("dart")
            .collection(User)
            .add(
              new User({
                id: crypto.randomUUID(),
                state: "local",
                name: state.name,
                alias: state.alias,
                rfid: crypto.randomUUID(),
                mmr: 0,
                rank: 0,
              })
            );

          await this.retrieveUsers();
        } catch (error) {
          /*  */
        } finally {
          dialog.close();
        }
      };

      dialog.addEventListener(
        "close",
        () => {
          // Have to change focus to a new element before refocusing.
          this.focusListField(0, 0);
          this.focusHeaderField(columnIndex);
        },
        { once: true }
      );

      return {
        isUsernameValid: isNameValid,
        handleUsernameInput,
        handleAliasInput,
        submit,
      };
    })
    .template({
      initialize: (dialog) => {
        const blockPropagation = (ev: KeyboardEvent) => ev.stopPropagation();
        dialog.addEventListener("keydown", blockPropagation);
        dialog.addEventListener(
          "close",
          () => dialog.removeEventListener("keydown", blockPropagation),
          { once: true }
        );
      },
      render: (dialog, state, actions) => html`
        <h3>Create a new Player</h3>
        <user-form>
          <input
            ?disabled=${state.submitting}
            placeholder="name"
            @input=${actions.handleUsernameInput}
          />
          <input
            ?disabled=${state.submitting}
            placeholder="alias"
            @input=${actions.handleAliasInput}
          />
          <form-actions>
            <button
              ?disabled=${!state.canSubmit || state.submitting}
              @click=${actions.submit}
            >
              Submit
            </button>
            <button @click=${() => dialog.close()}>Cancel</button>
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
