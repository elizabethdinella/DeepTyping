"use strict";
const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const excel = require('excel4node');

const SyntaxKind = [
        "Unknown",
        "EndOfFileToken",
        "SingleLineCommentTrivia",
        "MultiLineCommentTrivia",
        "NewLineTrivia",
        "WhitespaceTrivia",
        // We detect and preserve #! on the first line
        "ShebangTrivia",
        // We detect and provide better error recovery when we encounter a git merge marker.  This
        // allows us to edit files with git-conflict markers in them in a much more pleasant manner.
        "ConflictMarkerTrivia",
        // Literals
        "NumericLiteral",
        "BigIntLiteral",
        "StringLiteral",
        "JsxText",
        "JsxTextAllWhiteSpaces",
        "RegularExpressionLiteral",
        "NoSubstitutionTemplateLiteral",
        // Pseudo-literals
        "TemplateHead",
        "TemplateMiddle",
        "TemplateTail",
        // Punctuation
        "OpenBraceToken",
        "CloseBraceToken",
        "OpenParenToken",
        "CloseParenToken",
        "OpenBracketToken",
        "CloseBracketToken",
        "DotToken",
        "DotDotDotToken",
        "SemicolonToken",
        "CommaToken",
        "LessThanToken",
        "LessThanSlashToken",
        "GreaterThanToken",
        "LessThanEqualsToken",
        "GreaterThanEqualsToken",
        "EqualsEqualsToken",
        "ExclamationEqualsToken",
        "EqualsEqualsEqualsToken",
        "ExclamationEqualsEqualsToken",
        "EqualsGreaterThanToken",
        "PlusToken",
        "MinusToken",
        "AsteriskToken",
        "AsteriskAsteriskToken",
        "SlashToken",
        "PercentToken",
        "PlusPlusToken",
        "MinusMinusToken",
        "LessThanLessThanToken",
        "GreaterThanGreaterThanToken",
        "GreaterThanGreaterThanGreaterThanToken",
        "AmpersandToken",
        "BarToken",
        "CaretToken",
        "ExclamationToken",
        "TildeToken",
        "AmpersandAmpersandToken",
        "BarBarToken",
        "QuestionToken",
        "ColonToken",
        "AtToken",
        // Assignments
        "EqualsToken",
        "PlusEqualsToken",
        "MinusEqualsToken",
        "AsteriskEqualsToken",
        "AsteriskAsteriskEqualsToken",
        "SlashEqualsToken",
        "PercentEqualsToken",
        "LessThanLessThanEqualsToken",
        "GreaterThanGreaterThanEqualsToken",
        "GreaterThanGreaterThanGreaterThanEqualsToken",
        "AmpersandEqualsToken",
        "BarEqualsToken",
        "CaretEqualsToken",
        // Identifiers
        "Identifier",
        // Reserved words
        "BreakKeyword",
        "CaseKeyword",
        "CatchKeyword",
        "ClassKeyword",
        "ConstKeyword",
        "ContinueKeyword",
        "DebuggerKeyword",
        "DefaultKeyword",
        "DeleteKeyword",
        "DoKeyword",
        "ElseKeyword",
        "EnumKeyword",
        "ExportKeyword",
        "ExtendsKeyword",
        "FalseKeyword",
        "FinallyKeyword",
        "ForKeyword",
        "FunctionKeyword",
        "IfKeyword",
        "ImportKeyword",
        "InKeyword",
        "InstanceOfKeyword",
        "NewKeyword",
        "NullKeyword",
        "ReturnKeyword",
        "SuperKeyword",
        "SwitchKeyword",
        "ThisKeyword",
        "ThrowKeyword",
        "TrueKeyword",
        "TryKeyword",
        "TypeOfKeyword",
        "VarKeyword",
        "VoidKeyword",
        "WhileKeyword",
        "WithKeyword",
        // Strict mode reserved words
        "ImplementsKeyword",
        "InterfaceKeyword",
        "LetKeyword",
        "PackageKeyword",
        "PrivateKeyword",
        "ProtectedKeyword",
        "PublicKeyword",
        "StaticKeyword",
        "YieldKeyword",
        // Contextual keywords
        "AbstractKeyword",
        "AsKeyword",
        "AnyKeyword",
        "AsyncKeyword",
        "AwaitKeyword",
        "BooleanKeyword",
        "ConstructorKeyword",
        "DeclareKeyword",
        "GetKeyword",
        "InferKeyword",
        "IsKeyword",
        "KeyOfKeyword",
        "ModuleKeyword",
        "NamespaceKeyword",
        "NeverKeyword",
        "ReadonlyKeyword",
        "RequireKeyword",
        "NumberKeyword",
        "ObjectKeyword",
        "SetKeyword",
        "StringKeyword",
        "SymbolKeyword",
        "TypeKeyword",
        "UndefinedKeyword",
        "UniqueKeyword",
        "UnknownKeyword",
        "FromKeyword",
        "GlobalKeyword",
        "BigIntKeyword",
        "OfKeyword", // LastKeyword and LastToken and LastContextualKeyword

        // Parse tree nodes

        // Names
        "QualifiedName",
        "ComputedPropertyName",
        // Signature elements
        "TypeParameter",
        "Parameter",
        "Decorator",
        // TypeMember
        "PropertySignature",
        "PropertyDeclaration",
        "MethodSignature",
        "MethodDeclaration",
        "Constructor",
        "GetAccessor",
        "SetAccessor",
        "CallSignature",
        "ConstructSignature",
        "IndexSignature",
        // Type
        "TypePredicate",
        "TypeReference",
        "FunctionType",
        "ConstructorType",
        "TypeQuery",
        "TypeLiteral",
        "ArrayType",
        "TupleType",
        "OptionalType",
        "RestType",
        "UnionType",
        "IntersectionType",
        "ConditionalType",
        "InferType",
        "ParenthesizedType",
        "ThisType",
        "TypeOperator",
        "IndexedAccessType",
        "MappedType",
        "LiteralType",
        "ImportType",
        // Binding patterns
        "ObjectBindingPattern",
        "ArrayBindingPattern",
        "BindingElement",
        // Expression
        "ArrayLiteralExpression",
        "ObjectLiteralExpression",
        "PropertyAccessExpression",
        "ElementAccessExpression",
        "CallExpression",
        "NewExpression",
        "TaggedTemplateExpression",
        "TypeAssertionExpression",
        "ParenthesizedExpression",
        "FunctionExpression",
        "ArrowFunction",
        "DeleteExpression",
        "TypeOfExpression",
        "VoidExpression",
        "AwaitExpression",
        "PrefixUnaryExpression",
        "PostfixUnaryExpression",
        "BinaryExpression",
        "ConditionalExpression",
        "TemplateExpression",
        "YieldExpression",
        "SpreadElement",
        "ClassExpression",
        "OmittedExpression",
        "ExpressionWithTypeArguments",
        "AsExpression",
        "NonNullExpression",
        "MetaProperty",
        "SyntheticExpression",

        // Misc
        "TemplateSpan",
        "SemicolonClassElement",
        // Element
        "Block",
        "VariableStatement",
        "EmptyStatement",
        "ExpressionStatement",
        "IfStatement",
        "DoStatement",
        "WhileStatement",
        "ForStatement",
        "ForInStatement",
        "ForOfStatement",
        "ContinueStatement",
        "BreakStatement",
        "ReturnStatement",
        "WithStatement",
        "SwitchStatement",
        "LabeledStatement",
        "ThrowStatement",
        "TryStatement",
        "DebuggerStatement",
        "VariableDeclaration",
        "VariableDeclarationList",
        "FunctionDeclaration",
        "ClassDeclaration",
        "InterfaceDeclaration",
        "TypeAliasDeclaration",
        "EnumDeclaration",
        "ModuleDeclaration",
        "ModuleBlock",
        "CaseBlock",
        "NamespaceExportDeclaration",
        "ImportEqualsDeclaration",
        "ImportDeclaration",
        "ImportClause",
        "NamespaceImport",
        "NamedImports",
        "ImportSpecifier",
        "ExportAssignment",
        "ExportDeclaration",
        "NamedExports",
        "ExportSpecifier",
        "MissingDeclaration",

        // Module references
        "ExternalModuleReference",

        // JSX
        "JsxElement",
        "JsxSelfClosingElement",
        "JsxOpeningElement",
        "JsxClosingElement",
        "JsxFragment",
        "JsxOpeningFragment",
        "JsxClosingFragment",
        "JsxAttribute",
        "JsxAttributes",
        "JsxSpreadAttribute",
        "JsxExpression",

        // Clauses
        "CaseClause",
        "DefaultClause",
        "HeritageClause",
        "CatchClause",

        // Property assignments
        "PropertyAssignment",
        "ShorthandPropertyAssignment",
        "SpreadAssignment",

        // Enum
        "EnumMember",
        // Top-level nodes
        "SourceFile",
        "Bundle",
        "UnparsedSource",
        "InputFiles",

        // JSDoc nodes
        "JSDocTypeExpression",
        // The * type
        "JSDocAllType",
        // The ? type
        "JSDocUnknownType",
        "JSDocNullableType",
        "JSDocNonNullableType",
        "JSDocOptionalType",
        "JSDocFunctionType",
        "JSDocVariadicType",
        "JSDocComment",
        "JSDocTypeLiteral",
        "JSDocSignature",
        "JSDocTag",
        "JSDocAugmentsTag",
        "JSDocClassTag",
        "JSDocCallbackTag",
        "JSDocEnumTag",
        "JSDocParameterTag",
        "JSDocReturnTag",
        "JSDocThisTag",
        "JSDocTypeTag",
        "JSDocTemplateTag",
        "JSDocTypedefTag",
        "JSDocPropertyTag",

        // Synthesized list
        "SyntaxList",

        // Transformation nodes
        "NotEmittedStatement",
        "PartiallyEmittedExpression",
        "CommaListExpression",
        "MergeDeclarationMarker",
        "EndOfDeclarationMarker",

        // Enum value count
        "Count"];





