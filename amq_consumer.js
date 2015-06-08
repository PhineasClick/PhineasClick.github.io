
(function(){

	this.connectStatusHandler;
	// The URI of the AjaxServlet.
	this.uri = "http://localhost:8161/api/amq";
	this.pollDelay;
	this.timeout;
	this.sessionInitialized = false;
	this.sessionInitializedCallback;
	this.messageHandlers = {};
	this.connectStatusHandler;
	this.pollErrorDelay = 5000;
	
	this.ajax = function(uri, options) {
		
		var req = new XMLHttpRequest();
		var state = req.readyState;

		req.responseType = "xml";	
			
		//req.setRequestHeader(options.headers);
		req.setRequestHeader("Content-type","application/xml");
		
		print("Sending : " + JSON.stringify(options));
		
		if (options.method == 'POST') {
			req.open(options.method, uri, false);
			req.send(options.data);
			
		} else {
			if (options.data)
			{
				uri += "?";
				uri += options.data;
			}
			req.open(options.method, uri, false);
			req.send();
		}
		
		print("Request sent : " + req.readyState);
		if(req.readyState == req.DONE) {
			
			print("HttpStatus  : " + req.status);
			print("ErrorCode   : " + req.errorCode);
			print("Status Text : " + req.statusText);
			print("Response    : " + req.responseText);
			
			
			if(typeof options.success === 'function') {
				eval(options.success);
			} else {
				print(options.success);
				print("not a function?");
			}
		
			return req.responseText;
		
		} else {
			print("ERROR: Didn't got ReadyState DONE");
			if(typeof options.error === 'function') {
				eval(options.error + "(ioargs.xhr,ioargs.xhr.status, ex)");
				
				//maybe better use 'new Function' 
			} else {
				print(options.error);
				print("not a function?");
			}
		}

	};	
		
	this.init = function(options) {
			print("AMQ initializing");
			this.connectStatusHandler = options.connectStatusHandler || function(connected){};
			this.pollDelay = typeof options.pollDelay == 'number' ? options.pollDelay : 0;
			this.timeout = typeof options.timeout == 'number' ? options.timeout : 25;
			this.sessionInitializedCallback = options.sessionInitializedCallback
			this.sendPoll();
			
	};
	
	this.messageHandler = function(data) {
		
		
		print("Received : " + data);
		
		//Read and format the Data as JSON Object.
		
		
	}
	
	
	this.pollHandler = function(data) {
		try {
			this.messageHandler(data);
		} catch(e) {
			print('Exception in the poll handler: ' + data + " : " + e);
			throw(e);
		} finally {
			//TODO : Maybe need to be replaced ny the Script.update Event.
			setTimeout(sendPoll, pollDelay);
		}
	};

	this.initHandler = function(data) {
		this.sessionInitialized = true;
		if(this.sessionInitializedCallback) {
			this.sessionInitializedCallback();
		}
		this.pollHandler(data);
	}
	
	function pollErrorHandler(xhr, status, ex) {
		this.connectStatusHandler(false);
		if (status === 'error' && xhr.status === 0) {
			print('Server connection dropped.');
			setTimeout(function() { this.sendPoll(); }, this.pollErrorDelay);
			return;
		}
		print('Error occurred in poll. HTTP result: ' +
		                         xhr.status + ', status: ' + status);
		setTimeout(function() { this.sendPoll(); }, this.pollErrorDelay);
	}
	
	this.sendPoll = function() {
		// Workaround IE6 bug where it caches the response
		// Generate a unique query string with date and random
		var now = new Date();
		var timeoutArg = this.sessionInitialized ? timeout : 0.001;
		var data = 'timeout=' + timeoutArg * 1000
				 + '&d=' + now.getTime()
				 + '&r=' + Math.random();
		var successCallback = this.sessionInitialized ? this.pollHandler : this.initHandler;

		var options = { method: 'GET',
			data: data,
			success: successCallback,
			error: pollErrorHandler};
		this.ajax(this.uri, options);
	}

	this.addListener = function(id, destination, handler, options) {
			this.messageHandlers[id] = handler;
			var headers = options && options.selector ? {selector:options.selector} : null;
			
			//sendJmsMessage(destination, id, 'listen', headers);
	
	};

	// remove Listener from channel or topic.
	this.removeListener = function(id, destination) {
			this.messageHandlers[id] = null;
			//sendJmsMessage(destination, id, 'unlisten');
	};


	this.init({ 
    	uri: this.uri, 
    	logging: true,
    	timeout: 20
  	});
	
	
	var myHandler = {
  		rcvMessage: function(message)
  		{
     		print("received "+message);
  		}
	};
 
	this.addListener(myId,myDestination,myHandler.rcvMessage);
  
})