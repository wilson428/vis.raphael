//Universal functions v0.11a
//csv_to_object now detects basic types

/* Author: Chris Wilson */

//guess the intrinsic type of a string
function guess_type(s) {
    if (s.replace(/[0-9\-]+/, "") === "") {
           //int
       	return [parseInt(s, 10), "integer"];
	} else if (s.replace(/[0-9\.\-]+/, "") === "") {
    	//float
       	return [parseFloat(s), "float" ];
	} else if (s.replace(/[0-9\/]+/, "") === "") {
       	//date
		//TO DO error handling
		try {
			//d = $.datepicker.parseDate(guess_date_format(s), s);
			//return [d, "date"];
			return [s, "date"];
		} catch (e) {
		}
	}                
    return [s, "string"];
}

//infer format from slashes. Very primitive at the moment
function guess_date_format(d) {
    var p = RegExp(/[0-9]+/ig),
    m = d.match(p),
    c,
    format = "";
    if (m.length == 2) { //guessing m/y or m/d
		format = "m";
		if (m[0][0] === "0") {
			format += "m";
		}
    	if (parseInt(m[1], 10) > 31) {
    		if (m[1].length > 2) {
	    		return format + "/yy";
	    	} else {
	    		return format + "/y";
	    	}
    	} else {
    		return format + "/d";
    	}
    } else {
    	format = "m";
		if (m[0][0] === "0") {
			format += "m";
		}
		format += "/d";
		if (m[1][0] === "0") {
			format += "d";
		}
		if (m[2].length > 2) {
			return format + "/yy";
		} else {
			return format + "/y";
		}
    }
}

/*
var tests = ["-24", "-25.2", "hello", "1/1/35", "2/1945", "31/3"];
for (var c = 0; c < tests.length; c += 1) {
    console.log(guess_type(tests[c]) + " (" + typeof(guess_type(tests[c])) + ")");            
}
*/

/* CSV-to-JS Object 					*/
/* Currently does not support quotes 	*/
/* If index is defined, uses as key 	*/
/* TO DO: detect delimitation 			*/
function csv_to_object(csv, delimit, index) {
	var lines = csv.split(/[\r\n]+/g),
		delimitor = typeof(delimit) !== 'undefined' ? delimit : ",",
		labels = lines[0].split(delimitor),
		types = {},
		formats = {},
		samples = lines[1].split(delimitor),
		c,
		i,
		o,
		oo,
		items,
		ind;

	//add label for index
	//labels.push("object_index");

	//record types	
	for (c = 0; c < labels.length; c += 1) {
		types[labels[c]] = guess_type(samples[c])[1];
	}

	if (typeof(index) === 'undefined') {
		o = [];
		for (c = 1; c < lines.length; c += 1) {
			items = lines[c].split(delimitor);
			oo = {};
			for (i = 0; i < items.length; i += 1) {
				oo[labels[i]] = guess_type(items[i])[0];
			}
			oo["object_index"] = c;
			o.push(oo);
		}
	} else {
		o = {};
		if (typeof(index) === 'number') {
			index = labels[index];
		}

		for (c = 1; c < lines.length; c += 1) {
			items = lines[c].split(delimitor);
			oo = {};
			for (i = 0; i < items.length; i += 1) {
				if (labels[i] === index) {
					ind = guess_type(items[i])[0];
				}
				oo[labels[i]] = guess_type(items[i])[0];
			}
			oo["object_index"] = c;			
			o[ind] = oo;
		}
	}

	return {
		columns: labels,
		types: types,
		object: o
	};
	//return o;
}

function append_object(o, appendee, override) {
	//add properties of one object to another if not already present, like a prototype
	//override determines whether to overwrite existing key if duplicated in second object
	for (var k in appendee) {
		if (!o.hasOwnProperty(k) || override === true) {
			o[k] = appendee[k];
		}
	}
}

function add_commas(number, pfix) {
	var prefix = typeof(pfix) !== 'undefined' ? pfix : '',
		mod, output, i;
	if (number < 0) {
		number *= -1;
		prefix = "-" + prefix;
	}
	number = String(number);
	if (number.length > 3) {
		mod = number.length % 3;
		output = (mod > 0 ? (number.substring(0,mod)) : '');
		for (i=0 ; i < Math.floor(number.length / 3); i += 1) {
			if ((mod === 0) && (i === 0)) {
				output += number.substring(mod+ 3 * i, mod + 3 * i + 3);
			} else {
				output+= ',' + number.substring(mod + 3 * i, mod + 3 * i + 3);
			}
		}
		return (prefix+output);
	}
	return prefix+number;
}

//Math
function logN (N, base) {
	base = typeof (base) !== "undefined" ? base : 10;
	return Math.log(N) / Math.log(base);
}

//random integer
function randInt(N) {
	return Math.floor(N * Math.random());
}

/* Crockford helper functions */

//define new methods. See examples below
Function.prototype.method = function (name, func) {
	this.prototype[name] = func;
	return this;
};

//specifies the prototype of a new object
if (typeof Object.beget !== 'function') {
	 Object.beget = function (o) {
		 var F = function () {};
		 F.prototype = o;
		 return new F();
	 };
}

/* NEW METHODS */
Number.method('integer', function (  ) {
	return Math[this < 0 ? 'ceiling' : 'floor'](this);
});

String.method('trim', function (  ) {
	return this.replace(/^\s+|\s+$/g, '');
});

String.method('deentityify', (function () {
// The entity table. 
	var entity = {
		quot: '"',
		lt:   '<',
		gt:   '>'
	};
// Return the deentityify method.
	return function () {
		return this.replace(/&([^&;]+);/g,
			function (a, b) {
				var r = entity[b];
				return typeof r === 'string' ? r : a;
			}
		);
	};
})());

//support Array.indexOf in pre-EMCA-262
//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf) {  
	Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {  
		"use strict";  
		if (this === null) {  
			throw new TypeError();  
		}  
		var t = Object(this);  
		var len = t.length >>> 0;  
		if (len === 0) {  
			return -1;  
		}  
		var n = 0;  
		if (arguments.length > 0) {  
			n = Number(arguments[1]);  
			if (n !== n) { // shortcut for verifying if it's NaN  
				n = 0;  
			} else if (n !== 0 && n !== Infinity && n !== -Infinity) {  
				n = (n > 0 || -1) * Math.floor(Math.abs(n));  
			}  
		}  
		if (n >= len) {  
			return -1;  
		}  
		var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);  
		for (; k < len; k += 1) {  
			if (k in t && t[k] === searchElement) {  
				return k;  
			}  
		}  
		return -1;  
	}  
}  