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
-views/components/;
-model/*.js;
-main.js;
```

Right-click on 'js.concat' to manually concatenate the files in the list, useful if 'concatOnSave' is false.

<b>Wildcard support</b>
* if the path to file ends with '/' character, all the files in that folder will be concatenated
* if the path to file ends with '\*' followed by a group of characters, only files ending in that group of characters will be concatenating (ex.: views/*.js matches all the files in views folder ending with '.js' i.e. all javascript files)

![](https://raw.githubusercontent.com/smiclea/brackets-js-concat/master/screenshot.png)

<b>Change log</b>

<i>0.1.0</i>
<ul>
<li>Added support for wildcards</li>
</ul>

<i>0.0.2</i>
<ul>
<li>Small bug-fixes</li>
</ul>

<i>0.0.1</i>
<ul>
<li>First release</li>
</ul>