// Raphael Maps v0.11a
// Can bind to either name or abbr, combine datasets with optional override

//states requiring inset box
//var small_states = ["MA", "RI", "CT", "NJ", "DE", "MD", "DC"],

//object handling drawing of actual shape and resulting object
var county = function(paper, info, tx, ty, scale) {
	var ctr,
		x,
		y,
		label,
		shape,
		outline,
		dirty = false;

	//outline drawn first. This is to keep opacity of stroke as opacity of state changes
	//makes more sense to draw second, but this interrupts mouseovers
	//state shape
	
	if (typeof(scale) === "undefined") {
		shape = paper.path(info.coords).attr({'fill' : "#FFF", "stroke-opacity" : 1}).translate(tx || 10, ty || 75);
	} else {
		shape = paper.path(info.coords).attr({'fill' : "#FFF", "stroke-opacity" : 1}).scale(scale, scale, 0, 0).translate(tx || 10, ty || 75);
	}
	//labels for small state boxes
	shape.tooltip('<strong>{{name}}, {{abbr}}</strong>', info, 400);

	//zoom
	shape.click(function(e) {
		console.log(zoom);
		if (zoom === 1) {
			paper.setViewBox(getXPos(e) - 150, getYPos(e) - 100, 300, 200);
			zoom = 2;
		}
	});
	
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
				label.attr({ "fill" : guess_text_color(color, 80, op) });
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
		shade: function(op) {
			shape.attr({"opacity" : op, "stroke" : "#666", "stroke-opacity" : 1 });
			if (typeof(label) !== "undefined") {
				label.attr({"opacity" : op, "stroke" : "#666", "stroke-opacity" : 1 });
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
	var counties;	
	//call this once in a closure
	$.ajax({
		url : 'data/counties.csv', 
		async: false,
		success: function(d) {
			counties = csv_to_object(d, '\t').object;		
		}
	}, "text");
	//constructor
	
	return function (opts) {
		if (typeof(opts) === "undefined" || typeof(opts.name) === "undefined") {
			return;
		}
		opts.width = opts.width || opts.w || 630;
		opts.height = opts.height || opts.h || 500;
		
		var paper = Raphael(opts.name, opts.width, opts.height),
			//roster = {"abbr" : {}, "name" : {}},
			roster = {},
			c,
			info,
			legend = paper.set(),
			zoom = 1;

		//title
		paper.text(opts.width / 2, 25, opts.title).attr({"text-anchor" : "middle", "font-family": "'Arial', serif", "font-size" : 24, "font-weight" : "bold"});

		//legend
		if (typeof(opts.legend) !== "undefined") {
			legend.push(paper.text(20, (opts.scale || 1) * 385 + opts.y, opts.legend.title).attr({"text-anchor" : "start", "font-family": "'Arial', serif", "font-size" : 12, "font-weight" : "bold"}));
			//paper.text(20, (opts.scale || 1) * 385 + opts.y, "LEGEND").attr({"text-anchor" : "start", "font-family": "'Arial', serif", "font-size" : 12, "font-weight" : "bold"});				
			
			//console.log(opts.legend.labels);
			var div = 1, acr = 95;
			for (c = 0; c < opts.legend.labels.length; c += 1) {
				legend.push(paper.text(35 + Math.floor(c / div) * acr, (opts.scale || 1) * 405 + opts.y + c % div * 14, opts.legend.labels[c][1]).attr({"text-anchor" : "start", "font-family": "'Arial', serif", "font-size" : 12, "font-weight" : "bold"}));
				legend.push(paper.rect(20 + Math.floor(c / div) * acr, (opts.scale || 1) * 400 + opts.y + c % div * 14, 10, 10).attr({"fill" : opts.legend.labels[c][0], "stroke-opacity" : 0.5}));
			}
		}

		//draw map
		for (c = 0; c < counties.length; c += 1) {
			info = counties[c];
			//useful to have keys for both state names and abbreviations
			roster[info.fips] = county(paper, info, opts.x, opts.y, opts.scale);

			/*
			if (typeof(roster["abbr"][info["abbr"]]) === "undefined") {
				roster["abbr"][info["abbr"]] = {}
			}
			
			//useful to have keys for both state names and abbreviations
			roster["abbr"][info["abbr"]][info["name"]] = county(paper, info, opts.x, opts.y, opts.scale);
			
			if (c % 100 === 0) {
				if (typeof(opts.progress) !== "undefined") {
					opts.progress(Math.round(100 * c / counties.length));			
					//console.log(Math.round(100 * c / counties.length));
				}
			}
			*/
			
		}
		
		if (typeof(opts.onload) !== "undefined") {
			opts.onload();		
		}
		
		return {
			get_paper: function () {
				return paper;
			},
			shade: function(fips, op) {
				if (roster[fips]) {
					roster[fips].shade(op)
				}
			},			
			color: function (fips, col, op) {
				if (roster[fips]) {
					roster[fips].color(col, op);
				}
				/*
				if (typeof(roster["abbr"][st][name]) !== "undefined") {
					roster["abbr"][st][name].color(col, op);
				}
				*/
			},
			bind: function (data, override) {
				if (!override) { override = false; }
				for (var c in data) {
					if (data.hasOwnProperty(c)) {
						if (roster[data[c].fips]) {
							roster[data[c].fips].append(data[c], override);
						}
										
						/*
						if (typeof(roster["abbr"][data[c].abbr][data[c].county]) !== "undefined") {
							roster["abbr"][data[c].abbr][data[c].county].append(data[c], override);
						}
						*/
					}
				}
			},
			tooltip: function (html) {
				for (var c in roster) {
					if (roster.hasOwnProperty(c)) {
						roster[c].add_tip(html);

						/*
						for (var i in roster["abbr"][c]) {
							if (roster["abbr"][c].hasOwnProperty(i)) {
								roster["abbr"][c][i].add_tip(html);
							}
						}
						*/
					}		
				}
			},
			get_counties: function () {
				return roster;			
			},
			get_data: function () {
				return info;
			},
			update_legend: function (leg) {
				legend.remove();
				opts.legend = leg;
				legend.push(paper.text(20, (opts.scale || 1) * 385 + opts.y, opts.legend.title).attr({"text-anchor" : "start", "font-family": "'Arial', serif", "font-size" : 12, "font-weight" : "bold"}));
				for (c = 0; c < opts.legend.labels.length; c += 1) {
					legend.push(paper.text(35 + Math.floor(c / div) * acr, (opts.scale || 1) * 405 + opts.y + c % div * 14, opts.legend.labels[c][1]).attr({"text-anchor" : "start", "font-family": "'Arial', serif", "font-size" : 12, "font-weight" : "bold"}));
					legend.push(paper.rect(20 + Math.floor(c / div) * acr, (opts.scale || 1) * 400 + opts.y + c % div * 14, 10, 10).attr({"fill" : opts.legend.labels[c][0], "stroke-opacity" : 0.5}));
				}
			},
			zoom: function () {
				paper.setViewBox(100, 100, 300, 200);
			}			
		};
	};
}()); //we're running this now to create ajax results in a closure