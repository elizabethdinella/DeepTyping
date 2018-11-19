var fs = require('fs');
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});


function filterFilename(myObj, fname){
	ret = [];
	myObj.files.forEach(function(fileObj){
		if(fileObj.filename.includes(fname) || fname === "all"){
			ret.push(fileObj);
		}
	});

	return ret;
}


function filterName(fileObj, ident){
	files.forEach(function(fileObj){
		idents = []
		fileObj.typed_idents.forEach(function(typed_ident){
			if(typed_ident.name === ident || ident === "all"){
				idents.push(typed_ident);
			}
		});

		if(idents.length > 0){
			console.log(fileObj.filename);
			idents.forEach(function(ident){
				console.log("\t",ident.name, "lineno", ident.line, "type", ident.type);
			});
		}
	});	
}


fs.readFile("out3.txt", {encoding: 'utf-8'}, function(err,data){
    if (!err) {
	var myObj = JSON.parse(data);
	console.log("searching",myObj.files.length, "files")

	readline.question("filename?", (fname) => {
	readline.question("ident name?", (ident) => {
		files = filterFilename(myObj, fname);
		filterName(files, ident);

		console.log("filename", fname, "with ident", ident);
	     });
	});
		
    } else {
        console.log(err);
    }
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

