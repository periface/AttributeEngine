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
#####Add the value in a diferent attribute
``` html
<img data-printproperty="src" data-property="MyProperties.WebSiteLogo" data-servicename="MyServiceName"  />
```
This will print the value in the src attribute
#####Use of replicate attribute
``` html
<a data-property="MyProperties.Email" data-replicate="true" data-printproperty="href" data-servicename="MyServiceName"></a>
```
Setting the replicate attribute to **true** (disabled by default) we can print the results inside the tag and in the attribute

#####Using callbacks
First we define a callback function inside the callback attribute
``` html
<a data-servicename="MyServiceName" data-callback="logData" data-property="MyProperties.SomeImportantValue"></a>
```
Then we define the function, when the value is obtained from the server the function is called
``` javascript
var setBackgroundImage = function (data, domElement) {
        console.log(data);
        console.log(domElement);
    }
```
## License

The content of this project itself is licensed under the [Creative Commons Attribution 3.0 license](http://creativecommons.org/licenses/by/3.0/us/deed.en_US), and the underlying source code used to format and display that content is licensed under the [MIT license](http://opensource.org/licenses/mit-license.php).
