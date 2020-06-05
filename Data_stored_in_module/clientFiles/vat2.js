const writeFile = {
  content: function(data){
    let content = '';
    //----------Prepare data to make file--------------
    data.forEach(function(entry){
      content += `NIP:\t${entry.nip}\nStatus:\t${entry.comm}\nKod:\t${entry.code}\n\n`
    });
    //----------Prepare data to make file--------------

    return content;
  },
  write: function(data){
    //--Create the text file as a Blob:
  	const blob = new Blob([this.content(data)],{type: 'text/plain'});

  	//--Download the file:
  	download(blob,"StatusNip.txt"); //file name and extension

  	function download(blob,name) {
  		const url = URL.createObjectURL(blob),
  		div = document.createElement("div"),
  		anch = document.createElement("a");

  		document.body.appendChild(div);
  		div.appendChild(anch);

  		anch.innerHTML = "&nbsp;";
  		div.style.width = "0";
  		div.style.height = "0";
  		anch.href = url;
  		anch.download = name;

  		let ev = new MouseEvent("click",{});
  		anch.dispatchEvent(ev);
  		document.body.removeChild(div);
  	}
  }
}

const receivedData = {
  checkNIP: {                       //Validate NIP
    weight: [6, 5, 7, 2, 3, 4, 5, 6, 7],
    check: function(nip){
      let sum = 0;

      for (let i = 0; i < 9; i++) { //9 = length of weight array
          sum += (parseInt(nip.substr(i, 1)) * this.weight[i]);
      }
      return sum % 11 === parseInt(nip.substring(9, 10));
    }
  },
  getData: function(arr){              //Prepare and send data received from file
    console.log(`arr length: ${arr.length}`);
    let send = [];                     //Placeholder for data to be sent

    arr.forEach((entry) => {
      if(this.checkNIP.check(entry)){  //Validate NIP
        if(send.indexOf(entry) === -1) //Exlude duplicates
          send.push(entry);
      }
      else{
        alert(`Podany NIP: ${entry} jest nieprawidłowy.\nNie zostanie on zawarty w pliku wyjściowym.`)
      }
    });

    console.log(`sending length: ${send.length}`);

    if(send.length){  //Sanity check
      console.log('calling server');

      $.ajax({
                url: '/vats',
                type: 'POST',
                contentType: 'json/application',
                data: JSON.stringify(send), //NIP numbers in form of JSON array
                success: function(response){
                  console.log('success');
                  let obj = response;
                  let data = [];

                  while(obj.length){
                    console.log('\tkod: ' + obj[0].kod + ',\n\tkomunikat: ' + obj[0].komunikat + ',\n\tnip: ' + obj[0].nip + '\n');
                    data.push({nip: obj[0].nip, comm: obj[0].komunikat, code: obj[0].kod});
                    obj.shift();
                  }

                  writeFile.write(data);
                }
              });
    }
    else{
      alert('Brak poprawnych danych do przetworzenia');
    }
  }
}

$(document).ready(function(){
  //File upload to calculate CRC
  document.getElementById('inputfile').onchange = function (evt) {
    const f = evt.target.files[0];

    //Sanity check
    if (f){
      const r = new FileReader();

      r.onload = function(e) {
        const contents = e.target.result;
        const dataArr = contents.substr(0, contents.length).replace(/\r/g, "").split("\n"); //Data read from file split into an array on new lines
        //console.log(dataArr);

        if(dataArr.length){
          console.log(dataArr.length);
          receivedData.getData(dataArr);  //Prepare and send data to server
        }
      }

      r.readAsText(f);

      } else {
        alert("No file uploaded");
      }
  }
});
