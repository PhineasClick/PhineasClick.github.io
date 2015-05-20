
(function(){ 

	function getRandomInt(min, max) {
        	return Math.floor(Math.random() * (max - min + 1)) + min;
    	};

	this.preload = function(entityID) {
		
		print("preload("+entityID.id+")");
		var properties = Entities.getEntityProperties(entityID);
		print(JSON.stringify(properties));
		
		
	};

	

	this.clickDownOnEntity = function(entityID, mouseEvent) { 
        print("clickDownOnEntity()...: " + this.entityID;);
        	
        	Entities.editEntity(entityID, { color: { red: getRandomInt(128,255), green: getRandomInt(128,255), blue: getRandomInt(128,255)} });
        
        
    	}; 



	this.deletingEntity = function(entityID) {
        	print("bye bye, says " + entityID.id);
    	};
	
});
