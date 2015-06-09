
(function(){

	this.connectStatusHandler;
	// The URI of the AjaxServlet.
	this.uri = "http://localhost:8161/api/amq";
	this.batchInProgress = false;
	this.messageQueue = [];
	this.messageHandlers = {};
	this.pollDelay;
	this.timeout;
	this.sessionInitialized = false;
	this.sessionInitializedCallback;
	this.messageHandlers = {};
	this.connectStatusHandler;
	this.pollErrorDelay = 5;
	this.waitForPoll = -1.0;
	
	
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
				options.success();
			} else {
				print(options.success);
				print("not a function?");
			}
		
			return req.responseText;
		
		} else {
			print("ERROR: Didn't got ReadyState DONE");
			if(typeof options.error === 'function') {
				options.error(ioargs.xhr,ioargs.xhr.status, ex);
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
			print("Send Poll...");
			this.sendPoll();
			
	};
	
	this.buildParams = function(msgs) {
		var s = [];
		for (var i = 0, c = msgs.length; i < c; i++) {
			if (i != 0) s[s.length] = '&';
			s[s.length] = ((i == 0) ? 'destination' : 'd' + i);
			s[s.length] = '=';
			s[s.length] = msgs[i].destination;
			s[s.length] = ((i == 0) ? '&message' : '&m' + i);
			s[s.length] = '=';
			s[s.length] = msgs[i].message;
			s[s.length] = ((i == 0) ? '&type' : '&t' + i);
			s[s.length] = '=';
			s[s.length] = msgs[i].messageType;
		}
		return s.join('');
	};
	
	this.errorHandler = function(xhr, status, ex) {
		this.connectStatusHandler(false);
		print('Error occurred in ajax call. HTTP result: ' +
		                         xhr.status + ', status: ' + status);
	};
	
	this.endBatch = function() {
			if (messageQueue.length > 0) {
				var messagesToSend = [];
				var messagesToQueue = [];
				var outgoingHeaders = null;
				
				// we need to ensure that messages which set headers are sent by themselves.
				// if 2 'listen' messages were sent together, and a 'selector' header were added to one of them,
				// AMQ would add the selector to both 'listen' commands.
				for(i=0;i<messageQueue.length;i++) {
					// a message with headers should always be sent by itself.	if other messages have been added, send this one later.
					if ( this.messageQueue[ i ].headers && messagesToSend.length == 0 ) {
						messagesToSend[ messagesToSend.length ] = this.messageQueue[ i ].message;
						outgoingHeaders = messageQueue[ i ].headers;
					} else if ( ! this.messageQueue[ i ].headers && ! outgoingHeaders ) {
						messagesToSend[ messagesToSend.length ] = this.messageQueue[ i ].message;
					} else {
						messagesToQueue[ messagesToQueue.length ] = this.messageQueue[ i ];
					}
				}
				var body = this.buildParams(messagesToSend);
				this.messageQueue = messagesToQueue;
				this.batchInProgress = true;
				this.ajax(this.uri, {
					method: 'post',
					headers: outgoingHeaders,
					data: body,
					success: this.endBatch, 
					error: this.errorHandler});
			} else {
				this.batchInProgress = false;
			}
	};
	
	this.sendJmsMessage = function(destination, message, type, headers) {
		var message = {
			destination: destination,
			message: message,
			messageType: type
		};
		// Add message to outbound queue
		if (this.batchInProgress) {
			this.messageQueue[this.messageQueue.length] = {message:message, headers:headers};
		} else {
			this.batchInProgress = true;
			this.ajax(this.uri, { method: 'post',
				data: this.buildParams( [message] ) ,
				error: this.errorHandler,
				headers: headers,
				success: this.endBatch});
		}
	};
	
	this.messageHandler = function(data) {
		
		
		print("Received : " + data);
		
		//Read and format the Data as JSON Object.
		
		
	};
	
	
	this.pollHandler = function(data) {
		print("pollHandler called...");
		try {
			this.messageHandler(data);
		} catch(e) {
			print('Exception in the poll handler: ' + data + " : " + e);
			throw(e);
		} finally {
			this.waitForPoll = this.pollDelay;
		}
	};

	this.initHandler = function(data) {
		print("InitHandler called....");
		this.sessionInitialized = true;
		if(this.sessionInitializedCallback) {
			this.sessionInitializedCallback();
		}
		this.pollHandler(data);
	};
	
	function pollErrorHandler(xhr, status, ex) {
		this.connectStatusHandler(false);
		if (status === 'error' && xhr.status === 0) {
			print('Server connection dropped.');
			this.waitForPoll = this.pollErrorDelay;
			return;
		}
		print('Error occurred in poll. HTTP result: ' +
		                         xhr.status + ', status: ' + status);
		this.waitForPoll = this.pollErrorDelay;
	};
	
	this.sendPoll = function() {
		print("=======> I'll send a Poll now.....");
		var now = new Date();
		var timeoutArg = this.sessionInitialized ? timeout : 0.001;
		var data = 'timeout=' + timeoutArg * 1000
				 + '&d=' + now.getTime()
				 + '&r=' + Math.random();
		var successCallback = this.sessionInitialized ? this.pollHandler : this.initHandler;

		var options = { method: 'GET',
			data: data,
			success: successCallback,
			error: this.pollErrorHandler};
		this.ajax(this.uri, options);
	};

	this.addListener = function(id, destination, handler, options) {
			this.messageHandlers[id] = handler;
			var headers = options && options.selector ? {selector:options.selector} : null;
			this.sendJmsMessage(destination, id, 'listen', headers);
	};

	// remove Listener from channel or topic.
	this.removeListener = function(id, destination) {
			this.messageHandlers[id] = null;
			this.sendJmsMessage(destination, id, 'unlisten');
	};

	this.update = function(d) {
		
		if(this.waitForPoll > 0) {
			this.waitForPoll -= d;
			print("waitForPoll now : " + this.waitForPoll);
		} else {
			if(this.waitForPoll != -1) {
				print("Trigger Poll... : " + this.waitForPoll);
				this.waitForPoll = -1;
				this.sendPoll();
			}
		}
	};

	this.cleanup = function() {
		print("Cleaning up...");
	};


	this.init({ 
    	uri: this.uri, 
    	pollDelay : 20,
    	logging: true,
    	timeout: 20
  	});
	
	
	var myHandler = {
  		rcvMessage: function(message)
  		{
     		print("received "+message);
  		}
	};
 
	this.addListener("HIFI","topic://HIFI.MS",myHandler.rcvMessage);

	this.clickReleaseOnEntity = function(entityID, mouseEvent) { 
        print("Clicked.....");
        this.sendJmsMessage("topic://HIFI.MS","{test:1}",'send');  
    }; 
	
	Script.scriptEnding.connect(this.cleanup);
	Script.update.connect(this.update);
	
  
})