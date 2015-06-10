
(function(){
    this.clickReleaseOnEntity = function(entityID, mouseEvent) { 
        if (this.entityID === null) {
            this.entityID = entityID;
        }
        var properties = Entities.getEntityProperties(this.entityID);
        print("Entity Properties : " + JSON.stringify(properties));
        print("UserData : " + properties.userData);    
    };

})