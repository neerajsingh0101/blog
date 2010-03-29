var sys = require('sys'),
fs = require('fs'),
path = './_posts',
open_files_count = 0,
cwd = process.cwd();

function handleError(err) {
	sys.puts('Error!!! encountered ' + err);
	process.exit();
}

function doSomething1(files) {
	files.forEach(function(file) {
		var filename = cwd + '/_posts/' + file.toString();
		var data = fs.readFileSync(filename);
		sys.debug(data);
	});
}

function doSomething2(files) {
	files.forEach(function(file) {
		var filename = cwd + '/_posts/' + file.toString();
		openFile(filename);
	});
}

function openFile(file) {
	sys.debug('open_files_count is ' + open_files_count);
	if (open_files_count > 10) {
		sys.debug('invoking setinterval');
    global.setTimeout(openFile, 1000, file);
	} else {
		open_files_count++;
		fs.readFile(file, function(err, data) {
			if (err) {
				sys.debug('error::: ' + open_files_count);
				handleError(err);
			}
			open_files_count--;
      sys.debug('reducing the count count is ' + open_files_count);
      sys.debug(data);
		});
	}

}

fs.readdir(path, function(err, files) {
	if (err) handleError(e);
	doSomething2(files);
});

//a =['2009-10-29-javascript-basics-quiz.textile'];
//doSomething(a);

