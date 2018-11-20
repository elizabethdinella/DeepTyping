"use strict";
const ts = require("typescript");
const fs = require("fs");
const sys = require('sys')
const exec = require('child_process').exec;
const path = require("path");

var debugPrint = false;

var removableLexicalKinds = [
	ts.SyntaxKind.EndOfFileToken,
	ts.SyntaxKind.NewLineTrivia,
	ts.SyntaxKind.WhitespaceTrivia
];

let root = "data/Repos";

const NUM_FILES_TO_EXPLORE = 4000;
//const NUM_FILES_TO_EXPLORE = 100;

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

let tsFnames = [];
let jsFnames = [];

outerObj.files.forEach(function(fileObj){
	numTyped += fileObj.typed_idents.length;
	numUntyped += fileObj.untyped_idents.length;
	tsFnames.push(fileObj.filename);
});

outerObjJS.files.forEach(function(fileObj){
	numTyped_JS += fileObj.typed_idents.length;
	numUntyped_JS += fileObj.untyped_idents.length;
	jsFnames.push(fileObj.filename);
});


let total = numTyped + numUntyped;
let pTyped = numTyped / total * 100;
let pUntyped =  numUntyped/ total * 100;
console.log("total typed TS", numTyped);
console.log("total untyped TS", numUntyped);
console.log("percent untyped TS:", pUntyped);
console.log("precent typed TS:", pTyped);
console.log();

total = numTyped_JS + numUntyped_JS;
let pTyped_JS = numTyped_JS / total * 100;
let pUntyped_JS = numUntyped_JS/ total * 100;
console.log("total typed JS:", numTyped_JS);
console.log("total untyped JS:", numUntyped_JS);
console.log("percent untyped JS:", pTyped_JS);
console.log("precent typed JS:", pUntyped_JS);
console.log();

console.log("sanity check:");
console.log("percentages add up to 100", pTyped + pUntyped === 100 && pTyped_JS + pUntyped_JS === 100);
console.log("same num files analyzed:", num_files_explored === num_files_explored_JS);
console.log("ts:", num_files_explored);
console.log("js:", num_files_explored_JS);
console.log("same files:",arraysEqual(tsFnames, jsFnames));
console.log("all js files end in .js", extensionCheck(jsFnames, "js"))
console.log("all ts files end in .ts", extensionCheck(tsFnames, "ts"))

function extensionCheck(names, ext){
	for(let i=0; i<names.length; ++i){
		if(names[i].slice(-2) !== ext){
			return false;
		}
	}
	return true;
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  a.sort();
  b.sort();

  for (var i = 0; i < a.length; ++i) {
    if (a[i].slice(0,-3) !== b[i].slice(0,-3)) return false;
  }
  return true;
}


/*
console.log("\ntsfiles");
outerObj.files.forEach(function(fileObj){
	console.log(fileObj.filename);
});

console.log("\njsfiles");
outerObjJS.files.forEach(function(fileObj){
	console.log(fileObj.filename);
});*/



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

		//console.log("traverse", numFilesExplored);
		if (numFilesExplored < NUM_FILES_TO_EXPLORE) {
			let fileObjs = [];

			let tsFilesAnalyzedObj = {"tsFilesAnalyzed": new Map()};
			numFilesExplored = extractAlignedSequences(dir, fileObjs, tsFilesAnalyzedObj, numFilesExplored);
			_outerObj.files = _outerObj.files.concat(fileObjs);
			
			let jsFileObjs = [];
			numFilesExploredJS = extractAlignedSequencesJS(dir, jsFileObjs, tsFilesAnalyzedObj, numFilesExploredJS);
			_outerObjJS.files =_outerObjJS.files.concat(jsFileObjs);
		}else {
			return [numFilesExplored, numFilesExploredJS];
		}
	}

	return [numFilesExplored, numFilesExploredJS];
}

function extractHelper(inputDirectory, files, fileObjs, numFilesExplored){
	//console.log("in extract helper", files);
	let options = { target: ts.ScriptTarget.Latest, module: ts.ModuleKind.CommonJS, checkJs: true, allowJs: true }
	let program = ts.createProgram(files, options);


	let checker = null;
	try {
		checker = program.getTypeChecker();
	}
	catch (err) {
		return numFilesExplored;
	}

	//For each of the programs we rely on 
	for (const sourceFile of program.getSourceFiles()) {


		let filename = sourceFile.getSourceFile().fileName;

		if(files.indexOf(filename) < 0) continue;
		if (filename.endsWith('.d.ts')) continue;

		try {

			let relativePath = path.relative(inputDirectory, filename);
			if (relativePath.startsWith("..")) continue;
			if (numFilesExplored >= NUM_FILES_TO_EXPLORE) return numFilesExplored;

			console.log("checking filename: ", filename);

			let cantInfer = [];
			let canInfer = [];
			let canInferNames = [];
			let cantInferNames = [];

			extractTokens(sourceFile, checker, cantInfer, canInfer, canInferNames, cantInferNames, sourceFile);
			numFilesExplored += 1;
			var obj = {
				"filename": filename,
				"typed_idents":  canInfer,
				"untyped_idents": cantInfer
			}

			fileObjs.push(obj);
		}
		catch (e) {
		}
	}

	return numFilesExplored;
}


