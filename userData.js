
(function(){

	
    this.clickReleaseOnEntity = function(entityID, mouseEvent) { 
        if (this.entityID === null) {
            this.entityID = entityID;
        }
        var properties = Entities.getEntityProperties(this.entityID);
        
        print("Entity Properties : " + JSON.stringify(properties));
        
        var id = properties.id.replace(/[{}]/g, '');
        
        print("UserData : " + properties.userData);
        
           
    };

})