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
	var min, max, c;
	for (c = 0; c < range.length; c += 1) {
		if (parseInt(range[c][index], 10) && (typeof(min) === "undefined" || parseInt(range[c][index], 10) < min)) {
			min = parseInt(range[c][index], 10);
		}
		if (parseInt(range[c][index], 10) && (typeof(max) === "undefined" || parseInt(range[c][index], 10) > max)) {
			max = parseInt(range[c][index], 10);
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

function make_data_object(info) {
	var column_names, series;
	
	//if info is array, assume it's the data itself
	//if array, assume filepath
	if ($.isArray(info) || typeof(i) === "string") {
		info = {
			values: info
		};
	}
	
	if (!info.values) {
		return;
	}

	//if info.values is a string, assume filepath and load it
	if (typeof (info.values) === "string") {
		$.ajax({
			url: info.values,
			dataType: "text",
			async: false,
			success: function (csv) {
				csv = csv_to_object(csv, ",");
				column_names = csv.columns;
				info.values = csv.object;
			}
		});
	}

	//Here we fill out the metadata object, guessing when user hasn't specified desires
	if (!info.metadata) {
		info.metadata = {};
	}

	//scan through properties in first data item, add to metadata if need be
	for (inf in info.values[0]) {
		if (info.values[0].hasOwnProperty(inf)) {
			if (!info.metadata[inf]) {
				info.metadata[inf] = {};
			}
			if (!info.metadata[inf].name) {
				info.metadata[inf].name = inf;
			}
			if (!info.metadata[inf].label) {
				info.metadata[inf].label = inf;
			}
		}
	}
	
	//fill out max/min/interval
	for (inf in info.values[0]) {
		if (info.values[0].hasOwnProperty(inf)) {
			var series = info.metadata[inf];
			if (typeof(series.min) === "undefined" || typeof(series.max) === "undefined") {
				range = get_min_max(info.values, inf);
				series.min = typeof (series.min) !== "undefined" ? series.min : range.min;
				series.max = typeof (series.max) !== "undefined" ? series.max : range.max;
			}
			if (typeof (series.color) === "undefined") {
				//idea: Randomly choose color set from kuler or somewhere
				series.color = "rgb(" + randInt(256) + "," + randInt(256) + "," + randInt(256) + ")";
			}
		}
	}
	
	//since info updated by reference, we can return this for future use
	//(It's useful to remember the order of the columns)
	return column_names;
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