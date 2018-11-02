var fs = require('fs');
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});


fs.readFile("out3.txt", {encoding: 'utf-8'}, function(err,data){
    if (!err) {
	var myObj = JSON.parse(data);

	readline.question("filename?", (fname) => {
		if(fname === "all"){
			myObj.files.forEach(function(fileObj){
				console.log(fileObj.filename);
				fileObj.untyped_idents.forEach(function(ident){
					console.log("\t",ident);
				});	
			});
		}

		myObj.files.forEach(function(fileObj){
			if(fileObj.filename.includes(fname)){
				console.log(fileObj.filename);
				fileObj.untyped_idents.forEach(function(ident){
					console.log("\t",ident);
				});			
			}
		});
	});


		
    } else {
        console.log(err);
    }
});
