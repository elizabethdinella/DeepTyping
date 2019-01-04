const ts = require("typescript");
const path = require("path");

var removableLexicalKinds = [
	ts.SyntaxKind.EndOfFileToken,
	ts.SyntaxKind.NewLineTrivia,
	ts.SyntaxKind.WhitespaceTrivia
];

function inFiles(files, filename){
	for(let i=0; i<files.length; i++){
		let file = files[i];	
		let idx = file.indexOf("airscript-");
		let idx2 = filename.indexOf("airscript-");

		if(idx2 < 0) return false;
		if(idx < 0){
			console.log("invalid path", idx, idx2);
			continue;
		}

		file = file.substring(idx+12, file.length-2);
		let langStrippedFilename = filename.substring(idx2+12, filename.length-2);

		if(file === langStrippedFilename) return true;	
	}

	return false;
}

export function getTypesForDirectory(inputDirectory, filesToProcess, returnObj, isTS){
	let options = { target: ts.ScriptTarget.Latest, module: ts.ModuleKind.CommonJS, checkJs: true, allowJs: true }
	let program = ts.createProgram(filesToProcess, options);

	let checker = null;
	try {
		checker = program.getTypeChecker();
	}
	catch (err) {
		console.log("couldn't get checker");
		return;
	}


	for (const sourceFile of program.getSourceFiles()) {

		let filename = sourceFile.getSourceFile().fileName;
		if (filename.endsWith('.d.ts')) continue;
		if(!inFiles(filesToProcess, filename)) continue;

		let idx = filename.indexOf("airscript-");
		let langStrippedfname = filename.substring(idx+12, filename.length-3);

		try {
			let relativePath = path.relative(inputDirectory, filename);
			if (relativePath.startsWith("..")) continue;

			let idx = returnObj.files.findIndex(function(elem) {
				return elem === langStrippedfname;
			});

			let fileObj;
			if(idx === -1){
				fileObj = {"filename": langStrippedfname};
				fileObj.idents = [];
				returnObj.files.push(fileObj);
				idx = returnObj.length-1;
			}else{
				fileObj = returnObj.files[idx];
			}

			getTypesForFile(sourceFile, fileObj, checker, sourceFile, isTS);
			returnObj.files[idx] = fileObj;	

		}
		catch (e) {
		}
	}
}

export function getTypesForFile(tree, fileObj, checker, sourceFile, isTS) {
	const keywords = ["async", "await", "break", "continue", "class", "extends", "constructor", "super", "extends", "const", "let", "var", "debugger", "delete", "do", "while", "export", "import", "for", "each", "in", "of", "function", "return", "get", "set", "if", "else", "instanceof", "typeof", "null", "undefined", "switch", "case", "default", "this", "true", "false", "try", "catch", "finally", "void", "yield", "any", "boolean", "null", "never", "number", "string", "symbol", "undefined", "void", "as", "is", "enum", "type", "interface", "abstract", "implements", "static", "readonly", "private", "protected", "public", "declare", "module", "namespace", "require", "from", "of", "package"];

	let symbolID;

	function findIdentObj(elem){
		return elem === name && (!isTS || elem.TSSymbol === symbolID);
		//TODO: figure out if all JS types don't have symbols?
	}

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
					let idx = fileObj.idents.findIndex(findIdentObj);	

					if (!symbol && !isTS) {
						console.log("no symbol", source, "any", idx, isTS);

						if(idx === -1){
							fileObj.idents.push({"name": source});
							idx = fileObj.idents.length-1;
						}

						fileObj.idents[idx].JStype = "any";
						fileObj.idents[idx].JSline = line;
						fileObj.idents[idx].JSsymbol = undefined;

						break;
					}


					symbolID = ts.getSymbolId(symbol);

					if(idx === -1){
						fileObj.idents.push({"name": source});
						idx = fileObj.idents.length-1;
					}

					if(fileObj.idents[idx].TStype !== undefined) continue; //no need to fill in info for the same ident more than once

					let type = checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, child));
					if(isTS){
						fileObj.idents[idx].TStype = type;
						fileObj.idents[idx].TSline = line;
						fileObj.idents[idx].TSsymbol = symbolID;
						fileObj.idents[idx].TSparent = tree.kind + 2;

					}else{
						fileObj.idents[idx].JStype = type;
						fileObj.idents[idx].JSline = line;
						fileObj.idents[idx].JSsymbol = symbolID;
					}

				}
				catch (e) { }
			}
		}
		getTypesForFile(child, fileObj, checker, sourceFile, isTS);
	}
}
