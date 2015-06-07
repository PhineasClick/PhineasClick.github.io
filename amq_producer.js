(function(){

	var batchInProgress = false;
	var messageQueue = [];
	var messageHandlers = {};
	var connectStatusHandler;
	
	function ajax(uri, options) {
		
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
	};
	
	function sendJmsMessage(destination, message, type, headers) {
		var message = {
			destination: destination,
			message: message,
			messageType: type
		};
		// Add message to outbound queue
		if (batchInProgress) {
			messageQueue[messageQueue.length] = {message:message, headers:headers};
		} else {
			batchInProgress = true;
			ajax(uri, { method: 'post',
				data: buildParams( [message] ) ,
				error: errorHandler,
				headers: headers,
				success: endBatch});
		}
	}
	




})