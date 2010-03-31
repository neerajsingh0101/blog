var sys = require('sys'),
fs = require('fs'),
path = './_posts',
open_files_count = 0,
cwd = process.cwd();

function handleError(err) {
	sys.puts('Error!!! encountered ' + err);
	process.exit();
}

function readFiles(files) {
	files.forEach(function(file) {
		var filename = cwd + '/_posts/' + file.toString();
		readFile(filename);
	});
}

function readFile(file) {
	if (open_files_count > 200) {
		global.setTimeout(readFile, 1000, file);
	} else {
		open_files_count++;
		fs.readFile(file, function(err, data) {
			if (err) handleError(err);
			open_files_count--;
      sys.debug(data);
		});
	}
}


fs.readdir(path, function(err, files) {
	if (err) handleError(e);
	readFiles(files.slice(0,1));
});

//a =['2009-10-29-javascript-basics-quiz.textile'];
//doSomething(a);

