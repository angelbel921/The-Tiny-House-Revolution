function dv_rolloutManager(handlersDefsArray, baseHandler) {
    this.handle = function () {
        var errorsArr = [];

        var handler = chooseEvaluationHandler(handlersDefsArray);
        if (handler) {
            var errorObj = handleSpecificHandler(handler);
            if (errorObj === null)
                return errorsArr;
            else {
                var debugInfo = handler.onFailure();
                if (debugInfo) {
                    for (var key in debugInfo) {
                        if (debugInfo.hasOwnProperty(key)) {
                            if (debugInfo[key] !== undefined || debugInfo[key] !== null) {
                                errorObj[key] = encodeURIComponent(debugInfo[key]);
                            }
                        }
                    }
                }
                errorsArr.push(errorObj);
            }
        }

        var errorObjHandler = handleSpecificHandler(baseHandler);
        if (errorObjHandler) {
            errorObjHandler['dvp_isLostImp'] = 1;
            errorsArr.push(errorObjHandler);
        }
        return errorsArr;
    }

    function handleSpecificHandler(handler) {
        var url;
        var errorObj = null;

        try {
            url = handler.createRequest();
            if (url) {
                if (!handler.sendRequest(url))
                    errorObj = createAndGetError('sendRequest failed.',
                        url,
                        handler.getVersion(),
                        handler.getVersionParamName(),
                        handler.dv_script);
            } else
                errorObj = createAndGetError('createRequest failed.',
                    url,
                    handler.getVersion(),
                    handler.getVersionParamName(),
                    handler.dv_script,
                    handler.dvScripts,
                    handler.dvStep,
                    handler.dvOther
                    );
        }
        catch (e) {
            errorObj = createAndGetError(e.name + ': ' + e.message, url, handler.getVersion(), handler.getVersionParamName(), (handler ? handler.dv_script : null));
        }

        return errorObj;
    }

    function createAndGetError(error, url, ver, versionParamName, dv_script, dvScripts, dvStep, dvOther) {
        var errorObj = {};
        errorObj[versionParamName] = ver;
        errorObj['dvp_jsErrMsg'] = encodeURIComponent(error);
        if (dv_script && dv_script.parentElement && dv_script.parentElement.tagName && dv_script.parentElement.tagName == 'HEAD')
            errorObj['dvp_isOnHead'] = '1';
        if (url)
            errorObj['dvp_jsErrUrl'] = url;
        if (dvScripts) {
            var dvScriptsResult = '';
            for (var id in dvScripts) {
                if (dvScripts[id] && dvScripts[id].src) {
                    dvScriptsResult += encodeURIComponent(dvScripts[id].src) + ":" + dvScripts[id].isContain + ",";
                }
            }
            //errorObj['dvp_dvScripts'] = encodeURIComponent(dvScriptsResult);
           // errorObj['dvp_dvStep'] = dvStep;
           // errorObj['dvp_dvOther'] = dvOther;
        }
        return errorObj;
    }

    function chooseEvaluationHandler(handlersArray) {
        var config = window._dv_win.dv_config;
        var index = 0;
        var isEvaluationVersionChosen = false;
        if (config.handlerVersionSpecific) {
            for (var i = 0; i < handlersArray.length; i++) {
                if (handlersArray[i].handler.getVersion() == config.handlerVersionSpecific) {
                    isEvaluationVersionChosen = true;
                    index = i;
                    break;
                }
            }
        }
        else if (config.handlerVersionByTimeIntervalMinutes) {
            var date = config.handlerVersionByTimeInputDate || new Date();
            var hour = date.getUTCHours();
            var minutes = date.getUTCMinutes();
            index = Math.floor(((hour * 60) + minutes) / config.handlerVersionByTimeIntervalMinutes) % (handlersArray.length + 1);
            if (index != handlersArray.length) //This allows a scenario where no evaluation version is chosen
                isEvaluationVersionChosen = true;
        }
        else {
            var rand = config.handlerVersionRandom || (Math.random() * 100);
            for (var i = 0; i < handlersArray.length; i++) {
                if (rand >= handlersArray[i].minRate && rand < handlersArray[i].maxRate) {
                    isEvaluationVersionChosen = true;
                    index = i;
                    break;
                }
            }
        }

        if (isEvaluationVersionChosen == true && handlersArray[index].handler.isApplicable())
            return handlersArray[index].handler;
        else
            return null;
    }    
}

function doesBrowserSupportHTML5Push() {
    "use strict";
    return typeof window.parent.postMessage === 'function' && window.JSON;
}

function dv_GetParam(url, name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS, 'i');
    var results = regex.exec(url);
    if (results == null)
        return null;
    else
        return results[1];
}

function dv_Contains(array, obj) {
    var i = array.length;
    while (i--) {
        if (array[i] === obj) {
            return true;
        }
    }
    return false;
}

function dv_GetDynamicParams(url) {
    try {
        var regex = new RegExp("[\\?&](dvp_[^&]*=[^&#]*)", "gi");
        var dvParams = regex.exec(url);

        var results = new Array();
        while (dvParams != null) {
            results.push(dvParams[1]);
            dvParams = regex.exec(url);
        }
        return results;
    }
    catch (e) {
        return [];
    }
}

function dv_createIframe() {
    var iframe;
    if (document.createElement && (iframe = document.createElement('iframe'))) {
        iframe.name = iframe.id = 'iframe_' + Math.floor((Math.random() + "") * 1000000000000);
        iframe.width = 0;
        iframe.height = 0;
        iframe.style.display = 'none';
        iframe.src = 'about:blank';
    }

    return iframe;
}

function dv_GetRnd() {
    return ((new Date()).getTime() + "" + Math.floor(Math.random() * 1000000)).substr(0, 16);
}

function dv_SendErrorImp(serverUrl, errorsArr) {

    for (var j = 0; j < errorsArr.length; j++) {
        var errorObj = errorsArr[j];
        var errorImp = dv_CreateAndGetErrorImp(serverUrl, errorObj);
        dv_sendImgImp(errorImp);
    }
}

function dv_CreateAndGetErrorImp(serverUrl, errorObj) {
    var errorQueryString = '';
    for (key in errorObj) {
        if (errorObj.hasOwnProperty(key)) {
            if (key.indexOf('dvp_jsErrUrl') == -1) {
                errorQueryString += '&' + key + '=' + errorObj[key];
            }
            else {
                var params = ['ctx', 'cmp', 'plc', 'sid'];
                for (var i = 0; i < params.length; i++) {
                    var pvalue = dv_GetParam(errorObj[key], params[i]);
                    if (pvalue) {
                        errorQueryString += '&dvp_js' + params[i] + '=' + pvalue;
                    }
                }
            }
        }
    }

    var windowProtocol = 'http:';
    var sslFlag = '&ssl=0';
    if (window._dv_win.location.protocol === 'https:') {
        windowProtocol = 'https:';
        sslFlag = '&ssl=1';
    }
    
    var errorImp = windowProtocol + '//' + serverUrl + sslFlag + errorQueryString;
    return errorImp;
}

function dv_sendImgImp(url) {
    (new Image()).src = url;
}

function dv_sendScriptRequest(url) {
    document.write('<scr' + 'ipt type="text/javascript" src="' + url + '"></scr' + 'ipt>');
}

function dv_getPropSafe(obj, propName) {
    try {
        if (obj)
            return obj[propName];
    } catch (e) { }
}

