"use strict";
const ts = require("typescript");
const fs = require("fs");
const path = require("path");

var debugPrint = false;

var removableLexicalKinds = [
	ts.SyntaxKind.EndOfFileToken,
	ts.SyntaxKind.NewLineTrivia,
	ts.SyntaxKind.WhitespaceTrivia
];

let root = "data/Repos";

//const NUM_FILES_TO_EXPLORE = 4000;
const NUM_FILES_TO_EXPLORE = 5;

var num_files_explored = 0;
var num_files_explored_JS = 0;

let outerObj = {
	"files": []	
};

let outerObjJS = {
	"files": []	
};

var jsfiles = [];

fs.readdirSync(root).forEach(org => fs.readdirSync(root + "/" + org).forEach(project => traverseProject(org, project, outerObj, outerObjJS)));

let numTyped = 0;
let numUntyped = 0;

let numTyped_JS = 0;
let numUntyped_JS = 0;

outerObj.files.forEach(function(fileObj){
	numTyped += fileObj.typed_idents.length;
	numUntyped += fileObj.untyped_idents.length;
});

outerObjJS.files.forEach(function(fileObj){
	numTyped_JS += fileObj.typed_idents.length;
	numUntyped_JS += fileObj.untyped_idents.length;
});


let total = numTyped + numUntyped;
console.log("total typed TS", numTyped);
console.log("total untyped TS", numUntyped);
console.log("percent untyped TS:", numUntyped/ total * 100);
console.log("precent typed TS:", numTyped / total * 100);
console.log();

console.log("total typed JS:", numTyped_JS);
console.log("total untyped JS:", numUntyped_JS);
console.log("percent untyped JS:", numUntyped_JS/ total * 100);
console.log("precent typed JS:", numTyped_JS / total * 100);
console.log();

console.log("sanity check:");
console.log("same num files analyzed:", num_files_explored === num_files_explored_JS);
console.log("same files:", "fix this");


/*
if(outerObj.files.length > 0){
	console.log(JSON.stringify(outerObj));
}
*/

function traverseProject(org, project, _outerObj, _outerObjJS) {
	// This project stalls forever
	if (org == "SAP") return
		let dir = root + "/" + org + "/" + project;
	if(num_files_explored < NUM_FILES_TO_EXPLORE){
		let exp_nums = traverse(dir, _outerObj, _outerObjJS, num_files_explored, num_files_explored_JS);
		num_files_explored = exp_nums[0];
		num_files_explored_JS = exp_nums[1];
	}
}

function traverse(dir, _outerObj, _outerObjJS, numFilesExplored, numFilesExploredJS) {
	var children = fs.readdirSync(dir);
	if (children.find(value => value == "tsconfig.json")) {
		// We extract two aligned sequences: the 'true' ones from the initial pass and the tsc+CheckJS derived ones from this pass (without true annotations)

		const tsFilesAnalyzed = new Map();
		//console.log("traverse", numFilesExplored);
		if (numFilesExplored < NUM_FILES_TO_EXPLORE) {
			let fileObjs = [];
			numFilesExplored = extractAlignedSequences(dir, fileObjs, tsFilesAnalyzed, numFilesExplored);
			_outerObj.files = _outerObj.files.concat(fileObjs);
			
			let jsFileObjs = [];
			numFilesExploredJS = extractAlignedSequencesJS(dir, jsFileObjs, tsFilesAnalyzed, numFilesExploredJS);
			_outerObjJS.files =_outerObjJS.files.concat(jsFileObjs);
		}else {
			return [numFilesExplored, numFilesExploredJS];
		}
	}

	return [numFilesExplored, numFilesExploredJS];
}

