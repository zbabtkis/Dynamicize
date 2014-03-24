Dynamicize
==========

A simple tool for building dynamic HTML without a lick of JavaScript!

Docs
---
This library provides a quick, easy way to load data dynamically into HTML elements.
Just specify the following attributes and your page will suddenly become dynamci!

Basic Use
---
For the controller element, you must specify at least one attribute: data-src.
There are two more optional attributes: data-ctrl and data-attr.
* data-src - This is the most important one. It is the AJAX url to pull data from.
* data-attr - 
** This specifies which attribute should be used on the object that results from the ajax call.
** You can use a value nested in the result using a dot delimeted tree (e.g. bio.name.firstName)
* data-ctrl - This is the controller to use for fetching data. By default Dynamicize uses AJAX, so you can omit this attribute in most cases</p>

You can also use data-attr on elements inside of the controller. As in the date example on this page.
				
				
API
---
If you want to use your own data fetching controller (for example, if you want to load websockets data), use the registerLoadMethod method.
You can check out the AjaxController class in the source code to get an idea of what your controller should look like, but here's a quick overview:
* Controller's recieve three arguments
** ObjectBinder - this is the core of the libraries functionality -- it observes properties of an object
** With your controller, instantiate a new version for every data-src control
*** Use [instance].set(values) to set the values that should show in the DOM
*** ctrls - an object containing url=>callback pairs</li>
*** refreshRate - a number (miliseconds) that should determine how often data should be refreshed</li>


* To add your controller to data controller registry (to make it available through HTML API) use Dynamicize.registerLoadMethod(ctrl name, ctrl function);

Here's an example implementation for WebSockets

```
var WebSocketsCtrl = function(ObjectBinder, ctrls, refreshRate) {
  var socket = io.connect('http://localhost')
    , o;
  for(var sourceEvt in ctrls) {
    o = new ObjectBinder({});
    socket.on(sourceEvt, function (data) {
      // This is where the magic happens!
      ObjectBinder.set(data);
    });

    // Provide HTML Element with ObjectBinder instance to render
    ctrls[sourceEvent].call({}, o);
  }
};
```
