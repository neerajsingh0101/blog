var sys = require("sys"),
   http = require("http");

data = '/2005/07/03/one-to-many-bi-directional-relationship-using-xdoclet-and-hibernate/';

url = 'www.google.com';
url = 'neeraj.name';

var con = http.createClient(80, url);

var request = con.request("GET", data, {'host': 'neeraj.name' });
request.addListener('response', function (response) {
  sys.puts("STATUS: " + response.statusCode);
  sys.puts("HEADERS: " + JSON.stringify(response.headers));
  response.setBodyEncoding("utf8");
  response.addListener("data", function (chunk) {
    sys.puts("BODY: " + chunk);
  });
});
request.close();



