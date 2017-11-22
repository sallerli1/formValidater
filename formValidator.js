/*
* Author saller
* Email weskerli@163.com
* Date 2017-11-22
*
* This is a validator to check form validation which
*     currently provide pattern(RegExp) check,
*     twins check(check if one input equals another),
*     and required(not empty) check.
*
* hint: the current version can only check validation of HTMLInputElement.
*/
function inheritPrototype(sub, supper) {
    var prototype = Object.create(supper.prototype);
    prototype.constructor = sub;
    sub.prototype = prototype;
}

function typeOf(variable, type) {
    return Object.prototype.toString.call(variable) == "[object "+type+"]";
}

function formValidator() {
    this.filterMap = new Map();
    this.checkResult = true;
    this.invalidateIndex = -1;
}


// some event utilities that might be useful.
formValidator.prototype.eventUtil = {

    addHandler: function (element, type, handler) {
        if (element.addEventListener) {
            element.addEventListener(type, handler, false);
        } else if (element.attachEvent) {
            element.attachEvent("on" + type, handler);
        } else {
            element["on" + type] = handler;
        }
    },

    removeHandler: function (element, type, handler) {
        if (element.removeEventListener) {
            element.removeEventListener(type, handler, false);
        } else if (element.detachEvent) {
            element.detachEvent("on" + type, handler);
        } else {
            element["on" + type] = null;
        }
    },

    getEvent: function (event) {
        return event ? event : window.event;
    },

    getTarget: function (event) {
        return event.target || event.srcElement;
    },

    preventDefault: function (event) {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    },

    stopPropagation: function (event) {
        if (event.stopPropagation) {
            event.stopPropagation();
        } else {
            event.cancelBubble = true;
        }
    },

    getRelatedTarget: function(event) {
        if (event.relatedTarget) {
            return event.relatedTarget;
        } else if (event.toElement) {
            return event.toElement;
        } else if (event.fromElement) {
            return event.fromElement;
        } else {
            return null;
        }
    },

    getCharCode: function(event) {
        if (typeof event.charCode == "number") {
            return event.charCode;
        } else {
            return event.keyCode;
        }
    }
}

//add a filter to an input element,
//    the parameter 'options' varys along with the filter being added.
formValidator.prototype.setFilter = function(inputElement, options, exec) {
    if (!typeOf(inputElement, "HTMLInputElement")) {
        return false;
    }

    var filter = Filter.prototype.createFilter(options, exec),
        filterCollection = this.filterMap.get(inputElement),
        that = this,
        element = inputElement;

    if (!options['locked']) {
        filter.unlockFilter();
    }

    if (typeOf(filterCollection, "Array")) {
        filterCollection.push(filter);
    } else {
        filterCollection = new Array();
        this.filterMap.set(inputElement, filterCollection);
        filterCollection.push(filter);

        while (!typeOf(element, "HTMLFormElement")) {
            element = element.parentElement;
            if (typeOf(element, "HTMLBodyElement") || typeOf(element, "HTMLHtmlElement")) {
                return true;
            }
        }
        element.setAttribute("novalidate", "true");
    }

    return true;
}

// to delete a filter bound to an input element,
// this could only delete a filter when you know the index of it currently.
formValidator.prototype.removeFilter = function(inputElement, index) {
    var filterCollection = this.filterMap.get(inputElement);

    if (typeOf(filterCollection, "Array")) {
        if (filterCollection[index]) {
            return delete filterCollection[index];
        }

        return false
    }

    return false;
} 

// to check validation of an input element according to the filters bound to it
//
// the options is an object which contains 
// success: a callback function to run when input is valid,
//     it takes the current input value as the only parameter.
// error: a callback function to run when input is invalid,
//     it takes the error message as the only parameter.
formValidator.prototype.check = function(inputElement,options) {
    var value = inputElement.value,
        filterCollection = this.filterMap.get(inputElement);

    if (typeOf(filterCollection, "Array")) {
        for (let i=0; i<filterCollection.length; ++i) {

            if (!filterCollection[i].isLocked() && options['value']) {
                var isValidate = filterCollection[i].executeFilter(options['value']);
            } else {
                var isValidate = filterCollection[i].executeFilter(value);
            }

            if (!isValidate) {
                if (typeOf(options['error'], "Function")) {
                    options['error'](filterCollection[i].message);
                }
                
                this.invalidateIndex = i;

                return false;
            }
        }
    }

    if (typeOf(options['success'], "Function")) {
        if (options['value']) {
            options['success'](options['value']);
        } else {
            options['success'](value);
        }
    }

    return true;
}

// to prevent user from inputing when the input is invalid
//
// the options is an object which contains 
// success: a callback function to run when input is valid,
//     it takes the current input value as the only parameter.
// error: a callback function to run when input is invalid,
//     it takes the error message as the only parameter.
formValidator.prototype.filterInput = function(inputElement,options) {
    var that = this,
        eventUtil = this.eventUtil;

    eventUtil.addHandler(inputElement, "keypress", function(event) {
        var charCode = eventUtil.getCharCode(event);
        
        if (charCode>9 && !event.ctrlKey) {
            options['value'] =inputElement.value + String.fromCharCode(charCode);
        }

        if (!that.check(inputElement,options) ) {
            var filterCollection = that.filterMap.get(inputElement),
                index = that.invalidateIndex;

            if (!filterCollection[index].isLocked() && charCode>9 && !event.ctrlKey) {
                var event = eventUtil.getEvent(event);
                eventUtil.preventDefault(event);
            }
        }
    });
}