function dvBsType() {
    var that = this;
    var eventsForDispatch = {};
    this.t2tEventDataZombie = {};

    this.processT2TEvent = function (data, tag) {
        try {
            if (tag.ServerPublicDns) {
                data.timeStampCollection.push({"beginProcessT2TEvent" : getCurrentTime()});
                data.timeStampCollection.push({'beginVisitCallback' : tag.beginVisitCallbackTS});
                var tpsServerUrl = tag.dv_protocol + '//' + tag.ServerPublicDns + '/event.gif?impid=' + tag.uid;

                if (!tag.uniquePageViewId) {
                    tag.uniquePageViewId = data.uniquePageViewId;
                }

                tpsServerUrl += '&dvp_upvid=' + tag.uniquePageViewId;
                tpsServerUrl += '&dvp_numFrames=' + data.totalIframeCount;
                tpsServerUrl += '&dvp_numt2t=' + data.totalT2TiframeCount;
                tpsServerUrl += '&dvp_frameScanDuration=' + data.scanAllFramesDuration;
                tpsServerUrl += '&dvp_scene=' + tag.adServingScenario;
                tpsServerUrl += '&dvp_ist2twin=' + (data.isWinner ? '1' : '0');
                tpsServerUrl += '&dvp_numTags=' + Object.keys($dvbs.tags).length;
                tpsServerUrl += '&dvp_isInSample=' + data.isInSample;
                tpsServerUrl += (data.wasZombie)?'&dvp_wasZombie=1':'&dvp_wasZombie=0';
                tpsServerUrl += '&dvp_ts_t2tCreatedOn=' + data.creationTime;
                if(data.timeStampCollection)
                {
                    if(window._dv_win.t2tTimestampData)
                    {
                        for(var tsI = 0; tsI < window._dv_win.t2tTimestampData.length; tsI++)
                        {
                            data.timeStampCollection.push(window._dv_win.t2tTimestampData[tsI]);
                        }
                    }

                    for(var i = 0; i< data.timeStampCollection.length;i++)
                    {
                        var item = data.timeStampCollection[i];
                        for(var propName in item)
                        {
                            if(item.hasOwnProperty(propName))
                            {
                                tpsServerUrl += '&dvp_ts_' + propName + '=' + item[propName];
                            }
                        }
                    }
                }
                $dvbs.domUtilities.addImage(tpsServerUrl, tag.tagElement.parentElement);
            }
        } catch (e) {
            try {
                dv_SendErrorImp(window._dv_win.dv_config.tpsErrAddress + '/visit.jpg?ctx=818052&cmp=1619415&dvtagver=6.1.src&jsver=0&dvp_ist2tProcess=1', { dvp_jsErrMsg: encodeURIComponent(e) });
            } catch (ex) { }
        }
    };

    this.processTagToTagCollision = function (collision, tag) {
        var i;
        var tpsServerUrl = tag.dv_protocol + '//' + tag.ServerPublicDns + '/event.gif?impid=' + tag.uid;
        var additions = [
            '&dvp_collisionReasons=' + collision.reasonBitFlag,
            '&dvp_ts_reporterDvTagCreated=' + collision.thisTag.dvTagCreatedTS,
            '&dvp_ts_reporterVisitJSMessagePosted=' + collision.thisTag.visitJSPostMessageTS,
            '&dvp_ts_reporterReceivedByT2T=' + collision.thisTag.receivedByT2TTS,
            '&dvp_ts_collisionPostedFromT2T=' + collision.postedFromT2TTS,
            '&dvp_ts_collisionReceivedByCommon=' + collision.commonRecievedTS,
            '&dvp_collisionTypeId=' + collision.allReasonsForTagBitFlag
        ];
        tpsServerUrl += additions.join("");

        for (i = 0; i < collision.reasons.length; i++){
            var reason = collision.reasons[i];
            tpsServerUrl += '&dvp_' + reason + "MS=" + collision[reason+"MS"];
        }

        if(tag.uniquePageViewId){
            tpsServerUrl +=  '&dvp_upvid='+tag.uniquePageViewId;
        }
        $dvbs.domUtilities.addImage(tpsServerUrl, tag.tagElement.parentElement);
    };

    var messageEventListener = function (event) {
        try {
            var timeCalled = getCurrentTime();
            var data = window.JSON.parse(event.data);
            if(!data.action){
                data = window.JSON.parse(data);
            }
            if(data.timeStampCollection)
            {
                data.timeStampCollection.push({messageEventListenerCalled:timeCalled});
            }
            var myUID;
            var visitJSHasBeenCalledForThisTag = false;
            if ($dvbs.tags) {
                for (var uid in $dvbs.tags) {
                    if ($dvbs.tags.hasOwnProperty(uid) && $dvbs.tags[uid] && $dvbs.tags[uid].t2tIframeId === data.iFrameId) {
                        myUID = uid;
                        visitJSHasBeenCalledForThisTag = true;
                        break;
                    }
                }
            }

            switch(data.action){
            case 'uniquePageViewIdDetermination' :
                if(visitJSHasBeenCalledForThisTag){
                    $dvbs.processT2TEvent(data, $dvbs.tags[myUID]);
                    $dvbs.t2tEventDataZombie[data.iFrameId] = undefined;
                }
                else
                {
                    data.wasZombie = 1;
                    $dvbs.t2tEventDataZombie[data.iFrameId] = data;
                }
            break;
            case 'maColl':
                var tag = $dvbs.tags[myUID];
                //mark we got a message, so we'll stop sending them in the future
                tag.AdCollisionMessageRecieved = true;
                if (!tag.uniquePageViewId) { tag.uniquePageViewId = data.uniquePageViewId; }
                data.collision.commonRecievedTS = timeCalled;
                $dvbs.processTagToTagCollision(data.collision, tag);
            break;
            }

        } catch (e) {
            try{
                dv_SendErrorImp(window._dv_win.dv_config.tpsErrAddress + '/visit.jpg?ctx=818052&cmp=1619415&dvtagver=6.1.src&jsver=0&dvp_ist2tListener=1', { dvp_jsErrMsg: encodeURIComponent(e) });
            } catch (ex) { }
        }
    };

    if (window.addEventListener)
        addEventListener("message", messageEventListener, false);
    else
        attachEvent("onmessage", messageEventListener);

    this.pubSub = new function () {

        var subscribers = [];

        this.subscribe = function (eventName, uid, actionName, func) {
            if (!subscribers[eventName + uid])
                subscribers[eventName + uid] = [];
            subscribers[eventName + uid].push({ Func: func, ActionName: actionName });
        }

        this.publish = function (eventName, uid) {
            var actionsResults = [];
            if (eventName && uid && subscribers[eventName + uid] instanceof Array)
                for (var i = 0; i < subscribers[eventName + uid].length; i++) {
                    var funcObject = subscribers[eventName + uid][i];
                    if (funcObject && funcObject.Func && typeof funcObject.Func == "function" && funcObject.ActionName) {
                        var isSucceeded = runSafely(function () {
                            return funcObject.Func(uid);
                        });
                        actionsResults.push(encodeURIComponent(funcObject.ActionName) + '=' + (isSucceeded ? '1' : '0'));
                    }
                }
            return actionsResults.join('&');
        }
    };

    this.domUtilities = new function () {

        this.addImage = function (url, parentElement) {
            var image = parentElement.ownerDocument.createElement("img");
            image.width = 0;
            image.height = 0;
            image.style.display = 'none';
            image.src = appendCacheBuster(url);
            parentElement.insertBefore(image, parentElement.firstChild);
        };

        this.addScriptResource = function (url, parentElement) {
            var scriptElem = parentElement.ownerDocument.createElement("script");
            scriptElem.type = 'text/javascript';
            scriptElem.src = appendCacheBuster(url);
            parentElement.insertBefore(scriptElem, parentElement.firstChild);
        };

        this.addScriptCode = function (srcCode, parentElement) {
            var scriptElem = parentElement.ownerDocument.createElement("script");
            scriptElem.type = 'text/javascript';
            scriptElem.innerHTML = srcCode;
            parentElement.insertBefore(scriptElem, parentElement.firstChild);
        };

        this.addHtml = function (srcHtml, parentElement) {
            var divElem = parentElement.ownerDocument.createElement("div");
            divElem.style = "display: inline";
            divElem.innerHTML = srcHtml;
            parentElement.insertBefore(divElem, parentElement.firstChild);
        }
    };

    this.resolveMacros = function(str, tag) {
        var viewabilityData = tag.getViewabilityData();
        var viewabilityBuckets = viewabilityData && viewabilityData.buckets ? viewabilityData.buckets : { };
        var upperCaseObj = objectsToUpperCase(tag, viewabilityData, viewabilityBuckets);
        var newStr = str.replace('[DV_PROTOCOL]', upperCaseObj.DV_PROTOCOL);
        newStr = newStr.replace('[PROTOCOL]', upperCaseObj.PROTOCOL);
        newStr = newStr.replace( /\[(.*?)\]/g , function(match, p1) {
            var value = upperCaseObj[p1];
            if (value === undefined || value === null)
                value = '[' + p1 + ']';
            return encodeURIComponent(value);
        });
        return newStr;
    };

    this.settings = new function () {
    };

    this.tagsType = function () { };

    this.tagsPrototype = function () {
        this.add = function (tagKey, obj) {
            if (!that.tags[tagKey])
                that.tags[tagKey] = new that.tag();
            for (var key in obj)
                that.tags[tagKey][key] = obj[key];
        }
    };

    this.tagsType.prototype = new this.tagsPrototype();
    this.tagsType.prototype.constructor = this.tags;
    this.tags = new this.tagsType();

    this.tag = function () { }
    this.tagPrototype = function () {
        this.set = function (obj) {
            for (var key in obj)
                this[key] = obj[key];
        }

        this.getViewabilityData = function () {
        }
    };

    this.tag.prototype = new this.tagPrototype();
    this.tag.prototype.constructor = this.tag;

    this.getTagObjectByService = function (serviceName) {

        for (var impressionId in this.tags) {
            if (typeof this.tags[impressionId] === 'object'
                && this.tags[impressionId].services
                && this.tags[impressionId].services[serviceName]
                && !this.tags[impressionId].services[serviceName].isProcessed) {
                this.tags[impressionId].services[serviceName].isProcessed = true;
                return this.tags[impressionId];
            }
        }


        return null;
    };

    this.addService = function (impressionId, serviceName, paramsObject) {

        if (!impressionId || !serviceName)
            return;

        if (!this.tags[impressionId])
            return;
        else {
            if (!this.tags[impressionId].services)
                this.tags[impressionId].services = {};

            this.tags[impressionId].services[serviceName] = {
                params: paramsObject,
                isProcessed: false
            };
        }
    };

    this.Enums = {
        BrowserId: { Others: 0, IE: 1, Firefox: 2, Chrome: 3, Opera: 4, Safari: 5 },
        TrafficScenario: { OnPage: 1, SameDomain: 2, CrossDomain: 128 }
    };

    this.CommonData = { };
    
    var runSafely = function (action) {
        try {
            var ret = action();
            return ret !== undefined ? ret : true;
        } catch (e) { return false; }
    };

    var objectsToUpperCase = function () {
        var upperCaseObj = {};
        for (var i = 0; i < arguments.length; i++) {
            var obj = arguments[i];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    upperCaseObj[key.toUpperCase()] = obj[key];
                }
            }
        }
        return upperCaseObj;
    };

    var appendCacheBuster = function (url) {
        if (url !== undefined && url !== null && url.match("^http") == "http") {
            if (url.indexOf('?') !== -1) {
                if (url.slice(-1) == '&')
                    url += 'cbust=' + dv_GetRnd();
                else
                    url += '&cbust=' + dv_GetRnd();
            }
            else
                url += '?cbust=' + dv_GetRnd();
        }
        return url;
    };

    this.dispatchRegisteredEventsFromAllTags = function () {
        for (var impressionId in this.tags) {
            if (typeof this.tags[impressionId] !== 'function' && typeof this.tags[impressionId] !== 'undefined')
                dispatchEventCalls(impressionId, this);
        }
    };

    var dispatchEventCalls = function (impressionId, dvObj) {
        var tag = dvObj.tags[impressionId];
        var eventObj = eventsForDispatch[impressionId];
        if (typeof eventObj !== 'undefined' && eventObj != null) {
            var url = tag.protocol + '//' + tag.ServerPublicDns + "/bsevent.gif?impid=" + impressionId + '&' + createQueryStringParams(eventObj);
            dvObj.domUtilities.addImage(url, tag.tagElement.parentElement);
            eventsForDispatch[impressionId] = null;
        }
    };

    this.registerEventCall = function (impressionId, eventObject, timeoutMs) {        
        addEventCallForDispatch(impressionId, eventObject);

        if (typeof timeoutMs === 'undefined' || timeoutMs == 0 || isNaN(timeoutMs))
            dispatchEventCallsNow(this, impressionId, eventObject);
        else {
            if (timeoutMs > 2000)
                timeoutMs = 2000;

            var dvObj = this;
            setTimeout(function () {
                dispatchEventCalls(impressionId, dvObj);
                }, timeoutMs);
        }        
    };

    var dispatchEventCallsNow = function (dvObj, impressionId, eventObject) {
        addEventCallForDispatch(impressionId, eventObject);
        dispatchEventCalls(impressionId, dvObj);
    };

    var addEventCallForDispatch = function (impressionId, eventObject) {
        for (var key in eventObject) {
            if (typeof eventObject[key] !== 'function' && eventObject.hasOwnProperty(key)) {
                if (!eventsForDispatch[impressionId])
                    eventsForDispatch[impressionId] = {};
                eventsForDispatch[impressionId][key] = eventObject[key];
            }
        }
    };

    if (window.addEventListener) {
        window.addEventListener('unload', function () { that.dispatchRegisteredEventsFromAllTags(); }, false);
        window.addEventListener('beforeunload', function () { that.dispatchRegisteredEventsFromAllTags(); }, false);
    }
    else if (window.attachEvent) {
        window.attachEvent('onunload', function () { that.dispatchRegisteredEventsFromAllTags(); }, false);
        window.attachEvent('onbeforeunload', function () { that.dispatchRegisteredEventsFromAllTags(); }, false);
    }
    else {
        window.document.body.onunload = function () { that.dispatchRegisteredEventsFromAllTags(); };
        window.document.body.onbeforeunload = function () { that.dispatchRegisteredEventsFromAllTags(); };
    }

    var createQueryStringParams = function (values) {
        var params = '';
        for (var key in values) {
            if (typeof values[key] !== 'function') {
                var value = encodeURIComponent(values[key]);
                if (params === '')
                    params += key + '=' + value;
                else
                    params += '&' + key + '=' + value;
            }
        }

        return params;
    };
}


