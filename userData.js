
(function(){

	
    this.clickReleaseOnEntity = function(entityID, mouseEvent) { 
        if (this.entityID === null) {
            this.entityID = entityID;
        }
        var properties = Entities.getEntityProperties(this.entityID);
        
        var id = this.properties.id.replace(/[{}]/g, '');
        
        print("UserData : " + properties.userData);
        
        print("Entity Properties : " + JSON.stringify(properties));
           
    };

})