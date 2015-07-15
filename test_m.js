(function() {
    
    Script.$include = function(src) {
    	var xhr = new XMLHttpRequest();
    	xhr.open("GET", src, false); /* false == synchronous */
    	xhr.send();
    	/* should really do some error checking here...*/
    	eval(xhr.responseText)
  	};
    
    Script.$include("http://phineasclick.github.io/test1.js");
    
    print("test finished");
})