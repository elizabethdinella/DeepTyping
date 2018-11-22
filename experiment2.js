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

fs.readdirSync(root).forEach(org => fs.readdirSync(root + "/" + org).forEach(project => traverseProject(org, project, outerObj)));

console.log(outerObj);

outerObj.files.forEach(function(fileObj){
	console.log(fileObj.filename);

	fileObj.idents.forEach(function (ident){
		console.log("\t", ident.name, ident.TStype, ident.JStype);
	});
});

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






/*
if(outerObj.files.length > 0){
	console.log(JSON.stringify(outerObj));
}
*/

function traverseProject(org, project, _outerObj) {
	// This project stalls forever
	if (org == "SAP") return
		let dir = root + "/" + org + "/" + project;
	if(num_files_explored < NUM_FILES_TO_EXPLORE){
		num_files_explored = traverse(dir, _outerObj, num_files_explored);
	}
}

function traverse(dir, _outerObj, numFilesExplored) {
	var children = fs.readdirSync(dir);
	if (children.find(value => value == "tsconfig.json")) {

		//console.log("traverse", numFilesExplored);
		if (numFilesExplored < NUM_FILES_TO_EXPLORE) {
			let fileObjs = [];

			numFilesExplored = extractAlignedSequences(dir, fileObjs, numFilesExplored);
			_outerObj.files = _outerObj.files.concat(fileObjs);

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

function findFile(fileObjs, name){
	for(let i=0; i<fileObjs.length; i++){
		if(fileObjs[i].filename === name){
			return i;
		}
	}
	return -1;
}

function extractHelper(inputDirectory, files, fileObjs, numFilesExplored, isTS){
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


			
			let idx = findFile(fileObjs, check.slice(0,-2));
			let fileObj;
			if(idx === -1){
				console.log("file not found");
				fileObj = {"filename": check.slice(0,-2)};
				console.log("pushing");
				fileObjs.push(fileObj);
				console.log("pushed");
				idx = fileObjs.length-1;
				fileObj.idents = [];
			}else{
				console.log("file found!");
				fileObj = fileObjs[idx];
			}

			console.log("here");
			extractTokens(sourceFile, fileObj, checker, sourceFile, isTS);
			fileObjs[idx] = fileObj;	

			/*
			var obj = {
				"filename": 
				"idents": [{
						"name":
						"JSsymbol":
						"TSsymbol":
						"JStype": 
						"TStype":
						"TSline":
						"JSline":
						"TSparent":
					}]
			}*/


		}
		catch (e) {
		}
	}

	return numFilesExplored;
}

function findIdentObj(idents, name, ID, isTS){
	//console.log("searching through", idents, "for", name);
	for(let i=0; i<idents.length; i++){
		if(idents[i].name === name){
			if(!isTS){
				return i;
			}else if(idents[i].JStype !== undefined && idents[i].symbol === ID){
				return i;	
			}
		}
	}
	return -1;
}


function hasSeen(idents, name, ID, isTS){
	 let idx = findIdentObj(idents, name, ID, isTS);
	 if(idx === -1) return false;

	 let ident = idents[idx];
	 if(isTS){
		return ident.TStype !== undefined;
	 }else{
		return ident.JStype !== undefined;
	}
}

function extractAlignedSequences(inputDirectory, fileObjs, numFilesExplored) {
	let files = [];
	let jsFiles = [];
	walkSync(inputDirectory, files, jsFiles, {"count": 0});

	
	/*
	console.log();
	console.log("midway sanity check");
	console.log("same num files", files.length === jsFiles.length);
	console.log("same files", arraysEqual(files.slice(), jsFiles.slice()));
	console.log();

	console.log("explored", numFilesExplored, "files");
	jsFiles.sort();
	files.sort();
	*/


	extractHelper(inputDirectory, jsFiles, fileObjs, numFilesExplored, false);
	let num =  extractHelper(inputDirectory, files, fileObjs, numFilesExplored, true);
	
	return numFilesExplored + files.length;
}

function extractTokens(tree, fileObj, checker, sourceFile, isTS) {
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

				if(keywords.indexOf(source) >= 0) continue;
				
				try {

					let line = sourceFile.getLineAndCharacterOfPosition(child.getStart()).line;
					let symbol = checker.getSymbolAtLocation(child);
					if (!symbol) {
						//console.log("no symbol");
						console.log("getting index");
						let idx = findIdentObj(fileObj.idents, source, undefined, isTS);
						console.log(idx);

						if(idx === -1){
							fileObj.idents.push({"name": source});
							idx = fileObj.idents.length-1;
						}

						if(isTS){
							fileObj.idents[idx].TStype = "any";
							fileObj.idents[idx].TSline = line;
							fileObj.idents[idx].TSsymbol = undefined;
							fileObj.idents[idx].TSparent = child.parent.kind;

						}else{
							fileObj.idents[idx].JStype = "any";
							fileObj.idents[idx].JSline = line;
							fileObj.idents[idx].JSsymbol = undefined;
						}

						break;
					}


					console.log("yes symbol!");
					let symbolID = ts.getSymbolId(symbol);
					if(hasSeen(fileObj.idents, source, symbolID, isTS)) continue;
					console.log(source, "isTS?", isTS, "not seen yet");

					let idx = findIdentObj(fileObj.idents, source, symbolID, isTS);
					if(idx === -1){
						fileObj.idents.push({"name": source});
						idx = fileObj.idents.length-1;
						console.log(idx, fileObj.idents[idx]);
					}


					let type = checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, child));
					if(isTS){
						fileObj.idents[idx].TStype = type;
						fileObj.idents[idx].TSline = line;
						fileObj.idents[idx].TSsymbol = symbolID;
						fileObj.idents[idx].TSparent = child.parent.kind;
					}else{
						fileObj.idents[idx].JStype = type;
						fileObj.idents[idx].JSline = line;
						fileObj.idents[idx].JSsymbol = symbolID;
					}

				}
				catch (e) { }
			}
		}
		extractTokens(child, fileObj, checker, sourceFile, isTS);
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
