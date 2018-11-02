var fs = require('fs');
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});

fs.readFile("out3.txt", {encoding: 'utf-8'}, function(err,data){
    if (!err) {
	var myObj = JSON.parse(data);
	var foundFile = false;
	var foundIdent = false;

	readline.question("filename?", (fname) => {
			
		myObj.files.forEach(function(fileObj){
			if(fileObj.filename.includes(fname)){
					readline.question("ident?", (search_ident) => {
						fileObj.typed_idents.forEach(function(ident){
							if(ident.name === search_ident) {
								foundIdent = true;
								console.log(ident.type);
							}
						});

						if(!foundIdent){
							fileObj.untyped_idents.forEach(function(ident){
								if(ident === search_ident) {
									foundIdent = true;
									console.log("untyped: any");
								}
							});


						}

						if(!foundIdent){
							console.log("ident not in that file");
						}
					});

			}
		});
	});
    } else {
        console.log(err);
    }
});
