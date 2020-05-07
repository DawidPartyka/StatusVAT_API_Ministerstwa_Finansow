$.ajax({
        url: '/vats',
        type: 'POST',
        contentType: 'plain/text',
        //contentType: 'application/json',
        //data: '5223071241 5223071242 5223071243', //NIPy
        data: '7791011327 5261037737 7811897358', //NIPy
        //data: '5223071241',
        /*body: JSON.stringify({
          contents: {
              nips: ['5223071241 ','5223071242 ','5223071243']
            }
        }),*/
        success: function(response){
          console.log(response);
        }
      });
