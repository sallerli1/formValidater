function formValidater() {
    this.filterMap = new Map();
    this.messageHolderMap = new Map();
}

formValidater.prototype.setFilter = function(inputElement, options) {
    var filter = new Filter(options);
    var filterCollection = this.filterMap.get(inputElement);

    if (filterCollection instanceof Map) {
        return filterCollection.set(filter.type, filter);
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

formValidater.prototype.setMessageHolder = function(inputElement, holder) {
    this.messageHolderMap.set(inputElement, holder);
}

formValidater.prototype.check = function(inputElement) {
    var value = inputElement.value,
        filterCollection = this.filterMap.get(inputElement);

    if (filterCollection instanceof Map) {
        for (var filter of filterCollection) {
            if (!filter.pattern.test(value)) {
                if (this.messageHolderMap.has(inputElement)) {
                    this.messageHolderMap.get(inputElement).innerHtml = filter.message;
                } else {

                }
                break;
            }
        }
    }
}

function Filter(options) {
    this.type = options['type'] ? options['type'] : null;
    
    if (this.patternCollection[type]) {
        this.pattern = this.patternCollection[type];
    } else if (options['pattern']) {
        this.pattern = options['pattern'];
    } else {
        this.pattern = null;
    }
    
    this.message = options['message'] ? options['message'] : null;
    this.lock = true;
}

Filter.prototype.patternCollection = {

}

Filter.prototype.unlockFilter = function() {
    this.lock = false;
}

Filter.prototype.lockFilter = function() {
    this.lock = true;
}

