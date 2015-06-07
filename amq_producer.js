(function(){

	this.batchInProgress = false;
	this.messageQueue = [];
	this.messageHandlers = {};
	this.connectStatusHandler;
	
	this.ajax = function(uri, options) {
		
		var req = new XMLHttpRequest();
		var state = req.readyState;

		req.responseType = "xml";		
		req.setRequestHeader(options.headers);
		
		if (options.method == 'post') {
			req.open(type, uri, false);
			req.send(options.data);
			
		} else {
			if (options.data)
			{
				uri += "?";
				uri += options.data;
			}
			req.open(type, uri, false);
			req.send();
		}
		
		print("Request sent");
		if(req.readyState == req.DONE) {
			
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
				this.ajax(uri, {
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
			this.ajax(uri, { method: 'post',
				data: bthis.uildParams( [message] ) ,
				error: this.errorHandler,
				headers: headers,
				success: this.endBatch});
		}
	};
	

	this.clickReleaseOnEntity = function(entityID, mouseEvent) { 
        
        this.sendJmsMessage("topic://HIFI.MS","{test:1}",'send');
         
    }; 


})