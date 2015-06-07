/**
 *
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// AMQ Ajax handler
// This class provides the main API for using the Ajax features of AMQ. It
// allows JMS messages to be sent and received from javascript when used
// with the org.apache.activemq.web.MessageListenerServlet.
//
// This version of the file provides an adapter interface for the jquery library
// and a namespace for the Javascript file, private/public variables and
// methods, and other scripting niceties. -- jim cook 2007/08/28

AmqAdapter =  function() {

	var that = {};

	function init(options) {
 		print("Init : " + options);
 	}

/**
 *  Implement this method to make an AJAX call to the AjaxServlet. An
 *  options object will accompany this class and will contain the properties
 *  that describe the details of the AJAX call. The options object will
 *  have the following properties:
 *
 *  - method:  'get' or 'post'
 *  - data:    query data to accompany the post or get.
 *  - success: A callback function that is invoked upon successful
 *             completion of the AJAX call. The parameter is:
 *             - data: The result of the AJAX call. In the case of XML
 *                     data should resolve to a Document element.
 *  - error:   A callback when some type of error occurs. The callback
 *             function's parameters should be:
 *             - xhr:    The XmlHttpRequest object.
 *             - status: A text string of the status.
 *             - ex:     The exception that caused the error.
 *  - headers: An object containing additional headers for the ajax request.
 */
	that.ajax: function(uri, options) {
		
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

	that.log: function(message, exception) {
		print(message);
	}

	return that;

};


