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

//const NUM_FILES_TO_EXPLORE = 4000;
const NUM_FILES_TO_EXPLORE = 1;

var num_files_explored = 0;

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

let numFiles = 0;
let numFilesJS = 0;
outerObj.files.forEach(function(fileObj){
	numTyped += fileObj.typed_idents.length;
	numUntyped += fileObj.untyped_idents.length;
	tsFnames.push(fileObj.filename);
	numFiles += 1;
});

outerObjJS.files.forEach(function(fileObj){
	numTyped_JS += fileObj.typed_idents.length;
	numUntyped_JS += fileObj.untyped_idents.length;
	jsFnames.push(fileObj.filename);
	numFilesJS += 1;
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
console.log("same num files analyzed:", numFiles=== numFilesJS);
console.log("ts:", numFiles);
console.log("js:", numFilesJS);
console.log("all js files end in .js", extensionCheck(jsFnames, "js"))
console.log("all ts files end in .ts", extensionCheck(tsFnames, "ts"))
console.log("same files:",arraysEqual(tsFnames, jsFnames));

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

  for(let i=0; i < a.length; ++i){

	a[i] = a[i].slice(0,-2);
	b[i] = b[i].slice(0,-2);

  }

 a.sort();
 b.sort();


  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]){
	        if(b.indexOf(a[i]) < 0){
			console.log("no match for", a[i]);
		}
		return false;
	}
  }

  return true;
}



console.log("\ntsfiles");
outerObj.files.forEach(function(fileObj){
	console.log(fileObj.filename);
	console.log("typed", fileObj.typed_idents);
});

console.log("\njsfiles");
outerObjJS.files.forEach(function(fileObj){
	console.log(fileObj.filename);
	console.log("typed", fileObj.typed_idents);
});



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
		num_files_explored = traverse(dir, _outerObj, _outerObjJS, num_files_explored);
	}
}

function traverse(dir, _outerObj, _outerObjJS, numFilesExplored) {
	var children = fs.readdirSync(dir);
	if (children.find(value => value == "tsconfig.json")) {

		//console.log("traverse", numFilesExplored);
		if (numFilesExplored < NUM_FILES_TO_EXPLORE) {
			let fileObjs = [];
			let jsFileObjs = [];

			numFilesExplored = extractAlignedSequences(dir, fileObjs, jsFileObjs, numFilesExplored);
			_outerObj.files = _outerObj.files.concat(fileObjs);
			_outerObjJS.files =_outerObjJS.files.concat(jsFileObjs);

			let files = [];
			let jsFiles = [];
			
			fileObjs.forEach(function(file){
				files.push(file.filename);	
			});

			jsFileObjs.forEach(function(file){
				jsFiles.push(file.filename);
			});


			console.log();
			console.log("second midway sanity check");
			console.log("same num files", files.length === jsFiles.length);
			console.log("same files", arraysEqual(files.slice(), jsFiles.slice()));
			console.log();


		}else {
			return numFilesExplored;
		}
	}

	return numFilesExplored;
}

function inFiles(files, filename){
	for(let i=0; i<files.length; i++){
		let file = files[i];	
		let idx = file.indexOf("data");
		let idx2 = filename.indexOf("data");

		if(idx2 < 0) return false;
		if(idx < 0){
			console.log("invalid path", idx, idx2);
			continue;
		}

		file = file.slice(idx);
		let fname = filename.slice(idx2);

		if(file === fname){
			return file;	
		}
	}
	return false;
}

function extractHelper(inputDirectory, files, fileObjs, numFilesExplored){
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

		let check = inFiles(files, filename);
		if(!check) continue;
		if (filename.endsWith('.d.ts')) continue;

		try {
			let relativePath = path.relative(inputDirectory, filename);
			if (relativePath.startsWith("..")) continue;
			//if (numFilesExplored >= NUM_FILES_TO_EXPLORE) return numFilesExplored;

			let cantInfer = [];
			let canInfer = [];
			let canInferNames = [];
			let cantInferNames = [];

			extractTokens(sourceFile, checker, cantInfer, canInfer, canInferNames, cantInferNames, sourceFile);
			//numFilesExplored += 1;
			var obj = {
				"filename": check,
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

function extractAlignedSequences(inputDirectory, fileObjs, fileObjsJS, numFilesExplored) {
	let files = [];
	let jsFiles = [];
	walkSync(inputDirectory, files, jsFiles, {"count": 0});

	
	console.log();
	console.log("midway sanity check");
	console.log("same num files", files.length === jsFiles.length);
	console.log("same files", arraysEqual(files.slice(), jsFiles.slice()));
	console.log();

	console.log("explored", numFilesExplored, "files");
	jsFiles.sort();
	files.sort();
	extractHelper(inputDirectory, jsFiles, fileObjsJS, numFilesExplored);


	fileObjsJS.forEach(function(fileObj){
		let flag = false;
		for(var i=0; i<jsFiles.length; i++){
			if(fileObj.filename === jsFiles[i]) {
				flag = true;
				break;
			}
		}
		if(!flag){
			console.log("no match for", fileObj.filename);	
		}
	});
	
	let num =  extractHelper(inputDirectory, files, fileObjs, numFilesExplored);
	
	fileObjs.forEach(function(fileObj){
		let flag = false;
		for(var i=0; i<files.length; i++){
			let idx = fileObj.filename.indexOf("data");
	
			fileObj.filename = fileObj.filename.slice(idx);

			if(fileObj.filename === files[i]) {
				flag = true;
				break;
			}
		}
		if(!flag){
			console.log("no match for", fileObj.filename);	
		}
	});


	return numFilesExplored + files.length;
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

function walkSync(dir, filelist, jsfilelist, countObj){
	var fs = fs || require('fs'), files = fs.readdirSync(dir);
	filelist = filelist || [];
	for(let i=0; i<files.length; i++){
		let file = files[i];
		if (countObj.count >= NUM_FILES_TO_EXPLORE) break;
		let fullPath = path.join(dir, file);
		try {
		        let idx = fullPath.indexOf("data");
			let strippedName = fullPath.slice(idx,-2);
			let jsName = strippedName + "js";

			if (fs.statSync(fullPath).isDirectory()) {
				if (file != ".git")
				var out = walkSync(dir + '/' + file, filelist, jsfilelist, countObj);
				filelist = out[0];
				jsfilelist = out[1];
			}
			else if (file.endsWith('.ts') && !file.endsWith('.d.ts') && fs.existsSync(jsName) && fs.statSync(fullPath).size < 1*1000*1000){
				filelist.push(fullPath);
				jsfilelist.push(jsName);
				countObj.count += 1;

			}
		}
		catch (e) {
			//console.error("Error processing " + file);
		}
	}
	return [filelist, jsfilelist];
}
;
