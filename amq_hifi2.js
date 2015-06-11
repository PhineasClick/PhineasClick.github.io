
Amq = function() {


	var that = {};

	var connectStatusHandler;
	// The URI of the AjaxServlet.
	var uri;
	var batchInProgress = false;
	var messageQueue = [];
	var messageHandlers = {};
	var pollDelay;
	var timeout;
	var sessionInitialized = false;
	var sessionInitializedCallback;
	var messageHandlers = {};
	var connectStatusHandler;
	var pollErrorDelay = 5000;
	var clientId = null;
	
	function ajax(uri, options) {
		
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
		
		print("DEBUG : " + JSON.stringify(req));
		
		if(req.readyState == req.DONE) {
			
			print("HttpStatus  : " + req.status);
			print("ErrorCode   : " + req.errorCode);
			print("Status Text : " + req.statusText);
			print("Response    : " + req.responseText);
			
			
			if(typeof options.success === 'function') {
				options.success(req.responseText);
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

	}
		
	function buildParams(msgs) {
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
	}
	
	
	// add clientId to data if it exists, before passing data to ajax connection adapter.
	function addClientId( data ) {
		var output = data || '';
		if( clientId ) {
			if( output.length > 0 ) {
				output += '&';
			}
			output += 'clientId='+clientId;
		}
		return output;
	}
	
	function errorHandler(xhr, status, ex) {
		connectStatusHandler(false);
		print('Error occurred in ajax call. HTTP result: ' +
		                         xhr.status + ', status: ' + status);
	}
	
	function endBatch() {
			if (messageQueue.length > 0) {
				var messagesToSend = [];
				var messagesToQueue = [];
				var outgoingHeaders = null;
				
				// we need to ensure that messages which set headers are sent by themselves.
				// if 2 'listen' messages were sent together, and a 'selector' header were added to one of them,
				// AMQ would add the selector to both 'listen' commands.
				for(i=0;i<messageQueue.length;i++) {
					// a message with headers should always be sent by itself.	if other messages have been added, send this one later.
					if ( messageQueue[ i ].headers && messagesToSend.length == 0 ) {
						messagesToSend[ messagesToSend.length ] = messageQueue[ i ].message;
						outgoingHeaders = messageQueue[ i ].headers;
					} else if ( ! messageQueue[ i ].headers && ! outgoingHeaders ) {
						messagesToSend[ messagesToSend.length ] = messageQueue[ i ].message;
					} else {
						messagesToQueue[ messagesToQueue.length ] = messageQueue[ i ];
					}
				}
				var body = buildParams(messagesToSend);
				messageQueue = messagesToQueue;
				batchInProgress = true;
				ajax(uri, {
					method: 'post',
					headers: outgoingHeaders,
					data: body,
					success: endBatch, 
					error: errorHandler});
			} else {
				batchInProgress = false;
			}
	}
	
	
	
	function messageHandler(data) {
		
		
		print("message Handler received : " + data);
		
		//Read and format the Data as JSON Object.
		
		
		
	}
	
	
	function pollHandler(data) {
		print("pollHandler called...");
		try {
			messageHandler(data);
		} catch(e) {
			print('Exception in the poll handler: ' + data + " : " + e);
			throw(e);
		} finally {
			print("PollDelay : " + pollDelay);
			Script.setTimeout(sendPoll, pollDelay);
		}
	}

	function initHandler(data) {
		print("InitHandler called....");
		sessionInitialized = true;
		if(sessionInitializedCallback) {
			sessionInitializedCallback();
		}
		pollHandler(data);
	}
	
	function pollErrorHandler(xhr, status, ex) {
		connectStatusHandler(false);
		if (status === 'error' && xhr.status === 0) {
			print('Server connection dropped.');
			Script.setTimeout(sendPoll, pollErrorDelay);
			return;
		}
		print('Error occurred in poll. HTTP result: ' +
		                         xhr.status + ', status: ' + status);
		Script.setTimeout(sendPoll, pollErrorDelay);
	}
	
	function sendPoll() {
		print("=======> I'll send a Poll now.....");
		var now = new Date();
		var timeoutArg = sessionInitialized ? timeout : 0.001;
		var data = 'timeout=' + timeoutArg * 1000
				 + '&d=' + now.getTime()
				 + '&r=' + Math.random();
		var successCallback = sessionInitialized ? pollHandler : initHandler;

		var options = { method: 'GET',
			data: addClientId( data ),
			success: successCallback,
			error: pollErrorHandler};
		ajax(uri, options);
	}

	that.init = function(options) {
			print("AMQ initializing");
			connectStatusHandler = options.connectStatusHandler || function(connected){};
			pollDelay = typeof options.pollDelay == 'number' ? options.pollDelay : 5000;
			timeout = typeof options.timeout == 'number' ? options.timeout : 25;
			sessionInitializedCallback = options.sessionInitializedCallback;
			clientId = options.clientId;
			uri = options.uri;
			print("Send Poll...");
			sendPoll();
	};

	that.sendJmsMessage = function(destination, message, type, headers) {
		var message = {
			destination: destination,
			message: message,
			messageType: type
		};
		// Add message to outbound queue
		if (batchInProgress) {
			messageQueue[this.messageQueue.length] = {message:message, headers:headers};
		} else {
			batchInProgress = true;
			ajax(uri, { method: 'post',
				data: addClientId( buildParams( [message] ) ),
				error: errorHandler,
				headers: headers,
				success: endBatch});
		}
	};

	that.addListener = function(id, destination, handler, options) {
			messageHandlers[id] = handler;
			var headers = options && options.selector ? {selector:options.selector} : null;
			that.sendJmsMessage(destination, id, 'listen', headers);
	};

	// remove Listener from channel or topic.
	that.removeListener = function(id, destination) {
			messageHandlers[id] = null;
			that.sendJmsMessage(destination, id, 'unlisten');
	};

	that.cleanup = function() {
		print("Cleaning up...");
		removeHandler("HIFI");
	};
	
	return that;
};

(function(){


	this.entityID = null;
    this.properties = null;
    this.clientID = null;

	var amq = new Amq();
	
	this.preload = function(entityID) {
		 if (this.entityID === null || !this.entityID.isKnownID) {
            this.entityID = Entities.identifyEntity(entityID);
        }
        this.properties = Entities.getEntityProperties(this.entityID);
        this.clientID = this.properties.id;
	}
	
	amq.init({ 
    	uri: "http://localhost:8161/api/amq", 
    	pollDelay : 10000,
    	logging: true,
    	clientID : this.clientID,
    	timeout: 20
  	});
	
	var myHandler = {
  		rcvMessage: function(message)
  		{
     		print("received " + message);
  		}
	};
 
	amq.addListener("HIFI","topic://HIFI.MS",myHandler.rcvMessage);

	this.clickReleaseOnEntity = function(entityID, mouseEvent) { 
        print("Clicked....." + mouseEvent);
        amq.sendJmsMessage("topic://HIFI.MS","{test:1}",'send');  
    }; 
	
	
	Script.scriptEnding.connect(amq.cleanup);
	
})