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
	var time;
	var direcoriesList = [];
	var WILD_CARD_EXP = /(.*)\*(.*)/;
	
	var addDirectoryToFileList = function (callback) {
		var path = direcoriesList.shift();
		var wildMatch = WILD_CARD_EXP.exec(path);
		
		if (wildMatch) {
			path = wildMatch[1];
		}
		
		var directory = FileSystem.getDirectoryForPath(ProjectManager.getProjectRoot().fullPath + path);
		directory.getContents(function (error, entries, stats, statsErrors) {
			var i;
			
			for (i = 0; i < entries.length; i++) {
				var relativePath = entries[i].fullPath.substr(ProjectManager.getProjectRoot().fullPath.length);
				
				if (entries[i].isFile) {
					var fileName = entries[i].name;
					
					if (wildMatch && fileName.indexOf(wildMatch[2]) === fileName.length - wildMatch[2].length) {
						fileList.push(relativePath);
					} else if (!wildMatch) {
						fileList.push(relativePath);
					}
				} else if (entries[i].isDirectory) {
					var wildCard = (wildMatch) ? '*' + wildMatch[2] : '';
					direcoriesList.push(relativePath + wildCard);
				}
			}
			
			if (direcoriesList.length > 0) {
				addDirectoryToFileList(callback);
			} else {
				callback();
			}
		});
	};
	
	var removeFileDuplicates = function () {
		var i, buffer = {}, newFileList = [];
		
		for (i = 0; i < fileList.length; i++) {
			if (!buffer[fileList[i]]) {
				buffer[fileList[i]] = 1;
				newFileList.push(fileList[i]);
			}
		}
		
		fileList = newFileList;
	};
	
	var checkForWildCards = function (callback) {
		var i;
		direcoriesList = [];
		
		for (i = 0; i < fileList.length; i++) {
			if (/\/$/.exec(fileList[i]) || WILD_CARD_EXP.exec(fileList[i])) {
				direcoriesList.push(fileList[i]);
			}
		}
		
		for (i = fileList.length - 1; i >= 0; i--) {
			if (/\/$/.exec(fileList[i]) || WILD_CARD_EXP.exec(fileList[i])) {
				fileList.splice(i, 1);
			}
		}
		
		if (direcoriesList.length > 0) {
			addDirectoryToFileList(callback);
		} else {
			callback();
		}
	};
	
	var parseConfigFile = function (data, callback) {
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
		
		checkForWildCards(function () {
			removeFileDuplicates();
			callback();
		});
	};
	
	var loadConfigFile = function (callback) {
		var file = FileSystem.getFileForPath(ProjectManager.getProjectRoot().fullPath + CONFIG_FILE);
		file.read(function (error, data, status) {
			if (error) {
				console.log('[brackets-js-concat] Error loading project config file (' + CONFIG_FILE + '): ' + error);
			} else {
				parseConfigFile(data, callback);
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
				readFile(fileList[fileList.length - 1 - fileQueue], readInto, callback);
			} else {
				callback(readInto);
			}
		});
	};
	
	var getFileListContents = function (callback) {
		var buildContent = '';
		fileQueue = fileList.length - 1;
		readFile(fileList[fileList.length - 1 - fileQueue], buildContent, callback);
	};
	 
	var writeBuildFile = function () {
		getFileListContents(function (data) {
			buildFile.unlink();
			buildFile.write(data, function (error, stats) {
				if (error) {
					console.error('[brackets-js-concat] Error writing build file: ' + error);
				} else {
					//ProjectManager.refreshFileTree();
					console.log('[brackets-js-concat] ' + new Date().toLocaleTimeString() + ' Concatenation done succesfully! Duration: ' + (new Date().getTime() - time) + ' ms.');
				}
			});
		});
	};
	
	var concatFiles = function () {
		time = new Date().getTime();
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
			
			loadConfigFile(function () {
				if (concatOnSave && fileIsWatched(document.file.fullPath)) {
					concatFiles();
				}
			});
		});
		
	};
	
    AppInit.appReady(function () {
		watchFiles();
		addContextMenu();
    });

});