let playercount = 0;
let rowcount = 0;

function testfunc() {
  console.log("test");
}

function addPlayer() {
  let head = document.querySelector("#tableHead");
  if (!head) return;

  newPlayer = document.createElement("th");
  newPlayer.innerHTML = "gfgfgfg";
  head.appendChild(newPlayer);
  playercount += 1;

  //Add missing column cells if game is already started
  if (rowcount > 0) {
    let body = document.querySelector("#tableBody");
    for (let i = 0; i < rowcount; i++) {
      body.children[i].appendChild(createTableCellWithInput());
    }
  }
}

function addRow() {
  let body = document.querySelector("#tableBody");
  let row = document.createElement("tr");
  for (let i = 0; i < playercount; i++) {
    row.appendChild(createTableCellWithInput());
  }
  body.appendChild(row);
  rowcount += 1;
}

function createTableCellWithInput() {
  let cell = document.createElement("td");
  let input = document.createElement("input");
  input.type = "number";
  cell.append(input);
  return cell;
}
