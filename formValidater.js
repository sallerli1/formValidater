
function inheritPrototype(sub, supper) {
    var prototype = Object.create(supper.prototype);
    prototype.constructor = sub;
    sub.prototype = prototype;
}

function formValidater() {
    this.filterMap = new Map();
    this.checkResult = true;
    this.invalidateIndex = -1;
}

formValidater.prototype.eventUtil = {

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
    }
}

formValidater.prototype.setFilter = function(inputElement, options, exec) {
    var filter = Filter.prototype.createFilter(options, exec);
    var filterCollection = this.filterMap.get(inputElement);

    if (filterCollection instanceof Array) {
        return filterCollection.push(filter);
    } else {
        filterCollection = new Array();
        this.filterMap.set(inputElement, filterCollection);
        filterCollection.push(filter);
        if (inputElement instanceof HTMLElement) {
            var that = this;
            this.eventUtil.addHandler(inputElement, "submit", function(event) {
                that.eventUtil.preventDefault(that.eventUtil.getEvent(event));
            });
        }
    }

    return false;
}

formValidater.prototype.removeFilter = function(inputElement, type) {
    var filterCollection = this.filterMap.get(inputElement);

    if (filterCollection instanceof Map) {
        return filterCollection.delete(type);
    }

    return false;
}

formValidater.prototype.check = function(inputElement, successCal, errorCal) {
    var value = inputElement.value,
        filterCollection = this.filterMap.get(inputElement);

    if (filterCollection instanceof Array) {
        for (let i=0; i<filterCollection.length; ++i) {
            if (!filterCollection[i].executeFilter(value)) {
                if (errorCal instanceof Function) {
                    errorCal(filterCollection[i].message);
                }
                
                this.invalidateIndex = i;

                return false;
            }
        }
    }

    if (successCal instanceof Function) {
        successCal(value);
    }

    return true;
}

formValidater.prototype.filterInput = function(inputElement, successCal, errorCal) {
    var that = this,
        eventUtil = this.eventUtil;

    eventUtil.addHandler(inputElement, "keypress", function(event) {
        if (!that.check(inputElement, successCal, errorCal)) {
            var filterCollection = that.filterMap.get(inputElement),
                index = that.invalidateIndex;

            if (!filterCollection[index].isLocked()) {
                let event = eventUtil.getEvent(event);
                eventUtil.preventDefault(event);
            }
        }
    });
}

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
            break;

        default:
            return new customFilter(options, exec);
    }
}

function patternFilter(name, message, pattern) {

    this.name = name;

    if (message instanceof String) {
        var _message = message;
    } else if (this.messageCollection[name]) {
        var _message = this.messageCollection[name];
    } else {
        console.error("validator: No default settings found for name"+name+
                       "please provide all parameters for patternFilter(name, message, pattern)");
    }

    if (this.patternCollection[name]) {
        this.pattern = this.patternCollection[name];
    } else if (pattern instanceof RegExp) {
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

patternFilter.prototype.executeFilter = function(value) {
    return this.pattern.test(value);
}

function twinsFilter(boundInputElement, message) {
    this.bound = boundInputElement;

    var name = boundInputElement.name;
    
    var _message = message ? message : "this field must contain the same value as "+name;

    Filter.call(this,
        Filter.prototype.defaultTypes['twinsFilter'],
        _message);
}

inheritPrototype(twinsFilter, Filter);

twinsFilter.prototype.executeFilter = function(value) {
    var anotherValue = this.bound.value;

    return anotherValue === value;
}

function customFilter(options, exec) {
    for (let key in options) {
        if (options.hasOwnProperty(i)) {
            this.key = options[key];
        }
    }

    this.executeFilter = exec;
}