var debugPrint = false;

var removableLexicalKinds = [
	ts.SyntaxKind.EndOfFileToken,
	ts.SyntaxKind.NewLineTrivia,
	ts.SyntaxKind.WhitespaceTrivia
];

let root = "data/Repos";

//const NUM_FILES_TO_EXPLORE = 4000;
const NUM_FILES_TO_EXPLORE = 10;

var num_files_explored = 0;

let outerObj = {
	"files": []	
};

fs.readdirSync(root).forEach(org => fs.readdirSync(root + "/" + org).forEach(project => traverseProject(org, project, outerObj)));

let workbook = new excel.Workbook();
let fileCount = 1;
let totalBothType = 0;
let tsAnys = 0;
let jsAnys = 0;



outerObj.files.forEach(function(fileObj){
	let worksheet = workbook.addWorksheet("Sheet" + fileCount);
	console.log(fileObj.filename);
	worksheet.cell(1,1).string(fileObj.filename);

	worksheet.cell(2, 1).string("name");
	worksheet.cell(2, 2).string("TS type");
	worksheet.cell(2, 3).string("TS lineno");
	worksheet.cell(2, 4).string("TS parent");
	worksheet.cell(2, 5).string("JS type");
	worksheet.cell(2, 6).string("JS lineno");
	
	let count = 3;

	fileObj.idents.sort(function(x,y){
		function getPriority(x){
			if(x.TStype && x.JStype) {
				if(x.TStype === "any" && x.JStype != "any"){
					return 1;	
				}else if(x.TStype !== "any" && x.JStype === "any"){
					return 2;
				}

				return 3;
			}else if(x.TStype){
				return 4;
			}else{
				return 5;
			}

		}

		let xPrior = getPriority(x);
		let yPrior = getPriority(y);

		if(xPrior < yPrior){
			return -1;
		}else if(xPrior > yPrior){
			return 1;
		}

		return 0;

		
	});

	fileObj.idents.forEach(function (ident){

		if(ident.TStype && ident.JStype){
			totalBothType += 1;
			if(ident.TStype === "any"){
				tsAnys += 1;
			}

			if(ident.JStype === "any"){
				jsAnys += 1 ;
			}

		}
		
		worksheet.cell(count,1).string(ident.name);
		if(ident.TStype){
			worksheet.cell(count,2).string(ident.TStype);
			worksheet.cell(count,3).number(ident.TSline);
			worksheet.cell(count,4).string(SyntaxKind[ident.TSparent]);
		}
		if(ident.JStype){
			worksheet.cell(count,5).string(ident.JStype);
			worksheet.cell(count,6).number(ident.JSline);
		}

		count += 1;
	});
	fileCount +=1;
});