function dv_handler36(){function J(e){if(window._dv_win.document.body)return window._dv_win.document.body.insertBefore(e,window._dv_win.document.body.firstChild),!0;var a=0,h=function(){if(window._dv_win.document.body)try{window._dv_win.document.body.insertBefore(e,window._dv_win.document.body.firstChild)}catch(c){}else a++,150>a&&setTimeout(h,20)};setTimeout(h,20);return!1}function K(e){var a,h=window._dv_win.document.visibilityState;window[e.tagObjectCallbackName]=function(c){if(window._dv_win.$dvbs){var d=
"https"==window._dv_win.location.toString().match("^https")?"https:":"http:";a=c.ImpressionID;window._dv_win.$dvbs.tags.add(c.ImpressionID,e);window._dv_win.$dvbs.tags[c.ImpressionID].set({tagElement:e.script,impressionId:c.ImpressionID,dv_protocol:e.protocol,protocol:d,uid:e.uid,serverPublicDns:c.ServerPublicDns,ServerPublicDns:c.ServerPublicDns});if("prerender"===h)if("prerender"!==window._dv_win.document.visibilityState&&"unloaded"!==visibilityStateLocal)window._dv_win.$dvbs.registerEventCall(c.ImpressionID,
{prndr:0});else{var b;"undefined"!==typeof window._dv_win.document.hidden?b="visibilitychange":"undefined"!==typeof window._dv_win.document.mozHidden?b="mozvisibilitychange":"undefined"!==typeof window._dv_win.document.msHidden?b="msvisibilitychange":"undefined"!==typeof window._dv_win.document.webkitHidden&&(b="webkitvisibilitychange");var n=function(){var a=window._dv_win.document.visibilityState;"prerender"===h&&("prerender"!==a&&"unloaded"!==a)&&(h=a,window._dv_win.$dvbs.registerEventCall(c.ImpressionID,
{prndr:0}),window._dv_win.document.removeEventListener(b,n))};window._dv_win.document.addEventListener(b,n,!1)}}};window[e.callbackName]=function(c){var d;d=window._dv_win.$dvbs&&"object"==typeof window._dv_win.$dvbs.tags[a]?window._dv_win.$dvbs.tags[a]:e;e.perf&&e.perf.addTime("r7");var b=window._dv_win.dv_config.bs_renderingMethod||function(a){document.write(a)};switch(c.ResultID){case 1:d.tagPassback?b(d.tagPassback):c.Passback?b(decodeURIComponent(c.Passback)):c.AdWidth&&c.AdHeight&&b(decodeURIComponent("%3Cstyle%3E%0A.dvbs_container%20%7B%0A%09border%3A%201px%20solid%20%233b599e%3B%0A%09overflow%3A%20hidden%3B%0A%09filter%3A%20progid%3ADXImageTransform.Microsoft.gradient(startColorstr%3D%27%23315d8c%27%2C%20endColorstr%3D%27%2384aace%27)%3B%0A%09%2F*%20for%20IE%20*%2F%0A%09background%3A%20-webkit-gradient(linear%2C%20left%20top%2C%20left%20bottom%2C%20from(%23315d8c)%2C%20to(%2384aace))%3B%0A%09%2F*%20for%20webkit%20browsers%20*%2F%0A%09background%3A%20-moz-linear-gradient(top%2C%20%23315d8c%2C%20%2384aace)%3B%0A%09%2F*%20for%20firefox%203.6%2B%20*%2F%0A%7D%0A.dvbs_cloud%20%7B%0A%09color%3A%20%23fff%3B%0A%09position%3A%20relative%3B%0A%09font%3A%20100%25%22Times%20New%20Roman%22%2C%20Times%2C%20serif%3B%0A%09text-shadow%3A%200px%200px%2010px%20%23fff%3B%0A%09line-height%3A%200%3B%0A%7D%0A%3C%2Fstyle%3E%0A%3Cscript%20type%3D%22text%2Fjavascript%22%3E%0A%09function%0A%20%20%20%20cloud()%7B%0A%09%09var%20b1%20%3D%20%22%3Cdiv%20class%3D%5C%22dvbs_cloud%5C%22%20style%3D%5C%22font-size%3A%22%3B%0A%09%09var%20b2%3D%22px%3B%20position%3A%20absolute%3B%20top%3A%20%22%3B%0A%09%09document.write(b1%20%2B%20%22300px%3B%20width%3A%20300px%3B%20height%3A%20300%22%20%2B%20b2%20%2B%20%2234px%3B%20left%3A%2028px%3B%5C%22%3E.%3C%5C%2Fdiv%3E%22)%3B%0A%09%09document.write(b1%20%2B%20%22300px%3B%20width%3A%20300px%3B%20height%3A%20300%22%20%2B%20b2%20%2B%20%2246px%3B%20left%3A%2010px%3B%5C%22%3E.%3C%5C%2Fdiv%3E%22)%3B%0A%09%09document.write(b1%20%2B%20%22300px%3B%20width%3A%20300px%3B%20height%3A%20300%22%20%2B%20b2%20%2B%20%2246px%3B%20left%3A50px%3B%5C%22%3E.%3C%5C%2Fdiv%3E%22)%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%09%09document.write(b1%20%2B%20%22400px%3B%20width%3A%20400px%3B%20height%3A%20400%22%20%2B%20b2%20%2B%20%2224px%3B%20left%3A20px%3B%5C%22%3E.%3C%5C%2Fdiv%3E%22)%3B%0A%20%20%20%20%7D%0A%20%20%20%20%0A%09function%20clouds()%7B%0A%20%20%20%20%20%20%20%20var%20top%20%3D%20%5B%27-80%27%2C%2780%27%2C%27240%27%2C%27400%27%5D%3B%0A%09%09var%20left%20%3D%20-10%3B%0A%20%20%20%20%20%20%20%20var%20a1%20%3D%20%22%3Cdiv%20style%3D%5C%22position%3A%20relative%3B%20top%3A%20%22%3B%0A%09%09var%20a2%20%3D%20%22px%3B%20left%3A%20%22%3B%0A%20%20%20%20%20%20%20%20var%20a3%3D%20%22px%3B%5C%22%3E%3Cscr%22%2B%22ipt%20type%3D%5C%22text%5C%2Fjavascr%22%2B%22ipt%5C%22%3Ecloud()%3B%3C%5C%2Fscr%22%2B%22ipt%3E%3C%5C%2Fdiv%3E%22%3B%0A%20%20%20%20%20%20%20%20for(i%3D0%3B%20i%20%3C%208%3B%20i%2B%2B)%20%7B%0A%09%09%09document.write(a1%2Btop%5B0%5D%2Ba2%2Bleft%2Ba3)%3B%0A%09%09%09document.write(a1%2Btop%5B1%5D%2Ba2%2Bleft%2Ba3)%3B%0A%09%09%09document.write(a1%2Btop%5B2%5D%2Ba2%2Bleft%2Ba3)%3B%0A%09%09%09document.write(a1%2Btop%5B3%5D%2Ba2%2Bleft%2Ba3)%3B%0A%09%09%09if(i%3D%3D4)%0A%09%09%09%7B%0A%09%09%09%09left%20%3D-%2090%3B%0A%09%09%09%09top%20%3D%20%5B%270%27%2C%27160%27%2C%27320%27%2C%27480%27%5D%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20else%20%0A%09%09%09%09left%20%2B%3D%20160%3B%0A%09%09%7D%0A%09%7D%0A%0A%3C%2Fscript%3E%0A%3Cdiv%20class%3D%22dvbs_container%22%20style%3D%22width%3A%20"+
c.AdWidth+"px%3B%20height%3A%20"+c.AdHeight+"px%3B%22%3E%0A%09%3Cscript%20type%3D%22text%2Fjavascript%22%3Eclouds()%3B%3C%2Fscript%3E%0A%3C%2Fdiv%3E"));break;case 2:case 3:d.tagAdtag&&b(d.tagAdtag);break;case 4:c.AdWidth&&c.AdHeight&&b(decodeURIComponent("%3Cstyle%3E%0A.dvbs_container%20%7B%0A%09border%3A%201px%20solid%20%233b599e%3B%0A%09overflow%3A%20hidden%3B%0A%09filter%3A%20progid%3ADXImageTransform.Microsoft.gradient(startColorstr%3D%27%23315d8c%27%2C%20endColorstr%3D%27%2384aace%27)%3B%0A%7D%0A%3C%2Fstyle%3E%0A%3Cdiv%20class%3D%22dvbs_container%22%20style%3D%22width%3A%20"+
c.AdWidth+"px%3B%20height%3A%20"+c.AdHeight+"px%3B%22%3E%09%0A%3C%2Fdiv%3E"))}}}function M(e){var a=null,h=null,c;var d=e.src,b=dv_GetParam(d,"cmp"),d=dv_GetParam(d,"ctx");c="919838"==d&&"7951767"==b||"919839"==d&&"7939985"==b||"971108"==d&&"7900229"==b||"971108"==d&&"7951940"==b?"</scr'+'ipt>":/<\/scr\+ipt>/g;"function"!==typeof String.prototype.trim&&(String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")});var n=function(b){if((b=b.previousSibling)&&"#text"==b.nodeName&&(null==b.nodeValue||
void 0==b.nodeValue||0==b.nodeValue.trim().length))b=b.previousSibling;if(b&&"SCRIPT"==b.tagName&&b.getAttribute("type")&&("text/adtag"==b.getAttribute("type").toLowerCase()||"text/passback"==b.getAttribute("type").toLowerCase())&&""!=b.innerHTML.trim()){if("text/adtag"==b.getAttribute("type").toLowerCase())return a=b.innerHTML.replace(c,"<\/script>"),{isBadImp:!1,hasPassback:!1,tagAdTag:a,tagPassback:h};if(null!=h)return{isBadImp:!0,hasPassback:!1,tagAdTag:a,tagPassback:h};h=b.innerHTML.replace(c,
"<\/script>");b=n(b);b.hasPassback=!0;return b}return{isBadImp:!0,hasPassback:!1,tagAdTag:a,tagPassback:h}};return n(e)}function D(e,a,h,c,d,b,n,k,u){var g,i,f;void 0==a.dvregion&&(a.dvregion=0);var s,t,F;try{f=c;for(i=0;10>i&&f!=window._dv_win.top;)i++,f=f.parent;c.depth=i;g=N(c);s="&aUrl="+encodeURIComponent(g.url);t="&aUrlD="+g.depth;F=c.depth+d;b&&c.depth--}catch(j){t=s=F=c.depth=""}void 0!=a.aUrl&&(s="&aUrl="+a.aUrl);d=a.script.src;b="&ctx="+(dv_GetParam(d,"ctx")||"")+"&cmp="+(dv_GetParam(d,
"cmp")||"")+"&plc="+(dv_GetParam(d,"plc")||"")+"&sid="+(dv_GetParam(d,"sid")||"")+"&advid="+(dv_GetParam(d,"advid")||"")+"&adsrv="+(dv_GetParam(d,"adsrv")||"")+"&unit="+(dv_GetParam(d,"unit")||"")+"&uid="+a.uid+"&tagtype="+(dv_GetParam(d,"tagtype")||"")+"&adID="+(dv_GetParam(d,"adID")||"")+"&app="+(dv_GetParam(d,"app")||"")+"&sup="+(dv_GetParam(d,"sup")||"");(f=dv_GetParam(d,"xff"))&&(b+="&xff="+f);(f=dv_GetParam(d,"useragent"))&&(b+="&useragent="+f);if(void 0!=window._dv_win.$dvbs.CommonData.BrowserId&&
void 0!=window._dv_win.$dvbs.CommonData.BrowserVersion&&void 0!=window._dv_win.$dvbs.CommonData.BrowserIdFromUserAgent)g=window._dv_win.$dvbs.CommonData.BrowserId,i=window._dv_win.$dvbs.CommonData.BrowserVersion,f=window._dv_win.$dvbs.CommonData.BrowserIdFromUserAgent;else{var p=f?decodeURIComponent(f):navigator.userAgent;g=[{id:4,brRegex:"OPR|Opera",verRegex:"(OPR/|Version/)"},{id:1,brRegex:"MSIE|Trident/7.*rv:11|rv:11.*Trident/7|Edge/",verRegex:"(MSIE |rv:| Edge/)"},{id:2,brRegex:"Firefox",verRegex:"Firefox/"},
{id:0,brRegex:"Mozilla.*Android.*AppleWebKit(?!.*Chrome.*)|Linux.*Android.*AppleWebKit.* Version/.*Chrome",verRegex:null},{id:0,brRegex:"AOL/.*AOLBuild/|AOLBuild/.*AOL/|Puffin|Maxthon|Valve|Silk|PLAYSTATION|PlayStation|Nintendo|wOSBrowser",verRegex:null},{id:3,brRegex:"Chrome",verRegex:"Chrome/"},{id:5,brRegex:"Safari|(OS |OS X )[0-9].*AppleWebKit",verRegex:"Version/"}];f=0;i="";for(var m=0;m<g.length;m++)if(null!=p.match(RegExp(g[m].brRegex))){f=g[m].id;if(null==g[m].verRegex)break;p=p.match(RegExp(g[m].verRegex+
"[0-9]*"));null!=p&&(i=p[0].match(RegExp(g[m].verRegex)),i=p[0].replace(i[0],""));break}g=m=O();i=m===f?i:"";window._dv_win.$dvbs.CommonData.BrowserId=g;window._dv_win.$dvbs.CommonData.BrowserVersion=i;window._dv_win.$dvbs.CommonData.BrowserIdFromUserAgent=f}b+="&brid="+g+"&brver="+i+"&bridua="+f;(f=dv_GetParam(d,"turl"))&&(b+="&turl="+f);(f=dv_GetParam(d,"tagformat"))&&(b+="&tagformat="+f);f="";try{var q=window._dv_win.parent;f+="&chro="+(void 0===q.chrome?"0":"1");f+="&hist="+(q.history?q.history.length:
"");f+="&winh="+q.innerHeight;f+="&winw="+q.innerWidth;f+="&wouh="+q.outerHeight;f+="&wouw="+q.outerWidth;q.screen&&(f+="&scah="+q.screen.availHeight,f+="&scaw="+q.screen.availWidth)}catch(I){}var b=b+f,E;q=function(){try{return!!window.sessionStorage}catch(a){return!0}};f=function(){try{return!!window.localStorage}catch(a){return!0}};i=function(){var a=document.createElement("canvas");if(a.getContext&&a.getContext("2d")){var b=a.getContext("2d");b.textBaseline="top";b.font="14px 'Arial'";b.textBaseline=
"alphabetic";b.fillStyle="#f60";b.fillRect(0,0,62,20);b.fillStyle="#069";b.fillText("!image!",2,15);b.fillStyle="rgba(102, 204, 0, 0.7)";b.fillText("!image!",4,17);return a.toDataURL()}return null};try{g=[];g.push(["lang",navigator.language||navigator.browserLanguage]);g.push(["tz",(new Date).getTimezoneOffset()]);g.push(["hss",q()?"1":"0"]);g.push(["hls",f()?"1":"0"]);g.push(["odb",typeof window.openDatabase||""]);g.push(["cpu",navigator.cpuClass||""]);g.push(["pf",navigator.platform||""]);g.push(["dnt",
navigator.doNotTrack||""]);g.push(["canv",i()]);var r=g.join("=!!!=");if(null==r||""==r)E="";else{q=function(a){for(var b="",c,d=7;0<=d;d--)c=a>>>4*d&15,b+=c.toString(16);return b};f=[1518500249,1859775393,2400959708,3395469782];var r=r+String.fromCharCode(128),z=Math.ceil((r.length/4+2)/16),A=Array(z);for(i=0;i<z;i++){A[i]=Array(16);for(g=0;16>g;g++)A[i][g]=r.charCodeAt(64*i+4*g)<<24|r.charCodeAt(64*i+4*g+1)<<16|r.charCodeAt(64*i+4*g+2)<<8|r.charCodeAt(64*i+4*g+3)}A[z-1][14]=8*(r.length-1)/Math.pow(2,
32);A[z-1][14]=Math.floor(A[z-1][14]);A[z-1][15]=8*(r.length-1)&4294967295;r=1732584193;g=4023233417;var m=2562383102,p=271733878,G=3285377520,v=Array(80),B,w,x,y,H;for(i=0;i<z;i++){for(var l=0;16>l;l++)v[l]=A[i][l];for(l=16;80>l;l++)v[l]=(v[l-3]^v[l-8]^v[l-14]^v[l-16])<<1|(v[l-3]^v[l-8]^v[l-14]^v[l-16])>>>31;B=r;w=g;x=m;y=p;H=G;for(l=0;80>l;l++){var D=Math.floor(l/20),J=B<<5|B>>>27,C;c:{switch(D){case 0:C=w&x^~w&y;break c;case 1:C=w^x^y;break c;case 2:C=w&x^w&y^x&y;break c;case 3:C=w^x^y;break c}C=
void 0}var K=J+C+H+f[D]+v[l]&4294967295;H=y;y=x;x=w<<30|w>>>2;w=B;B=K}r=r+B&4294967295;g=g+w&4294967295;m=m+x&4294967295;p=p+y&4294967295;G=G+H&4294967295}E=q(r)+q(g)+q(m)+q(p)+q(G)}}catch(M){E=null}a=(window._dv_win.dv_config.verifyJSURL||a.protocol+"//"+(window._dv_win.dv_config.bsAddress||"rtb"+a.dvregion+".doubleverify.com")+"/verify.js")+"?jsCallback="+a.callbackName+"&jsTagObjCallback="+a.tagObjectCallbackName+"&num=6"+b+"&srcurlD="+c.depth+"&ssl="+a.ssl+"&refD="+F+a.tagIntegrityFlag+a.tagHasPassbackFlag+
"&htmlmsging="+(n?"1":"0")+(null!=E?"&aadid="+E:"");(c=dv_GetDynamicParams(d).join("&"))&&(a+="&"+c);if(!1===k||u)a=a+("&dvp_isBodyExistOnLoad="+(k?"1":"0"))+("&dvp_isOnHead="+(u?"1":"0"));h="srcurl="+encodeURIComponent(h);if((k=window._dv_win[L("=@42E:@?")][L("2?46DE@C~C:8:?D")])&&0<k.length){u=[];u[0]=window._dv_win.location.protocol+"//"+window._dv_win.location.hostname;for(c=0;c<k.length;c++)u[c+1]=k[c];k=u.reverse().join(",")}else k=null;k&&(h+="&ancChain="+encodeURIComponent(k));k=4E3;/MSIE (\d+\.\d+);/.test(navigator.userAgent)&&
7>=new Number(RegExp.$1)&&(k=2E3);if(d=dv_GetParam(d,"referrer"))d="&referrer="+d,a.length+d.length<=k&&(a+=d);s.length+t.length+a.length<=k&&(a+=t,h+=s);s=P();a+="&vavbkt="+s.vdcd;a+="&lvvn="+s.vdcv;"prerender"===window._dv_win.document.visibilityState&&(a+="&prndr=1");return a+="&eparams="+encodeURIComponent(L(h))+"&"+e.getVersionParamName()+"="+e.getVersion()}function P(){try{return{vdcv:8,vdcd:eval(function(a,e,c,d,b,n){b=function(a){return(a<e?"":b(parseInt(a/e)))+(35<(a%=e)?String.fromCharCode(a+
29):a.toString(36))};if(!"".replace(/^/,String)){for(;c--;)n[b(c)]=d[c]||b(c);d=[function(a){return n[a]}];b=function(){return"\\w+"};c=1}for(;c--;)d[c]&&(a=a.replace(RegExp("\\b"+b(c)+"\\b","g"),d[c]));return a}("(v(){1i{m Q=[1h];1i{m 6=1h;2n(6!=6.1Q&&6.1k.2i.2h){Q.1l(6.1k);6=6.1k}}1f(e){}v 1m(H){1i{W(m i=0;i<Q.1j;i++){11(H(Q[i]))b Q[i]==1h.1Q?-1:1}b 0}1f(e){b 1g}}v 1G(K){b 1m(v(6){b 6[K]!=1g})}v 3i(6,1E,H){W(m K 2F 6){11(K.1N(1E)>-1&&(!H||H(6[K])))b 3x}b 2R}v g(s){m h=\"\",t=\"36.;j&38}3d/0:31'32=B(30-2Z!,2X)2Y\\\\{ >33+34\\\"39<\";W(i=0;i<s.1j;i++)f=s.1R(i),e=t.1N(f),0<=e&&(f=t.1R((e+41)%37)),h+=f;b h}m c=['35\"18-2W\"2V\"2K','p','l','2L&p','p','{','-5,!u<}\"2J}\"','p','J','-2I}\"<2G','p','=o',':<2H}T}<\"','p','h','\\\\<}4-2}\"E(d\"G}8?\\\\<}4-2}\"E(d\"1w<N\"[1d*1t\\\\\\\\1s-2N<1r\"1n\"2O]V}C\"O','e','2T','\"1o\\\\<}1u\"I<-2U\"1p\"5\"2S}1x<}2P\"1o\\\\<}10}1a>19-13}2}\"1p\"5\"2Q}1x<}3a','e','=J','17}U\"<5}3b\"y}F\\\\<}[3v}3w:3u]9}7\\\\<}[t:1P\"3t]9}7\\\\<}[3r})5-u<}t]9}7\\\\<}[3s]9}7\\\\<}[3y}3C]9}3B','e','3z',':3A}<\"D-3q/2M','p','3p','\\\\<}w<U/X}7\\\\<}w<U/!9}8','e','=l','\\\\<}1q!3g\\\\<}1q!3h)p?\"k','e','3f','3e:,','p','3c','17}U\"<5}1S:3j\\\\<}4-2}\"3o\".42-2}\"3n-3m<N\"3k<3l<3E}C\"3H<2B<23[<]E\"27\"18}\"2}\"1W[<]E\"27\"18}\"2}\"E<}1e&1U\"1\\\\<}14\\\\1X\\\\<}14\\\\10}1a>19-13}2}\"z<26-2}\"22\"2.42-2}\"1Z=20\"y}24\"y}P=25','e','x','1Y)','p','+','\\\\<}1y)u\"28\\\\<}1y)u\"1V?\"k','e','21','\\\\<}4-2}\"E(d\"G}8?\\\\<}4-2}\"E(d\"2E<:[\\\\2v}}2M][\\\\2u,5}2]2t}C\"O','e','2q',':2r<Z','p','2w','\\\\<}E\"2x\\\\<}E\"2C-29?\"k','e','2A','1D\\\\<}2y:,2z}U\"<5}2p\"y}2o<2e<2g}2d','e','2c','\\\\<}w<U/2a&1K\"E/1O\\\\<}w<U/2b}C\"1T\\\\<}w<U/f[&1K\"E/1O\\\\<}w<U/2m[S]]1u\"2l}8?\"k','e','2j','2k}3D}43>2s','p','4Y','\\\\<}16:<15}s<55}7\\\\<}16:<15}s<4U<}f\"u}1I\\\\<}1J\\\\<}16:<15}s<C[S]E:1P\"X}8','e','l{','4G\\'<}14\\\\T}4B','p','==','\\\\<}E\"2f\"4A\\\\<}4H<4I?\"k','e','o{',' &D)&4K','p','4F','\\\\<}E.:2}\"c\"<4M}7\\\\<}4L}7\\\\<}4J<}f\"u}1I\\\\<}1J\\\\<}10:}\"9}8','e','3F','\\\\<}4-2}\"E(d\"G}8?\\\\<}4-2}\"E(d\"1w<N\"[1d*1t\\\\\\\\1s-1r\"1n/4O<4S]V}C\"O','e','4R',')4Q!4P}s<C','p','4z','\\\\<}1z.L>g;D\\'T)Y.4y\\\\<}1z.L>g;4x&&4C>D\\'T)Y.I?\"k','e','l=','D:<Z<:5','p','4E','\\\\<}9\\\\<}E\"4D\\\\<}n\"<5}1v\"1F}/1B\\\\<}4-2}\"1M<}1e&4T\\\\<}n\"<5}1c\"}u-54=?17}U\"<5}1S\"51\"y}52\\\\<}4Z}\"n\"<5}50\"4X\"y}F\"4V','e','4W','53-N:4v','p','3X','\\\\<}1b\"3W\\\\<}1b\"3V\"<5}3U\\\\<}1b\"3Y||\\\\<}3Z?\"k','e','h+','\\\\<}n\"<5}1c\"}u-45\\\\<}10}1a>19-13}2}\"q\\\\<}n\"<5}1c\"}u-2D','e','=S','c>A','p','=','\\\\<}4-2}\"E(d\"G}8?\\\\<}4-2}\"E(d\"1A<:[<Z*1t:Z,1C]F:<44[<Z*4w]V}C\"O','e','h=','40-2}\"n\"<5}9}8','e','3T','\\\\<}4-2}\"E(d\"G}8?\\\\<}4-2}\"E(d\"1A<:[<Z*3S}1C]R<-C[1d*3L]V}C\"O','e','3K','1D\\\\<}1H\"\\\\3J\\\\<}1H\"\\\\3G','e','3I','\\\\<}3M}Z<}3N}7\\\\<}3R<f\"9}7\\\\<}3Q/<}C!!3P<\"42.42-2}\"X}7\\\\<}3O\"<5}9}8?\"k','e','46','T>;47\"<4f','p','h{','\\\\<}4o\\\\<}4n}<(4m?\"k','e','4l','\\\\<}4p<4q a}4u}7\\\\<}E}4t\"4s 4r- X}8','e','4k','4j\\\\<}n\"<5}4b}4a\"49&M<C<}48}C\"1T\\\\<}n\"<5}1v\"1F}/1B\\\\<}4-2}\"4c\\\\<}4-2}\"1M<}1e&4d[S]4i=?\"k','e','l+'];m 12=[];W(m j=0;j<c.1j;j+=3){m r=c[j+1]=='p'?1G(g(c[j])):1m(v(6){b 4h(g(c[j]))});11(r>0||r<0)12.1l(r*1L(g(c[j+2])));4g 11(r==1g)12.1l(-4e*1L(g(c[j+2])))}b 12}1f(e){b[-4N]}})();",
62,316,"    EZ5Ua  win a44OO a44 P1  return  a2MQ0242U       Ma2vsu4f2  var E45Uu        function EBM  aM     _   5ML44P1 func   prop    3RSvsu4f2  wins     WDE42 for fP1   E2 if results N5 Z5 ZU5 E_ qsa g5 Tg5 U5Z2c EuZ E35f fMU Z27 catch null window try length parent push ch MuU QN25sF ENM5 E_Y kN7 BuZfEU5  Ef2 E3M2sP1tuB5a 5ML44qWfUM Z2s EufB EcIT_0 5ML44qWZ tOO _t U5q str vB4u ex zt__ U25sF ELMMuQOO BV2U parseInt EM2s2MM2ME indexOf 2Qfq uf top charAt qD8 3RSOO sqt ujuM OO2 E2fUuN2z21 Ld0 tDRm DM2 oo EUM2u sq2 PSHM2 HnDqD 1Z5Ua  u_Z2U5Z2OO NTZ fOO fDE42 lJ a44nD f32M_faB  ZP1 href location ox M2 aNP1 fD while F5ENaB4 q5D8M2 eS u_faB  tDE42 Um UmBu hJ UIuCTZOO zt_M tzsa oJ 99D UT  5ML44qtZ in u4f ZBu fgM2Z2 g5a Q42 60  kUM EVft 2ZtOO QN2P1ta false QN211ta eo 25a 2Z0 Na LnG 5r uic2EHVO Q6T s7 Kt NhCZ lkSvfxWX C2 Ue 82 PzA 1bqyJIma 2Zt qD8M2 he YDoMw8FRp3gd94 _M lS AOO AEBuf2g co uMF21 tDHs5Mq 1SH 2qtfUM fbQIuCpu EC2 ho uM tUZ tUBt r5Z2t 24t tf5a ZA2 true tB ee u_a a44nDqD LMMt 5IMu i2E42 ll B_UB_tD  lh B__tDOOU5q oe 1tNk4CEN3Nt E4u CcM4P1 Eu445Uu gI ENuM Ef2A 1tB2uU5 eh OOq CfEf2U CfOO le CfE35aMfUuN E35aMfUuND Z5Ua   fY45 Z25 2P1 lo _c fzuOOuE42 5M U2f Eu EM2s2MM2MOO squ 100  else eval D11m u1 lx ol a2TZ E_NUCEYp_c E_NUCOO EUuU 4Zf M5 5M2f _f UP1 _ZBf 1tfMmN4uQ2Mt _I IOO oh fNNOO s5 AbL 5NOO hh hl UufUuZ2 E0N2U u4buf2Jl ErF rLTp ErP1 4P1 999 kZ 4Qg5 2u4 eJ fN4uQLZfEVft sq CF Ma2nnDqDvsu4f2 oS U3q2D8M2 hx ENuM2 E3M2szsu4f2nUu MQ8M2 FN1 ___U 2DRm CP1".split(" "),
0,{}))}}catch(e){return{vdcv:8,vdcd:"0"}}}function N(e){try{if(1>=e.depth)return{url:"",depth:""};var a,h=[];h.push({win:window._dv_win.top,depth:0});for(var c,d=1,b=0;0<d&&100>b;){try{if(b++,c=h.shift(),d--,0<c.win.location.toString().length&&c.win!=e)return 0==c.win.document.referrer.length||0==c.depth?{url:c.win.location,depth:c.depth}:{url:c.win.document.referrer,depth:c.depth-1}}catch(n){}a=c.win.frames.length;for(var k=0;k<a;k++)h.push({win:c.win.frames[k],depth:c.depth+1}),d++}return{url:"",
depth:""}}catch(u){return{url:"",depth:""}}}function L(e){new String;var a=new String,h,c,d;for(h=0;h<e.length;h++)d=e.charAt(h),c="!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~".indexOf(d),0<=c&&(d="!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~".charAt((c+47)%94)),a+=d;return a}function I(){return Math.floor(1E12*(Math.random()+""))}function O(){try{if("function"===typeof window.callPhantom)return 99;
try{if("function"===typeof window.top.callPhantom)return 99}catch(e){}if(void 0!=window.opera&&void 0!=window.history.navigationMode||void 0!=window.opr&&void 0!=window.opr.addons&&"function"==typeof window.opr.addons.installExtension)return 4;if(void 0!=window.chrome&&"function"==typeof window.chrome.csi&&"function"==typeof window.chrome.loadTimes&&void 0!=document.webkitHidden&&(!0==document.webkitHidden||!1==document.webkitHidden))return 3;if(void 0!=window.mozInnerScreenY&&"number"==typeof window.mozInnerScreenY&&
void 0!=window.mozPaintCount&&0<=window.mozPaintCount&&void 0!=window.InstallTrigger&&void 0!=window.InstallTrigger.install)return 2;if(void 0!=document.uniqueID&&"string"==typeof document.uniqueID&&(void 0!=document.documentMode&&0<=document.documentMode||void 0!=document.all&&"object"==typeof document.all||void 0!=window.ActiveXObject&&"function"==typeof window.ActiveXObject)||window.document&&window.document.updateSettings&&"function"==typeof window.document.updateSettings)return 1;var a=!1;try{var h=
document.createElement("p");h.innerText=".";h.style="text-shadow: rgb(99, 116, 171) 20px -12px 2px";a=void 0!=h.style.textShadow}catch(c){}return 0<Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor")&&a&&void 0!=window.innerWidth&&void 0!=window.innerHeight?5:0}catch(d){return 0}}this.createRequest=function(){this.perf&&this.perf.addTime("r3");var e=!1,a=window._dv_win,h=0,c=!1;try{for(dv_i=0;10>=dv_i;dv_i++)if(null!=a.parent&&a.parent!=a)if(0<a.parent.location.toString().length)a=
a.parent,h++,e=!0;else{e=!1;break}else{0==dv_i&&(e=!0);break}}catch(d){e=!1}0==a.document.referrer.length?e=a.location:e?e=a.location:(e=a.document.referrer,c=!0);window._dv_win._dvScripts||(window._dv_win._dvScripts=[]);var b=document.getElementsByTagName("script");this.dvScripts=[];this.dvOther=this.dvStep=0;for(dv_i in b)if(b[dv_i].src){var n=b[dv_i].src,k=window._dv_win.dv_config.bs_regex||/\.doubleverify\.com:?[0-9]*\/dvbs_src\.js/;if(n&&n.match(k)&&!dv_Contains(window._dv_win._dvScripts,b[dv_i])){this.dvStep=
1;this.dv_script=b[dv_i];window._dv_win._dvScripts.push(b[dv_i]);var u;u=window._dv_win.dv_config?window._dv_win.dv_config.bst2tid?window._dv_win.dv_config.bst2tid:window._dv_win.dv_config.dv_GetRnd?window._dv_win.dv_config.dv_GetRnd():I():I();var g,k=window.parent.postMessage&&window.JSON,i=!0,f=!1;if("0"==dv_GetParam(n,"t2te")||window._dv_win.dv_config&&!0==window._dv_win.dv_config.supressT2T)f=!0;if(k&&!1==f)try{var s=window._dv_win.dv_config.bst2turl||"https://cdn3.doubleverify.com/bst2tv3.html",
f="bst2t_"+u,t=void 0;if(document.createElement&&(t=document.createElement("iframe")))t.name=t.id=window._dv_win.dv_config.emptyIframeID||"iframe_"+I(),t.width=0,t.height=0,t.id=f,t.style.display="none",t.src=s;g=t;i=J(g)}catch(F){}var j;g=n;s={};try{for(var p=RegExp("[\\?&]([^&]*)=([^&#]*)","gi"),m=p.exec(g);null!=m;)"eparams"!==m[1]&&(s[m[1]]=m[2]),m=p.exec(g);j=s}catch(q){j=s}j.perf=this.perf;j.uid=u;j.script=this.dv_script;j.callbackName="__verify_callback_"+j.uid;j.tagObjectCallbackName="__tagObject_callback_"+
j.uid;j.tagAdtag=null;j.tagPassback=null;j.tagIntegrityFlag="";j.tagHasPassbackFlag="";!1==(null!=j.tagformat&&"2"==j.tagformat)&&(p=M(j.script),j.tagAdtag=p.tagAdTag,j.tagPassback=p.tagPassback,p.isBadImp?j.tagIntegrityFlag="&isbadimp=1":p.hasPassback&&(j.tagHasPassbackFlag="&tagpb=1"));j.protocol="http:";j.ssl="0";"https"==j.script.src.match("^https")&&"https"==window._dv_win.location.toString().match("^https")&&(j.protocol="https:",j.ssl="1");this.dvStep=2;K(j);this.perf&&this.perf.addTime("r4");
b=b[dv_i]&&b[dv_i].parentElement&&b[dv_i].parentElement.tagName&&"HEAD"===b[dv_i].parentElement.tagName;this.dvStep=3;return D(this,j,e,a,h,c,k,i,b)}this.dvOther++;n&&n.match(/dvbs_src\.js/)&&(k=dv_Contains(window._dv_win._dvScripts,b[dv_i])?1:0,this.dvScripts.push({src:n,isContain:k}))}};this.sendRequest=function(e){this.perf&&this.perf.addTime("r5");var a=dv_GetParam(e,"tagformat");a&&"2"==a?$dvbs.domUtilities.addScriptResource(e,document.body):dv_sendScriptRequest(e);this.perf&&this.perf.addTime("r6");
return!0};this.isApplicable=function(){return!0};this.onFailure=function(){var e=window._dv_win._dvScripts,a=this.dv_script;null!=e&&(void 0!=e&&a)&&(a=e.indexOf(a),-1!=a&&e.splice(a,1))};window.debugScript&&(window.CreateUrl=D);this.getVersionParamName=function(){return"ver"};this.getVersion=function(){return"36"}};


