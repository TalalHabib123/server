let i = 0;
const check = "Hello World";

function cov_20rlhpc6w4() {
  var path = "../server/Utils/Test_Codes/Test_Code.js";
  var hash = "66645059ad46ebf75bf554b51ff24891dc4efca2";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "../server/Utils/Test_Codes/Test_Code.js",
    statementMap: {
      0: { start: { line: 2, column: 2 }, end: { line: 2, column: 29 } },
      1: { start: { line: 3, column: 2 }, end: { line: 3, column: 15 } },
      2: { start: { line: 6, column: 13 }, end: { line: 6, column: 201 } },
      3: { start: { line: 7, column: 2 }, end: { line: 21, column: 3 } },
      4: { start: { line: 8, column: 4 }, end: { line: 14, column: 5 } },
      5: { start: { line: 9, column: 6 }, end: { line: 9, column: 33 } },
      6: { start: { line: 10, column: 6 }, end: { line: 10, column: 20 } },
      7: { start: { line: 12, column: 6 }, end: { line: 12, column: 31 } },
      8: { start: { line: 13, column: 6 }, end: { line: 13, column: 20 } },
      9: { start: { line: 15, column: 9 }, end: { line: 21, column: 3 } },
      10: { start: { line: 16, column: 4 }, end: { line: 16, column: 29 } },
      11: { start: { line: 17, column: 4 }, end: { line: 17, column: 18 } },
      12: { start: { line: 19, column: 4 }, end: { line: 19, column: 16 } },
      13: { start: { line: 20, column: 4 }, end: { line: 20, column: 31 } },
    },
    fnMap: {
      0: {
        name: "fun",
        decl: { start: { line: 1, column: 9 }, end: { line: 1, column: 12 } },
        loc: { start: { line: 1, column: 20 }, end: { line: 4, column: 1 } },
        line: 1,
      },
      1: {
        name: "printTips",
        decl: { start: { line: 5, column: 9 }, end: { line: 5, column: 18 } },
        loc: { start: { line: 5, column: 34 }, end: { line: 22, column: 1 } },
        line: 5,
      },
    },
    branchMap: {
      0: {
        loc: { start: { line: 7, column: 2 }, end: { line: 21, column: 3 } },
        type: "if",
        locations: [
          { start: { line: 7, column: 2 }, end: { line: 21, column: 3 } },
          { start: { line: 15, column: 9 }, end: { line: 21, column: 3 } },
        ],
        line: 7,
      },
      1: {
        loc: { start: { line: 7, column: 6 }, end: { line: 7, column: 65 } },
        type: "binary-expr",
        locations: [
          { start: { line: 7, column: 6 }, end: { line: 7, column: 21 } },
          { start: { line: 7, column: 25 }, end: { line: 7, column: 38 } },
          { start: { line: 7, column: 42 }, end: { line: 7, column: 65 } },
        ],
        line: 7,
      },
      2: {
        loc: { start: { line: 8, column: 4 }, end: { line: 14, column: 5 } },
        type: "if",
        locations: [
          { start: { line: 8, column: 4 }, end: { line: 14, column: 5 } },
          { start: { line: 11, column: 11 }, end: { line: 14, column: 5 } },
        ],
        line: 8,
      },
      3: {
        loc: { start: { line: 15, column: 9 }, end: { line: 21, column: 3 } },
        type: "if",
        locations: [
          { start: { line: 15, column: 9 }, end: { line: 21, column: 3 } },
          { start: { line: 18, column: 9 }, end: { line: 21, column: 3 } },
        ],
        line: 15,
      },
    },
    s: {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
      10: 0,
      11: 0,
      12: 0,
      13: 0,
    },
    f: { 0: 0, 1: 0 },
    b: { 0: [0, 0], 1: [0, 0, 0], 2: [0, 0], 3: [0, 0] },
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "66645059ad46ebf75bf554b51ff24891dc4efca2",
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_20rlhpc6w4 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_20rlhpc6w4();
function fun(check) {
  cov_20rlhpc6w4().f[0]++;
  cov_20rlhpc6w4().s[0]++;
  console.log("Hello World");
  cov_20rlhpc6w4().s[1]++;
  return check;
}
function printTips(check, check2) {
  cov_20rlhpc6w4().f[1]++;
  let tips =
    (cov_20rlhpc6w4().s[2]++,
    [
      "Click on any AST node with a '+' to expand it",
      "Hovering over a node highlights the corresponding location in the source code",
      "Shift click on an AST node to expand the whole subtree",
    ]);
  cov_20rlhpc6w4().s[3]++;
  if (
    (cov_20rlhpc6w4().b[1][0]++, check == "KILL") ||
    (cov_20rlhpc6w4().b[1][1]++, check == "ME") ||
    (cov_20rlhpc6w4().b[1][2]++, check === "Hello World")
  ) {
    cov_20rlhpc6w4().b[0][0]++;
    cov_20rlhpc6w4().s[4]++;
    if (check === "Hello World") {
      cov_20rlhpc6w4().b[2][0]++;
      cov_20rlhpc6w4().s[5]++;
      console.log("Hello World");
      cov_20rlhpc6w4().s[6]++;
      return check2;
    } else {
      cov_20rlhpc6w4().b[2][1]++;
      cov_20rlhpc6w4().s[7]++;
      console.log("Bye World");
      cov_20rlhpc6w4().s[8]++;
      return check2;
    }
  } else {
    cov_20rlhpc6w4().b[0][1]++;
    cov_20rlhpc6w4().s[9]++;
    if (check !== "Hello World") {
      cov_20rlhpc6w4().b[3][0]++;
      cov_20rlhpc6w4().s[10]++;
      console.log("Bye World");
      cov_20rlhpc6w4().s[11]++;
      return check2;
    } else {
      cov_20rlhpc6w4().b[3][1]++;
      cov_20rlhpc6w4().s[12]++;
      fun(check2);
      cov_20rlhpc6w4().s[13]++;
      console.log("Hello World");
    }
  }
}
