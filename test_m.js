(function() {
    
    Script.$include = function(src) {
    	var xhr = new XMLHttpRequest();
    	xhr.open("GET", src, false); /* false == synchronous */
    	xhr.send();
    	/* should really do some error checking here...*/
    	eval(xhr.responseText)
  	};
    
    Script.$include("");
    
    print("test finished");
})