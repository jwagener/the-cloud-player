// Place your application-specific JavaScript functions and classes here
// This file is automatically included by javascript_include_tag :defaults

$(document).ready(function(){
  var options = {
    'request_token_endpoint': '/soundcloud-connect/request_token',
    'access_token_endpoint': '/soundcloud-connect/access_token',
    'callback': function(query_obj){ window.location.reload(); }
  };

  $('#sc_connect').each(function(button){
    SC.Connect.prepareButton(this,options); 
  }); 
});