// Raphael Maps v0.11a
// Can bind to either name or abbr, combine datasets with optional override

//states requiring inset box
var small_states = ["MA", "RI", "CT", "NJ", "DE", "MD", "DC"],

//object handling drawing of actual shape and resulting object
state = function(paper, info, tx, ty) {
	var ctr,
		x,
		y,
		label,
		shape,
		outline,
		dirty = false;
	//outline drawn first. This is to keep opacity of stroke as opacity of state changes
	//makes more sense to draw second, but this interrupts mouseovers
	outline = paper.path(info.coords).attr({"fill" : "#FFFFEE", "stroke" : "#999"}).scale(0.6, 0.6, 0, 0).translate(tx || 10, ty || 75);
	//state shape
	shape = paper.path(info.coords).attr({'fill' : "#FFF", "stroke-opacity" : 0}).scale(0.6, 0.6, 0, 0).translate(tx || 10, ty || 75);
	//labels for small state boxes
	shape.tooltip('<strong>{{name}}</strong>', info, 400);
	if (small_states.indexOf(info.abbr) !== -1) {
		//The boxes for small shapes are included in the coordinates, so getting first x,y works for label
		ctr = info.coords.match(/M([0-9\.]+),([0-9\.]+)/);
		x = parseInt(ctr[1], 10) + 40; //TO DO: make offset dynamic
		y = parseInt(ctr[2], 10) + 20; //TO DO: make offset dynamic
		label = paper.text(x, y, info.abbr).attr({"font-family" : "Arial", "font-size" : 14, "font-weight" : "bold", "fill" : "#000"}).scale(0.6, 0.6, 0, 0).translate(tx - 20 || -10, ty || 75);
		label.tooltip('<strong>{{name}}</strong>', info, 400);
		label.node.style.cursor = "default";
	}
	return {
		get_info: function() {
			return info;
		},
		//fill state. Random color if not specified
		color: function(color, op, dirtify) {
			op = typeof(op) !== 'undefined' ? op : 1;
			switch(typeof(color)) {
				case "object": break;
				case "string": color = hexToRgb(color); break;
				default: color = [randInt(255), randInt(255), randInt(255)];
			}
			shape.attr({"fill" : "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + op + ")", "opacity" : op, "stroke" : "#666", "stroke-opacity" : 1 });

			if (typeof(label) !== "undefined") {
				label.attr({ "fill" : guess_text_color(color, 120, op) });
			}
			
			//store properties SHOULD BE INTERNAL PROPS I THINK
			if (dirtify) {
				dirty = true;
			} else {
				dirty = false;
				shape.color = color;
				shape.op = op || 1;
			}
		},
		listen: function (event, f, o) {
			switch (event) {
				case "click": shape.click(function (e) {
					f(o);
				});		
			}
		},
		isDirty: function () {
			return dirty;
		},
		restore: function (override) {
			if (override || dirty) {
				shape.attr({"fill" : "rgba(" + shape.color[0] + "," + shape.color[1] + "," + shape.color[2] + "," + shape.op + ")", "opacity" : shape.op, "stroke" : "#666", "stroke-opacity" : 1 });
				dirty = false;
			}
		},
		append: function (datum, override) {
			//add properties of data to state objects if not already present, like a prototype
			//override determines whether to overwrite existing binds if conflict
			//TO DO: Make clear() to clear out data points when starting new map
			for (var d in datum) {
				if (!info.hasOwnProperty(d) || override === true) {
					info[d] = datum[d];
				}
			}
		},
		add_tip: function(html) {
			shape.tooltip(html, info, 400);
			if (typeof(label) !== "undefined") {
				label.tooltip(html, info, 400);			
			}
		}
	};
},
map = (function () {
	var states;	
	//call this once in a closure
	$.ajax({
		//url: 'http://c339400.r0.cf1.rackcdn.com/states.csv',
		url : 'data/states.csv', 
		//url: '../../../../code/vis.raphael/src/data/states.csv',
		async: false,
		success: function(d) {
			states = csv_to_object(d, '\t').object;		
		}
	}, "text");
	//constructor
	
	return function (opts) {
		if (typeof(opts) === "undefined" || typeof(opts.name) === "undefined") {
			return;
		}
		var paper = Raphael(opts.name, opts.width || opts.w || 600, opts.height || opts.h || 500),
			roster = {"abbr" : {}, "name" : {}},
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
			//useful to have keys for both state names and abbreviations
			roster["abbr"][info["abbr"]] = roster["name"][info["name"]] = state(paper, info, opts.x, opts.y);
		}
		
		return {
			get_paper: function () {
				return paper;
			},
			color: function (index, col, op) {
				//detect whether abbr or state name is used as index
				//console.log(index);
				if (index.length > 2) {
					roster["name"][index].color(col, op);
				} else {
					roster["abbr"][index].color(col, op);				
				}
			},
			get_states: function () {
				//console.log(roster);
				return roster;			
			},
			get_data: function () {
				return info;
			},
			bind: function (data, override) {
				if (!override) { override = false; }
				for (c in data) {
					if (data.hasOwnProperty(c)) {
						//detect whether abbr or state name is used as index
						if (c.length > 2) {
							roster["name"][c].append(data[c], override);
						} else {
							roster["abbr"][c].append(data[c], override);
						}
					}
				}
			},
			tooltip: function (html) {
				for (c in roster["abbr"]) {
					if (roster["abbr"].hasOwnProperty(c)) {
						roster["abbr"][c].add_tip(html);
					}
				}
			}
		};
	};
}()); //we're running this now to create ajax results in a closure