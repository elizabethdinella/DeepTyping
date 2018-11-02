"use strict";
const ts = require("typescript");
const fs = require("fs");
const path = require("path");


var removableLexicalKinds = [
	ts.SyntaxKind.EndOfFileToken,
	ts.SyntaxKind.NewLineTrivia,
	ts.SyntaxKind.WhitespaceTrivia
];

let root = "data/Repos-cleaned";

const NUM_FILES_TO_EXPLORE = 10;
let num_files_explored = 0;
let outerObj = {
	"files": []	
};

fs.readdirSync(root).forEach(org => fs.readdirSync(root + "/" + org).forEach(project => traverseProject(org, project, outerObj)));
if(outerObj.files.length > 0){
	console.log(JSON.stringify(outerObj));
}

function traverseProject(org, project, _outerObj) {
	// This project stalls forever
	if (org == "SAP") return
		let dir = root + "/" + org + "/" + project;
	traverse(dir, _outerObj);
}

function traverse(dir, _outerObj) {
	var children = fs.readdirSync(dir);
	if (children.find(value => value == "tsconfig.json")) {
		// We extract two aligned sequences: the 'true' ones from the initial pass and the tsc+CheckJS derived ones from this pass (without true annotations)

		if (num_files_explored < NUM_FILES_TO_EXPLORE) {
			let fileObjs = [];
			extractAlignedSequences(dir, fileObjs);
			_outerObj.files = _outerObj.files.concat(fileObjs);
		}else {
			return;
		}
	}

}

function extractAlignedSequences(inputDirectory, fileObjs) {

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
			let canInferNames = [];
			extractTokens(sourceFile, checker, cantInfer, canInfer, canInferNames);
			num_files_explored += 1;
			//console.log(cantInfer.length)

			var obj = {
				"filename": fname,
				"typed_idents":  canInfer,
				"untyped_idents": cantInfer
			}

			fileObjs.push(obj);
			//console.log(fileObjs.length);
			//console.log(JSON.stringify(obj));
		}
		catch (e) {
			//console.log(e);
			//console.log("Error parsing file " + filename);
		}
	}

}

function extractTokens(tree, checker, cantInfer, canInfer, canInferNames) {
	const keywords = ["async", "await", "break", "continue", "class", "extends", "constructor", "super", "extends", "const", "let", "var", "debugger", "delete", "do", "while", "export", "import", "for", "each", "in", "of", "function", "return", "get", "set", "if", "else", "instanceof", "typeof", "null", "undefined", "switch", "case", "default", "this", "true", "false", "try", "catch", "finally", "void", "yield", "any", "boolean", "null", "never", "number", "string", "symbol", "undefined", "void", "as", "is", "enum", "type", "interface", "abstract", "implements", "static", "readonly", "private", "protected", "public", "declare", "module", "namespace", "require", "from", "of", "package"];

	for (var i in tree.getChildren()) {
		var ix = parseInt(i);
		var child = tree.getChildren()[ix];
		if (removableLexicalKinds.indexOf(child.kind) != -1 ||
				ts.SyntaxKind[child.kind].indexOf("JSDoc") != -1) {
			continue;
		}
		if (child.getChildCount() == 0) {
			var source = child.getText();
			if(cantInfer.indexOf(source) >= 0 || keywords.indexOf(source) >= 0 || canInfer.indexOf(source) >= 0) continue;

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
						canInferNames.push(source);
					}

				}
				catch (e) { }
			}
		}
		extractTokens(child, checker, cantInfer, canInfer, canInferNames);
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
			//console.error("Error processing " + file);
			}
			});
	return filelist;
}
;
