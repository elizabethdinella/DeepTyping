var fs = require('fs');

fs.readFile("out3.txt", {encoding: 'utf-8'}, function(err,data){
    if (!err) {
	var myObj = JSON.parse(data);
	myObj.files.forEach(function(fileObj){
		console.log(fileObj.filename);
		fileObj.typed_idents.forEach(function(ident){
			console.log("\t",ident.name, ident.type);
		});
	});
    } else {
        console.log(err);
    }
});
