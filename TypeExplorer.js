"use strict";
const ts = require("typescript");
const fs = require("fs");
const path = require("path");
function print(x) { console.log(x); }
var removableLexicalKinds = [
	ts.SyntaxKind.EndOfFileToken,
	ts.SyntaxKind.NewLineTrivia,
	ts.SyntaxKind.WhitespaceTrivia
];
var templateKinds = [
	ts.SyntaxKind.TemplateHead,
	ts.SyntaxKind.TemplateMiddle,
	ts.SyntaxKind.TemplateSpan,
	ts.SyntaxKind.TemplateTail,
	ts.SyntaxKind.TemplateExpression,
	ts.SyntaxKind.TaggedTemplateExpression,
	ts.SyntaxKind.FirstTemplateToken,
	ts.SyntaxKind.LastTemplateToken,
	ts.SyntaxKind.TemplateMiddle
];

let root = "data/Repos-cleaned";
let outputDirGold = "data/outputs-gold/";
let outputDirAll = "data/outputs-all/";
let outputDirCheckJS = "data/outputs-checkjs/";

const ANY_THRESHOLD = 0.2;
const NUM_FILES_TO_EXPLORE = 10;
let num_files_explored = 0;

fs.readdirSync(root).forEach(org => fs.readdirSync(root + "/" + org).forEach(project => traverseProject(org, project)));

function traverseProject(org, project) {
	// This project stalls forever
	if (org == "SAP") return
		let dir = root + "/" + org + "/" + project;
	let projectTokens = traverse(dir);
}

function traverse(dir) {
	var children = fs.readdirSync(dir);
	let projectTokens = [[], [], []];
	if (children.find(value => value == "tsconfig.json")) {
		// We extract two aligned sequences: the 'true' ones from the initial pass and the tsc+CheckJS derived ones from this pass (without true annotations)

	        if (num_files_explored < NUM_FILES_TO_EXPLORE){
			let fileContents = extractAlignedSequences(dir);
		}
	}
	else {
		children.forEach(function (file) {
				let fullPath = dir + "/" + file;
				try {
				if (fs.statSync(fullPath).isDirectory()) {
				fullPath.indexOf("DefinitelyTyped")
				if (fullPath.indexOf("DefinitelyTyped") < 0 && fullPath.indexOf("TypeScript/tests") < 0 && file != ".git") {
				projectTokens = projectTokens.concat(traverse(fullPath));
				}
				else {
				print("Skipping: " + fullPath);
				}
				}
				}
				catch (err) {
				print("Error processing " + fullPath)
				}
				});
	}
	return projectTokens;
}
function extractAlignedSequences(inputDirectory) {

	let files = [];
	walkSync(inputDirectory, files);
	let program = ts.createProgram(files, { target: ts.ScriptTarget.Latest, module: ts.ModuleKind.CommonJS, checkJs: true, allowJs: true });
	let checker = null;
	try {
		checker = program.getTypeChecker();
	}
	catch (err) {
		return null;
	}
	let fileContents = [[], [], []];

	for (const sourceFile of program.getSourceFiles()) {
		let filename = sourceFile.getSourceFile().fileName;
		if (filename.endsWith('.d.ts')) continue;

		try {
			let relativePath = path.relative(inputDirectory, filename);
			if (relativePath.startsWith("..")) continue;
			if (num_files_explored >= NUM_FILES_TO_EXPLORE) return;

			let fname = filename.replace("Repos-cleaned", "Repos");
			//console.log("checking filename: ", fname);
			
			let cantInfer = [];
			let canInfer = [];
			extractTokens(sourceFile, checker, cantInfer, canInfer);
			num_files_explored += 1;
			//console.log(cantInfer)

			var obj = {
				"filename": fname,
				"typed_idents":  canInfer,
				"untyped_idents": cantInfer
			}

			console.log(JSON.stringify(obj));
		}
		catch (e) {
			console.log(e);
			console.log("Error parsing file " + filename);
		}
	}

	return fileContents;
}
function extractTokens(tree, checker, cantInfer, canInfer) {
	const keywords = ["async", "await", "break", "continue", "class", "extends", "constructor", "super", "extends", "const", "let", "var", "debugger", "delete", "do", "while", "export", "import", "for", "each", "in", "of", "function", "return", "get", "set", "if", "else", "instanceof", "typeof", "null", "undefined", "switch", "case", "default", "this", "true", "false", "try", "catch", "finally", "void", "yield", "any", "boolean", "null", "never", "number", "string", "symbol", "undefined", "void", "as", "is", "enum", "type", "interface", "abstract", "implements", "static", "readonly", "private", "protected", "public", "declare", "module", "namespace", "require", "from", "of", "package"];

	var justPopped = false;
	for (var i in tree.getChildren()) {
		var ix = parseInt(i);
		var child = tree.getChildren()[ix];
		if (removableLexicalKinds.indexOf(child.kind) != -1 ||
				ts.SyntaxKind[child.kind].indexOf("JSDoc") != -1) {
			continue;
		}
		if (child.getChildCount() == 0) {
			var source = child.getText();
			if(cantInfer.indexOf(source) >= 0 || keywords.indexOf(source) >= 0) continue;

			if (child.kind === ts.SyntaxKind.Identifier) {
				try {
					let symbol = checker.getSymbolAtLocation(child);
					if (!symbol) {
						//console.log("can't infer type of identifier because symbol doesn't exist?: ", source);
						//cantInfer.push(source);
						break;
					}

					let type = checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, child));
					if (type === "any") {
						//console.log("can't infer type of identifier: ", source);
						cantInfer.push(source);
					} 
					else {
						var typed_ident = {
							"name": source,
							"type":	type
						}
						canInfer.push(typed_ident);
					}

				}
				catch (e) { }
			}
		}
		extractTokens(child, checker, cantInfer, canInfer);
	}
}

function walkSync(dir, filelist) {
	var fs = fs || require('fs'), files = fs.readdirSync(dir);
	filelist = filelist || [];
	files.forEach(function (file) {
			let fullPath = path.join(dir, file);
			try {
			if (fs.statSync(fullPath).isDirectory()) {
			if (file != ".git")
			filelist = walkSync(dir + '/' + file, filelist);
			}
			else if (file.endsWith('.js') || file.endsWith('.ts')) {
			if (fs.statSync(fullPath).size < 1*1000*1000)
			filelist.push(fullPath);
			}
			}
			catch (e) {
			console.error("Error processing " + file);
			}
			});
	return filelist;
}
;
