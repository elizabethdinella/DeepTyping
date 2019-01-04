"use strict";
const fs = require("fs");
const path = require("path");
import { SyntaxKind } from "./syntaxKind";
import { getTypesForFile, getTypesForDirectory } from "./Utils";

let outerObj = {
	"files": []	
};

let files = [];
let jsFiles = [];

let dir = "airscript/airscript-ts/";
walkSync(dir, files, jsFiles, {"count": 0});
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
			anys += "\n";
		}
	});
});

fs.writeFileSync("airscript_anys.txt", anys, "utf-8");

function walkSync(dir, filelist, jsfilelist, countObj){
	var fs = fs || require('fs'), files = fs.readdirSync(dir);
	filelist = filelist || [];
	for(let i=0; i<files.length; i++){
		let file = files[i];
		let fullPath = path.join(dir, file);
		try {
			let jsName = fullPath.replace("airscript-ts", "airscript-js");
			jsName = jsName.replace(".ts", ".js");

			if (fs.statSync(fullPath).isDirectory()) {
				if (file != ".git")
					var out = walkSync(dir + '/' + file, filelist, jsfilelist, countObj);
				filelist = out[0];
				jsfilelist = out[1];
			}
			else if (file.endsWith('.ts') && !file.endsWith('.d.ts') /*&& fs.existsSync(jsName)*/ && fs.statSync(fullPath).size < 1*1000*1000){
				filelist.push(fullPath);
				jsfilelist.push(jsName);
				countObj.count += 1;

			}
		}
		catch (e) {
		}
	}
	return [filelist, jsfilelist];
}
;


