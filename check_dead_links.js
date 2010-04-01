// Objective is to find all the files under _posts directory
// scan those files for url
// report the http status code returned by hitting those urls

var number_of_files_to_process = 90,
sys = require('sys'),
http = require('http'),
fs = require('fs'),
url = require('url'),
path = './_posts',
open_files_count = 0,
outstanding_requests_count = 0,
cwd = process.cwd(),
storage = {};

function handleError(err) {
	sys.puts('Error!!! encountered ' + err);
	process.exit();
}

function readFiles(files) {
	files.forEach(function(file) {
		var filename = cwd + '/_posts/' + file.toString();
		readFile(filename, file);
	});
}

function readFile(file, file2) {
	if (open_files_count > 200) {
		global.setTimeout(readFile, 1000, file);
	} else {
		open_files_count++;
		fs.readFile(file, function(err, data) {
			if (err) handleError(err);
			open_files_count--;
			processFileData(file, data, file2);
		});
	}
}

// get all the urls from the 
function processFileData(file, data, short_file_name) {
	sys.debug(short_file_name);
	var regex = /(http:\/\/(?![^\s]*\.dtd\b)[^\s"'<]*)/ig,
	matches = data.match(regex),
	fn,
	url,
	i
	storage[short_file_name] = [];

	if (matches) {
		for (i = 0; i < matches.length; i++) {
			url = matches[i];
			fn = function(statusCode) {
				sys.debug('response received from url ' + url);
				var array = storage[short_file_name];
				array.push([url, statusCode]);
				outstanding_requests_count--;
				sys.debug('number of requests outstanding: ' + outstanding_requests_count);
			};
			outstanding_requests_count++;
			statusCodeForURL(url, fn);
		}
	}
}

function statusCodeForURL(_url, callback) {
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
		callback(response.statusCode);
	});
	request.close();
}

// storage might not be fulfilled with data when this call is invoked. It is important that
// a check is made to ensure that all data is present is storage because looking for result
function printReport() {
	var data, i;

	for (i in storage) {
		sys.puts('');
		sys.puts(i);
		data = storage[i];
		for (i = 0; i < data.length; i++) {
			sys.puts('   ' + data[i][1] + ' ' + data[i][0]);
		}
	}
}

function isReportReady() {
	if (outstanding_requests_count === 0) {
		printReport();
	} else {
		printReport();
		sys.debug('number of requests still outstanding ' + outstanding_requests_count);
		global.setTimeout(isReportReady, 1000);
	}
}

fs.readdir(path, function(err, files) {
	if (err) handleError(e);
	files = files.slice(0, number_of_files_to_process);
	readFiles(files);
	global.setTimeout(isReportReady, 10);
	sys.puts('processing ' + files.length + ' file(s)');
});