function extractHelper(inputDirectory, files, fileObjs, numFilesExplored){
	let options = { target: ts.ScriptTarget.Latest, module: ts.ModuleKind.CommonJS, checkJs: true, allowJs: true }
	let program = ts.createProgram(files, options);

 	//let result = ts.transpileModule(files, options);	
	//jsfiles.push(JSON.stringify(result));

	let checker = null;
	try {
		checker = program.getTypeChecker();
	}
	catch (err) {
		return numFilesExplored;
	}

	for (const sourceFile of program.getSourceFiles()) {
		let filename = sourceFile.getSourceFile().fileName;
		if (filename.endsWith('.d.ts')) continue;

		try {
			let relativePath = path.relative(inputDirectory, filename);
			if (relativePath.startsWith("..")) continue;
			if (numFilesExplored >= NUM_FILES_TO_EXPLORE) return numFilesExplored;
			//console.log(numFilesExplored, NUM_FILES_TO_EXPLORE);

			let fname = filename.replace("Repos-cleaned", "Repos");
			//console.log("checking filename: ", fname);

			let cantInfer = [];
			let canInfer = [];
			let canInferNames = [];
			let cantInferNames = [];
			//debugPrint = filename.includes("node_modules/diff/lib/diff/sentence.js");
			extractTokens(sourceFile, checker, cantInfer, canInfer, canInferNames, cantInferNames, sourceFile);
			numFilesExplored += 1;
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

	return numFilesExplored;
}


function extractAlignedSequencesJS(inputDirectory, fileObjs, tsFilesAnalyzed, numFilesExplored_js) {
	let files = [];
	walkSyncJS(inputDirectory, files, tsFilesAnalyzed);
	//console.log("Extract js");
	//console.log(files);
	return extractHelper(inputDirectory, files, fileObjs, numFilesExplored_js);
}

function extractAlignedSequences(inputDirectory, fileObjs, tsFilesAnalyzed, numFilesExplored) {
	let files = [];
	walkSync(inputDirectory, files);
	tsFilesAnalyzed.set(inputDirectory, files);
	//console.log("Extract ts");
	return extractHelper(inputDirectory, files, fileObjs, numFilesExplored);
}

function extractTokens(tree, checker, cantInfer, canInfer, canInferNames, cantInferNames, sourceFile) {
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

			if (child.kind === ts.SyntaxKind.Identifier) {

				//if(debugPrint) console.log(source);

				//if(debugPrint && source === "tokenize") console.log("didn't cont")
				if(keywords.indexOf(source) >= 0) continue;

				try {

					let line = sourceFile.getLineAndCharacterOfPosition(child.getStart()).line;
					let symbol = checker.getSymbolAtLocation(child);
					if (!symbol) {

						if(cantInferNames.indexOf(source) >= 0) continue;
						//console.log("can't infer type of identifier because symbol doesn't exist?: ", source);
						var untyped_ident = {
							"name": source, 
							"parent": child.parent.kind,
							"line": line
						}
						cantInfer.push(untyped_ident);
						cantInferNames.push(source);
						break;
					}


					let symbolID = ts.getSymbolId(symbol);
					if(cantInferNames.indexOf(symbolID) >= 0 || canInferNames.indexOf(symbolID) >= 0) continue;

					let type = checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, child));
					if (type === "any") {
						//console.log("can't infer type of identifier: ", source);
						var untyped_ident = {
							"name": source, 
							"parent": child.parent.kind,
							"line": line
						}
						cantInfer.push(untyped_ident);
						cantInferNames.push(symbolID);
					} 
					else {
						var typed_ident = {
							"name": source,
							"type":	type,
							"parent": child.parent.kind,
							"line": line
						}
						canInfer.push(typed_ident);
						canInferNames.push(symbolID);
					}

				}
				catch (e) { }
			}
		}
		extractTokens(child, checker, cantInfer, canInfer, canInferNames, cantInferNames, sourceFile);
	}
}

//returns js counter parts
function walkSyncJS(dir, filelist, tsFilesAnalyzed){
	var fs = fs || require('fs'), files = fs.readdirSync(dir);
	filelist = filelist || [];
	files.forEach(function (file) {
		let fullPath = path.join(dir, file);
		try {
			if (fs.statSync(fullPath).isDirectory()) {
				if (file != ".git")
				filelist = walkSyncJS(dir + '/' + file, filelist);
			}
			
			else if (file.startsWith(file.slice(0, -3)) && file.endsWith('.js')) {
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
			else if (file.endsWith('.ts')) {
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
