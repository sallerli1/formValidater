# FormValidator

    this a primitive version of a form validator to check validation of certain input written in javascript.
    It adds validation rules as filters to a filter map of a certain input element to check its validation,
    however, this can only validate text-like input element, whose type is HTMLInputElement for now,
    others will be provided in later versions
    
### Constructor

formValidator()

### Methods

#### Boolean setFilter(HTMLInputElement: inputElement, Object: options, Function?: exec)

add a filter to the filter map of the input element

the options are different when adding different type of filters

the exec is a function to check validation of the input according to the filter, only needed when the filter is custom

the return value means whether the inplementation is successful

#### check(HTMLInputElement: inputElement, Object: options)

check validation of the inputElement according to the filters bound to it

    the options is object which contains two member functions: 
        success: a function which will run when the input is valid, it takes the current input value as the only parameter
        error: a function which will run when the input is invalid, it takes the error message as the only parameter

#### filterInput(HTMLInputElement: inputElement, Object: options)

prevent user from inputting when the input is invalid, when a filter is lock, it will not be considered when filtering

    the options is object which contains two member functions: 
        success: a function which will run when the input is valid, it takes the current input value as the only parameter
        error: a function which will run when the input is invalid, it takes the error message as the only parameter

### Filter Tyes

the type numbers are stored in Filter.prototype.defaultTypes

#### requiredFilter

check if the input is empty

    options:
        type: "required"
        message: a custom error message
        locked: true|false   if the filter is locked, it will not be considered when filtering input
        
#### patternFilter

check validation according to pattern(RegExp)

    options:
        type: "pattern"
        name: the name of a default pattern stored in the pattern collection
        message: a custom error message
        pattern: a custom pattern(RegExp), needed when the default patterns do not fit the demand
        locked: true|false   if the filter is locked, it will not be considered when filtering input
        
    names of the default patterns:
        numeric: check if the input is numeric(not decimal)
        integer: check if the input is an integer
        decimal: check if the input is decimal
        email:  check if the input is a valid email address
        alpha:  check if the input is alphabetic charcters
        alphaNumeric:  check if the input is alpha-numeric
        alphaDash:  check if the input is alpha-dash charcters
        natural: check if the input is a natural number
        naturalNoZero: check if the input is a natural number which is not zero
        ip:  check if the input is a valid ip address
        base64:  check if the input is base64 charcters
        numericDash: check if the input is numeric-dash
        url:  check if the input is a valid url
        
#### twinsFilter

check whether the input is the same as the other input

    options:
        type: "twin"
        bound: an HTMLInputElement to check if the the input is the same as its value
        message: a custom error message
        locked: true|false   if the filter is locked, it will not be considered when filtering input
        
### Example

```
var validator = new formValidater();
            validator.setFilter(input1, {
                type: "required",
                locked: true
            });

            validator.setFilter(input1, {
                type: "pattern",
                name: "email",
                message: "请输入邮箱",
                locked: true
            });

            validator.setFilter(input2, {
                type: "required",
                message: "请与上面输入保持一致",
                locked: true
            });

            validator.setFilter(input2, {
                type: "pattern",
                name: "numeric",
                message: "请输入数字",
                locked: false
            });

            validator.setFilter(input2, {
                type: "twin",
                bound: input1,
                message: "请与上面输入保持一致",
                locked: true
            });
            validator.eventUtil.addHandler(input1, "input",
                function (event) {
                    validator.check(input1, {
                        success: function () {
                            p1.innerHTML = "";
                        },
                        error: function (message) {
                            p1.innerHTML = message;
                        }
                    });
                });
            validator.eventUtil.addHandler(input2, "input",
                function (event) {
                    validator.check(input2, {
                        success: function () {
                            p2.innerHTML = "";
                        },
                        error: function (message) {
                            p2.innerHTML = message;
                        }
                    });
                });
```
