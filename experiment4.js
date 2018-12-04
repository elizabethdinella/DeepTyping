"use strict";
const ts = require("typescript");
const fs = require("fs");
const readline = require('readline');
const path = require("path");
const excel = require('excel4node');

var debugPrint = false;

let root = "data/Repos";
let gold_root = "data/outputs-gold/"

var rd = readline.createInterface({
	input: fs.createReadStream('data/test_projects.txt')
});


let projects = [];
rd.on('line', function(line){
	let project = line;
	let idx = line.indexOf("__");
	let name = line.substring(0,idx);
	//console.log(project);

	var rdproj = readline.createInterface({
		input: fs.createReadStream(gold_root + project)
	});

	let idents = [];

	rdproj.on('line', function(token_line){
		let split_line = token_line.split("\t");
		let tokens = split_line[0].split(" ");
		let types = split_line[1].split(" ");
				
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

rd.on("close", function(){

	var rd3 = readline.createInterface({
		input: fs.createReadStream('results/evaluation-true.txt')
	});

	let projIdx = 0;
	let identIdx = 0;
	rd3.on('line', function(line){
		let stats = line.split("\t");
		let userType = stats[0];
		let deepType = stats[2];	

		if (userType !== projects[projIdx].idents[identIdx].userType) {
			console.log("indexs are off...", projIdx, identIdx, userType, projects[projIdx].idents[identIdx].userType);
		}

		projects[projIdx].idents[identIdx].dtType = deepType;
		identIdx += 1;
		if(identIdx >= projects[projIdx].idents.length){
			identIdx = 0;
			projIdx += 1;
		}
	});

	rd3.on("close", function(){

		let workbook = new excel.Workbook();

		let worksheet = workbook.addWorksheet("Sheet");
		worksheet.cell(1,1).string("Project")
		worksheet.cell(1,2).string("# Type Errors")
		worksheet.cell(1,3).string("DT accuracy")

		let count = 2;
		let total = 0;
		let totalCorrect = 0;
		projects.forEach(function(project){
			worksheet.cell(count,1).string(project.name);
			total += project.idents.length;
	
			projects.idents.forEach(function(ident){
				if(ident.userType === ident.dtType){
					totalCorrect += 1;
				}
			});

			worksheet.cell(count, 3).number(totalCorrect / total * 100);
		});

		workbook.write("experiment4.xlsx");

	});
});

