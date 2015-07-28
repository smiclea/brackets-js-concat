/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true */
/*global brackets */

(function () {

	"use strict";

	var child;
	
	function start(filePath, rootPath, callback) {
		var exec = require('child_process').exec;
		var cmd = rootPath + 'node/node_modules/.bin/uglifyjs --compress -- ' + '"' + filePath + '"';
		var output = '';
		
		child = exec(cmd, function (error, stdout, stderr) {
			if (error) {
				callback({error: stderr});
			}

			if (stdout) {
				callback({out: stdout});
			}
		});

		child.stdout.on("data", function (data) {
			callback({data: data});
		});
	}
	
	function init(domainManager) {
		if (!domainManager.hasDomain('uglify-js')) {
			domainManager.registerDomain('uglify-js', {major: 0, minor: 1});
		}
		
		domainManager.registerCommand(
			'uglify-js',
			'start',
			start,
			true
		);
	}

	exports.init = init;

}());