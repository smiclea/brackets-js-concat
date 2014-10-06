/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window, log , Mustache, NodeConnection */

define(function (require, exports, module) {
    "use strict";
    
	var CONFIG_FILE = 'js.concat';
	var CONTEXT_MENU_TEXT = 'Concatenate files';
	
	var AppInit = brackets.getModule("utils/AppInit");
    var FileSystem = brackets.getModule("filesystem/FileSystem");
	var ProjectManager = brackets.getModule('project/ProjectManager');
	var Menus = brackets.getModule("command/Menus");
	var CommandManager = brackets.getModule("command/CommandManager");
	var DocumentManager = brackets.getModule("document/DocumentManager");
	
	var contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.PROJECT_MENU);
	var concatOnSave;
	var outputFile;
	var fileList = [];
	var buildFile;
	var fileQueue;
	
	var parseConfigFile = function (data) {
		var concatOnSaveExp = /\s*concatOnSave\s*=\s*true\s*;/;
		var outputFileExp = /\s*output\s*=\s*(.*)\s*;/;
		var outputFilePath = outputFileExp.exec(data);
		var fileListExp = /^\s*-\s*(.*)\s*;/gm;
		var file;
		
		outputFile = 'js-concat-build.js';
		concatOnSave = false;
		fileList = [];
		
		if (outputFilePath) {
			outputFile = outputFilePath[1];
		}
		
		if (concatOnSaveExp.exec(data)) {
			concatOnSave = true;
		}
		
		while ((file = fileListExp.exec(data)) !== null) {
			fileList.push(file[1]);
		}
	};
	
	var loadConfigFile = function (callback) {
		var file = FileSystem.getFileForPath(ProjectManager.getProjectRoot().fullPath + CONFIG_FILE);
		file.read(function (error, data, status) {
			if (error) {
				console.log('[brackets-js-concat] Error loading project config file (' + CONFIG_FILE + '): ' + error);
			} else {
				parseConfigFile(data);
				callback();
			}
		});
	};
	
	var readFile = function (fileName, readInto, callback) {
		var file = FileSystem.getFileForPath(ProjectManager.getProjectRoot().fullPath + fileName);
		file.read(function (error, data) {
			if (error) {
				console.error('[brackets-js-concat] Error reading file for concatenation (' + fileName + '): ' + error);
			} else {
				readInto += data + '\n';
			}
			
			fileQueue--;
			if (fileQueue >= 0) {
				readFile(fileList[fileQueue], readInto, callback);
			} else {
				callback(readInto);
			}
		});
	};
	
	var getFileListContents = function (callback) {
		var buildContent = '';
		fileQueue = fileList.length - 1;
		readFile(fileList[fileQueue], buildContent, callback);
	};
	 
	var writeBuildFile = function () {
		getFileListContents(function (data) {
			buildFile.write(data, function (error, stats) {
				if (error) {
					console.error('[brackets-js-concat] Error writing build file: ' + error);
				} else {
					ProjectManager.refreshFileTree();
				}
			});
		});
	};
	
	var concatFiles = function () {
		buildFile = FileSystem.getFileForPath(ProjectManager.getProjectRoot().fullPath + outputFile);
		
		FileSystem.resolve(buildFile.fullPath, function (error, fileSystemEntry, status) {
			if (!error) {
				writeBuildFile();
			} else {
				var directory = FileSystem.getDirectoryForPath(buildFile.parentPath);
				directory.create(function (error, status) {
					if (error && error !== 'AlreadyExists') {
						console.error('[brackets-js-concat] Error creating build directory: ' + error);
						return;
					}
					
					writeBuildFile();
				});
			}
		});
	};
	
	var addContextMenu = function () {
		var CMD = 'jsConcatCmd';
		var divider;
		
		if (!CommandManager.get(CMD)) {
			CommandManager.register(CONTEXT_MENU_TEXT, CMD, function () {
				loadConfigFile(function () {
					concatFiles();
				});
			});
		}
		$(contextMenu).on("beforeContextMenuOpen", function (evt) {
			var selectedItem = ProjectManager.getSelectedItem();
			contextMenu.removeMenuItem(CMD);
			
			if (divider) {
				contextMenu.removeMenuDivider(divider.id);
				divider = null;
			}
			
			if (selectedItem.name === CONFIG_FILE) {
				divider = contextMenu.addMenuDivider(Menus.FIRST);
				contextMenu.addMenuItem(CMD, '', Menus.FIRST, CMD);
			}
		});
	};
	
	var fileIsWatched = function (path) {
		var projPath = ProjectManager.getProjectRoot().fullPath;
		var i;
		
		if (path === projPath + CONFIG_FILE) {
			return true;
		}
		
		for (i = 0; i < fileList.length; i++) {
			if (path === projPath + fileList[i]) {
				return true;
			}
		}
	};
	
	var watchFiles = function () {
		$(DocumentManager).on('documentSaved', function () {
			var document = DocumentManager.getCurrentDocument();
			
			if (fileIsWatched(document.file.fullPath)) {
				loadConfigFile(function () {
					if (concatOnSave) {
						concatFiles();
					}
				});
			}
		});
		
	};
	
    AppInit.appReady(function () {
		loadConfigFile(function () {
			if (concatOnSave) {
				watchFiles();
			}
		});
		
		addContextMenu();
    });

});