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


function logN (N, base) {
	base = typeof (base) !== "undefined" ? base : 10;
	return Math.log(N) / Math.log(base);
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
		if (typeof(min) === "undefined" || parseInt(range[c][index], 10) < min) {
			min = parseInt(range[c][index], 10);
		}
		if (typeof(max) === "undefined" || parseInt(range[c][index], 10) > max) {
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