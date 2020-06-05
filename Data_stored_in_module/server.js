const { parse } = require('querystring');

const httpsPort = 8000;

/*Dependencies*/
const express = require('express');
const https = require('https');
const fs = require('fs');
const getVATdata = require('./getVATdata');
/*Dependencies*/

const app = express();

/*SSL*/
const options = {
    key: fs.readFileSync('key.pem', 'utf8'),
    cert: fs.readFileSync('server.crt', 'utf8')
};
//console.log("KEY: ", options.key);
//console.log("CERT: ", options.cert);
/*SSL*/

const serverHttps = https.createServer(options, app).listen(httpsPort, () => {
    console.log(">> Server listening at port " + httpsPort);
});

/*Request | routing handlers*/
app.use('/index', express.static(__dirname + '/clientFiles'));  //main page https://localhost:8000/index/vat.html

//Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

app.post('/vats', function(req, res){         //Handle POST request from page
  req.on('data', data => {
    getVATdata.check(JSON.parse(data), res);  //Passing data to module with the response object
                                              //Module handles the response
  });
});