function extractAlignedSequencesJS(inputDirectory, fileObjs, tsFilesAnalyzed, numFilesExplored_js) {
	let files = [];
	//console.log("tsFilesAnalyzed", tsFilesAnalyzed.tsFilesAnalyzed);
	walkSyncJS(inputDirectory, files, tsFilesAnalyzed.tsFilesAnalyzed, 0);
	//console.log("Extract js");
	//console.log(files);
	//console.log("JS");
	return extractHelper(inputDirectory, files, fileObjs, numFilesExplored_js);
}

function extractAlignedSequences(inputDirectory, fileObjs, tsFilesAnalyzedObj, numFilesExplored) {
	let files = [];
	console.log("before walk sync:", tsFilesAnalyzedObj);
	walkSync(inputDirectory, files, {"count": 0}, tsFilesAnalyzedObj);
	console.log("Walk sync gave us", files.length, "files");

	for(var i=0; i<files.length; i++) {
		let file = files[i];
		let strippedName = file.slice(0,-2);
		let jsName = strippedName + ".js";
		if(!fs.existsSync(jsName)){
			console.log("generating js file");
			exec("tsc" + file);
			console.log("generated js file");
		}
	}

	//console.log("tsFilesanalyzed length should be the same", tsFilesAnalyzedObj);
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

						//if(cantInferNames.indexOf(source) >= 0) continue;
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
					//if(cantInferNames.indexOf(symbolID) >= 0 || canInferNames.indexOf(symbolID) >= 0) continue;

					let type = checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, child));
					if (type === "any") {
						var untyped_ident = {
							"name": source, 
							"parent": child.parent.kind,
							"line": line
						}
						cantInfer.push(untyped_ident);
						//cantInferNames.push(symbolID);
					} 
					else {
						var typed_ident = {
							"name": source,
							"type":	type,
							"parent": child.parent.kind,
							"line": line
						}
						canInfer.push(typed_ident);
						//canInferNames.push(symbolID);
					}

				}
				catch (e) { }
			}
		}
		extractTokens(child, checker, cantInfer, canInfer, canInferNames, cantInferNames, sourceFile);
	}
}

//returns js counter parts
function walkSyncJS(dir, filelist, tsFilesAnalyzed, count){
	var fs = fs || require('fs'), files = fs.readdirSync(dir);
	filelist = filelist || [];
	let tsFiles = tsFilesAnalyzed.get(dir);
	//if(tsFiles) console.log(dir, tsFiles.length);

	for(let i=0; i<files.length; i++){
		let file = files[i];
		if (count >= NUM_FILES_TO_EXPLORE) break;
		let fullPath = path.join(dir, file);
		try {
			if (fs.statSync(fullPath).isDirectory()) {
				if (file != ".git")
				filelist = walkSyncJS(dir + '/' + file, filelist, tsFilesAnalyzed, count);
			}
			else if (fullPath.endsWith('.js') && tsFiles.length > 0) {
				let flag = false;
				for(let j=0; j<tsFiles.length; j++){
					let tsFile = tsFiles[j].slice(0, -3);
					//console.log("file vs tsfile", fullPath, tsFile);
					if(fullPath.startsWith(tsFile)){
						flag = true;
						break;
					}
				}

				if (flag && fs.statSync(fullPath).size < 1*1000*1000)
					filelist.push(fullPath);
					count += 1;
				}
		}
		catch (e) {
			//console.error("Error processing " + file);
		}
	}
	return filelist;
}

function walkSync(dir, filelist, countObj, tsFilesAnalyzedObj) {
	var fs = fs || require('fs'), files = fs.readdirSync(dir);
	filelist = filelist || [];
	for(let i=0; i<files.length; i++){
		let file = files[i];
		if (countObj.count >= NUM_FILES_TO_EXPLORE) break;
		let fullPath = path.join(dir, file);
		try {
			if (fs.statSync(fullPath).isDirectory()) {
				if (file != ".git")
				filelist = walkSync(dir + '/' + file, filelist, countObj, tsFilesAnalyzedObj);
			}
			else if (file.endsWith('.ts')) {
				if (fs.statSync(fullPath).size < 1*1000*1000)
					filelist.push(fullPath);
					countObj.count += 1;

					if(tsFilesAnalyzedObj.tsFilesAnalyzed.get(dir) && tsFilesAnalyzedObj.tsFilesAnalyzed.get(dir).length > 0){
						tsFilesAnalyzedObj.tsFilesAnalyzed.get(dir).push(fullPath);
					}else{
						tsFilesAnalyzedObj.tsFilesAnalyzed.set(dir, [fullPath]);
					}
					
				}
		}
		catch (e) {
			//console.error("Error processing " + file);
		}
	}
	return filelist;
}
;
