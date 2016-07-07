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
    var iterationServiceConst = "iterationServiceName";
    //All property services defined
    this.propertyServices = [];
    this.dependentIterations = [];
    this.iterationServices = [];
    this.jobsFinished = [];

    this.addJobsFinished = function (jobName) {
        self.jobsFinished.push(jobName);
    }

    /**
       * Add a new element to iterationServices array
       * @param {string} iterationServiceName
       * @param {string} iterationServiceEndPoint
   */
    this.defineIterationService = function (iterationServiceName, iterationServiceEndPoint) {
        self.iterationServices.push({
            iterationServiceName: iterationServiceName,
            iterationServiceEndPoint: iterationServiceEndPoint
        });
    }
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
        //http://stackoverflow.com/questions/9354834/iterate-over-object-literal-values
        //http://stackoverflow.com/questions/1184123/is-it-possible-to-add-dynamically-named-properties-to-javascript-object
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
        //http://stackoverflow.com/questions/4092325/how-to-remove-part-of-a-string-before-a-in-javascript
        var fixed = requestProperty.substring(requestProperty.indexOf(".") + 1);
        return fixed;
    }
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
    /**
     * Creates a new instance of a databindObject
     * @param {string} propertyRequest
     * @param {string} propertyServiceName
     * @param {string} printInProperty
     * @param {bool} replicate
     * @param {function} callbackFunc
     * @param {bool} useFuncOnly
     * @param {object} extendProperties
     * @param {bool} async
     * @param {$object} element
     */
    var dataBindObj = function (propertyRequest, propertyServiceName, printInProperty, replicate, callbackFunc, useFuncOnly, extendProperties, async, element, iterationObjName) {
        this.propertyRequest = propertyRequest;
        this.propertyServiceName = propertyServiceName;
        this.printInProperty = printInProperty;
        this.replicate = replicate;
        this.callbackFunc = callbackFunc;
        this.runAsync = async;
        this.useFuncOnly = useFuncOnly;
        this.requestProperties = extendProperties;
        this.element = element;
        this.iterationObjName = iterationObjName;
    }
    /**
     * This will execute all the iterations in queue after all the properties from the parent had been assigned
     * @param {String} parentIterationName
     */
    this.executeInQueue = function (parentIterationName) {
        $.each(self.dependentIterations, function (i, v) {

            if (v.dependsOn === parentIterationName) {
                if (!v.executed) {
                    setTimeout(function () {
                        //This hasn�t been executed

                        console.log("dependen of section id " + v.sectionId);

                        var parentContext = $('[data-template="' + v.dependsOn + '"]');

                        var sectionContext = $(parentContext).find('[data-identifier="' + v.sectionId + '"]');

                        var iterationContext = $(sectionContext).find('[data-iterate="' + v.iterationName + '"]');

                        var htmlElement = $(iterationContext[0])[0];

                        var context = $('[data-template="' + v.iterationName + '"]');

                        self.buildAjaxIObj(context, v.iterationService.iterationServiceEndPoint, v.deferredReference, v.iterationName, v.beforeSendFunction);

                        //fkme n t ss
                        //Test -> this attribute might be diferent
                        var id = $(htmlElement).data("id");

                    }, 0);
                    v.executed = true;
                }
            }
        });
    }
    /**
     * Sets the section context to the queue element
     * @param {} sectionId
     * @param {} dependsOn
     * @returns {}
     */
    this.setSectionIdToQueueElement = function (sectionId, dependsOn) {

        $.each(self.dependentIterations, function (i, v) {
            if (v.dependsOn === dependsOn) {
                if (!v.sectionId) {
                    v.sectionId = sectionId;
                }
            }
        });
    };

    this.lookForChilds = function (context) {
        console.log("Now looking for childs inside context -->");
        var childs = $(context[0]).find("[data-iterate]");
        if (childs.length > 0) {
            console.log("The context has " + childs.length + " childs");
            $.each(childs, function (i, child) {
                console.log(child);
                self.processContext(child, self.deferred, true);
            });
        } else {
            console.log("No childs");
        }
    }
    this.processContext = function (context, deferredArray, isChild) {
        setTimeout(function () {
            if (!context) {
                return;
            }
            console.log("Processing context ->");

            console.log(context);

            var iterateValue = $(context).data("iterate");
            //Iteration source
            var iterationSourceName = $(context).data("source");

            var beforeSendFunction = $(context).data("beforesend");
            //avoids the execution of beforesend
            if (isChild == undefined) {

                beforeSendFunction = undefined;
            } else {

                console.log("Is child? " + isChild);
            }

            var iterationService = findElement(self.iterationServices, iterationServiceConst, iterationSourceName);

            if (iterationService == undefined) {
                console.error("Iteration service undefined for " + iterationSourceName);
            } else {

                //Iteration template context obj
                var iterateContext = $(context).find('[data-template="' + iterateValue + '"]');

                self.buildAjaxIObj(iterateContext, iterationService.iterationServiceEndPoint, deferredArray, iterateValue, beforeSendFunction);

                //Iteration template
                //var templateContext = $(this).find(context);

            }
        }, 0);

    }
    this.deferred = [];
    /**
        * Reads all the data-* attributes from the document
    */
    this.listener = function () {
        //$.When example for deferred objects
        //Lets try http://stackoverflow.com/questions/5627284/pass-in-an-array-of-deferreds-to-when

        /**
        * Starts the default listener
        */
        function initializeMainListener() {
            $("[data-property]").each(function (i, v) {
                //Current dom element
                var element = $(v);

                //Value assignation
                var propertyRequest = $(v).data("property");
                var propertyServiceName = $(v).data("servicename");
                var printInProperty = $(v).data("printproperty");
                var replicate = $(v).data("replicate");
                var callbackFunc = $(v).data("callback");
                var useFuncOnly = $(v).data("ignoreall");
                var extendProperties = $(v).data("params");



                //Use it with caution pls
                var async = $(v).data("async");

                if (async == undefined) {
                    async = true;
                }

                var bindObj = new dataBindObj(propertyRequest,
                    propertyServiceName,
                    printInProperty,
                    replicate,
                    callbackFunc,
                    useFuncOnly,
                    extendProperties,
                    async,
                    element);


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
                        bindObj.propertyRequest = fixPropertyForConvention(bindObj.propertyRequest);
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
                        console.info("Seems like you have the convention resolver inactive and you dont have a data-servicename defined for this property (" + propertyRequest + "), skipping.....");
                    } else {
                        console.info("The convention resolver fixed the problem, but please check the code or enable the convention resolver in the options object");
                        bindObj.propertyRequest = fixPropertyForConvention(bindObj.propertyRequest);
                        self.buildAjaxObj(serviceInfo.propertyServiceEndPoint, bindObj, self.deferred);
                    }
                } else {

                    self.buildAjaxObj(serviceInfo.propertyServiceEndPoint, bindObj, self.deferred);
                }

            });
        };
        /**
            * Starts the iterator listener
        */
        function initializeIteratorListener() {

            //This way it only supports one child iteration ->
            //Possible solution: Build the databindObject without checking if it has a parent or child,
            //and create a function for do everyting else

            $("[data-iterate]").each(function (i, v) {



                ///Lets try parent find childrens instead


                // it doesnt have childs cuz they havent been rendered yet
                //sooo we need to start a sub-listener after the father has finished the instructions

                self.processContext(v, self.deferred);
                //if (isInsideParent) {
                //    console.log("Is inside parent");
                //    //Iteration service is added to queue
                //    var parent = $(v).parents("[data-iterate]")[0];
                //    self.dependentIterations.push({
                //        dependsOn: $(parent).data("iterate"),
                //        executed: false,
                //        iterationSourceName: $(v).data("source"),
                //        beforeSendFunction: $(v).data("beforesend"),
                //        iterationService: findElement(self.iterationServices, iterationServiceConst, $(v).data("source")),
                //        iterationName: $(v).data("iterate"),
                //        deferredReference: deferred
                //    });
                //}
                //else {
                //    //Array name
                //    var iterateValue = $(v).data("iterate");
                //    //Iteration source
                //    var iterationSourceName = $(v).data("source");
                //    var beforeSendFunction = $(v).data("beforesend");
                //    var iterationService = findElement(self.iterationServices, iterationServiceConst, iterationSourceName);

                //    if (iterationService == undefined) {
                //        console.error("Iteration service undefined for " + iterationSourceName);
                //    } else {

                //        //Iteration template context obj
                //        var context = $('[data-template="' + iterateValue + '"]');

                //        self.buildAjaxIObj(context, iterationService.iterationServiceEndPoint, deferred, iterateValue, beforeSendFunction);

                //        //Iteration template
                //        //var templateContext = $(this).find(context);

                //    }
                //    self.executeInQueue();
                //}

            });
        }



        initializeMainListener();
        initializeIteratorListener();

        /**
         * Awaits for all the ajax executions to finish
         */
        $.when.apply($, self.deferred).done(self.allDoneFunction);
        //
        //It works!! many awesome!! much power, very async



    };


    /**
     * Auto starts the listener if the autoStart option is set to true
     */
    if (options.autoStart) {
        self.listener();
    }
    /**
        * Creates a dynamic object
    */
    var dynamicObj = function (object) {
        var obj = {};
        obj = Object.assign(object);
        return obj;
    };
    /**
        * Builds the ajax request for the iteration service
        * @param {$object} context
        * @param {string} endPoint
        * @param {array} deferredArray
        * @param {string} iterateValue
        * @param {function} beforeSendFunction
    */
    this.buildAjaxIObj = function (context, endPoint, deferredArray, iterateValue, beforeSendFunction) {
        var data = {};
        if (endPoint !== "") {
            if (beforeSendFunction != undefined) { }
            deferredArray.push($.ajax({
                url: endPoint,
                data: data,
                beforeSend: function (jqXhr, settings) {
                    if (beforeSendFunction != undefined) {
                        self.callFunction(beforeSendFunction, data, context, function (updatedData) {
                            if (updatedData) {
                                settings.url = settings.url + "/" + updatedData.Id;
                            }
                        });
                    }
                },
                error: function () {
                    console.warn("Endpoint (" + endPoint + ") failed");
                    return;
                }
            }).done(function (responseData) {

                var engineArray = [];

                $.each(responseData, function (index, obj) {
                    engineArray.push(new dynamicObj(obj));
                });
                self.processTemplate(context, engineArray, iterateValue);
                console.log("I had finished my job");

                self.lookForChilds(context);

            }));
        }
    };

    /**
        * Process the data-binding for the provided context
        * @param {$object} context
        * @param {array} arrayOfData
        * @param {string} iterationObjName
    */
    this.processTemplate = function (context, arrayOfData, iterationObjName) {
        var contextBackUpContent = context.html();

        context.html("");

        context.append("<!--IterationContext for " + iterationObjName + "-->");


        //Avoid auto closing tag

        //This will define the unique identifier context

        $.each(arrayOfData, function (i, v) {
            var html = "<div data-identifier=" + i + ">";
            html += contextBackUpContent;
            html += "</div>";
            context.append(html);
        });

        //Finds all unique contexts
        var sections = $(context).find("[data-identifier]");

        //Foreach section found
        sections.each(function (index, section) {
            //We get the iteration identifier
            var sectionId = $(section).data("identifier");

            //Now we have a sectionId lets assign it to the queue element if any

            self.setSectionIdToQueueElement(sectionId, iterationObjName);


            //Then we get the requested properties inside the context
            var propertyRequests = $(section).find("[data-iproperty]");

            //For each request we find the element in the array by the identifier and then we resolve the value of the property requested
            propertyRequests.each(function (propertyIndex, propertyRequest) {
                var propertyName = $(propertyRequest).data("iproperty");
                var printInProperty = $(propertyRequest).data("printproperty");
                var replicate = $(propertyRequest).data("replicate");
                var callbackFunc = $(propertyRequest).data("callback");
                var useFuncOnly = $(propertyRequest).data("ignoreall");
                var resolvedValue = self.resolvePropertyValue(propertyName, arrayOfData[sectionId]);
                var element = $(propertyRequest);
                //now we build a new databindObject
                var bindObj = new dataBindObj(propertyName, "", printInProperty, replicate, callbackFunc, useFuncOnly, undefined, true, element, iterationObjName);

                self.bindDataOfIteration(bindObj, resolvedValue);

            });
        });

        context.append("<!--End of IterationContext for" + iterationObjName + "-->");
    }
    /**
     * Custom function to bind the data of a iteration
     * @param {$object} bindObj
     * @param {object} data
     */
    this.bindDataOfIteration = function (bindObj, data) {
        if (bindObj.callbackFunc) {

            if (bindObj.useFuncOnly) {

                self.callFunction(bindObj.callbackFunc, data, bindObj.element);

            } else {

                self.bindData(bindObj, data);

                self.callFunction(bindObj.callbackFunc, data, bindObj.element);

            }
        } else {
            self.bindData(bindObj, data);
        }
    }
    /**
     * Returns a property value from the provided object
     * @param {string} property
     * @param {object} object
     */
    this.resolvePropertyValue = function (property, object) {
        if (options.enableDebug) {
            console.log("Trying to resolve " + property + " from object -->");
        }
        for (var key in object) {
            if (Object.prototype.hasOwnProperty.call(object, key)) {
                if (property === key) {

                    var val = object[key];

                    return val;
                }
                // use val
            }
        }
    }
    /**
     * Builds the default ajax object
     * @param {string} endPoint
     * @param {object} bindObj
     * @param {array} deferredArray
     */
    this.buildAjaxObj = function (endPoint, bindObj, deferredArray) {

        if (endPoint !== "" && bindObj.propertyRequest !== "") {

            var data = self.resolveDataRequest(bindObj.propertyRequest, bindObj.requestProperties);

            deferredArray.push($.ajax({
                url: endPoint,
                data: data,
                async: bindObj.runAsync

            }).done(function (responseData) {
                if (bindObj.callbackFunc) {

                    if (bindObj.useFuncOnly) {

                        self.callFunction(bindObj.callbackFunc, responseData, bindObj.element);

                    } else {

                        self.bindData(bindObj, data);

                        self.callFunction(bindObj.callbackFunc, responseData, bindObj.element);

                    }
                } else {
                    self.bindData(bindObj, responseData);
                }
            }));
        }
    };
    /**
     * Calls a function based on an string
     * @param {string} func
     * @param {object} data
     * @param {$object} domElement
     * @param {function} callback
     */
    this.callFunction = function (func, data, domElement, callback) {
        try {
            //Most simplistic way
            //I dont want to use eval.
            window[func](data, domElement, function (d) {
                callback(d);
            });
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
    /**
     * Triggers when all ajax executions are done
     */
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
    /**
     * Hides the defined overlay
     */
    this.hideOverlay = function () {
        if (options.overlayObj) {
            document.getElementById(options.overlayObj).style.width = "0%";
        } else {
            console.warn("No overlay defined");
        }
    };
    /**
     * Binds the received data to the dom element inside the bindObj
     * @param {object} bindObj
     * @param {object} data
     */
    this.bindData = function (bindObj, data) {
        //var elementTag = dataBindObj.element[0].nodeName.toLowerCase();
        if (bindObj.printInProperty) {
            bindObj.element.attr(bindObj.printInProperty, data);
            if (bindObj.replicate) {
                self.appendDataInDomElement(bindObj, data);
            } else {
                self.appendOnlyId(bindObj);
            }
        } else {
            self.appendDataInDomElement(bindObj, data);
        }

    };
    /**
     * Appends all the data in the dom
     * @param {object} bindObj
     * @param {object} data
     */
    this.appendDataInDomElement = function (bindObj, data) {
        //console.log("Appending data to ");
        //console.log(bindObj);
        bindObj.element.text(data);
        bindObj.element.attr("id", bindObj.propertyRequest);
        bindObj.element.attr("data-finished", true);

        //self.executeInQueue(bindObj.iterationObjName);
    };
    /**
     * Appends only the id in the dom
     * @param {object} bindObj
     */
    this.appendOnlyId = function (bindObj) {
        bindObj.element.attr("id", bindObj.propertyRequest);
        bindObj.element.attr("data-finished", true);
        self.executeInQueue(bindObj.iterationObjName);
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
        defineIterationSericePoint: this.defineIterationService,
        getValueFromDom: this.getValueFromDomElement,
        startListener: this.listener,
        getValue: this.getValue
    };
});