let worksheet = workbook.addWorksheet("Statistics");
worksheet.cell(1,1).string("Statistics on idents that appear in both TS and JS")
worksheet.cell(2,2).string("number any types")
worksheet.cell(2,3).string("number typed")
worksheet.cell(2,4).string("percent any types")
worksheet.cell(2,5).string("percent typed")


worksheet.cell(3,1).string("TS");
worksheet.cell(3,2).number(tsAnys);
worksheet.cell(3,3).number(totalBothType - tsAnys);
worksheet.cell(3,4).number(tsAnys / totalBothType * 100);
worksheet.cell(3,5).number((totalBothType - tsAnys) / totalBothType * 100);

worksheet.cell(4,1).string("JS");
worksheet.cell(4,2).number(jsAnys);
worksheet.cell(4,3).number(totalBothType - jsAnys);
worksheet.cell(4,4).number(jsAnys / totalBothType * 100);
worksheet.cell(4,5).number((totalBothType - jsAnys) / totalBothType * 100);


workbook.write("idents.xlsx");

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
				fileObj = {"filename": check.slice(0,-2)};
				fileObjs.push(fileObj);
				idx = fileObjs.length-1;
				fileObj.idents = [];
			}else{
				fileObj = fileObjs[idx];
			}

			extractTokens(sourceFile, fileObj, checker, sourceFile, isTS);
			fileObjs[idx] = fileObj;	

		}
		catch (e) {
		}
	}

	return numFilesExplored;
}

