const soap = require('soap');
const mysql = require('mysql');

Date.prototype.formatDate = function() {                      //Format date into YYYY-MM-DD
let mm = this.getMonth() + 1; //getMonth() is zero-based
let dd = this.getDate();

return [this.getFullYear(),
        (mm>9 ? '' : '0') + mm,
        (dd>9 ? '' : '0') + dd
      ].join('-');
};

const finalize = {
  res: '',
  saveRes: function(data){
    this.res = data;
  },
  send: function(results){
    dataObj.show();
    this.res.json(results);
    this.res.status(200).send();
    dataObj.results = [];                      //Empty results
  }
}

const dataObj = {
  startValues: '',                        //Placeholder for data received through POST
  results: [],                            //Placeholder for results
  date: new Date().formatDate(),          //Placeholder for current date
  show: function(){                       //Log stored data in console
    let tmp = this.results;
    for(let i = 0; i < tmp.length; i++){
      let info = `Element ${i} {\n\tkod: ${tmp[i].kod},\n\tkomunikat: ${tmp[i].komunikat},\n\tdate: ${tmp[i].date}\n\tnip: ${tmp[i].nip}\n\tOrigin: ${tmp[i].origin}\n}\n`
      console.log(info);
    }
  },
  commFromCode: function(code){            //Get a messeage based on the NIP number status
    switch (code) {
      case 'N':
        return 'Podmiot o podanym identyfikatorze podatkowym NIP nie jest zarejestrowany jako podatnik VAT';
        break;
      case 'C':
        return 'Podmiot o podanym identyfikatorze podatkowym NIP jest zarejestrowany jako podatnik VAT czynny';
        break;
      case 'Z':
        return 'Podmiot o podanym identyfikatorze podatkowym NIP jest zarejestrowany jako podatnik VAT zwolniony';
        break;
      case 'I':
        return 'Błąd zapytania - Nieprawidłowy Numer Identyfikacji Podatkowej';
        break;
      case 'D':
        return 'Błąd zapytania - Data spoza ustalonego zakresu';
        break;
      case 'X':
        return 'Usługa nieaktywna';
        break;
      default:

    }
  },
  addResult: function(obj){                //Add data to 'results' attribute in form of an object
    this.results.push({kod: obj.status, komunikat: obj.comm, nip: obj.nip, date: obj.date, origin: obj.origin});
  },
  callAPI: function(data){
    //.. Function making a proper call to the API
    async function call(nip){
      const url = 'https://sprawdz-status-vat.mf.gov.pl/?wsdl'; //API adress

      let promise = new Promise((resolve, rej) => {
        setTimeout(function(){
          soap.createClient(url, function(err, client) {
            client.SprawdzNIP({ nip: nip }, function(err, result) {
              let tmpObj = {                //Prepares temporary object to be added to the 'results' attribute
                status: result.Kod,
                comm: result.Komunikat,
                nip: nip,
                date: dataObj.date,
                origin: 'API'
              }

              dataObj.addResult(tmpObj);    //Save result
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

          if(param.length){
            recurseCalls(param);
          }
          else{
            DBobj.insertNIP(dataObj.results); //Insert results to DB
            console.log('all data processed');
          }
        });
      }
      else{                                 //Whole else will be changed. Test only.
        param.splice(0, 1);
        if(param.length){
          recurseCalls(param);
        }
        else{
          DBobj.insertNIP(dataObj.results);
          console.log('all data processed');
        }
      }

    }

    recurseCalls(data);                     //Start calls to API
  }
}

const DBobj = {
  initDB: function(obj){
    this.connection = mysql.createConnection({                //Connection DB data
      host: obj.host,
      user: obj.user,
      password: obj.pass,
      database: obj.db
    })

    this.connect(); //Check if there's connection
  },
  connect: function(){                                //Open connection with DB
    let flag = false;                                 //Flag to determine if connection succeeded

    this.connection.connect(function(err) {
      if (err){
        flag = false;
        console.log('Not connected to DB');
      }
      else{
        flag = true;
        console.log('Connected to DB');
      }
    });

    return flag;                                        //Possibility to check if connection failed while using the moethod
  },
  kill: function(){                                     //Close connection with DB
    this.connection.end();
    console.log('Closed DB connection');
  },
  checkNIP: function(data, res){                        //data = nip numbers (array), date = check status of given nip for given date
    finalize.saveRes(res);
    let date = dataObj.date;                            //Get current date
    let query = `SELECT * FROM status_nip WHERE `;      //Placeholder for query to DB

    data.forEach((entry) => {                           //Add condition to search for results in DB based on given NIP number and current date
      query += `(nip = ${entry} AND data = '${date}') OR `;
    });

    query = query.substring(0, query.length - 4) + `;`; //Trims last 'OR' and adds ';'

    this.connection.query(query, (err,rows) => {        //Query to DB
      if(err){
        console.log('Query failed');
        throw err;
      }
      else{
        console.log('Query successful');

        if(rows.length){
          console.log(`Data length received from Db: ${rows.length}`);

          rows.forEach((entry) => {
            let tmp = {                                 //Prepares temporary object to be added to the 'results' attribute
              status: entry.status,
              comm: dataObj.commFromCode(entry.status),
              nip: entry.nip,
              date: entry.data.formatDate(),
              origin: 'DB'
            }

            dataObj.addResult(tmp);                     //Add data to 'results' attribute

            data.splice(data.indexOf(entry.nip), 1);    //Remove from NIP array numbers found in DB
          });
        }
        if(data){
          console.log(data);
          dataObj.callAPI(data);                        //If there're some NIP numbers left get data from API
        }
        else{
          finalize.send(dataObj.results);                           //No data to process left. Send response to client
        }
      }
    });
  },
  insertNIP: function(data){
    let flag = false;                                   //Flag to determine if there's data received from API
    let query = `INSERT INTO status_nip VALUES `;       //Placeholder for query to DB

    data.forEach((entry) => {
      if(entry.origin === 'API'){
        query += `('${entry.nip}','${entry.date}','${entry.kod}'),`;
        flag = true;
      }
    });

    if(flag){
      query = query.substring(0, query.length - 1) + `;`;

      this.connection.query(query, (err,rows) => {      //Insert data from API to DB
        this.kill();                                    //End connection with DB

        if(err){
          console.log('Query failed');
          throw err;
        }
        else{
          console.log('Query successful');
        }

        finalize.send(dataObj.results);
      });
    }
    else {
      this.kill();                                      //End connection with DB
      console.log('No data needs to be sent to DB');
      finalize.send(dataObj.results);                   //Send response to client
    }
  }
}

module.exports = DBobj;
