import { parse } from "@babel/parser";
import { readFileSync, writeFileSync } from "fs";
import pkg from "@babel/traverse";
import pkg2 from "@babel/generator";
import * as istanbul from 'istanbul-lib-instrument';
import vm from "vm";
const { default: traverse } = pkg;
const { default: generate } = pkg2;


function Statement_Cov() {
    const code = readFileSync('../server/Utils/Test_Codes/Test_Code.js', "utf8");
    const ast = parse(code, {
        sourceType: "module",
        plugins: ["jsx"]
    });
    const globalVariableNodes = [];
    traverse(ast, {
        VariableDeclaration(path) {
            if (path.parent.type === 'Program') {
                path.node.declarations.forEach(declaration => {
                    globalVariableNodes.push({
                        kind: path.node.kind,
                        declarations: [declaration],
                    });
                });
            }
        },
    });
    let globalVariableCode = "";

    globalVariableCode = globalVariableNodes.map(node => {
        const kind = node.kind;
        const declarations = node.declarations.map(declaration => {
            const variableName = declaration.id.name;
            let variableValue = null;
            if (declaration.init) {
                variableValue = generate(declaration.init).code;
            }
            return `${variableName} = ${variableValue}`;
        });
        return `${kind} ${declarations.join(', ')};`;
    }).join('\n');
    globalVariableCode += "\n";

    const CallFunctions = [];
    const FunctionCalls = [];
    const DeadFunctions = [];
    traverse(ast, {
        FunctionDeclaration(path) {
            const callerFunction = path.node.id.name;
            CallFunctions.push({
                name: callerFunction,
                ast: {
                    type: 'Program',
                    body: [path.node],
                }
            });
            const functionsCalledByCurrent = [];
            path.traverse({
                CallExpression(callPath) {
                    if (callPath.node.callee.name) {
                        const calledFunction = callPath.node.callee.name;
                        if (calledFunction !== callerFunction) {
                            functionsCalledByCurrent.push({ callerFunction, calledFunction });
                            const deadFunctionIndex = DeadFunctions.indexOf(calledFunction);
                            if (deadFunctionIndex !== -1) {
                                DeadFunctions.splice(deadFunctionIndex, 1);
                            }
                        }
                    }
                },
            });
            if (functionsCalledByCurrent.length > 0) {
                FunctionCalls.push(...functionsCalledByCurrent);
            }
            DeadFunctions.push(callerFunction);
        },
    });
    function RemoveDuplicates(Functions) {
        for (let i = 0; i < Functions.length; i++) {
            for (let j = i + 1; j < Functions.length; j++) {
                if (Functions[i] == Functions[j]) {
                    Functions.splice(j, 1);
                    j--;
                }
            }
        }
    }

    function extractBinaryExpression(node) {
        switch (node.type) {
            case 'BinaryExpression':
                return {
                    type: 'binaryExpression',
                    operator: node.operator,
                    left: extractBinaryExpression(node.left),
                    right: extractBinaryExpression(node.right),
                };
            case 'LogicalExpression':
                return {
                    type: 'logicalExpression',
                    operator: node.operator,
                    left: extractBinaryExpression(node.left),
                    right: extractBinaryExpression(node.right),
                };
            case 'Identifier':
                return { type: 'identifier', value: node.name };
            case 'StringLiteral':
                return { type: 'String', value: node.value };
            case 'NumericLiteral':
                return { type: 'Number', value: node.value };
            default:
                return null;
        }
    }


    const Statement_Coverage = [];
    let Test_Cases = [];
    const Best_Test_Case = [];

    function SaveCoverage(coverage, name, code) {
        let flag = false;
        Statement_Coverage.forEach((stat) => {
            if (stat.name === name) {
                flag = true;
                return;
            }
        });
        if (flag === true) { return; }
        const context = vm.createContext();
        vm.runInContext(code, context);
        const stat_coverage = context[coverage]();
        Statement_Coverage.push({
            name: name,
            coverage: stat_coverage.s,
            Actual_Coverage: {},
        });
    };

    function generateRandomArray(values, size) {
        const randomArray = [];
        for (let i = 0; i < size; i++) {
            const randomIndex = Math.floor(Math.random() * values.length);
            const randomValue = values[randomIndex];
            randomArray.push(randomValue);
        }
        return randomArray;
    }

    function ExecuteTestCases(Arguments, Function_Name, FunctionCalls) {
        const code = readFileSync("../server/Utils/Temp/instrumented_code.js", "utf8");
        const functionPattern1 = /function (\w+)/g;
        const matches = [...code.matchAll(functionPattern1)];
        const context = vm.createContext();
        vm.runInContext(code, context);
        context[Function_Name](...Arguments);
        const stat_coverage = context[matches[0][1]]();
        Test_Cases.push({
            name: Function_Name,
            functions_called: FunctionCalls,
            Arguments: Arguments,
            coverage: stat_coverage.s,
        });
    }

    function Select_Best_Test_Case(Function_Order, Function_Name) {
        const Temp_Test_Cases = [];
        const Mapped_Coverages = new Set();
        const Coverage_Separation = [];
        Function_Order.forEach((call) => {
            Statement_Coverage.forEach((stat) => {
                if (stat.name === call) {
                    Coverage_Separation.push(Object.keys(stat.coverage).length);
                }
            });
        });
        Test_Cases.forEach((test) => {
            const coverageString = JSON.stringify(test.coverage);
            if (!Mapped_Coverages.has(coverageString)) {
                Mapped_Coverages.add(coverageString);
                Temp_Test_Cases.push(test);
            }
        });
        const Coverage_Mapping = {};
        for (const key in Test_Cases[0].coverage) {
            Coverage_Mapping[key] = 0;
        }
        Temp_Test_Cases.forEach((test) => {
            for (const key in test.coverage) {
                if (test.coverage[key] > 0) {
                    Coverage_Mapping[key] = 1;
                }
            }
        });
        let totalStatements = 0;
        let coveredStatements = 0;
        for (const key in Coverage_Mapping) {
            totalStatements++;
            if (Coverage_Mapping[key] > 0) {
                coveredStatements++;
            }
        }
        let i = 0;
        Coverage_Separation.forEach((sep, index) => {
            const Function_Index = Statement_Coverage.findIndex((stat) => stat.name === Function_Order[index]);
            for (let j = 0; j < sep; j++) {
                Statement_Coverage[Function_Index].Actual_Coverage[j] = Coverage_Mapping[i];
                i++;
            }
        });
        Best_Test_Case.push({
            name: Function_Name,
            coverage: Coverage_Mapping,
            percentage: ((coveredStatements / totalStatements) * 100),
            coveredStatements: coveredStatements,
            totalStatements: totalStatements,
            Test_Cases: Temp_Test_Cases,
        });
        return ((coveredStatements / totalStatements) * 100);
    }
    DeadFunctions.forEach((func) => {
        Test_Cases = [];
        const AllCalled = [];
        FunctionCalls.forEach((call) => {
            if (call.callerFunction === func) {
                AllCalled.push(call.calledFunction);
            }
        });
        let flag = true;
        do {
            flag = false;
            AllCalled.forEach((call) => {
                FunctionCalls.forEach((call2) => {
                    if (call2.callerFunction === call) {
                        let check = AllCalled.indexOf(call2.calledFunction);
                        if (check === -1) {
                            AllCalled.unshift(call2.calledFunction);
                            flag = true;
                        }
                    }
                });
            });
        } while (flag !== false);

        RemoveDuplicates(AllCalled);
        const Function_Order = [];
        const ifstatements = [];
        let Tempstatements = [];
        const Prediction_Values = [];
        const If_Spaces = [];
        let targetFunctionNode;
        AllCalled.forEach((call) => {
            Tempstatements = [];
            traverse(ast, {
                FunctionDeclaration(path) {
                    if (path.node.id.name === call) {
                        targetFunctionNode = path.node;
                        const scope = path.scope;
                        const parentPath = path.parentPath;
                        traverse(targetFunctionNode, {
                            IfStatement(innerPath) {
                                const condition = extractBinaryExpression(innerPath.node.test);
                                const ifStatementNode = {
                                    condition,
                                    body: [],
                                };
                                traverse(innerPath.node, {
                                    IfStatement(nestedPath) {
                                        ifStatementNode.body.push({
                                            type: 'nestedIf',
                                            data: {
                                                condition: extractBinaryExpression(nestedPath.node.test),
                                                body: [],
                                            },
                                        });
                                        nestedPath.skip();
                                    },
                                    BinaryExpression(nestedPath) {
                                        ifStatementNode.body.push({
                                            type: 'binaryExpression',
                                            data: extractBinaryExpression(nestedPath.node),
                                        });
                                    },
                                }, scope, innerPath);
                                Tempstatements.push(ifStatementNode);
                                if (innerPath.node.alternate && innerPath.node.alternate.type === 'BlockStatement') {
                                    Tempstatements.push({
                                        condition: {
                                            type: 'else',
                                        },
                                        body: [],
                                    });
                                }
                            },
                        }, scope, parentPath);
                    }
                },
            });
            ifstatements.push(Tempstatements);
            Function_Order.push(call);
        });
        Tempstatements = [];
        let Parameter = 0;
        traverse(ast, {
            FunctionDeclaration(path) {
                if (path.node.id.name === func) {
                    targetFunctionNode = path.node;
                    const scope = path.scope;
                    const parentPath = path.parentPath;
                    Parameter = path.node.params.length;
                    traverse(targetFunctionNode, {
                        IfStatement(innerPath) {
                            const condition = extractBinaryExpression(innerPath.node.test);
                            const ifStatementNode = {
                                condition,
                                body: [],
                            };
                            traverse(innerPath.node, {
                                IfStatement(nestedPath) {
                                    ifStatementNode.body.push({
                                        type: 'nestedIf',
                                        data: {
                                            condition: extractBinaryExpression(nestedPath.node.test),
                                            body: [],
                                        },
                                    });
                                    nestedPath.skip();
                                },
                                BinaryExpression(nestedPath) {
                                    ifStatementNode.body.push({
                                        type: 'binaryExpression',
                                        data: extractBinaryExpression(nestedPath.node),
                                    });
                                },
                            }, scope, innerPath);
                            Tempstatements.push(ifStatementNode);
                            if (innerPath.node.alternate && innerPath.node.alternate.type === 'BlockStatement') {
                                Tempstatements.push({
                                    condition: {
                                        type: 'else',
                                    },
                                    body: [],
                                });
                            }
                        },
                    }, scope, parentPath);
                }
            },
        });
        ifstatements.push(Tempstatements);
        Function_Order.push(func);
        ifstatements.forEach((ifstatement) => {
            const Values = [];
            const Spaces = [];
            function printCondition(condition) {
                if (condition.type === 'binaryExpression') {
                    if (condition.left.type === 'String' || condition.left.type === 'Number') {
                        Values.push(condition.left.value);
                    }
                    if (condition.right.type === 'String' || condition.right.type === 'Number') {
                        Values.push(condition.right.value);
                    }
                } else if (condition.type === 'logicalExpression') {
                    printCondition(condition.left);
                    printCondition(condition.right);
                }
            }
            function printIfStatement(ifStatement) {
                if (ifStatement.condition.type === 'binaryExpression') {
                    Spaces.push(1);
                }
                else if (ifStatement.condition.type === 'logicalExpression') {
                    Spaces.push(2);
                }
                else {
                    Spaces.push(0);
                }
                printCondition(ifStatement.condition);
            }
            ifstatement.forEach(printIfStatement);
            Prediction_Values.push(...Values);
            If_Spaces.push(Spaces);
        });
        RemoveDuplicates(Prediction_Values);
        //console.log(Prediction_Values);
        //console.log(If_Spaces);
        //console.log(Function_Order);
        let code = "";
        Function_Order.forEach((call) => {
            const FunctionAst = CallFunctions.find((func) => func.name === call).ast;
            const FunctionCode = generate(FunctionAst).code;
            const instrumenter = new istanbul.createInstrumenter();
            const instrumentedCode = instrumenter.instrumentSync(FunctionCode, '../server/Utils/Test_Codes/Test_Code.js');
            const functionPattern1 = /function (\w+)/g;
            const matches = [...instrumentedCode.matchAll(functionPattern1)];
            SaveCoverage(matches[0][1], matches[1][1], instrumentedCode);
            code += FunctionCode;
            code += '\n';
        });
        //console.log(code);
        function saveInstrumentedCode(instrumentedCode) {
            const tempFilePath = `../server/Utils/Temp/instrumented_code.js`;

            try {
                writeFileSync(tempFilePath, instrumentedCode);
                //console.log(`Instrumented code saved to: ${tempFilePath}`);
            } catch (error) {
                console.error(`Error saving instrumented code: ${error.message}`);
            }
        }
        const instrumenter = new istanbul.createInstrumenter();
        const instrumentedCode = globalVariableCode + "\n" + instrumenter.instrumentSync(code, '../server/Utils/Test_Codes/Test_Code.js');
        saveInstrumentedCode(instrumentedCode);
        if (Prediction_Values.length > 0) {
            Prediction_Values.push("garbage");
            for (let index = 0; index < 100; index++) {
                Prediction_Values.push(Math.floor(Math.random() * 10000));
            }
        }
        else {
            for (let index = 0; index < 1000; index++) {
                Prediction_Values.push(Math.floor(Math.random() * 10000000));
            }
        }
        const Functions_Called = Function_Order.filter((call) => call !== func);
        for (let index = 0; index < 1000; index++) {
            ExecuteTestCases(generateRandomArray(Prediction_Values, Parameter), func, Functions_Called);
        }
        Select_Best_Test_Case(Function_Order, func);
    });

    const Final_Result = {
        Coverages: Statement_Coverage,
        Test_Cases: Best_Test_Case,
    };
    return Final_Result;
}

export default Statement_Cov;