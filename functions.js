let playercount = 0;
let goal = 0;
let rows = [];
let players = [];

function addPlayer() {
  let tableHeader = document.querySelector("#tableHeadRow");
  let tableFooter = document.querySelector("#tableFooterRow");
  let tableBody = document.querySelector("#tableBody");
  let playerID = crypto.randomUUID();
  players.push(playerID);

  playerHeader = document.createElement("th");
  playerInput = document.createElement("input");
  headerButton = document.createElement("button");

  playerInput.type = "text";
  playerInput.placeholder = `Player ${playercount + 1}`;
  playerInput.classList.add("won");

  headerButton.textContent = "X";
  headerButton.classList.add("removePlayerButton");
  headerButton.addEventListener("click", removePlayerHandler);
  headerButton["data-player"] = playerID;
  headerButton.tabIndex = -1;

  playerHeader.appendChild(playerInput);
  playerHeader.appendChild(headerButton);

  tableHeader.appendChild(playerHeader);

  //Add missing column cells if game is already started
  if (rows.length > 0) {
    for (let i = 0; i < rows.length; i++) {
      let cell = createTableCellWithInput();
      cell.children[0]["data-player"] = playerID;
      cell.children[0]["data-row"] = i;
      tableBody.children[i].appendChild(cell);
      rows[i].appendChild(cell);
    }
  }

  let footerCell = createTableCellFooter();
  footerCell.tabIndex = -1;
  tableFooter.appendChild(footerCell);
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
  input.addEventListener("keypress", (e) => inputEnterKeyHandler(e));
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
function clearScores() {
  let tableBody = document.querySelector("#tableBody");
  let tableRows = tableBody.rows;
  for (let i = tableRows.length - 1; i >= 0; i--) {
    tableRows[i].remove();
  }

  rows.length = 0;

  addRow();
  calculateSumAllPlayers();
  tableBody.rows[0].children[0].children[0].focus();
}

removePlayerHandler = (e) => {
  index = getPlayerIndexFromID(e.target["data-player"]);
  removeColumn(index);
};

const removeColumn = (playerIndex) => {
  let tableBody = document.querySelector("#tableBody");
  let footer = document.querySelector("#tableFooterRow");
  let header = document.querySelector("#tableHeadRow");

  footer.deleteCell(playerIndex);
  header.deleteCell(playerIndex);

  let rows = tableBody.rows;
  for (let row of rows) {
    row.deleteCell(playerIndex);
  }

  players.splice(playerIndex, 1);
};

const getPlayerIndexFromID = (id) => {
  return players.indexOf(id);
};
function goalChangedHandler(e) {
  goal = parseInt(e.value);
  calculateSumAllPlayers();
  window.localStorage.setItem("goal", goal);
}
function initialize() {
  let value = window.localStorage.getItem("goal");
  if (value) {
    goal = value;
    document.querySelector("#input-target").value = value;
    calculateSumAllPlayers();
  }
}
function inputEnterKeyHandler(e) {
  // this just mimics tab if enter is pressed
  if (e.key === "Enter") {
    let tableRows = document.querySelector("#tableBody").rows;
    let row = e.target["data-row"];
    let column = [...tableRows[row].children].indexOf(e.target.parentElement);

    let rowColumnsCount = tableRows[row].children.length;
    if (column < rowColumnsCount - 1) {
      tableRows[row].children[column + 1].children[0].focus();
    } else if (row < tableRows.length - 1) {
      tableRows[row + 1].children[0].children[0].focus();
    }
  }
}
