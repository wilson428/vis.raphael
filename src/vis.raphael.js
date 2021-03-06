/*global Raphael logN csv_to_object guess_date_format randInt*/
//for conversion
var timekeeper = function() {
	var month_abbr = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."],
		month_full = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
		month_days = {"Jan.": 31, "Feb.": 28, "Mar.": 31, "Apr.": 30, "May": 31, "Jun.": 30, "Jul.": 31, "Aug.": 31, "Sep.": 30, "Oct.": 31, "Nov.": 30, "Dec.": 31},
		month_nums = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

	return {
		// takes 118, returns Apr. 28
		dayOfYearToDate: function (days) {
			for (var k in month_days) {
				if (days > month_days[k]) {
					days -= month_days[k];
				} else {
					return (k + " " + Math.round(days));
				}
			}
			return "Error";
		},
        //assumes YYYY-MM-DD for now
        dateToDayOfYear: function(date, minyear) {
            var days = 0,
                parts = date.split("-");
            for (var c = 0; c < parseInt(parts[1], 10) - 1; c += 1) {
                days += month_nums[c];
            }
            if (parseInt(parts[0], 10) % 4 === 0 && parts[1] >= 3) {
                days += 1;
            }
            if (typeof minyear !== "number") {
                return days + parseInt(parts[2], 10);
            } else {
                return days + parseInt(parts[2], 10) + 365 * (parseInt(parts[0], 10) - minyear);
            }
        }
	};
};

function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
}

//Returns black or white for text label over a color, depending on background
function guess_text_color (rgb, threshold, op) {
	var vals = typeof rgb !== "string" ? rgb : hexToRgb(rgb);
	op = typeof op !== "undefined" ? op : 1;
	//move up and down to adjust level at which text switches to white
	threshold = typeof threshold !== "undefined" ? threshold : 128;
	var	luminosity = 0.2126 * parseInt(vals[0], 10) + 0.7152 * parseInt(vals[1], 10) + 0.0722 * parseInt(vals[2], 10);
	return (luminosity / op < threshold) ? "#FFF": "#000";
}

//converts an array of x/y coords into SVG-ready path
//TO DO: Allow for coords to arrive as strings
function makepath(coords, reverse, scale) {
    scale = typeof scale !== "undefined" ? scale : 1;
	var path = "",
        c;

    for (c = coords.length - 1; c >= 0; c -= 1) {
        if (!reverse) {
            path = path + "L" + coords[c].x * scale + "," + coords[c].y * scale;
        } else {
            path = "L" + coords[c].x * scale + "," + coords[c].y * scale + path;
        }
    }
    return "M" + path.substr(1);
}

function firstpoint(path) {
    var first = RegExp(/^L\d+,\d+/);
    return first.exec(path);
}

function lastpoint(path) {
    var last = RegExp(/L\d+,\d+$/);
    return last.exec(path);
}

// probably a better way to calculate sub intervals
function guess_interval (N) {
	var lg =  logN(N),
        base = Math.floor(lg) - 1,
        rem = lg % 1;
	if (rem > logN(5)) {
        return 10 * Math.pow(10, base);
	}
	if (rem > logN(2.5)) {
        return 5 * Math.pow(10, base);
	}
	if (rem > 0) {
        return 2.5 * Math.pow(10, base);
	}
	return Math.pow(10, base);
}

function get_max_index (infobit, yvals) {
	var max,
		maxindex,
		ib,
		i;

	if (!yvals) {
		yvals = [];
		for (ib in infobit) {
			if (infobit.hasOwnProperty(ib)) {
				yvals.push(ib);
			}
		}
	}
	for (i = 0; i < yvals.length; i += 1) {
		if (typeof(max) === "undefined" || infobit[yvals[i]] > max) {
			max = infobit[yvals[i]];
			maxindex = yvals[i];
		}
	}
	return maxindex;
}

function get_min_max (range, index) {
	var min,
		max,
		val,
		c;
	//for (c = 0; c < range.length; c += 1) {
	//we want this to work for large objects as well as arrays
	for (c in range) {
		if (typeof(index) === "undefined") {
			val = range[c];
		} else {
			val = range[c][index];
		}
		if (typeof val !== "undefined" && (typeof min === "undefined" || val < min)) {
			min = val;
		}
		if (typeof val !== "undefined" && (typeof max === "undefined" || val > max)) {
			max = val;
		}
	}
	return { "min": min, "max": max };
}


