const { parse } = require('querystring');

const httpsPort = 8000;

/*Dependencies*/
var express = require('express');
var soap = require('soap');
var https = require('https');
var fs = require('fs');
/*Dependencies*/

var app = express();

/*SSL*/
var options = {
    key: fs.readFileSync('key.pem', 'utf8'),
    cert: fs.readFileSync('server.crt', 'utf8')
};
//console.log("KEY: ", options.key);
//console.log("CERT: ", options.cert);
/*SSL*/

var serverHttps = https.createServer(options, app).listen(httpsPort, () => {
    console.log(">> Server listening at port " + httpsPort);
});

/*Routing handler*/
app.use('/index', express.static(__dirname + '/clientFiles')); //main page

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

app.post('/vats', function(req, res){ //post request from page
  req.on('data', chunk => {
      processNips(chunk.toString().split(' '));
  });

  function processNips(data){
    //Sanity check
    if(data){

      let dataObj = {
        processed: [], //Results go here in form of objects {vat status, messeage, nip}
        add: function(comm, nipFromRes){
          this.processed.push({kod: comm.Kod, komunikat: comm.Komunikat, nip: nipFromRes});
        },
        show: function(){ //Show received data in console
          let tmp = this.processed;
          for(let i = 0; i < this.processed.length; i++){
            console.log('Element ' + i + '{');
            console.log('\tkod: ' + tmp[i].kod + ',\n\tkomunikat: ' + tmp[i].komunikat + ',\n\tnip: ' + tmp[i].nip + '\n}');
          }
        },
        startCalls: function(data){
          let timedCalls = setInterval(function(){ timer() }, 1000);  //Making calls every 1sec

          function timer(){
            var url = 'https://sprawdz-status-vat.mf.gov.pl/?wsdl'; //API adress
            var args = { nip: data[0] }; //Only one nip checked at a time. Only for tests.

            soap.createClient(url, function(err, client) {
              client.SprawdzNIP(args, function(err, result) {
                dataObj.add(result, data[0]); //Save result and nip for this result to array
                data.shift(); //Deletes first NIP in array which was processed in the same iteration

                //Are all NIPs processed?
                if(!data.length){
                  dataObj.show(); //console.log saved data
                  console.log('stopped');
                  stopFunction(); //Call to stop interval processing NIPs
                }
              });
            });
          }

          //Stops NIP processing interval
          function stopFunction() {
            clearInterval(timedCalls);
          }
        }
      }

      dataObj.startCalls(data); //Start processing NIPs
    }
  }
});
