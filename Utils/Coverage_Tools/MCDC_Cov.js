import { parse } from "@babel/parser";
import { readFileSync, writeFileSync } from "fs";
import pkg from "@babel/traverse";
import pkg2 from "@babel/generator";
import * as istanbul from 'istanbul-lib-instrument';
import vm from "vm";
const { default: traverse } = pkg;
const { default: generate } = pkg2;

function MCDC_Cov() {
    const code = readFileSync("../server/Utils/Test_Codes/Test_Code.js", "utf8");
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

    function extractValue(node) {
        switch (node.type) {
            case 'StringLiteral':
            case 'NumericLiteral':
                return node.value;
            case 'ArrayExpression':
                return node.elements.map(element => extractValue(element));
            case 'ObjectExpression':
                const object = {};
                node.properties.forEach(property => {
                    object[property.key.value] = extractValue(property.value);
                });
                return object;
            default:
                return null;
        }
    }

    const MCDC = [];
    let Test_Cases = [];
    const Best_Test_Case = [];

    function removeAndFillObject(data, index) {
        const keys = Object.keys(data);
        const removedObject = data[keys[index]];
        delete data[keys[index]];
        for (let i = index; i < keys.length - 1; i++) {
            data[keys[i]] = data[keys[i + 1]];
        }
        delete data[keys[keys.length - 1]];

        return removedObject;
    }

    function SaveCoverage(coverage, name, code, Spaces) {
        let flag = false;
        MCDC.forEach((stat) => {
            if (stat.name === name) {
                flag = true;
                return;
            }
        });
        if (flag === true) { return; }
        const context = vm.createContext();
        vm.runInContext(code, context);
        const stat_coverage = context[coverage]();
        Spaces.forEach((space, index) => {
            if (space === 2) {
                removeAndFillObject(stat_coverage.b, index);
            }
        });
        MCDC.push({
            name: name,
            coverage: stat_coverage.b,
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

    function ExecuteTestCases(Arguments, Function_Name, FunctionCalls, If_Spaces) {
        const code = readFileSync("../server/Utils/Temp/instrumented_code_mc.js", "utf8");
        const functionPattern1 = /function (\w+)/g;
        const matches = [...code.matchAll(functionPattern1)];
        const context = vm.createContext();
        vm.runInContext(code, context);
        context[Function_Name](...Arguments);
        const branch_covrage = context[matches[0][1]]();
        let index_b = 0;
        If_Spaces.forEach((space, index) => {
            space.forEach((space2, index2) => {
                if (space2 === 2) {
                    removeAndFillObject(branch_covrage.b, index2);
                }
                index_b++;
            });
        });
        Test_Cases.push({
            name: Function_Name,
            functions_called: FunctionCalls,
            Arguments: Arguments,
            coverage: branch_covrage.b,
        });
    }

    function createArrayOfZeros(size) {
        return Array(size).fill(0);
    }

    function Select_Best_Test_Case(Function_Order, Function_Name, Spaces) {
        const Temp_Test_Cases = [];
        const Mapped_Coverages = new Set();
        const Coverage_Separation = [];
        Test_Cases.forEach((test) => {
            const coverageString = JSON.stringify(test.coverage);
            if (!Mapped_Coverages.has(coverageString)) {
                let flag = false;
                for (const key in test.coverage) {
                    test.coverage[key].forEach((value, index) => {
                        if (value === 1) {
                            flag = true;
                        }
                    });
                }
                if (flag === true) {
                    Mapped_Coverages.add(coverageString);
                    Temp_Test_Cases.push(test);
                }
            }
        });
        const Coverage_Mapping = {};
        for (const key in Test_Cases[0].coverage) {
            Coverage_Mapping[key] = createArrayOfZeros(Test_Cases[0].coverage[key].length);
        }
        Temp_Test_Cases.forEach((test) => {
            for (const key in test.coverage) {
                test.coverage[key].forEach((value, index) => {
                    if (value === 1) {
                        Coverage_Mapping[key][index] = 1;
                    }
                });
            }
        });
        let index_b = 0;
        Spaces.forEach((space, index) => {
            const index2 = MCDC.findIndex((stat) => stat.name === Function_Order[index]);
            const length_of_space = Object.keys(MCDC[index2].coverage).length;
            for (let i = 0; i < length_of_space; i++) {
                MCDC[index2].Actual_Coverage[i] = Coverage_Mapping[index_b];
                index_b++;
            }
        });
        Best_Test_Case.push({
            name: Function_Name,
            coverage: Coverage_Mapping,
            Test_Cases: Temp_Test_Cases,
        });
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
        let Falg = false;
        ifstatements.forEach((ifstatement) => {
            if (ifstatement.length > 0) {
                Falg = true;
            }
        });
        let code = "";
        Function_Order.forEach((call, index) => {
            const FunctionAst = CallFunctions.find((func) => func.name === call).ast;
            const FunctionCode = generate(FunctionAst).code;
            const instrumenter = new istanbul.createInstrumenter();
            const instrumentedCode = instrumenter.instrumentSync(FunctionCode, '../server/Utils/Test_Codes/Test_Code.js');
            const functionPattern1 = /function (\w+)/g;
            const matches = [...instrumentedCode.matchAll(functionPattern1)];
            SaveCoverage(matches[0][1], matches[1][1], instrumentedCode, If_Spaces[index]);
            code += FunctionCode;
            code += '\n';
        });
        if (Falg === true) {
            //console.log(code);
            function saveInstrumentedCode(instrumentedCode) {
                const tempFilePath = `../server/Utils/Temp/instrumented_code_mc.js`;

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
                for (let index = 0; index < 10000000; index++) {
                    Prediction_Values.push(Math.floor(Math.random() * 10000000));
                }
            }
            const Functions_Called = Function_Order.filter((call) => call !== func);
            for (let index = 0; index < 1000; index++) {
                ExecuteTestCases(generateRandomArray(Prediction_Values, Parameter), func, Functions_Called, If_Spaces);
            }
            Select_Best_Test_Case(Function_Order, func, If_Spaces);
        }
        else {
            Best_Test_Case.push({
                name: func,
                coverage: {},
                Test_Cases: [],
                Message: "Coverage is not possible",
            });
        }
    });

    const Final_Result = {
        MCDC: MCDC,
        Test_Cases: Best_Test_Case,
    };

    return Final_Result;
}

export default MCDC_Cov;