function bucket (N, info, index) {
	var mm = get_min_max(info, index),
		c,
		val,
		buckets = [],
		volumes = [],
		//step = (mm.max - mm.min) / N;
		step = guess_interval(mm.max - mm.min) * 2;
		mm.min = step * Math.floor(mm.min / step);

	for (c = 0; c < N; c += 1) {
		volumes.push(0);
	}

	for (c = 0; c < info.length; c += 1) {
		if (typeof(index) === "undefined") {
			val = info[c];
		} else {
			val = info[c][index];
		}
		info[c].bucket = Math.min(Math.floor((val - mm.min) / step), N - 1);
		volumes[info[c].bucket] += 1;
	}

	for (c = 0; c < N; c += 1) {
		buckets.push({
			start: mm.min + c * step,
			volume: volumes[c]
		});
	}
	return buckets;
}

function getPos(e, xdiv, ydiv) {
    var x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop-15;

    return {
        x: typeof xdiv === "undefined" && x > xdiv ? x - 200 : x,
        y: typeof ydiv === "undefined" && y > ydiv ? y - 150 : y - 15
    };
}

function getXPos(e, divide) {
	var x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
	if (x > divide) {
	x -= 230;
	}
	return x;
}

function getYPos(e) {
	return e.clientY + document.body.scrollTop + document.documentElement.scrollTop-15;
}

//make data object parseable by visualization
/*  {
	values: [{a: 1, b:0}, {a:2, b: 50}],
	metadata: [a:{}, b:{}]
	}
*/

function make_data_object(info_obj) {
	var types,
		series;

	//if info_obj is array, assume it's the data itself
	if ($.isArray(info_obj) || !info_obj.values) {
		info_obj = {
			values: info_obj
		};
	}

	if (!info_obj.metadata) {
		info_obj.metadata = {};
	}
	//Here we fill out the object, guessing when user hasn't specified desires

	//if info_obj.values is a string, assume filepath and load it
	types = [];
	if (typeof (info_obj.values) === "string") {
		$.ajax({
			url: info_obj.values,
			dataType: "text",
			async: false,
			success: function (csv) {
				csv = csv_to_object(csv, info_obj.delimit || ",");
				info_obj.values = csv.object;
				//(It's useful to remember the order of the columns)
				info_obj.columns = csv.columns;
				types = csv.types;
			},
			error: function(e) {
				//console.log("Error", e);
			}
		});
	}

	//scan through properties in first data item, add to metadata if need be
    for (var first_item in info_obj.values) {
        if (info_obj.values.hasOwnProperty(first_item)) {
            first_item = info_obj.values[first_item];
            break;   
        }
    }
    
	for (var inf in first_item) {
		if (first_item.hasOwnProperty(inf)) {
			info_obj.metadata[inf] = info_obj.metadata[inf] || {};
			info_obj.metadata[inf].name = info_obj.metadata[inf].name || inf;
			info_obj.metadata[inf].label = info_obj.metadata[inf].label || inf;
			info_obj.metadata[inf].type = info_obj.metadata[inf].type || types[inf] || typeof(first_item[inf]);
			if (info_obj.metadata[inf].type === "date") {
				info_obj.metadata[inf].format = info_obj.metadata[inf].format || guess_date_format(first_item[inf]);
				info_obj.metadata[inf].dates_to_tick = info_obj.metadata[inf].dates_to_tick || [1];
				if (typeof(info_obj.metadata[inf].dates_to_tick) === "string") {
					info_obj.metadata[inf].dates_to_tick = [info_obj.metadata[inf].dates_to_tick];
				}
			}
		}
	}
    
	//fill out max/min/interval
	for (inf in first_item) {
		if (first_item.hasOwnProperty(inf)) {
			series = info_obj.metadata[inf];
			if (typeof(series.min) === "undefined" || typeof(series.max) === "undefined") {
				var range = get_min_max(info_obj.values, inf);
				series.min = typeof (series.min) !== "undefined" ? series.min : range.min;
				series.max = typeof (series.max) !== "undefined" ? series.max : range.max;
			}
			if (typeof (series.color) === "undefined") {
				//idea: Randomly choose color set from kuler or somewhere
				series.color = "rgb(" + randInt(256) + "," + randInt(256) + "," + randInt(256) + ")";
			}
		}
	}
	return info_obj;
}

