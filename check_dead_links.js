// Objective is to find all the files under _posts directory
// scan those files for url
// report the http status code returned by hitting those urls
var sys = require('sys'),
http = require('http'),
fs = require('fs'),
url = require('url'),
path = './_posts',
open_files_count = 0,
cwd = process.cwd();

function handleError(err) {
	sys.puts('Error!!! encountered ' + err);
	process.exit();
}

function readFiles(files) {
	files.forEach(function(file) {
		var short_file_name = file.toString(),
		filename = cwd + '/_posts/' + file.toString();
		readFile(filename, short_file_name);
	});
}

function readFile(file, short_file_name) {
	if (open_files_count > 200) {
		global.setTimeout(readFile, 10, file, short_file_name);
	} else {
		open_files_count++;
		fs.readFile(file, function(err, data) {
			if (err) handleError(err);
			open_files_count--;
			processFileData(file, data, short_file_name);
		});
	}
}

function processFileData(file, data, short_file_name) {
	var regex = /(http:\/\/(?![^\s]*\.dtd\b)[^\s"'<]*)/ig,
	matches = data.match(regex),
	fn,
	url,
	i,
	sfn = short_file_name;

	if (matches) {
		for (i = 0; i < matches.length; i++) {
			url = matches[i];
			fn = function(statusCode) {
				var msg = statusCode + '\n' + url + '\n' + short_file_name + '\n' + sfn + '\n';
				sys.puts(msg);
			};
			statusCodeForURL(url, fn);
		}
	}
}

function statusCodeForURL(_url, callback) {
	var connection, tmp = url.parse(_url),
	protocol = tmp.protocol,
	host = tmp.host,
	pathname = tmp.pathname;

	connection = http.createClient(80, host); // make it 443 if https
	request = connection.request('GET', pathname, {
		'host': host
	});

	request.addListener('response', function(response) {
		callback(response.statusCode);
	});
	request.close();
}

fs.readdir(path, function(err, files) {
	if (err) handleError(e);
	readFiles(files);
});

