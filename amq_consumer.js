
(function(){

	Script.include("amq_hifi_adapter.js");
	Script.include("amq.js");

	print("Start Consumer ...");

	var amq = new Amq();

  	amq.init({ 
    	uri: "http://localhost:8161/api", 
    	logging: true,
    	timeout: 20
  	});
  
  	var myHandler = {
  		rcvMessage: function(message)
  		{
     		print("received "+message);
  		}
  	};
 
  	amq.addListener("C1","topic://HIFI.MS",myHandler.rcvMessage);
  
})