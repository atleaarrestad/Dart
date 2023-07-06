let playercount = 0;
let goal = 0;
let rows = [];
let players = [];
let playersWon = [];

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
    let wonRow = hasPlayerWon(i);
    if (wonRow) {
      cell.children[0].classList.add("won-column-data");
      cell.children[0].tabIndex = -1;
    }
    row.appendChild(cell);
  }
  rows.push(row);
  body.appendChild(row);
  row.scrollIntoView();
}
const isNewRowNeeded = (rowIndex) => {
  return rowIndex + 1 >= rows.length;
};
function createTableCellWithInput() {
  let cell = document.createElement("td");
  let input = document.createElement("input");
  input.type = "text";
  input.placeholder = "0";
  input.addEventListener("blur", (e) => {
    input.value = validateInputValue(input.value);
    calculateSum(getPlayerIndexFromID(e.target["data-player"]), true);
    removeFooterCellClass(
      getPlayerIndexFromID(input["data-player"]),
      "yellow-text"
    );
  });
  input.addEventListener("focus", (e) => {
    if (isNewRowNeeded(e.target["data-row"])) {
      addRow();
    }
  });
  input.addEventListener("keypress", (e) => inputEnterKeyHandler(e));
  input.addEventListener("keyup", (e) => {
    if (isFinite(e.key) || e.key === "Backspace") {
      addFooterCellClass(
        getPlayerIndexFromID(input["data-player"]),
        "yellow-text"
      );
      let oldvalue = input.value;
      input.value = validateInputValue(input.value);
      calculateSum(getPlayerIndexFromID(e.target["data-player"]));
      input.value = oldvalue;
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
const validateInputValue = (value) => {
  try {
    if (isNaN(value.charAt(value.length - 1)) && value.length > 1) {
      value = value.substring(0, value.length - 1);
    }
    value = Math.floor(eval(value));
  } catch (error) {}

  value = value === undefined || value === null || isNaN(value) ? 0 : value;
  return value;
};
const calculateSum = (playerIndex, countTowardsWin = false) => {
  let sum = 0;
  let body = document.querySelector("#tableBody");
  let rowWon = false;
  for (let i = 0; i < body.rows.length; i++) {
    let input = body.rows[i].children[playerIndex].children[0];
    let val = parseInt(input.value);
    if (sum + val == goal) rowWon = i;
    if (sum + val > goal) {
      input.classList.add("red-text");
    } else {
      sum += val === undefined || val === null || isNaN(val) ? 0 : val;
      input.classList.remove("red-text");
    }
  }
  let footer = document.querySelector("#tableFooterRow");
  footer.children[playerIndex].children[0].value = `${sum} (${sum - goal})`;
  if (sum == goal && countTowardsWin) setPlayerWon(playerIndex, rowWon);
  return sum;
};
const calculateSumAllPlayers = () => {
  for (let i = 0; i < players.length; i++) {
    calculateSum(i);
  }
};
function clearScores() {
  let tableBody = document.querySelector("#tableBody");
  let tableRows = tableBody.rows;
  for (let i = tableRows.length - 1; i >= 0; i--) {
    tableRows[i].remove();
  }

  rows.length = 0;
  removePlayersWon();

  addRow();
  calculateSumAllPlayers();
  tableBody.rows[0].children[0].children[0].focus();
}
const removePlayerHandler = (e) => {
  index = getPlayerIndexFromID(e.target["data-player"]);
  removeColumn(index);
};
const removeColumn = (playerIndex) => {
  let columns = getColumns(playerIndex);
  let headerCell = getHeaderCell(playerIndex);
  let footerCell = getFooterCell(playerIndex);

  headerCell.remove();
  footerCell.remove();
  columns.forEach((element) => element.remove());

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
function getHeaderCell(index) {
  let header = document.querySelector("#tableHeadRow");
  return header.children[index];
}
function getFooterCell(index) {
  let footer = document.querySelector("#tableFooterRow");
  return footer.children[index];
}
function getColumns(index) {
  let tableBody = document.querySelector("#tableBody");
  let rows = tableBody.rows;
  columns = [];
  for (let row of rows) {
    columns.push(row.children[index]);
  }
  return columns;
}
function addCssClassToArrayElements(array, className) {
  array.forEach((element) => {
    element.classList.add(className);
  });
}
function removeCssClassToArrayElements(array, className) {
  array.forEach((element) => {
    element.classList.remove(className);
  });
}
function addFooterCellClass(index, className) {
  let cell = getFooterCell(index);
  cell.children[0].classList.add(className);
}
function removeFooterCellClass(index, className) {
  let cell = getFooterCell(index);
  cell.children[0].classList.remove(className);
}

const goalKeypressedHandler = (e) => {
  if (e.key === "Enter") {
    setFocusFirstColumnFirstCell();
  }
};
const globalKeypressHandler = (e) => {
  if (e.shiftKey && e.key === "+") {
    e.preventDefault();
    addPlayer();
    setFocusPlayerName(players.length - 1);
  }
  if (e.shiftKey && e.key === "-") {
    e.preventDefault();
    if (players.length > 0) {
      removeColumn(players.length - 1);
      setFocusPlayerName(players.length - 1);
    }
  }
  if (e.shiftKey && e.key === "C") {
    e.preventDefault();
    clearScores();
  }
};
function setFocusFirstColumnFirstCell() {
  let body = document.querySelector("#tableBody");
  if (body.rows.length > 0) {
    body.rows[0].children[0].children[0].focus();
  }
}
function setFocusPlayerName(index) {
  if (players.length === 0) return;
  let tableHeader = document.querySelector("#tableHeadRow");
  tableHeader.children[index].children[0].focus();
}
function setPlayerWon(playerIndex, rowIndex) {
  if (hasPlayerWon(playerIndex)) return;
  playersWon.push({ player: playerIndex, row: rowIndex });
  let columns = getColumns(playerIndex);
  columns.forEach((element) => {
    element.children[0].tabIndex = -1;
    element.children[0].classList.add("won-column-data");
  });

  let header = getHeaderCell(playerIndex);
  header.children[0].classList.add("won-header");

  let footer = getFooterCell(playerIndex);
  footer.children[0].classList.add("won-footer");
}
function removePlayersWon() {
  playersWon.length = 0;
  for (let i = 0; i < players.length; i++) {
    let header = getHeaderCell(i);
    header.children[0].classList.remove("won-header");
    let footer = getFooterCell(i);
    footer.children[0].classList.remove("won-footer");
  }
}
function hasPlayerWon(index) {
  //return false if player has not won, otherwise it returns the row index the player won on
  for (let i = 0; i < playersWon.length; i++) {
    if (playersWon[i]["player"] == index) return playersWon[i]["row"];
  }
  return false;
}
