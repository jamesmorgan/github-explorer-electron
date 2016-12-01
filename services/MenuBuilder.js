class MenuBuilder {

	constructor(options) {
		this.tray = options.tray;

		// let unsubscribe = options.store.subscribe(
		// 	function next(val) {
		// 		console.log("next()", val)
		// 	},
		// 	function error(err) {
		// 		console.log("error()", err)
		// 	},
		// 	function complete() {
		// 		console.log("complete()")
		// 	}
		// );
	}

}

module.exports = MenuBuilder;