function dv_baseHandler(){function J(e){if(window._dv_win.document.body)return window._dv_win.document.body.insertBefore(e,window._dv_win.document.body.firstChild),!0;var a=0,h=function(){if(window._dv_win.document.body)try{window._dv_win.document.body.insertBefore(e,window._dv_win.document.body.firstChild)}catch(c){}else a++,150>a&&setTimeout(h,20)};setTimeout(h,20);return!1}function K(e){var a,h=window._dv_win.document.visibilityState;window[e.tagObjectCallbackName]=function(c){if(window._dv_win.$dvbs){var d=
"https"==window._dv_win.location.toString().match("^https")?"https:":"http:";a=c.ImpressionID;window._dv_win.$dvbs.tags.add(c.ImpressionID,e);window._dv_win.$dvbs.tags[c.ImpressionID].set({tagElement:e.script,impressionId:c.ImpressionID,dv_protocol:e.protocol,protocol:d,uid:e.uid,serverPublicDns:c.ServerPublicDns,ServerPublicDns:c.ServerPublicDns});if("prerender"===h)if("prerender"!==window._dv_win.document.visibilityState&&"unloaded"!==visibilityStateLocal)window._dv_win.$dvbs.registerEventCall(c.ImpressionID,
{prndr:0});else{var b;"undefined"!==typeof window._dv_win.document.hidden?b="visibilitychange":"undefined"!==typeof window._dv_win.document.mozHidden?b="mozvisibilitychange":"undefined"!==typeof window._dv_win.document.msHidden?b="msvisibilitychange":"undefined"!==typeof window._dv_win.document.webkitHidden&&(b="webkitvisibilitychange");var n=function(){var a=window._dv_win.document.visibilityState;"prerender"===h&&("prerender"!==a&&"unloaded"!==a)&&(h=a,window._dv_win.$dvbs.registerEventCall(c.ImpressionID,
{prndr:0}),window._dv_win.document.removeEventListener(b,n))};window._dv_win.document.addEventListener(b,n,!1)}}};window[e.callbackName]=function(c){var d;d=window._dv_win.$dvbs&&"object"==typeof window._dv_win.$dvbs.tags[a]?window._dv_win.$dvbs.tags[a]:e;e.perf&&e.perf.addTime("r7");var b=window._dv_win.dv_config.bs_renderingMethod||function(a){document.write(a)};switch(c.ResultID){case 1:d.tagPassback?b(d.tagPassback):c.Passback?b(decodeURIComponent(c.Passback)):c.AdWidth&&c.AdHeight&&b(decodeURIComponent("%3Cstyle%3E%0A.dvbs_container%20%7B%0A%09border%3A%201px%20solid%20%233b599e%3B%0A%09overflow%3A%20hidden%3B%0A%09filter%3A%20progid%3ADXImageTransform.Microsoft.gradient(startColorstr%3D%27%23315d8c%27%2C%20endColorstr%3D%27%2384aace%27)%3B%0A%09%2F*%20for%20IE%20*%2F%0A%09background%3A%20-webkit-gradient(linear%2C%20left%20top%2C%20left%20bottom%2C%20from(%23315d8c)%2C%20to(%2384aace))%3B%0A%09%2F*%20for%20webkit%20browsers%20*%2F%0A%09background%3A%20-moz-linear-gradient(top%2C%20%23315d8c%2C%20%2384aace)%3B%0A%09%2F*%20for%20firefox%203.6%2B%20*%2F%0A%7D%0A.dvbs_cloud%20%7B%0A%09color%3A%20%23fff%3B%0A%09position%3A%20relative%3B%0A%09font%3A%20100%25%22Times%20New%20Roman%22%2C%20Times%2C%20serif%3B%0A%09text-shadow%3A%200px%200px%2010px%20%23fff%3B%0A%09line-height%3A%200%3B%0A%7D%0A%3C%2Fstyle%3E%0A%3Cscript%20type%3D%22text%2Fjavascript%22%3E%0A%09function%0A%20%20%20%20cloud()%7B%0A%09%09var%20b1%20%3D%20%22%3Cdiv%20class%3D%5C%22dvbs_cloud%5C%22%20style%3D%5C%22font-size%3A%22%3B%0A%09%09var%20b2%3D%22px%3B%20position%3A%20absolute%3B%20top%3A%20%22%3B%0A%09%09document.write(b1%20%2B%20%22300px%3B%20width%3A%20300px%3B%20height%3A%20300%22%20%2B%20b2%20%2B%20%2234px%3B%20left%3A%2028px%3B%5C%22%3E.%3C%5C%2Fdiv%3E%22)%3B%0A%09%09document.write(b1%20%2B%20%22300px%3B%20width%3A%20300px%3B%20height%3A%20300%22%20%2B%20b2%20%2B%20%2246px%3B%20left%3A%2010px%3B%5C%22%3E.%3C%5C%2Fdiv%3E%22)%3B%0A%09%09document.write(b1%20%2B%20%22300px%3B%20width%3A%20300px%3B%20height%3A%20300%22%20%2B%20b2%20%2B%20%2246px%3B%20left%3A50px%3B%5C%22%3E.%3C%5C%2Fdiv%3E%22)%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%0A%09%09document.write(b1%20%2B%20%22400px%3B%20width%3A%20400px%3B%20height%3A%20400%22%20%2B%20b2%20%2B%20%2224px%3B%20left%3A20px%3B%5C%22%3E.%3C%5C%2Fdiv%3E%22)%3B%0A%20%20%20%20%7D%0A%20%20%20%20%0A%09function%20clouds()%7B%0A%20%20%20%20%20%20%20%20var%20top%20%3D%20%5B%27-80%27%2C%2780%27%2C%27240%27%2C%27400%27%5D%3B%0A%09%09var%20left%20%3D%20-10%3B%0A%20%20%20%20%20%20%20%20var%20a1%20%3D%20%22%3Cdiv%20style%3D%5C%22position%3A%20relative%3B%20top%3A%20%22%3B%0A%09%09var%20a2%20%3D%20%22px%3B%20left%3A%20%22%3B%0A%20%20%20%20%20%20%20%20var%20a3%3D%20%22px%3B%5C%22%3E%3Cscr%22%2B%22ipt%20type%3D%5C%22text%5C%2Fjavascr%22%2B%22ipt%5C%22%3Ecloud()%3B%3C%5C%2Fscr%22%2B%22ipt%3E%3C%5C%2Fdiv%3E%22%3B%0A%20%20%20%20%20%20%20%20for(i%3D0%3B%20i%20%3C%208%3B%20i%2B%2B)%20%7B%0A%09%09%09document.write(a1%2Btop%5B0%5D%2Ba2%2Bleft%2Ba3)%3B%0A%09%09%09document.write(a1%2Btop%5B1%5D%2Ba2%2Bleft%2Ba3)%3B%0A%09%09%09document.write(a1%2Btop%5B2%5D%2Ba2%2Bleft%2Ba3)%3B%0A%09%09%09document.write(a1%2Btop%5B3%5D%2Ba2%2Bleft%2Ba3)%3B%0A%09%09%09if(i%3D%3D4)%0A%09%09%09%7B%0A%09%09%09%09left%20%3D-%2090%3B%0A%09%09%09%09top%20%3D%20%5B%270%27%2C%27160%27%2C%27320%27%2C%27480%27%5D%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20else%20%0A%09%09%09%09left%20%2B%3D%20160%3B%0A%09%09%7D%0A%09%7D%0A%0A%3C%2Fscript%3E%0A%3Cdiv%20class%3D%22dvbs_container%22%20style%3D%22width%3A%20"+
c.AdWidth+"px%3B%20height%3A%20"+c.AdHeight+"px%3B%22%3E%0A%09%3Cscript%20type%3D%22text%2Fjavascript%22%3Eclouds()%3B%3C%2Fscript%3E%0A%3C%2Fdiv%3E"));break;case 2:case 3:d.tagAdtag&&b(d.tagAdtag);break;case 4:c.AdWidth&&c.AdHeight&&b(decodeURIComponent("%3Cstyle%3E%0A.dvbs_container%20%7B%0A%09border%3A%201px%20solid%20%233b599e%3B%0A%09overflow%3A%20hidden%3B%0A%09filter%3A%20progid%3ADXImageTransform.Microsoft.gradient(startColorstr%3D%27%23315d8c%27%2C%20endColorstr%3D%27%2384aace%27)%3B%0A%7D%0A%3C%2Fstyle%3E%0A%3Cdiv%20class%3D%22dvbs_container%22%20style%3D%22width%3A%20"+
c.AdWidth+"px%3B%20height%3A%20"+c.AdHeight+"px%3B%22%3E%09%0A%3C%2Fdiv%3E"))}}}function M(e){var a=null,h=null,c;var d=e.src,b=dv_GetParam(d,"cmp"),d=dv_GetParam(d,"ctx");c="919838"==d&&"7951767"==b||"919839"==d&&"7939985"==b||"971108"==d&&"7900229"==b||"971108"==d&&"7951940"==b?"</scr'+'ipt>":/<\/scr\+ipt>/g;"function"!==typeof String.prototype.trim&&(String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")});var n=function(b){if((b=b.previousSibling)&&"#text"==b.nodeName&&(null==b.nodeValue||
void 0==b.nodeValue||0==b.nodeValue.trim().length))b=b.previousSibling;if(b&&"SCRIPT"==b.tagName&&b.getAttribute("type")&&("text/adtag"==b.getAttribute("type").toLowerCase()||"text/passback"==b.getAttribute("type").toLowerCase())&&""!=b.innerHTML.trim()){if("text/adtag"==b.getAttribute("type").toLowerCase())return a=b.innerHTML.replace(c,"<\/script>"),{isBadImp:!1,hasPassback:!1,tagAdTag:a,tagPassback:h};if(null!=h)return{isBadImp:!0,hasPassback:!1,tagAdTag:a,tagPassback:h};h=b.innerHTML.replace(c,
"<\/script>");b=n(b);b.hasPassback=!0;return b}return{isBadImp:!0,hasPassback:!1,tagAdTag:a,tagPassback:h}};return n(e)}function D(e,a,h,c,d,b,n,k,u){var g,i,f;void 0==a.dvregion&&(a.dvregion=0);var s,t,F;try{f=c;for(i=0;10>i&&f!=window._dv_win.top;)i++,f=f.parent;c.depth=i;g=N(c);s="&aUrl="+encodeURIComponent(g.url);t="&aUrlD="+g.depth;F=c.depth+d;b&&c.depth--}catch(j){t=s=F=c.depth=""}void 0!=a.aUrl&&(s="&aUrl="+a.aUrl);d=a.script.src;b="&ctx="+(dv_GetParam(d,"ctx")||"")+"&cmp="+(dv_GetParam(d,
"cmp")||"")+"&plc="+(dv_GetParam(d,"plc")||"")+"&sid="+(dv_GetParam(d,"sid")||"")+"&advid="+(dv_GetParam(d,"advid")||"")+"&adsrv="+(dv_GetParam(d,"adsrv")||"")+"&unit="+(dv_GetParam(d,"unit")||"")+"&uid="+a.uid+"&tagtype="+(dv_GetParam(d,"tagtype")||"")+"&adID="+(dv_GetParam(d,"adID")||"");(f=dv_GetParam(d,"xff"))&&(b+="&xff="+f);(f=dv_GetParam(d,"useragent"))&&(b+="&useragent="+f);if(void 0!=window._dv_win.$dvbs.CommonData.BrowserId&&void 0!=window._dv_win.$dvbs.CommonData.BrowserVersion&&void 0!=
window._dv_win.$dvbs.CommonData.BrowserIdFromUserAgent)g=window._dv_win.$dvbs.CommonData.BrowserId,i=window._dv_win.$dvbs.CommonData.BrowserVersion,f=window._dv_win.$dvbs.CommonData.BrowserIdFromUserAgent;else{var p=f?decodeURIComponent(f):navigator.userAgent;g=[{id:4,brRegex:"OPR|Opera",verRegex:"(OPR/|Version/)"},{id:1,brRegex:"MSIE|Trident/7.*rv:11|rv:11.*Trident/7|Edge/",verRegex:"(MSIE |rv:| Edge/)"},{id:2,brRegex:"Firefox",verRegex:"Firefox/"},{id:0,brRegex:"Mozilla.*Android.*AppleWebKit(?!.*Chrome.*)|Linux.*Android.*AppleWebKit.* Version/.*Chrome",
verRegex:null},{id:0,brRegex:"AOL/.*AOLBuild/|AOLBuild/.*AOL/|Puffin|Maxthon|Valve|Silk|PLAYSTATION|PlayStation|Nintendo|wOSBrowser",verRegex:null},{id:3,brRegex:"Chrome",verRegex:"Chrome/"},{id:5,brRegex:"Safari|(OS |OS X )[0-9].*AppleWebKit",verRegex:"Version/"}];f=0;i="";for(var m=0;m<g.length;m++)if(null!=p.match(RegExp(g[m].brRegex))){f=g[m].id;if(null==g[m].verRegex)break;p=p.match(RegExp(g[m].verRegex+"[0-9]*"));null!=p&&(i=p[0].match(RegExp(g[m].verRegex)),i=p[0].replace(i[0],""));break}g=
m=O();i=m===f?i:"";window._dv_win.$dvbs.CommonData.BrowserId=g;window._dv_win.$dvbs.CommonData.BrowserVersion=i;window._dv_win.$dvbs.CommonData.BrowserIdFromUserAgent=f}b+="&brid="+g+"&brver="+i+"&bridua="+f;(f=dv_GetParam(d,"turl"))&&(b+="&turl="+f);(f=dv_GetParam(d,"tagformat"))&&(b+="&tagformat="+f);f="";try{var q=window._dv_win.parent;f+="&chro="+(void 0===q.chrome?"0":"1");f+="&hist="+(q.history?q.history.length:"");f+="&winh="+q.innerHeight;f+="&winw="+q.innerWidth;f+="&wouh="+q.outerHeight;
f+="&wouw="+q.outerWidth;q.screen&&(f+="&scah="+q.screen.availHeight,f+="&scaw="+q.screen.availWidth)}catch(I){}var b=b+f,E;q=function(){try{return!!window.sessionStorage}catch(a){return!0}};f=function(){try{return!!window.localStorage}catch(a){return!0}};i=function(){var a=document.createElement("canvas");if(a.getContext&&a.getContext("2d")){var b=a.getContext("2d");b.textBaseline="top";b.font="14px 'Arial'";b.textBaseline="alphabetic";b.fillStyle="#f60";b.fillRect(0,0,62,20);b.fillStyle="#069";
b.fillText("!image!",2,15);b.fillStyle="rgba(102, 204, 0, 0.7)";b.fillText("!image!",4,17);return a.toDataURL()}return null};try{g=[];g.push(["lang",navigator.language||navigator.browserLanguage]);g.push(["tz",(new Date).getTimezoneOffset()]);g.push(["hss",q()?"1":"0"]);g.push(["hls",f()?"1":"0"]);g.push(["odb",typeof window.openDatabase||""]);g.push(["cpu",navigator.cpuClass||""]);g.push(["pf",navigator.platform||""]);g.push(["dnt",navigator.doNotTrack||""]);g.push(["canv",i()]);var r=g.join("=!!!=");
if(null==r||""==r)E="";else{q=function(a){for(var b="",c,d=7;0<=d;d--)c=a>>>4*d&15,b+=c.toString(16);return b};f=[1518500249,1859775393,2400959708,3395469782];var r=r+String.fromCharCode(128),z=Math.ceil((r.length/4+2)/16),A=Array(z);for(i=0;i<z;i++){A[i]=Array(16);for(g=0;16>g;g++)A[i][g]=r.charCodeAt(64*i+4*g)<<24|r.charCodeAt(64*i+4*g+1)<<16|r.charCodeAt(64*i+4*g+2)<<8|r.charCodeAt(64*i+4*g+3)}A[z-1][14]=8*(r.length-1)/Math.pow(2,32);A[z-1][14]=Math.floor(A[z-1][14]);A[z-1][15]=8*(r.length-1)&
4294967295;r=1732584193;g=4023233417;var m=2562383102,p=271733878,G=3285377520,v=Array(80),B,w,x,y,H;for(i=0;i<z;i++){for(var l=0;16>l;l++)v[l]=A[i][l];for(l=16;80>l;l++)v[l]=(v[l-3]^v[l-8]^v[l-14]^v[l-16])<<1|(v[l-3]^v[l-8]^v[l-14]^v[l-16])>>>31;B=r;w=g;x=m;y=p;H=G;for(l=0;80>l;l++){var D=Math.floor(l/20),J=B<<5|B>>>27,C;c:{switch(D){case 0:C=w&x^~w&y;break c;case 1:C=w^x^y;break c;case 2:C=w&x^w&y^x&y;break c;case 3:C=w^x^y;break c}C=void 0}var K=J+C+H+f[D]+v[l]&4294967295;H=y;y=x;x=w<<30|w>>>2;
w=B;B=K}r=r+B&4294967295;g=g+w&4294967295;m=m+x&4294967295;p=p+y&4294967295;G=G+H&4294967295}E=q(r)+q(g)+q(m)+q(p)+q(G)}}catch(M){E=null}a=(window._dv_win.dv_config.verifyJSURL||a.protocol+"//"+(window._dv_win.dv_config.bsAddress||"rtb"+a.dvregion+".doubleverify.com")+"/verify.js")+"?jsCallback="+a.callbackName+"&jsTagObjCallback="+a.tagObjectCallbackName+"&num=6"+b+"&srcurlD="+c.depth+"&ssl="+a.ssl+"&refD="+F+a.tagIntegrityFlag+a.tagHasPassbackFlag+"&htmlmsging="+(n?"1":"0")+(null!=E?"&aadid="+E:
"");(c=dv_GetDynamicParams(d).join("&"))&&(a+="&"+c);if(!1===k||u)a=a+("&dvp_isBodyExistOnLoad="+(k?"1":"0"))+("&dvp_isOnHead="+(u?"1":"0"));h="srcurl="+encodeURIComponent(h);if((k=window._dv_win[L("=@42E:@?")][L("2?46DE@C~C:8:?D")])&&0<k.length){u=[];u[0]=window._dv_win.location.protocol+"//"+window._dv_win.location.hostname;for(c=0;c<k.length;c++)u[c+1]=k[c];k=u.reverse().join(",")}else k=null;k&&(h+="&ancChain="+encodeURIComponent(k));k=4E3;/MSIE (\d+\.\d+);/.test(navigator.userAgent)&&7>=new Number(RegExp.$1)&&
(k=2E3);if(d=dv_GetParam(d,"referrer"))d="&referrer="+d,a.length+d.length<=k&&(a+=d);s.length+t.length+a.length<=k&&(a+=t,h+=s);s=P();a+="&vavbkt="+s.vdcd;a+="&lvvn="+s.vdcv;"prerender"===window._dv_win.document.visibilityState&&(a+="&prndr=1");return a+="&eparams="+encodeURIComponent(L(h))+"&"+e.getVersionParamName()+"="+e.getVersion()}function P(){try{return{vdcv:8,vdcd:eval(function(a,e,c,d,b,n){b=function(a){return(a<e?"":b(parseInt(a/e)))+(35<(a%=e)?String.fromCharCode(a+29):a.toString(36))};
if(!"".replace(/^/,String)){for(;c--;)n[b(c)]=d[c]||b(c);d=[function(a){return n[a]}];b=function(){return"\\w+"};c=1}for(;c--;)d[c]&&(a=a.replace(RegExp("\\b"+b(c)+"\\b","g"),d[c]));return a}("(v(){1i{m Q=[1h];1i{m 6=1h;2n(6!=6.1Q&&6.1k.2i.2h){Q.1l(6.1k);6=6.1k}}1f(e){}v 1m(H){1i{W(m i=0;i<Q.1j;i++){11(H(Q[i]))b Q[i]==1h.1Q?-1:1}b 0}1f(e){b 1g}}v 1G(K){b 1m(v(6){b 6[K]!=1g})}v 3i(6,1E,H){W(m K 2F 6){11(K.1N(1E)>-1&&(!H||H(6[K])))b 3x}b 2R}v g(s){m h=\"\",t=\"36.;j&38}3d/0:31'32=B(30-2Z!,2X)2Y\\\\{ >33+34\\\"39<\";W(i=0;i<s.1j;i++)f=s.1R(i),e=t.1N(f),0<=e&&(f=t.1R((e+41)%37)),h+=f;b h}m c=['35\"18-2W\"2V\"2K','p','l','2L&p','p','{','-5,!u<}\"2J}\"','p','J','-2I}\"<2G','p','=o',':<2H}T}<\"','p','h','\\\\<}4-2}\"E(d\"G}8?\\\\<}4-2}\"E(d\"1w<N\"[1d*1t\\\\\\\\1s-2N<1r\"1n\"2O]V}C\"O','e','2T','\"1o\\\\<}1u\"I<-2U\"1p\"5\"2S}1x<}2P\"1o\\\\<}10}1a>19-13}2}\"1p\"5\"2Q}1x<}3a','e','=J','17}U\"<5}3b\"y}F\\\\<}[3v}3w:3u]9}7\\\\<}[t:1P\"3t]9}7\\\\<}[3r})5-u<}t]9}7\\\\<}[3s]9}7\\\\<}[3y}3C]9}3B','e','3z',':3A}<\"D-3q/2M','p','3p','\\\\<}w<U/X}7\\\\<}w<U/!9}8','e','=l','\\\\<}1q!3g\\\\<}1q!3h)p?\"k','e','3f','3e:,','p','3c','17}U\"<5}1S:3j\\\\<}4-2}\"3o\".42-2}\"3n-3m<N\"3k<3l<3E}C\"3H<2B<23[<]E\"27\"18}\"2}\"1W[<]E\"27\"18}\"2}\"E<}1e&1U\"1\\\\<}14\\\\1X\\\\<}14\\\\10}1a>19-13}2}\"z<26-2}\"22\"2.42-2}\"1Z=20\"y}24\"y}P=25','e','x','1Y)','p','+','\\\\<}1y)u\"28\\\\<}1y)u\"1V?\"k','e','21','\\\\<}4-2}\"E(d\"G}8?\\\\<}4-2}\"E(d\"2E<:[\\\\2v}}2M][\\\\2u,5}2]2t}C\"O','e','2q',':2r<Z','p','2w','\\\\<}E\"2x\\\\<}E\"2C-29?\"k','e','2A','1D\\\\<}2y:,2z}U\"<5}2p\"y}2o<2e<2g}2d','e','2c','\\\\<}w<U/2a&1K\"E/1O\\\\<}w<U/2b}C\"1T\\\\<}w<U/f[&1K\"E/1O\\\\<}w<U/2m[S]]1u\"2l}8?\"k','e','2j','2k}3D}43>2s','p','4Y','\\\\<}16:<15}s<55}7\\\\<}16:<15}s<4U<}f\"u}1I\\\\<}1J\\\\<}16:<15}s<C[S]E:1P\"X}8','e','l{','4G\\'<}14\\\\T}4B','p','==','\\\\<}E\"2f\"4A\\\\<}4H<4I?\"k','e','o{',' &D)&4K','p','4F','\\\\<}E.:2}\"c\"<4M}7\\\\<}4L}7\\\\<}4J<}f\"u}1I\\\\<}1J\\\\<}10:}\"9}8','e','3F','\\\\<}4-2}\"E(d\"G}8?\\\\<}4-2}\"E(d\"1w<N\"[1d*1t\\\\\\\\1s-1r\"1n/4O<4S]V}C\"O','e','4R',')4Q!4P}s<C','p','4z','\\\\<}1z.L>g;D\\'T)Y.4y\\\\<}1z.L>g;4x&&4C>D\\'T)Y.I?\"k','e','l=','D:<Z<:5','p','4E','\\\\<}9\\\\<}E\"4D\\\\<}n\"<5}1v\"1F}/1B\\\\<}4-2}\"1M<}1e&4T\\\\<}n\"<5}1c\"}u-54=?17}U\"<5}1S\"51\"y}52\\\\<}4Z}\"n\"<5}50\"4X\"y}F\"4V','e','4W','53-N:4v','p','3X','\\\\<}1b\"3W\\\\<}1b\"3V\"<5}3U\\\\<}1b\"3Y||\\\\<}3Z?\"k','e','h+','\\\\<}n\"<5}1c\"}u-45\\\\<}10}1a>19-13}2}\"q\\\\<}n\"<5}1c\"}u-2D','e','=S','c>A','p','=','\\\\<}4-2}\"E(d\"G}8?\\\\<}4-2}\"E(d\"1A<:[<Z*1t:Z,1C]F:<44[<Z*4w]V}C\"O','e','h=','40-2}\"n\"<5}9}8','e','3T','\\\\<}4-2}\"E(d\"G}8?\\\\<}4-2}\"E(d\"1A<:[<Z*3S}1C]R<-C[1d*3L]V}C\"O','e','3K','1D\\\\<}1H\"\\\\3J\\\\<}1H\"\\\\3G','e','3I','\\\\<}3M}Z<}3N}7\\\\<}3R<f\"9}7\\\\<}3Q/<}C!!3P<\"42.42-2}\"X}7\\\\<}3O\"<5}9}8?\"k','e','46','T>;47\"<4f','p','h{','\\\\<}4o\\\\<}4n}<(4m?\"k','e','4l','\\\\<}4p<4q a}4u}7\\\\<}E}4t\"4s 4r- X}8','e','4k','4j\\\\<}n\"<5}4b}4a\"49&M<C<}48}C\"1T\\\\<}n\"<5}1v\"1F}/1B\\\\<}4-2}\"4c\\\\<}4-2}\"1M<}1e&4d[S]4i=?\"k','e','l+'];m 12=[];W(m j=0;j<c.1j;j+=3){m r=c[j+1]=='p'?1G(g(c[j])):1m(v(6){b 4h(g(c[j]))});11(r>0||r<0)12.1l(r*1L(g(c[j+2])));4g 11(r==1g)12.1l(-4e*1L(g(c[j+2])))}b 12}1f(e){b[-4N]}})();",
62,316,"    EZ5Ua  win a44OO a44 P1  return  a2MQ0242U       Ma2vsu4f2  var E45Uu        function EBM  aM     _   5ML44P1 func   prop    3RSvsu4f2  wins     WDE42 for fP1   E2 if results N5 Z5 ZU5 E_ qsa g5 Tg5 U5Z2c EuZ E35f fMU Z27 catch null window try length parent push ch MuU QN25sF ENM5 E_Y kN7 BuZfEU5  Ef2 E3M2sP1tuB5a 5ML44qWfUM Z2s EufB EcIT_0 5ML44qWZ tOO _t U5q str vB4u ex zt__ U25sF ELMMuQOO BV2U parseInt EM2s2MM2ME indexOf 2Qfq uf top charAt qD8 3RSOO sqt ujuM OO2 E2fUuN2z21 Ld0 tDRm DM2 oo EUM2u sq2 PSHM2 HnDqD 1Z5Ua  u_Z2U5Z2OO NTZ fOO fDE42 lJ a44nD f32M_faB  ZP1 href location ox M2 aNP1 fD while F5ENaB4 q5D8M2 eS u_faB  tDE42 Um UmBu hJ UIuCTZOO zt_M tzsa oJ 99D UT  5ML44qtZ in u4f ZBu fgM2Z2 g5a Q42 60  kUM EVft 2ZtOO QN2P1ta false QN211ta eo 25a 2Z0 Na LnG 5r uic2EHVO Q6T s7 Kt NhCZ lkSvfxWX C2 Ue 82 PzA 1bqyJIma 2Zt qD8M2 he YDoMw8FRp3gd94 _M lS AOO AEBuf2g co uMF21 tDHs5Mq 1SH 2qtfUM fbQIuCpu EC2 ho uM tUZ tUBt r5Z2t 24t tf5a ZA2 true tB ee u_a a44nDqD LMMt 5IMu i2E42 ll B_UB_tD  lh B__tDOOU5q oe 1tNk4CEN3Nt E4u CcM4P1 Eu445Uu gI ENuM Ef2A 1tB2uU5 eh OOq CfEf2U CfOO le CfE35aMfUuN E35aMfUuND Z5Ua   fY45 Z25 2P1 lo _c fzuOOuE42 5M U2f Eu EM2s2MM2MOO squ 100  else eval D11m u1 lx ol a2TZ E_NUCEYp_c E_NUCOO EUuU 4Zf M5 5M2f _f UP1 _ZBf 1tfMmN4uQ2Mt _I IOO oh fNNOO s5 AbL 5NOO hh hl UufUuZ2 E0N2U u4buf2Jl ErF rLTp ErP1 4P1 999 kZ 4Qg5 2u4 eJ fN4uQLZfEVft sq CF Ma2nnDqDvsu4f2 oS U3q2D8M2 hx ENuM2 E3M2szsu4f2nUu MQ8M2 FN1 ___U 2DRm CP1".split(" "),
0,{}))}}catch(e){return{vdcv:8,vdcd:"0"}}}function N(e){try{if(1>=e.depth)return{url:"",depth:""};var a,h=[];h.push({win:window._dv_win.top,depth:0});for(var c,d=1,b=0;0<d&&100>b;){try{if(b++,c=h.shift(),d--,0<c.win.location.toString().length&&c.win!=e)return 0==c.win.document.referrer.length||0==c.depth?{url:c.win.location,depth:c.depth}:{url:c.win.document.referrer,depth:c.depth-1}}catch(n){}a=c.win.frames.length;for(var k=0;k<a;k++)h.push({win:c.win.frames[k],depth:c.depth+1}),d++}return{url:"",
depth:""}}catch(u){return{url:"",depth:""}}}function L(e){new String;var a=new String,h,c,d;for(h=0;h<e.length;h++)d=e.charAt(h),c="!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~".indexOf(d),0<=c&&(d="!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~".charAt((c+47)%94)),a+=d;return a}function I(){return Math.floor(1E12*(Math.random()+""))}function O(){try{if("function"===typeof window.callPhantom)return 99;
try{if("function"===typeof window.top.callPhantom)return 99}catch(e){}if(void 0!=window.opera&&void 0!=window.history.navigationMode||void 0!=window.opr&&void 0!=window.opr.addons&&"function"==typeof window.opr.addons.installExtension)return 4;if(void 0!=window.chrome&&"function"==typeof window.chrome.csi&&"function"==typeof window.chrome.loadTimes&&void 0!=document.webkitHidden&&(!0==document.webkitHidden||!1==document.webkitHidden))return 3;if(void 0!=window.mozInnerScreenY&&"number"==typeof window.mozInnerScreenY&&
void 0!=window.mozPaintCount&&0<=window.mozPaintCount&&void 0!=window.InstallTrigger&&void 0!=window.InstallTrigger.install)return 2;if(void 0!=document.uniqueID&&"string"==typeof document.uniqueID&&(void 0!=document.documentMode&&0<=document.documentMode||void 0!=document.all&&"object"==typeof document.all||void 0!=window.ActiveXObject&&"function"==typeof window.ActiveXObject)||window.document&&window.document.updateSettings&&"function"==typeof window.document.updateSettings)return 1;var a=!1;try{var h=
document.createElement("p");h.innerText=".";h.style="text-shadow: rgb(99, 116, 171) 20px -12px 2px";a=void 0!=h.style.textShadow}catch(c){}return 0<Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor")&&a&&void 0!=window.innerWidth&&void 0!=window.innerHeight?5:0}catch(d){return 0}}this.createRequest=function(){this.perf&&this.perf.addTime("r3");var e=!1,a=window._dv_win,h=0,c=!1;try{for(dv_i=0;10>=dv_i;dv_i++)if(null!=a.parent&&a.parent!=a)if(0<a.parent.location.toString().length)a=
a.parent,h++,e=!0;else{e=!1;break}else{0==dv_i&&(e=!0);break}}catch(d){e=!1}0==a.document.referrer.length?e=a.location:e?e=a.location:(e=a.document.referrer,c=!0);window._dv_win._dvScripts||(window._dv_win._dvScripts=[]);var b=document.getElementsByTagName("script");this.dvScripts=[];this.dvOther=this.dvStep=0;for(dv_i in b)if(b[dv_i].src){var n=b[dv_i].src,k=window._dv_win.dv_config.bs_regex||/\.doubleverify\.com:?[0-9]*\/dvbs_src\.js/;if(n&&n.match(k)&&!dv_Contains(window._dv_win._dvScripts,b[dv_i])){this.dvStep=
1;this.dv_script=b[dv_i];window._dv_win._dvScripts.push(b[dv_i]);var u;u=window._dv_win.dv_config?window._dv_win.dv_config.bst2tid?window._dv_win.dv_config.bst2tid:window._dv_win.dv_config.dv_GetRnd?window._dv_win.dv_config.dv_GetRnd():I():I();var g,k=window.parent.postMessage&&window.JSON,i=!0,f=!1;if("0"==dv_GetParam(n,"t2te")||window._dv_win.dv_config&&!0==window._dv_win.dv_config.supressT2T)f=!0;if(k&&!1==f)try{var s=window._dv_win.dv_config.bst2turl||"https://cdn3.doubleverify.com/bst2tv3.html",
f="bst2t_"+u,t=void 0;if(document.createElement&&(t=document.createElement("iframe")))t.name=t.id=window._dv_win.dv_config.emptyIframeID||"iframe_"+I(),t.width=0,t.height=0,t.id=f,t.style.display="none",t.src=s;g=t;i=J(g)}catch(F){}var j;g=n;s={};try{for(var p=RegExp("[\\?&]([^&]*)=([^&#]*)","gi"),m=p.exec(g);null!=m;)"eparams"!==m[1]&&(s[m[1]]=m[2]),m=p.exec(g);j=s}catch(q){j=s}j.perf=this.perf;j.uid=u;j.script=this.dv_script;j.callbackName="__verify_callback_"+j.uid;j.tagObjectCallbackName="__tagObject_callback_"+
j.uid;j.tagAdtag=null;j.tagPassback=null;j.tagIntegrityFlag="";j.tagHasPassbackFlag="";!1==(null!=j.tagformat&&"2"==j.tagformat)&&(p=M(j.script),j.tagAdtag=p.tagAdTag,j.tagPassback=p.tagPassback,p.isBadImp?j.tagIntegrityFlag="&isbadimp=1":p.hasPassback&&(j.tagHasPassbackFlag="&tagpb=1"));j.protocol="http:";j.ssl="0";"https"==j.script.src.match("^https")&&"https"==window._dv_win.location.toString().match("^https")&&(j.protocol="https:",j.ssl="1");this.dvStep=2;K(j);this.perf&&this.perf.addTime("r4");
b=b[dv_i]&&b[dv_i].parentElement&&b[dv_i].parentElement.tagName&&"HEAD"===b[dv_i].parentElement.tagName;this.dvStep=3;return D(this,j,e,a,h,c,k,i,b)}this.dvOther++;n&&n.match(/dvbs_src\.js/)&&(k=dv_Contains(window._dv_win._dvScripts,b[dv_i])?1:0,this.dvScripts.push({src:n,isContain:k}))}};this.sendRequest=function(e){this.perf&&this.perf.addTime("r5");var a=dv_GetParam(e,"tagformat");a&&"2"==a?$dvbs.domUtilities.addScriptResource(e,document.body):dv_sendScriptRequest(e);this.perf&&this.perf.addTime("r6");
return!0};this.isApplicable=function(){return!0};this.onFailure=function(){var e=window._dv_win._dvScripts,a=this.dv_script;null!=e&&(void 0!=e&&a)&&(a=e.indexOf(a),-1!=a&&e.splice(a,1))};window.debugScript&&(window.CreateUrl=D);this.getVersionParamName=function(){return"ver"};this.getVersion=function(){return"35"}};


