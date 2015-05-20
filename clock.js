
(function(){ 


	this.textID = null;

	function getRandomInt(min, max) {
        	return Math.floor(Math.random() * (max - min + 1)) + min;
    };

	this.preload = function(entityID) {
		
		print("preload("+entityID.id+")");
		var properties = Entities.getEntityProperties(entityID);
		print(JSON.stringify(properties));
		
		var textproperties = {
			type : "Text",
			position: { x: properties.position.x,
        	   	     	y: properties.position.y,
        	        	z: properties.position.z + (properties.position.z / 2)
        	},
    		dimensions: {
            	    x: properties.dimensions.x,
               	    y: properties.dimensions.y,
                	z: 0.0
        	},
			text : "Please standby..."
		};
		
		print("Adding Text Entity...");
		
		this.textID = Entities.addEntity(textproperties);
		
		print("ID : " + this.textID.id);
	};

	

	this.clickDownOnEntity = function(entityID, mouseEvent) { 
        print("clickDownOnEntity()...: " + entityID);
        	
        	Entities.editEntity(entityID, { color: { red: getRandomInt(128,255), green: getRandomInt(128,255), blue: getRandomInt(128,255)} });
        
        
    	}; 



	this.deletingEntity = function(entityID) {
        	print("bye bye, says " + entityID.id);
        	Entities.deleteEntity(this.textID);
    	};
	
});
