Brackets JS Concat
==================

Concatenates a list of files into one big file. The extension needs you to create a 'js.concat' file in project root. This file will set the extension with a few mandatory options:

* concatOnSave - if true, concatenates the files in the list when saving one of them or when saving 'js.concat' itself
* output - the path (relative to project root) where the big concatenated file should be placed
* -pathToFile; - the list of files (paths relative to project root) to concatenate

Here is an example of a 'js.concat' file:
```
// THIS file should be placed in project root

// if true, concatenates the files in the list when saving one of them or when saving this file
concatOnSave = true;

// the output path and file name of the concatenated file
output = build/build-v0.0.1.js;

// list of files to concatenate
-views/mainView.js;
-views/leftView.js;
-views/components/widget.js;
-model/Car.js;
-model/Phone.js;
-main.js;
```

Right-click on this file to manually concatenate the files in the list, useful if 'concatOnSave' is false.

![](https://raw.githubusercontent.com/smiclea/brackets-js-concat/master/screenshot.png)

<b>Change log</b>

<i>0.0.1</i>
<ul>
<li>First release</li>
</ul>