
(function(){ 

	var this.entityID;

	this.preload = function(entityID) {
		this.entityID = entityID.id;
		print("preload("+entityID.id+")");
		var properties = Entities.getEntityProperties(entityID);
		print(JSON.stringify(properties);
		
		
	}

	function getRandomInt(min, max) {
        	return Math.floor(Math.random() * (max - min + 1)) + min;
    	}

	this.clickDownOnEntity = function(entityID, mouseEvent) { 
        print("clickDownOnEntity()...");
        	
        	Entities.editEntity(myID, { color: { red: getRandomInt(128,255), green: getRandomInt(128,255), blue: getRandomInt(128,255)} });
        
        
    	}; 



	this.deletingEntity(EntityItemID) {
        print("bye bye, says " + EntityItemID.id);
    };
	
}
