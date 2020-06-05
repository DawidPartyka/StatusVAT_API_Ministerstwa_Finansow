const soap = require('soap');
const moment = require('moment');
const savedData = require('./savedData');

let dataObj = {
  results: [],                                //Placeholder for results
  show: function(){                           //Log stored data in console
    let tmp = this.results;
    for(let i = 0; i < tmp.length; i++){
      let info = `Element ${i} {\n\tkod: ${tmp[i].kod},\n\tkomunikat: ${tmp[i].komunikat},\n\tnip: ${tmp[i].nip},\n\tdate: ${tmp[i].date},\n\torigin: ${tmp[i].origin}\n}`
      console.log(info);
    }
  },
  addResult: function(obj){                   //Add data to 'results' attribute in form of an object
    this.results.push({kod: obj.status, komunikat: obj.comm, nip: obj.nip, date: obj.date, origin: obj.origin});
  },
  check: function(data, res){                 //Check if requested data was processed before and saved to a file
    const time = moment().format('YYYYMMDD'); //Date now in format used in the 'savedData' file
    const result = savedData.filter(x => data.indexOf(savedData.nip) && x.date === time); //Get stored data from file

    result.forEach((entry) => {
      this.addResult(entry);                    //Add data to 'results' attribute
      data.splice(data.indexOf(entry.nip), 1);  //Remove NIP for which data was found
    });

    if(data.length) {                           //Are all NIP numbers processed?
      this.callAPI(data, res);                  //No. Call API
    } else {
      this.finalize(res);                       //Yes. Send data back to client
    }
  },
  callAPI: function(data, res){
    //.. Function making a proper call to the API
    async function call(nip){
      const url = 'https://sprawdz-status-vat.mf.gov.pl/?wsdl'; //API adress

      let promise = new Promise((resolve, rej) => {
        setTimeout(function(){
          soap.createClient(url, function(err, client) {
            console.log('Calling API');

            client.SprawdzNIP({ nip: nip }, function(err, result) {
              const tmpObj = {              //Prepares temporary object to be added to the 'results' attribute
                status: result.Kod,
                comm: result.Komunikat,
                nip: nip,
                date: moment().format('YYYYMMDD'),
                origin: 'API'               //Set origin to 'API'. It will be shown that way in dataObj.show()
              }

              dataObj.addResult(tmpObj);    //Save result

              tmpObj.origin = 'Stored';     //Change origin to be stored in savedData
              savedData.push(tmpObj);       //Add to result savedData module
              resolve(tmpObj);              //Returns result. It's redundant
            });
          });
        }, 100)                             //Making calls with at least 100ms delay. (Documentation states 10 calls per second)
      });

      let fin = await promise;              //Wait for the resolve of the promise
    }

    function recurseCalls(param){           //Make one call. Wait for response. Shift data. Recurses till parameter is not empty.
      if(param[0] != undefined){            //Checks if first parameter isn't 'undefined'. Shit happens.
        call(param[0]).then(function(){
          param.splice(0, 1);               //Shift data after the call

          if(param.length){                 //If data not empty continue
            recurseCalls(param);
          }
          else{                             //All data has been processed
            console.log('all data processed');
            dataObj.finalize(res);          //Send data back to client
          }
        });
      }
      else{                                 //Whole else will be changed. Test only.
        param.splice(0, 1);
        if(param.length){
          recurseCalls(param);
        }
        else{
          console.log('all data processed');
          dataObj.finalize(res);
        }
      }

    }

    recurseCalls(data);                     //Start calls to API
  },
  finalize: function(res){                  //Sending data back to client
    this.show();                            //Display data in console
    res.json(this.results);                 //Send results attribute as JSON
    res.status(200).send();                 //Everything's OK
    this.results = [];                      //Empty results
  }
}

module.exports = dataObj;
