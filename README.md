# Peri´s SimpleAttributeEngine
**--A simple javascript library for a simple purpose--**




###Basic usage
#### In Javascript:
#####Initialize the Engine
```javascript
var engine = new Engine({
     //Use overlay option
     useOverlay: true,
     //Overlay element: When all request are done its width will be equal to 0%
     overlayObj: "overlay",
     //Autostart the engine option
     autoStart: false,
     //Enable or disable debug options
     enableDebug: true
});
```

#####Define a service name and endpoint
```javascript
engine.defineNewPropertyService("MyServiceName", "/MyController/GetKeyValuePropsByKey");
```
#####Start the engine
```javascript
engine.startListener();
```

####In HTML

#####Basic markup
``` html
<h2 data-servicename="MyServiceName" data-property="MyProperties.PropertyKeyName"></h2>
```
This will print whatever value you have in the **MyProperties.PropertyKeyName** key in your database, xml, etc.

## License

The content of this project itself is licensed under the [Creative Commons Attribution 3.0 license](http://creativecommons.org/licenses/by/3.0/us/deed.en_US), and the underlying source code used to format and display that content is licensed under the [MIT license](http://opensource.org/licenses/mit-license.php).
