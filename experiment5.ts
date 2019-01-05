"use strict";
const fs = require("fs");
const path = require("path");
const excel = require('excel4node');
import { SyntaxKind } from "./syntaxKind";
import { excludeAnys, getTypesForFile, getTypesForDirectory, getFilesToProcess } from "./Utils";

let outerObj = {
	"files": []	
};

let dir = "airscript/airscript-ts/";
let files = [];
let jsFiles = [];

getFilesToProcess(dir, files, jsFiles, [["airscript-ts", "airscript-js"]]);
getTypesForDirectory("airscript/airscript-js/", jsFiles, outerObj, false);
getTypesForDirectory(dir, files, outerObj, true);

let workbook = new excel.Workbook();
let fileCount = 1;
let totalTS = 0;
let totalJS = 0;
let tsAnys = 0;
let jsAnys = 0;

outerObj.files.forEach(function(fileObj){
	let worksheet = workbook.addWorksheet("Sheet" + fileCount);

	worksheet.cell(1,1).string(fileObj.filename);
	worksheet.cell(2,1).string("name");
	worksheet.cell(2, 2).string("TS type");
	worksheet.cell(2, 3).string("TS lineno");
	worksheet.cell(2, 4).string("TS parent");

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

		let prnt = ident.TSparent;
		if(ident.TStype === "any" && excludeAnys.indexOf(SyntaxKind[prnt]) === -1){
			tsAnys += 1;
		}

		if(ident.JStype === "any"){
			jsAnys += 1 ;
		}


		worksheet.cell(count,1).string(ident.name);
		if(ident.TStype){
			totalTS += 1;
			worksheet.cell(count,2).string(ident.TStype);
			worksheet.cell(count,3).number(ident.TSline);
			worksheet.cell(count,4).string(SyntaxKind[ident.TSparent]);
		}
		if(ident.JStype){
			totalJS += 1;
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

console.log(tsAnys, jsAnys);

worksheet.cell(3,1).string("TS");
worksheet.cell(3,2).number(tsAnys);
worksheet.cell(3,3).number(totalTS - tsAnys);
worksheet.cell(3,4).number(tsAnys / totalTS * 100);
worksheet.cell(3,5).number((totalTS - tsAnys) / totalTS * 100);

worksheet.cell(4,1).string("JS");
worksheet.cell(4,2).number(jsAnys);
worksheet.cell(4,3).number(totalJS - jsAnys);
worksheet.cell(4,4).number(jsAnys / totalJS * 100);
worksheet.cell(4,5).number((totalJS - jsAnys) / totalJS * 100);

workbook.write("airscript.xlsx");

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

