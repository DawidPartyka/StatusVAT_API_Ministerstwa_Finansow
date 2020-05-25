let writeFile = {
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
    let sData = arr.join(" ");
    console.log("sdata: " + sData);
    console.log(arr.length);
    console.log('calling server');

    $.ajax({
              url: '/vats',
              type: 'POST',
              contentType: 'plain/text',
              data: sData.replace(/\n|\r/g, ""), //NIPy
              success: function(response){
                let obj = JSON.parse(response);
                let data = [];

                while(obj.length){
                  console.log('\tkod: ' + obj[0].kod + ',\n\tkomunikat: ' + obj[0].komunikat + ',\n\tnip: ' + obj[0].nip + '\n');
                  data.push({nip: obj[0].nip, comm: obj[0].komunikat, code: obj[0].kod});
                  //this.addData(obj[0]);
                  obj.shift();
                }

                writeFile.write(data);
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
        //console.log(dataArr);

        if(dataArr.length){
          console.log(dataArr.length);
          receivedData.getData(dataArr);
        }
      }

      r.readAsText(f);

      } else {
        alert("No file uploaded");
      }
  }
});
