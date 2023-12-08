let i = 0;
const check = "Hello World";

function cov_20rlhpc6w4() {
  var path = "../server/Utils/Test_Codes/Test_Code.js";
  var hash = "24b650341b928ecfffceab641cc565228d0d6b50";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "../server/Utils/Test_Codes/Test_Code.js",
    statementMap: {
      0: { start: { line: 2, column: 2 }, end: { line: 2, column: 29 } },
      1: { start: { line: 3, column: 2 }, end: { line: 3, column: 21 } },
    },
    fnMap: {
      0: {
        name: "printTips2",
        decl: { start: { line: 1, column: 9 }, end: { line: 1, column: 19 } },
        loc: { start: { line: 1, column: 35 }, end: { line: 4, column: 1 } },
        line: 1,
      },
    },
    branchMap: {},
    s: { 0: 0, 1: 0 },
    f: { 0: 0 },
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "24b650341b928ecfffceab641cc565228d0d6b50",
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
function printTips2(check, check2) {
  cov_20rlhpc6w4().f[0]++;
  cov_20rlhpc6w4().s[0]++;
  console.log("Hello World");
  cov_20rlhpc6w4().s[1]++;
  console.log("Bye");
}
