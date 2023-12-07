let i = 0;
const check = "Hello World";

function fun(check) {
  console.log("Hello World");
  return check;
}

function printTips(check, check2) {
  let tips = ["Click on any AST node with a '+' to expand it", "Hovering over a node highlights the corresponding location in the source code", "Shift click on an AST node to expand the whole subtree"];
  if (check == "KILL" || check == "ME" || check === "Hello World") {
    if (check === "Hello World") {
      console.log("Hello World");
      return check2;
    } else {
      console.log("Bye World");
      return check2;
    }
  } else if (check !== "Hello World") {
    console.log("Bye World");
    return check2;
  }
  else {
    fun(check2);
    console.log("Hello World");
  }

}

function printTips2(check, check2) {
  console.log("Hello World");
  console.log("Bye");
}
