



(function(){ 

	this.entityID = null;
	
	this.preload = function(entityID) { 
        //create DB i not exist 
        var result = this.queryDB("PUT","entities","");
        print("DEBUG : QueryResult : " + result);
        //TODO : To work with the result, it need to be JSON.parse first.
    }; 


    this.clickReleaseOnEntity = function(entityID, mouseEvent) { 
        if (this.entityID === null) {
            this.entityID = entityID;
        }
        this.properties = Entities.getEntityProperties(this.entityID);
        
        var id = this.properties.id.replace(/[{}]/g, '');
        
        this.queryDB("PUT","entities/"+id,JSON.stringify(this.properties));    
    }; 
    
    this.queryDB = function(type,parameter,data) {
    	
    	var URL = "http://127.0.0.1:5984/" + parameter;
    	
		var req = new XMLHttpRequest();
		var state = req.readyState;

		req.responseType = "json";
		req.open(type, URL, false);
		
		//TODO: Better check data for valid data....
		
		if(type === "PUT") {
			req.setRequestHeader("Content-type","application/json");
			req.send(data);
		} else {
			req.send();
		}
		print("Request sent");
		if(req.readyState == req.DONE) {
			
			return req.responseText;
		
		} else {
			print("ERROR: Didn't got ReadyState DONE");
			return("{status:ERROR}");
		}
    
    }
    
}) 