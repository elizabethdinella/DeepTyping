"use strict";
const fs = require("fs");
const excel = require('excel4node');

let root = "data/Repos";
let gold_root = "data/outputs-gold/"
let checkJS_root = "data/outputs-checkjs/"

let projects = [];
var lines = fs.readFileSync('data/test_projects.txt', 'utf-8').split('\n').filter(Boolean);

lines.forEach(function(line){
	let project = line;
	let idx = line.indexOf("__");
	let name = line.substring(0,idx);

	let idents = [];

	//for each project
	var projectLines = fs.readFileSync(gold_root + project, 'utf-8').split('\n').filter(Boolean);
	var checkJSLines = fs.readFileSync(checkJS_root + project, 'utf-8').split('\n').filter(Boolean);

	let checkJS_types = new Map();
	checkJSLines.forEach(function(token_line){
		let split_line = token_line.split("\t");
		let tokens = split_line[0];
		let types = split_line[1].split(" ");

		checkJS_types.set(tokens, types);
	});

	projectLines.forEach(function(token_line){
		let split_line = token_line.split("\t");
		let tokens = split_line[0];
		
		if(!checkJS_types.get(tokens)){
			console.log("returning bc of types");
			return;
		}
	
		let types = split_line[1].split(" ");
		if(types.length !== checkJS_types.get(tokens).length){
			console.log("returning bc of types length");
			return;	
		}

		tokens = tokens.split(" ");
		if(tokens[0] === "'js'"){
			return;
		}
				
		for(let i=0; i<types.length; i++) {
			if(types[i] !== "O") {
				//it had a user annotated type
				idents.push({
					name: tokens[i],
					userType: types[i]
				});
			}
		}
	});
	
	projects.push({
		name: name,
		idents: idents
	});

	//get all idents from the outputs-gold project file 
	//everything that has an annotation gets a corrosponding type in DT
	//get the corresponding types from the DT project (hsould be same order?)

});

let projIdx = 0;
let identIdx = 0;
var lines =  fs.readFileSync('results/evaluation-true.txt', 'utf-8').split('\n').filter(Boolean);

console.log("SANITY CHECK");
let totalGoldIdents = 0;
projects.forEach(function(project){
	totalGoldIdents += project.idents.length;
});

console.log(totalGoldIdents === lines.length, totalGoldIdents, lines.length);
	
function incrIdent(identIdx, projIdx){
	identIdx += 1;
	if(identIdx >= projects[projIdx].idents.length){
		identIdx = 0;
		projIdx += 1;
	}

	return [identIdx, projIdx];
}

let deepTypes = "";
lines.forEach(function(line){
	let stats = line.split("\t");
	let userType = stats[0];
	let deepType = stats[2];	
	deepTypes += deepType + " ";
	
	if(! projects[projIdx].idents.length > 0){
		return;
	}

	let goldType = projects[projIdx].idents[identIdx].userType;

	if (userType !==  goldType && userType !== "$any$") {
		//skip the gold one
		let idxs = incrIdent(identIdx, projIdx);	
		identIdx = idxs[0];
		projIdx = idxs[1];

		goldType = projects[projIdx].idents[identIdx].userType;

		if (userType !== goldType && userType !== "$any$"){
			//mark the project as tainted
			console.log("indexs are off...", projIdx, identIdx, "type from eval", userType, "type from gold", goldType);
			projects[projIdx].tainted = true;
		}
	}else{
		//console.log("we good", userType, goldType);
	}

	projects[projIdx].idents[identIdx].dtType = deepType;
	
	
	let idxs = incrIdent(identIdx, projIdx);
	identIdx = idxs[0];
	projIdx = idxs[1];
});

fs.writeFileSync("deepTypes.txt", deepTypes, "utf-8");

let workbook = new excel.Workbook();

let worksheet = workbook.addWorksheet("Sheet");
worksheet.cell(1,1).string("Project");
worksheet.cell(1,2).string("# Type Errors");
worksheet.cell(1,3).string("DT accuracy");
worksheet.cell(1,4).string("tainted?");

let count = 2;
let total = 0;
let totalCorrect = 0;

projects.forEach(function(project){
	worksheet.cell(count,1).string(project.name);
	total += project.idents.length;
	
	project.idents.forEach(function(ident){
		if(ident.userType === ident.dtType){
			totalCorrect += 1;
		}
	});

	if(total > 0) worksheet.cell(count, 3).number(totalCorrect / total * 100);
	if(project.tainted === undefined) project.tainted = false;

	worksheet.cell(count, 4).string(project.tainted.toString());

	count += 1;
	total = 0;
	totalCorrect = 0;
});

workbook.write("experiment4.xlsx");

