import { DialogConfig, MMDialog } from "@roenlie/mimic-elements/dialog";
import { css, html } from "lit";
import { repeat } from 'lit/directives/repeat.js';

import { type Player } from "../../app/client-db.js";
import DartScoreboardElement from "./scoreboard-element.js";
import { $PlayerResults } from '../../api/game-model.js';

[MMDialog];

export function gameSummaryDialog(
  this: DartScoreboardElement,
  playerResults: $PlayerResults,
  players: Player[],
  onClose?: () => void
) {
  const configCreator = new DialogConfig()

const config = configCreator.config({closeOnBlur: true, modal: true}).state().actions((dialog, state) => {
	// Assumes that Mmr is updated on the player object already
	const getMmr = (playerId: string) => {
		var player = players.find(p => p.user.id === playerId);
		if (!player)
			return "n/a";

		return player.user.mmr;
	};

	const placementSorter = (a: $PlayerResults[number], b: $PlayerResults[number]) => {
		// placement 0 means the player did not finish the game, hence they should be at the bottom
		var aPlacement = a.placement === 0 ? Infinity : a.placement;
		var bPlacement = b.placement === 0 ? Infinity : b.placement;

		return aPlacement - bPlacement;
	};

	const getMmrChangeColorClass = (mmrChange: number) => {
		if (mmrChange > 0) {
			return 'color-green';
		} else if (mmrChange < 0) {
			return 'color-red';
		} else {
			return 'color-black';
		}
	};

	dialog.addEventListener(
	  "close",
	  () => {
		if(onClose)
			onClose();
		this.focusListField(0, 0);
	  },
	  { once: true }
	);

	dialog.addEventListener("keydown", (ev) => {
		// Close on escape and enter
		if (ev.key === "Escape" || ev.key === "Enter") {
			dialog.close();
		}
	});

	return {
		getMmr,
	  	getMmrChangeColorClass,
	  	placementSorter,
	};
 }).template({
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
	  <game-summary>
		<table>
		<tr>
			<th>Placement</th>
			<th>Rounds</th>
			<th>Player</th>
			<th>MMR Change</th>
			<th>New MMR</th>
		</tr>
		${ repeat(
			playerResults.sort((a, b) => actions.placementSorter(a, b)),
			pr => pr,
			pr => html`
			<tr>
				<td>${pr.placement == 0 ? 'DNF' : pr.placement}</td>
				<td>${pr.roundsPlayed}</td>
				<td>${pr.alias} </td>
				<td class=${actions.getMmrChangeColorClass(pr.mmrChange)}>${pr.mmrChange}</td>
				<td>${actions.getMmr(pr.id)}</td>
			</tr>
			`,
		) }
		</table>
	  </game-summary>
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
	  game-summary {
		table {
			width: 100%;
		}
		th {
			min-width: 150px;
			text-align: left;
	  }
	  img {
		width: 25px;
	  }
	  .color-green {
		color: limegreen;
	  }
	  .color-red {
		color: red;
	  }
	  .color-black {
		color: black;
	  }
	`,
 });
 configCreator.create(this)
}
