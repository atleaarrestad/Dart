let playercount = 0;
let goal = 250;
let rows = new Array();
let players = [];

function addPlayer() {
  let head = document.querySelector("#tableHeadRow");
  let footer = document.querySelector("#tableFooterRow");
  let body = document.querySelector("#tableBody");
  let playerID = crypto.randomUUID();
  players.push(playerID);

  newPlayer = document.createElement("th");
  inputName = document.createElement("input");
  button = document.createElement("button");

  inputName.type = "text";
  inputName.placeholder = `Player ${playercount + 1}`;

  button.textContent = "X";
  button.classList.add("removePlayerButton");
  button.addEventListener("click", removePlayerHandler);
  button["data-player"] = playerID;

  newPlayer.appendChild(inputName);
  newPlayer.appendChild(button);
  newPlayer["data-player"] = playerID;
  head.appendChild(newPlayer);

  //Add missing column cells if game is already started
  if (rows.length > 0) {
    for (let i = 0; i < rows.length; i++) {
      let cell = createTableCellWithInput();
      cell.children[0]["data-player"] = playerID;
      cell.children[0]["data-row"] = i;
      body.children[i].appendChild(cell);
      rows[i].appendChild(cell);
    }
  }

  let footerCell = createTableCellFooter();
  footerCell["data-player"] = playerID;
  footer.appendChild(footerCell);
  calculateSum(getPlayerIndexFromID(playerID));

  playercount += 1;
}

function addRow() {
  let body = document.querySelector("#tableBody");
  let row = document.createElement("tr");

  for (let i = 0; i < players.length; i++) {
    let cell = createTableCellWithInput();
    cell.children[0]["data-player"] = players[i];
    cell.children[0]["data-row"] = rows.length;
    row.appendChild(cell);
  }
  rows.push(row);
  body.appendChild(row);
  row.scrollIntoView();
}
function createTableCellWithInput() {
  let cell = document.createElement("td");
  let input = document.createElement("input");
  input.type = "text";
  input.placeholder = "0";
  input.addEventListener("blur", (e) => {
    validateInput(e);
    calculateSum(getPlayerIndexFromID(e.target["data-player"]));
  });
  input.addEventListener("focus", (e) => {
    if (isNewRowNeeded(e.target["data-row"])) {
      addRow();
    }
  });
  cell.append(input);
  return cell;
}
function createTableCellFooter() {
  let cell = document.createElement("td");
  let input = document.createElement("input");
  input.type = "text";
  input.placeholder = "0";
  cell.append(input);
  return cell;
}
const validateInput = (e) => {
  let value = e.target.value;
  if (value.includes("+") || value.includes("-")) {
    try {
      value = eval(value);
    } catch (error) {}
  }
  value = value === undefined || value === null || isNaN(value) ? 0 : value;
  e.target.value = value;
};
const calculateSum = (playerIndex) => {
  let sum = 0;
  let body = document.querySelector("#tableBody");
  for (let i = 0; i < body.rows.length; i++) {
    let val = parseInt(body.rows[i].children[playerIndex].children[0].value);
    sum += val === undefined || val === null || isNaN(val) ? 0 : val;
  }
  let footer = document.querySelector("#tableFooterRow");
  footer.children[playerIndex].children[0].value = `${sum} (${sum - goal})`;
};
const calculateSumAllPlayers = () => {
  for (let i = 0; i < players.length; i++) {
    calculateSum(i);
  }
};
const isNewRowNeeded = (rowIndex) => {
  return rowIndex + 1 >= rows.length;
};
const clearScores = () => {
  rows.forEach((row) => {
    for (let i = 0; i < players.length; i++) {
      row[i].removeChild(row[i].children[0]);
      row[i].removeChild(row[i].children[1]);
      row[i].parentElement.removeChild(row[i]);
    }
  });
  rows = [];

  addRow();
  calculateSumAllPlayers();
};

removePlayerHandler = (e) => {
  index = getPlayerIndexFromID(e.target["data-player"]);
  removeColumn(e.target["data-player"]);
};
const removePlayer = (playerIndex) => {
  removeColumn(playerIndex);
};
const removeColumn = (playerID) => {
  console.log(players);
  console.log(playerID);
  let tableBody = document.querySelector("#tableBody");

  // remove columns
  let rows = tableBody.rows;
  for (let row of rows) {
    for (let i = 0; i < row.children.length; i++) {
      let child = row.children[i];
      if (child.children[0]["data-player"] === playerID) {
        row.removeChild(child);
        break;
      }
    }
  }

  // remove footer
  let footer = document.querySelector("#tableFooterRow");

  for (let i = 0; i < footer.children.length; i++) {
    let child = footer.children[i];
    if (child["data-player"] === playerID) {
      footer.removeChild(child);
      break;
    }
  }

  // remove header
  let header = document.querySelector("#tableHeadRow");

  for (let i = 0; i < header.children.length; i++) {
    let child = header.children[i];
    if (child["data-player"] === playerID) {
      header.removeChild(child);
      break;
    }
  }
  console.log(players.indexOf(playerID));
  players.splice(players.indexOf(playerID), 1);
  console.log(players);
};

const getPlayerIndexFromID = (id) => {
  return players.indexOf(id);
};
