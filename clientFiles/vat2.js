function checkNip(nip) {
    if (typeof nip !== 'string')
        return false;

    nip = nip.replace(/[\ \-]/gi, '');

    let weight = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    let sum = 0;
    let controlNumber = parseInt(nip.substring(9, 10));
    let weightCount = weight.length;
    for (let i = 0; i < weightCount; i++) {
        sum += (parseInt(nip.substr(i, 1)) * weight[i]);
    }

    return sum % 11 === controlNumber;
}

let writeFile = {
  content: function(data){
    let content = '';
    //----------Prepare data to make file--------------
    data.forEach(function(entry){
      content += `NIP:\t${entry.nip}\nStatus:\t${entry.comm}\nKod:\t${entry.code}\nAktualne na dzień:\t${entry.date}\n\n`;
    });
    //----------Prepare data to make file--------------

    return content;
  },
  write: function(data){
    //--Create the text file as a Blob:
  	let blob = new Blob([this.content(data)],{type: 'text/plain'});

  	//--Download the file:
  	download(blob,"StatusNip.txt"); //file name and extension

  	function download(blob,name) {
  		let url = URL.createObjectURL(blob),
  		div = document.createElement("div"),
  		anch = document.createElement("a");

  		document.body.appendChild(div);
  		div.appendChild(anch);

  		anch.innerHTML = "&nbsp;";
  		div.style.width = "0";
  		div.style.height = "0";
  		anch.href = url;
  		anch.download = name;

  		var ev = new MouseEvent("click",{});
  		anch.dispatchEvent(ev);
  		document.body.removeChild(div);
  	}
  }
}

let receivedData = {
  getData: function(arr){
    let sData = [];                       //Placeholoder for checked NIP numbers

    console.log(`Arr len: ${arr.length}`);

    arr.forEach((entry) => {
      if(checkNip(entry)){                //Check if it's a valid NIP number
        if(sData.indexOf(entry) === -1){  //Check if it's not a duplicate
          sData.push(entry);              //Push data to the array
        }
      }
    });

    sData = sData.join(" ");              //Join data in array to be sent as plain text
    console.log('Calling server');

    $.ajax({
              url: '/vats',
              type: 'POST',
              contentType: 'plain/text',
              data: sData.replace(/\n|\r/g, ""),  //NIP numbers
              success: function(response){
                let obj = JSON.parse(response);   //Parse received JSON data
                let data = [];                    //Placeholoder for received data

                while(obj.length){
                  console.log('\tkod: ' + obj[0].kod + ',\n\tkomunikat: ' + obj[0].komunikat + ',\n\tnip: ' + obj[0].nip + '\n');
                  data.push({nip: obj[0].nip, comm: obj[0].komunikat, code: obj[0].kod, date: obj[0].date});
                  obj.shift();                    //Remove first already processed element
                }

                writeFile.write(data);            //Create a file to download
              }
            });
  }
}

$(document).ready(function(){
  //File upload to calculate CRC
  document.getElementById('inputfile').onchange = function (evt) {
    var f = evt.target.files[0];

    //Sanity check
    if (f){
      var r = new FileReader();

      r.onload = function(e) {
        let contents = e.target.result;
        let dataArr = contents.substr(0, contents.length).split("\n");

        if(dataArr.length){
          receivedData.getData(dataArr);  //Make a POST call to a server with received data
        }
      }

      r.readAsText(f);

      } else {
        alert("No file uploaded");
      }
  }
});
