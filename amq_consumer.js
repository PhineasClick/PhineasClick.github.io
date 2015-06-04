
AmqAConsumer =  function{

Script.include("amq.js");

var amq = Amq;

  amq.init({ 
    uri: "http://localhost:61616/", 
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
  
  
}