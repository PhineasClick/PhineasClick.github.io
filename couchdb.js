



(function(){ 


	
	this.preload = function(entityID) { 
        //create DB i not exist 
        var resutl = this.queryDB("PUT","entities");
    }; 

	this.clickDownOnEntity = function(entityID, mouseEvent) { 
        print("clickDownOnEntity()...");
    
    }; 

    this.clickReleaseOnEntity = function(entityID, mouseEvent) { 
        print("clickReleaseOnEntity()...");
        this.properties = Entities.getEntityProperties(entityID);
        this.queryDB("PUT","entities/"+this.properties.Id,this.propeties);    
    }; 
    
    this.queryDB = function(type,parameter,data) {
    	var URL = "http://127.0.0.1:5984/" + parameter;
		print("Start Request");
		print("DEBUG : URL = " + URL);
		print("DEBUG : data = " + data );
		var req = new XMLHttpRequest();
		var state = req.readyState;

		req.responseType = "json";
		req.open(type, URL, false);

		data = data || "";

		if(type === "PUT") {
			req.setRequestHeader("Content-type","application/json");
			req.send(data);
		} else {
			req.send();
		}
		print("Request sent");
		if(req.readyState == req.DONE) {

			print("HttpStatus  : " + req.status);
			print("ErrorCode   : " + req.errorCode);
			print("Status Text : " + req.statusText);

			var resp = JSON.parse(req.responseText);
	
			return resp;
		
		} else {
			print("Didn't got ReadyState DONE");
			return("{status:ERROR}");
		}
    
    }
    
}) 