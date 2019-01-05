const ts = require("typescript");
const path = require("path");

var removableLexicalKinds = [
	ts.SyntaxKind.EndOfFileToken,
	ts.SyntaxKind.NewLineTrivia,
	ts.SyntaxKind.WhitespaceTrivia
];

export var excludeAnys = [
	"TypeParameter",
	"TypeReference",
	"InterfaceDeclaration",
	"ImportSpecifier",
	"TypeAliasDeclaration"
]

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
				return elem.filename === langStrippedfname;
			});

			let fileObj;
			if(idx === -1){
				fileObj = {"filename": langStrippedfname};
				fileObj.idents = [];
				returnObj.files.push(fileObj);
				idx = returnObj.files.length-1;
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

	let symbol, source;

	function findIdentObj(elem){
		return elem.name === source && (!isTS || elem.TSsymbol === ts.getSymbolId(symbol));
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
			source = child.getText();

			if (child.kind === ts.SyntaxKind.Identifier) {

				if(keywords.indexOf(source) >= 0) continue;

				try {
					let line = sourceFile.getLineAndCharacterOfPosition(child.getStart()).line + 1;
					symbol = checker.getSymbolAtLocation(child);
					if(symbol) var symbolID = ts.getSymbolId(symbol);

					let idx = fileObj.idents.findIndex(findIdentObj);	

					//TODO: delete this
					if(source === "item" && fileObj.filename.includes("StateMachine")){
						console.log(symbolID, line);
					}

					if(idx === -1){
						fileObj.idents.push({"name": source});
						idx = fileObj.idents.length-1;
					}

					if(!symbol && !isTS) {
						console.log("no symbol", source, sourceFile.getSourceFile().fileName, isTS);

						fileObj.idents[idx].JStype = "any";
						fileObj.idents[idx].JSline = line;
						fileObj.idents[idx].JSsymbol = undefined;
						
						continue;
					}


					let type = checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, child));
					if(isTS && fileObj.idents[idx].TStype === undefined){
						fileObj.idents[idx].TStype = type;
						fileObj.idents[idx].TSline = line;
						fileObj.idents[idx].TSsymbol = symbolID;
						fileObj.idents[idx].TSparent = tree.kind + 2;

					}else if(fileObj.idents[idx].JStype === undefined){
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

export function getFilesToProcess(dir, filelist, jsfilelist, langReplacements){
	var fs = fs || require('fs'), files = fs.readdirSync(dir);
	filelist = filelist || [];
	for(let i=0; i<files.length; i++){
		let file = files[i];
		let fullPath = path.join(dir, file);
		try {
			let jsName;
			for(const replacement of langReplacements){
				let _ts = replacement[0];
				let _js = replacement[1];
				jsName = fullPath.replace(_ts, _js);
			}

			jsName = jsName.replace(".ts", ".js");

			if (fs.statSync(fullPath).isDirectory()) {
				if (file != ".git")
					var out = getFilesToProcess(dir + '/' + file, filelist, jsfilelist, langReplacements);
				filelist = out[0];
				jsfilelist = out[1];
			}
			else if (file.endsWith('.ts') && !file.endsWith('.d.ts') /*&& fs.existsSync(jsName)*/ && fs.statSync(fullPath).size < 1*1000*1000){
				filelist.push(fullPath);
				jsfilelist.push(jsName);

			}
		}
		catch (e) {
		}
	}
	return [filelist, jsfilelist];
}
;