// supper type of a filter
function Filter(type, message) {
    this.type = type;
    this.message = message;
    this.lock = true;
}

Filter.prototype.defaultTypes = {
    requiredFilter: 0,
    patternFilter: 1,
    twinsFilter: 2,
    customFilter: 3
}

// to unlock a filter means it could be taken into consideration
//     when you want to prevent user from inputting
Filter.prototype.unlockFilter = function() {
    this.lock = false;
}

Filter.prototype.lockFilter = function() {
    this.lock = true;
}

Filter.prototype.isLocked = function() {
    return this.lock;
}

Filter.prototype.executeFilter = function() {}

Filter.prototype.createFilter = function(options, exec) {
    switch (options['type']) {
        case "twin":
            return new twinsFilter(options['bound'], options['message']);
    
        case "pattern":
            return new patternFilter(options['name'], options['message'], options['pattern']);

        case "required":
            return new requiredFilter(options['message']);

        default:
            return new customFilter(options, exec);
    }
}

// the required filter(not empty)
function requiredFilter(message) {
    var _message = message ? message : "this field must not be empty";

    Filter.call(this,
        Filter.prototype.defaultTypes['requiredFilter'],
        _message);
}

inheritPrototype(requiredFilter, Filter);

requiredFilter.prototype.executeFilter = function(value) {
    return !(value == "" || value == null || value == undefined)
}

// the pattern filter,
// the parameter message is optional, needed when you offer a custom error message
// the parameter pattern is optional, needed when you offer a custom RegExp
function patternFilter(name, message, pattern) {

    this.name = name;

    if (typeOf(message, "String")) {
        var _message = message;
    } else if (this.messageCollection[name]) {
        var _message = this.messageCollection[name];
    } else {
        console.error("validator: No default settings found for name"+name+
                       "please provide all parameters for patternFilter(name, message, pattern)");
    }

    if (this.patternCollection[name]) {
        this.pattern = this.patternCollection[name];
    } else if (typeOf(pattern, "RegExp")) {
        this.pattern = pattern;
    } else {
        console.error("validator: No default settings found for name"+name+
        "please provide all parameters for patternFilter(name, message, pattern)");
    }

    Filter.call(this,
        Filter.prototype.defaultTypes['patternFilter'],
        _message);
}

inheritPrototype(patternFilter, Filter);

//these are the currently supported patterns
patternFilter.prototype.patternCollection = {
    numeric: /^[0-9]+$/,
    integer: /^\-?[0-9]+$/,
    decimal: /^\-?[0-9]*\.?[0-9]+$/,
    email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    alpha: /^[a-z]+$/i,
    alphaNumeric: /^[a-z0-9]+$/i,
    alphaDash: /^[a-z0-9_\-]+$/i,
    natural: /^[0-9]+$/i,
    naturalNoZero: /^[1-9][0-9]*$/i,
    ip: /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/i,
    base64: /[^a-zA-Z0-9\/\+=]/i,
    numericDash: /^[\d\-\s]+$/,
    url: /^((http|https):\/\/(\w+:{0,1}\w*@)?(\S+)|)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/,
}

//these are the default error message for each pattern
patternFilter.prototype.messageCollection = {
    numeric: "This field must contain only number",
    integer: "This field must contain an integer",
    decimal: "This field must contain a decimal number",
    email: "This field must contain a valid email",
    alpha: "This field must only contain alphabetical characters",
    alphaNumeric: "This field must only contain alphabetical or numeric characters",
    alphaDash: "This field must only contain alpha-numeric characters, underscores, and dashes",
    natural: "This field must contain only positive numbers",
    naturalNoZero: "This field must contain a number greater than zero",
    ip: "This field must contain a valid IP",
    base64: "This field must contain a base64 string",
    numericDash: "This field must contain numeric characters or dashes",
    url: "this field must contain a valid url"
}

// check input validation according this filter
patternFilter.prototype.executeFilter = function(value) {
    return this.pattern.test(value);
}

// the twin filter, to check whether an input is the same as the other
// the parameter boundInputElement is the other input
// the parameter message is optional, needed when you offer a custom error message
function twinsFilter(boundInputElement, message) {
    this.bound = boundInputElement;

    var name = boundInputElement.name;
    
    var _message = message ? message : "this field must contain the same value as "+name;

    Filter.call(this,
        Filter.prototype.defaultTypes['twinsFilter'],
        _message);
}

inheritPrototype(twinsFilter, Filter);

// check input validation according this filter
twinsFilter.prototype.executeFilter = function(value) {
    var anotherValue = this.bound.value;

    return anotherValue === value;
}

// if no type is matched, the customFilter will be constructed
// the options are free to offer
// the parameter exec is a function to check input validation according this filter,
//     which is important.
//     it take a value as the only parameter to validate, and return true for success, false for error
function customFilter(options, exec) {
    for (let key in options) {
        if (options.hasOwnProperty(i)) {
            this.key = options[key];
        }
    }

    this.executeFilter = exec;
}