"use strict";
const fs = require("fs");
const path = require("path");
import { SyntaxKind } from "./syntaxKind";
import { getTypesForFile, getTypesForDirectory, getFilesToProcess } from "./Utils";

let outerObj = {
	"files": []	
};

let files = [];
let jsFiles = [];

let dir = "airscript/airscript-ts/";
getFilesToProcess(dir, files, jsFiles, [["airscript-ts", "airscript-js"]]);
getTypesForDirectory(dir, files, outerObj, true);

//print the output
let anys = "";
outerObj.files.forEach(function(fileObj){
	anys += fileObj.filename;
	anys += "\n";

	fileObj.idents.forEach(function(ident){
		let prnt = ident.TSparent;
		if(ident.TStype === "any" &&
			SyntaxKind[prnt] !== "TypeParameter" &&
			SyntaxKind[prnt] !== "TypeReference" &&
			SyntaxKind[prnt] !== "InterfaceDeclaration"){
			anys += "\t";
			anys += ident.name;
			anys += " ";
			anys += SyntaxKind[prnt];
			anys += " ";
			anys += ident.TSline;
			anys += " ";
			anys += ident.TSsymbol;
			anys += "\n";
		}
	});
});

fs.writeFileSync("airscript_anys.txt", anys, "utf-8");