Amq = function() {

	var that = {};

	var connectStatusHandler;

	var adapter =  new AmqAdapter();

	if (typeof adapter == 'undefined') {
		throw 'An AmqAdapter must be declared before the amq.js script file.'
	}

	// The URI of the AjaxServlet.
	var uri;

	// The number of seconds that the long-polling socket will stay connected.
	// Best to keep this to a value less than one minute.
	var timeout;

	// A session should not be considered initialized until the JSESSIONID is returned
	// from the initial GET request.  Otherwise subscription POSTS may register the
	// subscription with the wrong session.
	var sessionInitialized = false;

	// This callback will be called after the first GET request returns.
	var sessionInitializedCallback;	

	// Poll delay. if set to positive integer, this is the time to wait in ms
	// before sending the next poll after the last completes.
	var pollDelay;

	// Inidicates whether logging is active or not. Not by default.
	var logging = false;

	// 5 second delay if an error occurs during poll. This could be due to
	// server capacity problems or a timeout condition.
	var pollErrorDelay = 5000;

	// Map of handlers that will respond to message receipts. The id used during
	// addListener(id, destination, handler) is used to key the callback
	// handler.  
	var messageHandlers = {};

	// Indicates whether an AJAX post call is in progress.
	var batchInProgress = false;

	// A collection of pending messages that accumulate when an AJAX call is in
	// progress. These messages will be delivered as soon as the current call
	// completes. The array contains objects in the format { destination,
	// message, messageType }.
	var messageQueue = [];

  	// String to distinguish this client from others sharing the same session.
  	// This can occur when multiple browser windows or tabs using amq.js simultaneously.
  	// All windows share the same JESSIONID, but need to consume messages independently.
  	var clientId = null;
  
	/**
	 * Iterate over the returned XML and for each message in the response, 
	 * invoke the handler with the matching id.
	 */
	function messageHandler(data) {
		
		
		var response = data.getElementsByTagName("ajax-response");
		if (response != null && response.length == 1) {
			connectStatusHandler(true);
			var responses = response[0].childNodes;    // <response>
			for (var i = 0; i < responses.length; i++) {
				var responseElement = responses[i];

				// only process nodes of type element.....
				if (responseElement.nodeType != 1) continue;

				var id = responseElement.getAttribute('id');

				var handler = messageHandlers[id];

				if (logging && handler == null) {
					adapter.log('No handler found to match message with id = ' + id);
					continue;
				}

				// Loop thru and handle each <message>
				for (var j = 0; j < responseElement.childNodes.length; j++) {
					handler(responseElement.childNodes[j]);
				}
			}
		}
	}

	function errorHandler(xhr, status, ex) {
		connectStatusHandler(false);
		if (logging) adapter.log('Error occurred in ajax call. HTTP result: ' +
		                         xhr.status + ', status: ' + status);
	}

	function pollErrorHandler(xhr, status, ex) {
		connectStatusHandler(false);
		if (status === 'error' && xhr.status === 0) {
			if (logging) adapter.log('Server connection dropped.');
			setTimeout(function() { sendPoll(); }, pollErrorDelay);
			return;
		}
		if (logging) adapter.log('Error occurred in poll. HTTP result: ' +
		                         xhr.status + ', status: ' + status);
		setTimeout(function() { sendPoll(); }, pollErrorDelay);
	}

	function pollHandler(data) {
		try {
			messageHandler(data);
		} catch(e) {
			if (logging) adapter.log('Exception in the poll handler: ' + data, e);
			throw(e);
		} finally {
			setTimeout(sendPoll, pollDelay);
		}
	};

	function initHandler(data) {
		sessionInitialized = true;
		if(sessionInitializedCallback) {
			sessionInitializedCallback();
		}
		pollHandler(data);
	}

	function sendPoll() {
		// Workaround IE6 bug where it caches the response
		// Generate a unique query string with date and random
		var now = new Date();
		var timeoutArg = sessionInitialized ? timeout : 0.001;
		var data = 'timeout=' + timeoutArg * 1000
				 + '&d=' + now.getTime()
				 + '&r=' + Math.random();
		var successCallback = sessionInitialized ? pollHandler : initHandler;

		var options = { method: 'get',
			data: addClientId( data ),
			success: successCallback,
			error: pollErrorHandler};
		adapter.ajax(uri, options);
	}

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
			org.activemq.Amq.startBatch();
			adapter.ajax(uri, { method: 'post',
				data: addClientId( buildParams( [message] ) ),
				error: errorHandler,
				headers: headers,
				success: this.endBatch});
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

	
	// optional clientId can be supplied to allow multiple clients (browser windows) within the same session.
	that.init : function(options) {
			print("AMQ initializing");
			connectStatusHandler = options.connectStatusHandler || function(connected){};
			uri = options.uri || '/amq';
			pollDelay = typeof options.pollDelay == 'number' ? options.pollDelay : 0;
			timeout = typeof options.timeout == 'number' ? options.timeout : 25;
			logging = options.logging;
			sessionInitializedCallback = options.sessionInitializedCallback
			clientId = options.clientId;
			adapter.init(options);
			sendPoll();
			
	};
		    
	that.startBatch : function() {
			batchInProgress = true;
	};

	that.endBatch : function() {
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
				org.activemq.Amq.startBatch();
				adapter.ajax(uri, {
					method: 'post',
					headers: outgoingHeaders,
					data: addClientId( body ),
					success: this.endBatch, 
					error: errorHandler});
			} else {
				batchInProgress = false;
			}
	};

	// Send a JMS message to a destination (eg topic://MY.TOPIC).  Message
	// should be xml or encoded xml content.
	that.sendMessage : function(destination, message) {
			sendJmsMessage(destination, message, 'send');
	};

	// Listen on a channel or topic.
	// handler must be a function taking a message argument
	//
	// Supported options:
	//  selector: If supplied, it should be a SQL92 string like "property-name='value'"
	//            http://activemq.apache.org/selectors.html
	//
	// Example: addListener( 'handler', 'topic://test-topic', function(msg) { return msg; }, { selector: "property-name='property-value'" } )
	that.addListener : function(id, destination, handler, options) {
			messageHandlers[id] = handler;
			var headers = options && options.selector ? {selector:options.selector} : null;
			sendJmsMessage(destination, id, 'listen', headers);
	};

	// remove Listener from channel or topic.
	that.removeListener : function(id, destination) {
			messageHandlers[id] = null;
			sendJmsMessage(destination, id, 'unlisten');
	};
		
	// for unit testing
	that.getMessageQueue: function() {
			return messageQueue;
	};
	
	that.testPollHandler: function( data ) {
			return pollHandler( data );
		}
	};
	
	return that;
	
};
