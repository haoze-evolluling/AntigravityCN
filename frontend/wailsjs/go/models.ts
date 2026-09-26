export namespace main {
	
	export class ActionResult {
	    success: boolean;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new ActionResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	    }
	}
	export class AppState {
	    asarPath: string;
	    asarExists: boolean;
	    backupExists: boolean;
	    isRunning: boolean;
	
	    static createFrom(source: any = {}) {
	        return new AppState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.asarPath = source["asarPath"];
	        this.asarExists = source["asarExists"];
	        this.backupExists = source["backupExists"];
	        this.isRunning = source["isRunning"];
	    }
	}

}

