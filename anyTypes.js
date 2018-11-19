var fs = require('fs');
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});

const  SyntaxKind = [
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


function printAll(myObj){
	allParents = [];
	var totalTyped = 0;
	//var totalTypeof = 0;
	myObj.files.forEach(function(fileObj){
		console.log(fileObj.filename);
		fileObj.untyped_idents.forEach(function(ident){
			console.log("\t",ident.name, SyntaxKind[ident.parent], ident.line);
			allParents.push(ident.parent);
		});	

		/*
		fileObj.typed_idents.forEach(function(ident){
			if(ident.type.startsWith("typeof")){
				totalTypeof += 1;	
			}
		});

		*/
		totalTyped += fileObj.typed_idents.length;
	});

	maxParent(allParents);
	var total = (totalTyped+ allParents.length);
	console.log("total typed", totalTyped);
	console.log("percent untyped:", allParents.length / total * 100);
	//console.log("precent typeof:", totalTypeof / total * 100);
	console.log("precent typed:", totalTyped / total * 100);
}

function maxParent(allParents){
	allParents.sort();
	var current = null;
	var count = 0;
	const kinds = new Map();
	for (var i=0; i < allParents.length; i++){
		var _parent = allParents[i];
		if(_parent != current) {
			if(count > 0){
				kinds.set(SyntaxKind[current], count);
			}
			current = _parent;
			count = 1;
		}else{
			count++;
		}
	}

	console.log(kinds);
	console.log("total untyped", allParents.length);
	//result = allParents.filter(elem => elem == 235);
	//console.log(result.length);
	//const sortedKinds = new Map([kinds.entries()].sort((a,b)=> b[1] - a[1]));
	//console.log(sortedKinds);
}

function filterFilename(myObj, fname){
	ret = [];
	myObj.files.forEach(function(fileObj){
		if(fileObj.filename.includes(fname) || fname === "all"){
			ret.push(fileObj);
		}
	});

	return ret;
}


function filterParent(fileObj, parent){
	files.forEach(function(fileObj){
		idents = []
		fileObj.untyped_idents.forEach(function(ident){
			if(ident.parent === +parent || parent === "any"){
				idents.push(ident);
			}
		});
		if(idents.length > 0){
			console.log(fileObj.filename);
			idents.forEach(function(ident){
				console.log("\t",ident.name, "lineno", ident.line, "parent", SyntaxKind[ident.parent]);
			});
		}
	});	
}

fs.readFile("out3.txt", {encoding: 'utf-8'}, function(err,data){
    if (!err) {
	var myObj = JSON.parse(data);
	console.log("searching",myObj.files.length, "files")

	readline.question("filename?", (fname) => {
	readline.question("parent?", (parent) => {
		if(fname === "all" && parent === "any"){
			printAll(myObj);
		}else{
			files = filterFilename(myObj, fname);
			filterParent(files, parent);
		}
			

		console.log("filename", fname, "with parent", parent);
	     });
	});
		
    } else {
        console.log(err);
    }
});
