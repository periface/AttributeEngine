//Depends on Jquery
var Engine = (function (options) {

    if (!options) {
        console.warn("Options r null loading defaults...");
        options = {
            useOverlay: true,
            autoStart: false,
            overlayObj: undefined,
            enableDebug: false,
            onAllRequestsFinished: undefined
        }
    }
    var self = this;
    var propertyServiceConst = "propertyServiceName";
    //All property services defined
    this.propertyServices = [];

    //Define a new property service

    //Endpoint : Server Side Key, Value
    this.definePropertyService = function (propertyServiceName, propertyServiceEndPoint) {
        self.propertyServices.push({
            propertyServiceName: propertyServiceName,
            propertyServiceEndPoint: propertyServiceEndPoint
        });
    }
    function findElement(arr, propName, propValue) {
        for (var i = 0; i < arr.length; i++)
            if (arr[i][propName] === propValue)
                return arr[i];
        return undefined;
        // will return undefined if not found; you could return a default instead
    };
    function extendDataObj(target, source) {
        for (var objProperty in source) {
            if (!target.hasOwnProperty(objProperty)) {
                target[objProperty] = source[objProperty];
            }
        }
        return target;
    }
    //Listener to data-* properties
    this.listener = function () {
        //$.When example for deferred objects
        //Lets try http://stackoverflow.com/questions/5627284/pass-in-an-array-of-deferreds-to-when
        var deferred = [];
        $("[data-property]").each(function () {
            var element = $(this);
            var propertyRequest = $(this).data("property");
            var propertyServiceName = $(this).data("servicename");
            var printInProperty = $(this).data("printproperty");
            var replicate = $(this).data("replicate");
            var callbackFunc = $(this).data("callback");
            var useFuncOnly = $(this).data("ignoreall");
            var extendProperties = $(this).data("params");
            //Use it with caution pls
            var async = $(this).data("async");
            if (async == undefined) {
                async = true;
            }
            var dataBindObj = {
                propertyRequest: propertyRequest,
                propertyServiceName: propertyServiceName,
                printInProperty: printInProperty,
                replicate: replicate,
                element: element,
                callbackFunc: callbackFunc,
                useFuncOnly: useFuncOnly,
                runAsync: async,
                requestProperties: extendProperties
            }


            var serviceInfo = findElement(self.propertyServices, propertyServiceConst, propertyServiceName);
            if (options.enableDebug) {

                console.debug(dataBindObj);
            }
            if (serviceInfo == undefined) {
                console.error("Service undefined");
            } else {

                self.buildAjaxObj(serviceInfo.propertyServiceEndPoint, dataBindObj, deferred);
            }

        });
        $.when.apply($, deferred).done(self.allDoneFunction);
        //
        //It works!! many awesome!! much power, very async
    };
    if (options.autoStart) {
        self.listener();
    }
    this.buildAjaxObj = function (endPoint, dataBindObj, deferredArray) {
        if (endPoint !== "" && dataBindObj.propertyRequest !== "") {
            var data = self.resolveDataRequest(dataBindObj.propertyRequest, dataBindObj.requestProperties);
            deferredArray.push($.ajax({
                url: endPoint,
                data: data,
                async: dataBindObj.runAsync,
                success: function (responseData, textStatus, jqXhr) {
                    if (options.debug) {
                        console.log("Text status -->");
                        console.log(textStatus);
                        console.log("jqXHR -->");
                        console.log(jqXhr);
                    }
                    if (dataBindObj.callbackFunc) {
                        if (dataBindObj.useFuncOnly) {
                            self.callFunction(dataBindObj.callbackFunc, responseData, dataBindObj.element);
                        } else {
                            self.bindData(dataBindObj, data);
                            self.callFunction(dataBindObj.callbackFunc, responseData, dataBindObj.element);
                        }
                    } else {
                        self.bindData(dataBindObj, responseData);
                    }
                }
            }));
        }
    }
    this.callFunction = function (func, data, domElement) {
        try {
            window[func](data, domElement);
        } catch (e) {
            console.warn("Callback function has failed to execute or has some internal errors, please check it out --->");
            console.log("----------------------------------");

            console.log(e);

            console.log("----------------------------------");

            console.info("Dont try to eval the function in the lib source dude... pls -->");
            console.info("Lets continue....");
            return;
        }
    };
    this.allDoneFunction = function () {
        if (options.onAllRequestsFinished) {
            options.onAllRequestsFinished();
            if (options.useOverlay) {
                //Continue with the normal overlay behavior
                self.hideOverlay();
            }
        }
        else {
            if (options.useOverlay) {
                self.hideOverlay();
            }
            console.log("All requests done");
        }

    }
    this.hideOverlay = function () {
        if (options.overlayObj) {
            document.getElementById(options.overlayObj).style.width = "0%";
        } else {
            console.warn("No overlay defined");
        }
    }
    this.bindData = function (dataBindObj, data) {
        //var elementTag = dataBindObj.element[0].nodeName.toLowerCase();
        if (dataBindObj.printInProperty) {
            dataBindObj.element.attr(dataBindObj.printInProperty, data);
            if (dataBindObj.replicate) {
                self.appendDataInDomElement(dataBindObj, data);
            } else {
                self.appendOnlyId(dataBindObj);
            }
        } else {
            self.appendDataInDomElement(dataBindObj, data);
        }
    }
    this.appendDataInDomElement = function (dataBindObj, data) {
        dataBindObj.element.text(data);
        dataBindObj.element.attr("id", dataBindObj.propertyRequest);
    };
    this.appendOnlyId = function (dataBindObj) {
        dataBindObj.element.attr("id", dataBindObj.propertyRequest);
    };
    this.getValueFromDomElement = function (keyValue) {
        var value = document.getElementById(keyValue).value;
        if (value) {
            return value;
        }
        return undefined;
    }
    this.getValue = function(serviceName, property, extendObject, callback) {
        var serviceInfo = findElement(self.propertyServices, propertyServiceConst, serviceName);
        if (serviceInfo == undefined) {
            console.error("Service undefined");
        } else {
            self.getValueFromService(serviceInfo, property, extendObject, function(data) {
                callback(data);
            });
        }
    };
    this.getValueFromService = function (serviceInfo, property, extendObject, callback) {
        var data = self.resolveDataRequest(property, extendObject);
        $.ajax({
            url: serviceInfo.propertyServiceEndPoint,
            data: data,
            success: function (responseData, textStatus, jqXhr) {
                if (options.debug) {
                    console.info("Text status -->");
                    console.log(textStatus);
                    console.info("jqXHR -->");
                    console.log(jqXhr);
                }
                callback(responseData);
            }
        });
    };
    
    this.resolveDataRequest = function (property, extendProperties) {
        var data = {
            key: property
        };
        if (extendProperties != undefined) {
            data = extendDataObj(data, extendProperties);

            if (options.enableDebug) {
                console.info("The request object has been extended --->");
                console.log(data);
            }
        }
        return data;
    };

    return {
        propertyServices: this.propertyServices,
        defineNewPropertyService: this.definePropertyService,
        getValueFromDom: this.getValueFromDomElement,
        startListener: this.listener,
        getValue: this.getValue
    };
});
