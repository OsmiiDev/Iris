class IrisModule {

    LISTENERS = [];

    static SETTINGS = {};

    /**
     * @param {string?} name The name of the module. If undefined, exits.
    */
    constructor(name){
        if(name == undefined){ this._name = "core.IrisModule"; return; }

        this._name = name;
    }

    /**
     * @description Registers all event listeners
    */
    registerEvents(){
        for(let listener of this.LISTENERS){
            let eventName = listener.event;
            let eventFunction = listener.function;

            process.client.on(eventName, eventFunction);
        }
    }
    
}

module.exports = IrisModule;