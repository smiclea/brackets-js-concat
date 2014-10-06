Brackets JS Concat
==================

Concatenates a list of files into one big file, useful when using only one javascript file for debugging and/or deployment. The extension needs you to create a 'js.concat' file in your project root. This file will set the extension with a few mandatory options:

* concatOnSave - if true, concatenates the list of files when saving one of them or when saving 'js.concat' itself. Otherwise you have to always right click 'js.concat' -> 'Concatenate files'
* output - the path (relative to project root, directories will be created if necessary) where the big concatenated file should be placed
* -pathToFile; - the list of files (paths relative to project root) to concatenate

Here is an example of a 'js.concat' file:
```
// THIS file should be placed in project root

// if true, concatenates the list of files when saving one of them or when saving this file
concatOnSave = true;

// the output path of the concatenated file, directories will be created if necessary
output = build/build-v0.0.1.js;

// the list of files (paths relative to project root) to concatenate
-views/mainView.js;
-views/leftView.js;
-views/components/widget.js;
-model/Car.js;
-model/Phone.js;
-main.js;
```

Right-click on 'js.concat' to manually concatenate the files in the list, useful if 'concatOnSave' is false.

![](https://raw.githubusercontent.com/smiclea/brackets-js-concat/master/screenshot.png)

Planned (not yet implemented) features:
* wild card support in the list of files
* grouping files for multiple outputs

<b>Change log</b>

<i>0.0.2</i>
<ul>
<li>First release</li>
</ul>