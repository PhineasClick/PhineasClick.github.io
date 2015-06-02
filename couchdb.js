



(function(){ 

	this.entityID = null;
	
	this.preload = function(entityID) { 
        //create DB i not exist 
        var resutl = this.queryDB("PUT","entities","");
    }; 

	this.clickDownOnEntity = function(entityID, mouseEvent) { 
        print("clickDownOnEntity()...");
    
    }; 

    this.clickReleaseOnEntity = function(entityID, mouseEvent) { 
        print("clickReleaseOnEntity()...");
        if (this.entityID === null || !this.entityID.isKnownID) {
            this.entityID = Entities.identifyEntity(entityID);
        }
        this.properties = Entities.getEntityProperties(this.entityID);
        
        var id = this.properties.id.replace(/[{}]/g, '');
        this.queryDB("PUT","entities/"+id,JSON.stringify(this.propeties));    
    }; 
    
    this.queryDB = function(type,parameter,data) {
    	
    	var URL = "http://127.0.0.1:5984/" + parameter;
    	
		print("Start Request");
		
		var req = new XMLHttpRequest();
		var state = req.readyState;

		req.responseType = "json";
		req.open(type, URL, false);
		
		//TODO: Better check data for valid data....
		
		print("DEBUG : URL = " + URL);
		print("DEBUG : data = " + data );
		
		if(type === "PUT") {
			req.setRequestHeader("Content-type","application/json");
			req.send(data);
		} else {
			req.send();
		}
		print("Request sent");
		if(req.readyState == req.DONE) {

			print("HttpStatus    : " + req.status);
			print("ErrorCode     : " + req.errorCode);
			print("Status Text   : " + req.statusText);
			print("Response Text : " + req.responseText);

			var resp = JSON.parse(req.responseText);
	
			return resp;
		
		} else {
			print("Didn't got ReadyState DONE");
			return("{status:ERROR}");
		}
    
    }
    
}) 