function findIdentObj(idents, name, ID, isTS){
	for(let i=0; i<idents.length; i++){
		if(idents[i].name === name){
			if(!isTS){
				return i;
			}else if(idents[i].JStype !== undefined && (ID !== undefined || idents[i].TStype === undefined)){
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
					if (!symbol && !isTS) {
						let idx = findIdentObj(fileObj.idents, source, undefined, isTS);
						console.log("no symbol", source, "any", idx, isTS);

						if(idx === -1){
							fileObj.idents.push({"name": source});
							idx = fileObj.idents.length-1;
						}

						/*
						if(isTS){
							fileObj.idents[idx].TStype = "any";
							fileObj.idents[idx].TSline = line;
							fileObj.idents[idx].TSsymbol = undefined;
							fileObj.idents[idx].TSparent = child.parent.kind;

						}else{*/
							fileObj.idents[idx].JStype = "any";
							fileObj.idents[idx].JSline = line;
							fileObj.idents[idx].JSsymbol = undefined;
						//}

						break;
					}


					let symbolID = ts.getSymbolId(symbol);
					if(hasSeen(fileObj.idents, source, symbolID, isTS)) continue;

					let idx = findIdentObj(fileObj.idents, source, symbolID, isTS);
					if(idx === -1){
						fileObj.idents.push({"name": source});
						idx = fileObj.idents.length-1;
					}


					let type = checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, child));
					console.log(source, type, idx, isTS);
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


