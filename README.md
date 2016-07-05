# Peri´s SimpleAttributeEngine
**A simple javascript library for a simple purpose**

**Why!?**
Sometimes you just want to print some value on an html page or razor file.



Cuz i dont want to do this

``` html

<a href="@{Html.RenderAction("GetValueFromKey","MyController",{new { key="someAwesomeUrl"  }})}"> @{Html.RenderAction("GetValueFromKey","MyController",{new {key="awesomeKey"}})}</a>

```


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
For now the only parameter send to the server is **key**

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
var logData = function (someImportantValue, domElement) {
        console.log(someImportantValue);
        console.log(domElement);
}
```
This will execute the binding function in addition with the callback.
To disable the binding function we can use the **data-ignoreall** attribute
``` html
<a data-servicename="MyServiceName" data-ignoreall="true" data-callback="logData" data-property="MyProperties.SomeImportantValue"></a>
```
This will disable the binding and only use the callback function

###Extra
Sometimes we will need to load some things in the old fashion sync way (NOT!).
Ex. Some logo, title, etc.
If you really **really need** to do this you can use the **data-async attribute** and set it to false.
``` html
<h1 data-async="false" data-servicename="MyServiceName" data-property="MyProperties.SomeUberImportantTitleThatMustBeDisplayedASAP"></h1>
```

## That´s It! ##