function dvbs_src_main(dvbs_baseHandlerIns, dvbs_handlersDefs) {

    var getCurrentTime = function() {
        "use strict";
        if (Date.now) {
            return Date.now();
        }
        return (new Date()).getTime();
    };
    /**
     * r0 - Start
     * r1 - Before exec
     * r2 - After exec
     * r3 - Start createRequest
     * r4 - End createRequest
     * r5 - Start sendRequest
     * r6 - End sendRequest
     * r7 - In callback
     */

    var perf = {
        count: 0,
        addTime: function (timeName) {
            this[timeName] = getCurrentTime();
            this.count += 1;
        }
    };
    perf.addTime('r0');

    this.bs_baseHandlerIns = dvbs_baseHandlerIns;
    this.bs_handlersDefs = dvbs_handlersDefs;

    this.exec = function() {
        perf.addTime('r1');
        try {
            window._dv_win = (window._dv_win || window);
            window._dv_win.$dvbs = (window._dv_win.$dvbs || new dvBsType());

            window._dv_win.dv_config = window._dv_win.dv_config || { };
            window._dv_win.dv_config.bsErrAddress = window._dv_win.dv_config.bsAddress || 'rtb0.doubleverify.com';

            for(var index = 0; index < this.bs_handlersDefs.length; index++) {
                if (this.bs_handlersDefs[index] && this.bs_handlersDefs[index].handler)
                    this.bs_handlersDefs[index].handler.perf = perf;
            }
            this.bs_baseHandlerIns.perf = perf;

            var errorsArr = (new dv_rolloutManager(this.bs_handlersDefs, this.bs_baseHandlerIns)).handle();
            if (errorsArr && errorsArr.length > 0)
                dv_SendErrorImp(window._dv_win.dv_config.bsErrAddress + '/verify.js?ctx=818052&cmp=1619415&num=6', errorsArr);
        }
        catch(e) {
            try {
                dv_SendErrorImp(window._dv_win.dv_config.bsErrAddress + '/verify.js?ctx=818052&cmp=1619415&num=6&dvp_isLostImp=1', { dvp_jsErrMsg: encodeURIComponent(e) });
            } catch(e) { }
        }
        perf.addTime('r2');
    };
};

try {
    window._dv_win = window._dv_win || window;
    var dv_baseHandlerIns = new dv_baseHandler();
	dv_handler36.prototype = dv_baseHandlerIns;
dv_handler36.prototype.constructor = dv_handler36;

    var dv_handlersDefs = [{handler: new dv_handler36(), minRate: 0, maxRate: 90}];
    (new dvbs_src_main(dv_baseHandlerIns, dv_handlersDefs)).exec();
} catch (e) { }