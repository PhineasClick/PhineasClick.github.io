
(function(){ 

	var this.entityID;

	this.preload = function(entityID) {
		this.entityID = entityID.id;
		print("preload("+entityID.id+")");
		var properties = Entities.getEntityProperties(entityID);
		print(JSON.stringify(properties);
		
		
	}


	this.clickDownOnEntity = function(entityID, mouseEvent) { 
        print("clickDownOnEntity()...");
        
        
        
        
    }; 



	this.deletingEntity(EntityItemID) {
        print("bye bye, says " + EntityItemID.id);
    };
	
}
