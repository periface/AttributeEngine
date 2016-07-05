//Depends on Jquery
var Engine = (function (options) {

    if (!options) {
        console.warn("Options r null loading defaults...");
        options = {
            useOverlay: true,
            autoStart: false,
            overlayObj: undefined,
            enableDebug: false,
            onAllRequestsFinished: undefined,
            //Disabled by default: Its beta
            resolveByConvention: false
        };
    }
    var self = this;
    var propertyServiceConst = "propertyServiceName";
    //All property services defined
    this.propertyServices = [];




    /**
        * Add a new element to propertyServices array
        * @param {string} propertyServiceName 
        * @param {string} propertyServiceEndPoint
    */
    this.definePropertyService = function (propertyServiceName, propertyServiceEndPoint) {
        self.propertyServices.push({
            propertyServiceName: propertyServiceName,
            propertyServiceEndPoint: propertyServiceEndPoint
        });
    };
    /**
        * Find an element in the provided array by the propertyName and value
        * @param {array} arr
        * @param {string} propName
        * @param {string} propValue
        * @return {propertyService} propertyService
    */
    function findElement(arr, propName, propValue) {
        for (var i = 0; i < arr.length; i++)
            if (arr[i][propName] === propValue)
                return arr[i];
        return undefined;
        // will return undefined if not found; you could return a default instead
    }
    /**
        * Extends the data object for custom request to the server
        * @param {object} target
        * @param {object} source
        * @return {object} resultObject
    */
    function extendDataObj(target, source) {
        for (var objProperty in source) {
            if (source.hasOwnProperty(objProperty)) {
                target[objProperty] = source[objProperty];
            }
        }
        return target;
    }
    /**
        * Removes the service name from the request property (only if the engine has the resolveByConvention option active)
        * @param {string} requestProperty
        * @return {string} fixedProperty
    */
    function fixPropertyForConvention(requestProperty) {
        var fixed = requestProperty.substring(requestProperty.indexOf(".") + 1);
        return fixed;
    }
    /**
        * Reads all the data-* attributes from the document
    */
    this.listener = function () {
        //$.When example for deferred objects
        //Lets try http://stackoverflow.com/questions/5627284/pass-in-an-array-of-deferreds-to-when
        var deferred = [];

        /**
            * Resolves the service name by convention
            * @param {string} propertyRequest
            * @return {Number} propertyService
        */
        function resolveServiceNameByConvention(propertyRequest) {
            var splitServiceName = propertyRequest.split(".");
            if (options.enableDebug) {
                console.info("Resolving service by convention");
            }
            for (var i = 0; i < splitServiceName.length; i++) {
                var service = findElement(self.propertyServices, propertyServiceConst, splitServiceName[i]);
                if (service != undefined) {
                    if (i > 0) {
                        //If the service was resolved in a different position than 0 then we broke the convention rules, this may not cause an error
                        // but can throw some bugs here and there
                        console.warn("Warning: The service " + service.propertyServiceName + " was resolved in position " + i);
                        return undefined;
                    } else {
                        return service;
                    }
                }
            }
            return undefined;
        }
        $("[data-property]").each(function () {

            //Current dom element
            var element = $(this);

            //Value assignation
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
            };


            var serviceInfo;
            //in test process
            if (options.resolveByConvention) {
                //Resolve by convention
                serviceInfo = resolveServiceNameByConvention(propertyRequest);

                //--Test
                if (serviceInfo == undefined) {

                    if (options.enableDebug) {
                        console.warn("Resolve by convention failed for property " + propertyRequest + " trying to resolve the service by default");
                    }
                    //Try to resolve the service by default
                    serviceInfo = findElement(self.propertyServices, propertyServiceConst, propertyServiceName);
                } else {
                    //The convention resolver worked so...
                    if (options.enableDebug) {
                        console.warn("Resolve by convention succeded for property " + propertyRequest);
                    }
                    //Now we know the service is not null
                    //Next lets remove the service name from the property to request it 
                    dataBindObj.propertyRequest = fixPropertyForConvention(dataBindObj.propertyRequest);
                }
            } else {


                serviceInfo = findElement(self.propertyServices, propertyServiceConst, propertyServiceName);
            }


            if (serviceInfo == undefined) {

                console.warn("Service undefined for property " + propertyRequest);

                if (options.enableDebug) {
                    console.info("Trying to get the service by convention for property " + propertyRequest);
                }

                serviceInfo = resolveServiceNameByConvention(propertyRequest);

                //if still undefined...
                if (serviceInfo == undefined) {
                    console.warn("Second try : Service undefined for property " + propertyRequest);
                    console.info("Seems like you have the convention resolver inactive and you dont have a data-servicename defined for this property ("+propertyRequest+"), skipping.....");
                } else {
                    console.info("The convention resolver fixed the problem, but please check the code or enable the convention resolver in the options object");
                    dataBindObj.propertyRequest = fixPropertyForConvention(dataBindObj.propertyRequest);
                    self.buildAjaxObj(serviceInfo.propertyServiceEndPoint, dataBindObj, deferred);
                }
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
    };
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

    };
    this.hideOverlay = function () {
        if (options.overlayObj) {
            document.getElementById(options.overlayObj).style.width = "0%";
        } else {
            console.warn("No overlay defined");
        }
    };
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
    };
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
    };
    this.getValue = function (serviceName, property, extendObject, callback) {
        var serviceInfo = findElement(self.propertyServices, propertyServiceConst, serviceName);
        if (serviceInfo == undefined) {
            console.error("Service undefined");
        } else {
            self.getValueFromService(serviceInfo, property, extendObject, function (data) {
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
                callback(responseData);
            }
        });
    };

    this.resolveDataRequest = function (property, extendProperties) {
        var data = {
            key: property
        };
        if (extendProperties != undefined) {
            var extendedData = extendDataObj(data, extendProperties);

            if (options.enableDebug) {
                console.info("The request object has been extended --->");
                console.log(extendedData);
            }
            return extendedData;
        } else {
            return data;
        }
    };

    return {
        propertyServices: this.propertyServices,
        defineNewPropertyService: this.definePropertyService,
        getValueFromDom: this.getValueFromDomElement,
        startListener: this.listener,
        getValue: this.getValue
    };
});