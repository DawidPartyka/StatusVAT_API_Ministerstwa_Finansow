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

/* Create HTTPS server with SSL from "options" object */
var serverHttps = https.createServer(options, app).listen(httpsPort, () => {
    console.log(">> Server listening at port " + httpsPort);
});

/*Request | routing handler*/
app.use('/index', express.static(__dirname + '/clientFiles'));  //main page

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

app.post('/vats', function(req, res){               //POST request from client
  req.on('data', chunk => {
      processNips(chunk.toString().split(' '));     //Sent NIPs in form of array from the POST request
  });

  function processNips(data){
    //Sanity check
    if(data){
      let ctrl = data.length;                       //Just a control value. Number of NIPs sent through POST

      let dataObj = {
        processed: [],                              //Results go here in form of objects {kod, komunikat, nip}
        add: function(comm, nipFromRes){            //Add received data to array "processed" in form of object
          this.processed.push({kod: comm.Kod, komunikat: comm.Komunikat, nip: nipFromRes});
        },
        finish: function(){
          dataObj.show(); //console.log saved data
          //...send back the data
          res.end(JSON.stringify(this.processed));  //Return data to client in form of JSON
          res.status(200).send();                   //Everything's OK
          console.log('stopped');
        },
        show: function(){ //Method only to output received data in console
          let tmp = this.processed;
          for(let i = 0; i < this.processed.length; i++){
            console.log('Element ' + i + '{');
            console.log('\tkod: ' + tmp[i].kod + ',\n\tkomunikat: ' + tmp[i].komunikat + ',\n\tnip: ' + tmp[i].nip + '\n}');
          }
        },
        startCalls: function(data){
          let tmp = data;
          let timedCalls = setInterval(function(){ timer() }, 100);  /* Making calls in intervals as given in the documentation.
                                                                     10 NIPs per second so the functions makes call with a single
                                                                     NIP every 0.1 second
                                                                     https://www.podatki.gov.pl/media/3275/specyfikacja-we-wy.pdf */ 
          function timer(){
            var url = 'https://sprawdz-status-vat.mf.gov.pl/?wsdl';  //API adress
            var args = { nip: data[0] };                             //NIP as batch to the SOAP

            soap.createClient(url, function(err, client) {
              client.SprawdzNIP({ nip: data[0] }, function(err, result) {
                dataObj.add(result, data[0]);          //Save result and nip for this result to array
                data.shift();                          //Deletes first NIP in array which was processed in the same iteration

                if(!data || dataObj.processed.length === ctrl){ //Are all NIPs processed?
                  stopFunction();                               //Call to stop interval processing NIPs
                }
              });
            });
          }

          //Stops NIP processing interval
          function stopFunction() {
            clearInterval(timedCalls); //Clear interval making calls to api
            dataObj.finish();          //Call obj method to send data back to client
            return;
          }
        }
      }

      dataObj.startCalls(data); //Start processing NIPs
    }
  }
});
