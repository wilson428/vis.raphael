// Raphael Vis v0.11a
// Data object creator now here, not in charts.vis

Raphael.vis = {
	//for conversion
	month_abbr: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
	month_full: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
	month_days: {"Jan" : 31, "Feb" : 28, "Mar" : 31, "Apr" : 30, "May" : 31, "Jun" : 30, "Jul" : 31, "Aug" : 31, "Sep" : 30, "Oct" : 31, "Nov" : 30, "Dec" : 31},
	month_nums: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],

	// takes 118
	// returns Apr. 28
	dayOfYearToDate: function (days) {
	for (k in month_days) {
		if (days > months[k])
		days -= months[k];
		else
		return (k + " " + Math.round(days));
	}
	return "Error";	
	},

	// takes 4/28/12
	// returns Apr. 28, 2012
	dateToString: function (date, useyear) {
	ds = date.split('/');
	m = month_abbr[parseInt(ds[0])-1];
	y = ds[2];
	if (y.length == 2)
		y = '20'+y;
	if (!useyear)
		return m+" "+ds[1];
	return m+" "+ds[1]+", "+y
	}
}

function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;

	//rgb
    //var result = /[0-9]+/i.exec(hex);
   	//return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
}

function guess_text_color (rgb, threshold) {
	if (typeof(rgb) === "string") {
	vals = hexToRgb(rgb);
	} else {
	vals = rgb;
	}

	//move up and down to adjust level at which text switches to white
	threshold = typeof(threshold) !== "undefined" ? threshold : 128;
	var	luminosity = .2126 * parseInt(vals[0]) + 0.7152 * parseInt(vals[1]) + 0.0722 * parseInt(vals[2]);
	//console.log(luminosity);
	if (luminosity < threshold) {
	return "#FFF";
	}
	return "#000";
}

function makepath(coords, reverse) {
	var path = "", c;

	if (reverse) {
	for (c = coords.length - 1; c >= 0; c -= 1) {
		if (c === coords.length - 1) {
		path += "M" + coords[c].x + "," + coords[c].y;		
		} else {
		path += "L" + coords[c].x + "," + coords[c].y;
		}
	}
	} else {
	for (c = 0; c < coords.length; c += 1) {
		if (c === 0) {
		path += "M" + coords[c].x + "," + coords[c].y;
		} else {
		path += "L" + coords[c].x + "," + coords[c].y;
		}
	}
	}	
	return path;
}

function endpoint(coords, reverse) {
	if (reverse) {
	return coords[coords.length - 1].x + "," + coords[coords.length - 1].y;
	} else {
	return coords[0].x + "," + coords[0].y;
	}	
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

function get_min_max (range, index) {
	var min, 
		max,
		val,
		c;
	for (c = 0; c < range.length; c += 1) {
		if (typeof(index) !== "undefined") {
			val = parseInt(range[c], 10);
		} else {
			val = parseInt(range[c][index], 10);
		}
		if (val && (typeof(min) === "undefined" || val < min)) {
			min = val;
		}
		if (val && (typeof(max) === "undefined" || val > max)) {
			max = val;
		}
	}
	return { "min" : min, "max" : max };
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
	formats,
	series;

	//if info_obj is array, assume it's the data itself
	if ($.isArray(info_obj)) {
	info_obj = {
		values: info_obj
	};
	}
	
	if (!info_obj.values) {
	return;
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
		csv = csv_to_object(csv, ",");
		info_obj.values = csv.object;
		//(It's useful to remember the order of the columns)
		info_obj.columns = csv.columns;
		types = csv.types;
		},
		error: function(e) {
		console.log("Error", e);
		}
	});
	}
	
	//scan through properties in first data item, add to metadata if need be
	for (inf in info_obj.values[0]) {
	if (info_obj.values[0].hasOwnProperty(inf)) {
		info_obj.metadata[inf] = info_obj.metadata[inf] || {};
		info_obj.metadata[inf].name = info_obj.metadata[inf].name || inf;
		info_obj.metadata[inf].label = info_obj.metadata[inf].label || inf;
		info_obj.metadata[inf].type = info_obj.metadata[inf].type || types[inf] || typeof(info_obj.values[0][inf]);
		if (info_obj.metadata[inf].type === "date") {
		info_obj.metadata[inf].format = info_obj.metadata[inf].format || guess_date_format(info_obj.values[0][inf]);
		info_obj.metadata[inf].dates_to_tick = info_obj.metadata[inf].dates_to_tick || [1];
		if (typeof(info_obj.metadata[inf].dates_to_tick) === "string") {
			info_obj.metadata[inf].dates_to_tick = [info_obj.metadata[inf].dates_to_tick];
		}
		}
	}
	}

	//fill out max/min/interval
	for (inf in info_obj.values[0]) {
	if (info_obj.values[0].hasOwnProperty(inf)) {
		var series = info_obj.metadata[inf];
		if (typeof(series.min) === "undefined" || typeof(series.max) === "undefined") {
		range = get_min_max(info_obj.values, inf);
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
	'width': '200px',
	'height': 'auto',
    'background-color': '#ffffff',
	'border': '2px solid #999999',
	'font-family': 'Arial',
	'font-size': '10pt',
	'padding': '5px',
	'opacity': .95,
	'filter': 'alpha(opacity=95)'
}).hide().appendTo($(document.body));

//universal methods
Raphael.el.tooltip = function(html, info, divide) {
	if (html.replace("{{", "") !== html) {
	var indexes = html.match(/{{[A-z ]+}}/ig), index, ind, h, cc;
	for (c = 0; c < indexes.length; c += 1) {
		ind = indexes[c].replace("{{", "").replace("\}\}", "");
		html = html.replace(indexes[c], info[ind]);
	}
	}
	this.mouseover(function(e) {
		//may want to do a Django-style template later
		//re = html.match(/{{([A-Za-z-]+)}}/g);
		$('#tip').html(html);
		$('#tip').css("left", getXPos(e, divide)+10).css("top", getYPos(e)+15);
		$('#tip').show();
	}).mousemove(function(e) {
		$('#tip').css("left", getXPos(e, divide)+10).css("top", getYPos(e)+15);
	}).mouseout(function(e) {
		$('#tip').hide();
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