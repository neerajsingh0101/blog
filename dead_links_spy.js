var sys = require('sys'),
http = require('http'),
fs = require('fs'),
url = require('url'),
path = './_posts',
open_files_count = 0,
cwd = process.cwd(),
storage = {},
files_length;

function handleError(err) {
	sys.puts('Error!!! encountered ' + err);
	process.exit();
}

function readFiles(files) {
	files_length = files.length;
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
			processFileData(file, data);
		});
	}
}

function processFileData(file, data) {
	var regex = /(http:\/\/(?![^\s]*\.dtd\b)[^\s"']*)/ig,
	matches = data.match(regex),
	urlCheckResult = [];
	if (matches) {
		for (var i = 0; i < matches.length; i++) {
			var url = matches[i];
			sys.debug(url);
			a = [url, statusCodeForURL(url)];
			urlCheckResult.push(a);
		}
	}
	storage[file] = urlCheckResult;
}

function statusCodeForURL(_url) {
	var protocol, host, pathname, connection, tmp, base, statusCode;

	tmp = url.parse(_url);
	protocol = tmp.protocol;
	host = tmp.host;
	pathname = tmp.pathname;

	connection = http.createClient(80, host); // make it 443 if https
	request = connection.request('GET', pathname, {
		'host': host
	});

	request.addListener('response', function(response) {
		//response.setBodyEncoding("utf8");
		//response.addListener('data', function(chunk) {
		////sys.puts("Body: " + chunk);
		//});
		statusCode = response.statusCode;
	});
	request.close();
	return statusCode;
}

// storage might not be fulfilled with data when this call is invoked. It is important that
// a check is made to ensure that all data is present is storage because looking for result
function printReport() {
	var l = Object.keys(storage).length;
	sys.debug(l);
	sys.debug(files_length);
	sys.p(sys.inspect(storage));
	if (l === files_length) {
		sys.p(sys.inspect(storage));
	} else {
		global.setTimeout(printReport, 5);
	}
}

fs.readdir(path, function(err, files) {
	if (err) handleError(e);
	readFiles(files.slice(0, 4));
	printReport();
});

