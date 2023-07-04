let playercount = 0;
let rowcount = 0;
let goal = 250;
let rows = [];

function addPlayer() {
  let head = document.querySelector("#tableHead");
  let footer = document.querySelector("#tableFooterRow");
  let body = document.querySelector("#tableBody");
  if (!head) return;

  newPlayer = document.createElement("th");
  inputName = document.createElement("input");
  button = document.createElement("button");

  inputName.type = "text";
  inputName.placeholder = `Player ${playercount + 1}`;

  button.textContent = "X";
  button.classList.add("removePlayerButton");
  button.addEventListener("click", removePlayerHandler);
  button["data-player"] = playercount;

  newPlayer.appendChild(inputName);
  newPlayer.appendChild(button);
  head.appendChild(newPlayer);

  //Add missing column cells if game is already started
  if (rowcount > 0) {
    for (let i = 0; i < rowcount; i++) {
      let cell = createTableCellWithInput();
      cell.children[0]["data-player"] = playercount;
      cell.children[0]["data-row"] = i;
      body.children[i].appendChild(cell);
      rows[i].push(cell);
    }
  }

  let sum = createTableCellFooter();
  sum["data-player"] = playercount;
  console.log(sum);
  console.log(footer);
  footer.appendChild(sum);
  calculateSum(playercount);

  playercount += 1;
}

function addRow() {
  let body = document.querySelector("#tableBody");
  let row = document.createElement("tr");
  row["data-test"] = "dsds";
  rows[rowcount] = [];

  for (let i = 0; i < playercount; i++) {
    let cell = createTableCellWithInput();
    cell.children[0]["data-player"] = i;
    cell.children[0]["data-row"] = rowcount;
    row.appendChild(cell);

    rows[rowcount].push(cell);
  }
  body.appendChild(row);
  row.scrollIntoView();
  rowcount += 1;
}
function createTableCellWithInput() {
  let cell = document.createElement("td");
  let input = document.createElement("input");
  input.type = "text";
  input.placeholder = "0";
  input.addEventListener("blur", (e) => {
    validateInput(e);
    calculateSum(e.target["data-player"]);
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
      console.log("converted");
    } catch (error) {}
  }
  value = value === undefined || value === null || isNaN(value) ? 0 : value;
  e.target.value = value;
};
const calculateSum = (playerIndex) => {
  console.log("summing");
  let sum = 0;
  for (let i = 0; i < rows.length; i++) {
    let val = parseInt(rows[i][playerIndex].children[0].value);
    sum += val === undefined || val === null || isNaN(val) ? 0 : val;
  }
  let footer = document.querySelector("#tableFooterRow");
  footer.children[playerIndex].children[0].value = `${sum} (${sum - goal})`;
};
const calculateSumAllPlayers = () => {
  for (let i = 0; i < playercount; i++) {
    calculateSum(i);
  }
};
const isNewRowNeeded = (rowIndex) => {
  return rowIndex + 1 >= rowcount;
};
const clearScores = () => {
  rows.forEach((row) => {
    for (let i = 0; i < playercount; i++) {
      row[i].removeChild(row[i].children[0]);
      row[i].removeChild(row[i].children[1]);
      row[i].parentElement.removeChild(row[i]);
    }
  });
  rows = [];
  rowcount = 0;
  addRow();
  calculateSumAllPlayers();
};

removePlayerHandler = (e) => {
  index = e.target["data-player"];
  removeColumn(index);
};
const removePlayer = (playerIndex) => {
  removeColumn(playerIndex);
};
const removeColumn = (index) => {
  rows.forEach((row) => {
    row[index].removeChild(row[index].children[0]);
    row[index].parentElement.removeChild(row[index]);
  });
};
