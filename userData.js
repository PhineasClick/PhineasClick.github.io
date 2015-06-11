
(function(){
    this.clickReleaseOnEntity = function(entityID, mouseEvent) { 
    	print("event entityID : " + entityID);
    	print("this entityID : " + this.entityID);
        if (this.entityID === null || this.entityID === 'undefined') {
            this.entityID = entityID;
        }
        
        var properties = Entities.getEntityProperties(this.entityID);
        
        print("Entity Properties : " + JSON.stringify(properties));
        print("UserData : " + properties.userData);    
    };

})