//make tooltip div
$('<div/>', {
	id: 'tip'
}).css({
	'position': 'absolute',
	'width': 'auto',
	'height': 'auto',
	'background-color': '#ffffff',
	'border': '2px solid #999999',
	'font-family': 'Arial',
	'font-size': '10pt',
	'padding': '5px',
	'opacity': .90,
	'z-index': 50,
	'filter': 'alpha(opacity=90)'
}).hide().appendTo($(document.body));

var dateview = function(s, output, format) {
	if (!format) {
		format = guess_date_format(s);
	}
	var d = $.datepicker.parseDate(format, s);
	var txt = output
		.replace('m', Raphael.vis.month_abbr[d.getMonth()])
		.replace('d', d.getDate())
		.replace(/yyyy/, d.getFullYear())
		.replace('yy', String(d.getFullYear()).substr(2));
	return txt;
};

//very basic model view borrowing Django syntax
//takes 'html' with {{variable}}, inserts said variable from object 'info'
var template = function (html, info, inst) {
	if (html.replace("{{", "") !== html) {
		var indexes = html.match(/{{[A-z0-9 ]+}}/ig),
			ind,
			c;
		for (c = 0; c < indexes.length; c += 1) {
			ind = indexes[c].replace("{{", "").replace("\}\}", "");
			//this way, keys can also be array indices
			var i = guess_type(String(info[ind]));
			//console.log(i);
			//var ind = i[0];
			if (ind === "date" && inst) {
				html = html.replace(indexes[c], dateview(info[ind], inst.output, inst.format));
			} else if (i[1] === "integer") {
				html = html.replace(indexes[c], add_commas(info[ind]));
			} else if (i[1] === "float") {
				html = html.replace(indexes[c], info[ind]);
			} else {
				html = html.replace(indexes[c], info[ind]);
			}
		}
	}
	return html;
}

//universal methods
Raphael.el.tooltip = function(h, info, divide) {
	this.html = template(h, info);
	this.mouseover(function(e) {
		//may want to do a Django-style template later
		//re = html.match(/{{([A-Za-z-]+)}}/g);
		$('#tip').html(this.html);
		$('#tip').css("left", getXPos(e, divide)+10).css("top", getYPos(e)+15);
		$('#tip').show();
	}).mousemove(function(e) {
		$('#tip').css("left", getXPos(e, divide)+10).css("top", getYPos(e)+15);
	}).mouseout(function(e) {
		$('#tip').hide();
	});
};

Raphael.el.infobox = function(x, y, h, info) {
	this.html = template(h, info);
	this.mouseover(function(e) {
		//may want to do a Django-style template later
		//re = html.match(/{{([A-Za-z-]+)}}/g);
		$('#tip').html(this.html);
		$('#tip').css("left", x).css("top", y);
		$('#tip').show();
	}).mouseout(function(e) {
		$('#tip').hide();
	});
};

/*
if (!Object.prototype.addtip) {
	Object.prototype.addtip = function (e) {};
}
*/

//add easing formula for visual effect of randomness
Raphael.easing_formulas.rattle = function(n) { 
        var sign = (Math.random() > 0.5) ? 3 : -3;
        return Math.random() * (sign);     
    };

Raphael.el.rattle = function(magnitude, duration, f) {
    magnitude = typeof magnitude !== "undefined" ? magnitude : 1;
    duration = typeof duration !== "undefined" ? duration : 1000;
    
    
    //NOTE: Animates along diagonal axis. Should fix to animate independently on x and y axes if possible.
    var newx = this.matrix.split().dx + magnitude,
        newy = this.matrix.split().dy - magnitude;        
    this.animate({transform:"t" + newx + "," + newy}, duration, "rattle", function(e) {
        //move back to original position
        this.transform("t" + (newx - magnitude) + "," + (newy - magnitude));
        if (f) {
            f();
        }
    });    
};

//https://groups.google.com/forum/?fromgroups#!topic/raphaeljs/9dw-oUnTVAs
Raphael.el.moveTo = function(x, y) {
	switch (this.type) {
		case "path":
			var path = Raphael.pathToRelative(this.attrs.path),
				//dim = Raphael.pathDimensions(path),
				dim = this.getBBox(),
				dx = (path[0][1] - dim.x) + x,
				dy = (path[0][2] - dim.y) + y;
			path[0][1] = dx;
			path[0][2] = dy;
			return this.attr({path: path});
			break;
		default:
			return this.attr({x: x, y: y});
			break;
	}
	return this;
};