SC.Connect =  {
    'prepareButton': function(link, options){      
      SC.Connect.wrapped_callback = options.callback;
      link.addEventListener('click',function(){
        SC.Connect.popup_window = window.open(options.request_token_endpoint,"sc_connect_popup","location=1, width=456, height=500,toolbar=no,scrollbars=yes");
        return false;
      },true);
    },
    'callback': function(query_obj){
      SC.Connect.popup_window.close();
      SC.Connect.wrapped_callback(query_obj);
    }
  };
  
SC.QueryToObject = function(query) {
    var obj = {};
    var splitted_url =document.URL.split("?");
    var query = splitted_url[1] ? splitted_url[1] : "";
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
      var pair = vars[i].split("=");
      obj[pair[0]] = decodeURIComponent(pair[1]);
    }
    return(obj);
  }
