// Raphael Maps v0.1a
var small_states = ["MA", "RI", "CT", "NJ", "DE", "MD", "DC"],
state = function(paper, info) {
	var ctr, x, y, label,
		shape = paper.path(info.coords).attr({'fill' : "#FFF", "stroke-opacity" : 0}).scale(0.6, 0.6, 0, 0).translate(10, 75);
		paper.path(info.coords).attr({"stroke" : "#999"}).scale(0.6, 0.6, 0, 0).translate(10, 75);

	//labels for small state boxes
	shape.tooltip('<strong>{{name}}</strong>', info, 400);
	if (small_states.indexOf(info.abbr) !== -1) {
		//The boxes for small shapes are included in the coordinates, so getting first x,y works for label
		ctr = info.coords.match(/M([0-9\.]+),([0-9\.]+)/);
		x = parseInt(ctr[1], 10) + 40; //TO DO: make offset dynamic
		y = parseInt(ctr[2], 10) + 20; //TO DO: make offset dynamic
		label = paper.text(x, y, info.abbr).attr({"font-family" : "Arial", "font-size" : 14, "font-weight" : "bold", "fill" : "#000"}).scale(0.6, 0.6, 0, 0).translate(-10,75);
		label.tooltip('<strong>{{name}}</strong>', info, 400);
		label.node.style.cursor = "default";
	}
	return {
		//fill state. Random color if not specified
		color: function(color, op) {
			op = typeof(op) !== 'undefined' ? op : 1;
			switch(typeof(color)) {
				case "object": break;
				case "string": color = hexToRgb(color); break;
				default: color = [randInt(255), randInt(255), randInt(255)];
			}
			shape.attr({"fill" : "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + op + ")", "opacity" : op, "stroke" : "#666", "stroke-opacity" : 1 });

			if (typeof(label) !== "undefined") {
				label.attr({ "fill" : guess_text_color(color, 80) });
			}
		},
		append: function (datum, html) {
			//add properties of data to state objects if not already present, like a prototype
			//it's generally wise to clear() the data points when starting new map
			//TO DO: boolean OVERRIDE to determine whether to overwrite existing binds if conflict
			for (var d in datum) {
				info[d] = datum[d];
			}
			shape.tooltip(html, info, 400);
			if (typeof(label) !== "undefined") {
				label.tooltip(html, info, 400);			
			}

		},
		addTip: function() {}
	};
},

map = (function () {
	var states;	
	//call this once in a closure
	$.ajax({
		//url: 'http://c339400.r0.cf1.rackcdn.com/states.csv',
		url : 'data/states.csv', 
		//url: '../../../../codebase/vis.raphael/trunk/src/data/states.csv',
		async: false,
		success: function(d) {
			states = csv_to_object(d, '\t');		
		}
	}, "text");
	//constructor
	
	
	return function (opts) {
		if (typeof(opts) === "undefined" || typeof(opts.name) === "undefined") {
			return;
		}
		var paper = Raphael(opts.name, 600, 500),
		roster = {},
		c,
		info,
		binder = typeof(opts.binder) !== "undefined" ? opts.binder : "abbr";

		//title
		paper.text(300, 25, opts.title).attr({"text-anchor" : "middle", "font-family": "'Arial', serif", "font-size" : 24, "font-weight" : "bold"});

		//legend
		if (typeof(opts.legend) !== "undefined") {
			for (c = 0; c < opts.legend.length; c += 1) {
				paper.rect(20, 415 + c*14, 10, 10).attr({"fill" : opts.legend[c][0], "stroke-opacity" : 0.5});
				paper.text(40, 420 + c*14, opts.legend[c][1]).attr({"text-anchor" : "start", "font-family": "'Arial', serif", "font-size" : 12, "font-weight" : "bold"});				
			}
		}

		for (c = 0; c < states.length; c += 1) {
			info = states[c];
			roster[info[binder]] = state(paper, info);
		}
		return {
			color: function (index, col, op) {
				roster[index].color(col, op);
			},
			get_states: function () {
				return roster;			
			},
			bind: function (data, html) {
				for (c in data) {
					if (data.hasOwnProperty(c)) {
						roster[data[c][binder]].append(data[c], html);	
					}
				}
			}
		};
	};
}()); //we're running this now to create ajax results in a closure