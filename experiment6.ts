"use strict";
const fs = require("fs");
const path = require("path");
const excel = require('excel4node');
import { SyntaxKind } from "./syntaxKind";
import { excludeAnys, getTypesForFile, getTypesForDirectory, getFilesToProcess } from "./Utils";

let workbook = new excel.Workbook();

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
let fileCount = 1;
outerObj.files.forEach(function(fileObj){
	anys += fileObj.filename;
	anys += "\n";

	let worksheet = workbook.addWorksheet("Sheet" + fileCount);
	worksheet.cell(1,1).string(fileObj.filename);

	worksheet.cell(2, 1).string("name");
	worksheet.cell(2, 2).string("TS parent");
	worksheet.cell(2, 3).string("TS lineno");
	worksheet.cell(2, 4).string("comments");

	let identCount = 3;
	fileObj.idents.forEach(function(ident){
		let prnt = ident.TSparent;
		if(ident.TStype === "any" && excludeAnys.indexOf(SyntaxKind[prnt]) === -1){
			worksheet.cell(identCount,1).string(ident.name);
			worksheet.cell(identCount,2).string(SyntaxKind[prnt]);
			worksheet.cell(identCount,3).number(ident.TSline);

			identCount += 1;
		}

	});

	fileCount += 1;
});

workbook.write("airscript_anys.xlsx");
