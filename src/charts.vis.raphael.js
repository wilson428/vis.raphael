// Raphael Charts v0.11a
(function () {
	function Chart(paper, instructions, data, opts) {
		//defaults for options
		opts = typeof (opts) !== 'undefined' ? opts : {};
		opts.padding = typeof (opts.padding) !== 'undefined' ? opts.padding : "75 50 50 25";
		opts.xshift = typeof (opts.xshift) !== 'undefined' ? opts.xshift : 0;
		opts.showx = typeof (opts.showx) !== 'undefined' ? opts.showx : true;
		opts.showy = typeof (opts.showy) !== 'undefined' ? opts.showy : true;
		
		//declarations
		var x = typeof (opts.x) !== 'undefined' ? opts.x : 0,
			y = typeof (opts.y) !== 'undefined' ? opts.y : 0,
			width = typeof (opts.width) !== 'undefined' ? opts.width : 600,
			height = typeof (opts.height) !== 'undefined' ? opts.height : 400,
			axis, 
			graph,
			xaxis,
			yaxis,
			graphs = {}, //instances + containers of above			
			c, i, lx, ly,
			color,
			path,
			dot,
			dots = paper.set(),
			decorations = paper.set(),
			event,
			shape,
			pads = opts.padding.split(' '),
			padding = {
				'top' : typeof (pads[0]) !== "undefined" ? parseInt(pads[0], 10) : 75,
				'right' : typeof (pads[1]) !== "undefined" ? parseInt(pads[1], 10) : 50,
				'bottom' : typeof (pads[2]) !== "undefined" ? parseInt(pads[2], 10) : 50,
				'left' : typeof (pads[3]) !== "undefined" ? parseInt(pads[3], 10) : 25
			};

		//check if we've specified which y values to graph. If not, graph all. Else if we've specified one y value to graph, make array
		if (typeof (opts.datasets) === "undefined") {
			opts.datasets = [];
			for (c in instructions.yscales) {
				if (instructions.yscales.hasOwnProperty(c)) {
					opts.datasets.push(c);
				}
			}
		} else if (typeof (opts.datasets) === 'string') {
			opts.datasets = [opts.datasets];
		}

		//shell + top rule
		if (typeof (opts.shell) === "undefined" || opts.shell) {
			paper.rect(x, y, width, height).attr({"stroke" : "#CCCCCC"});
			paper.path("M " + (x + 10) + "," + (y + 15) + "L" + (x + width-10) + "," + (y + 15)).attr({"stroke" : "#000000", "stroke-width" : 4});		
		}

		//title
		if (typeof (instructions.info.title) !== "undefined" && instructions.info.title !== "") {
			paper.text(x + 10, y + 35, instructions.info.title).attr({"font-family": "'Convergence', sans-serif", "font-size" : 20, "text-anchor" : "start", "fill" : "#000000", "opacity" : 1 });
		}
		
		// legend
		c = 0;
		if (typeof (opts.legend) === "undefined" || opts.legend) {
			for (i in instructions.yscales) {
				if (instructions.yscales.hasOwnProperty(i)) {
					if (typeof (opts.legend_position) === "undefined") {
						opts.legend_position = [250, 35, 100, 15];
					}
	
					lx = x + padding.left + opts.legend_position[0] + Math.floor(c / 2) * opts.legend_position[2];
					ly = y + opts.legend_position[1] + (c % 2) * opts.legend_position[3];
					//if color not specified, choose random
					if (typeof (instructions.yscales[i].color) === "undefined") {
						instructions.yscales[i].color = "rgb(" + randInt(256) + "," + randInt(256) + "," + randInt(256) + ")";
					}
					//draw a line for LINE graph, rect for FILL graph
					if (instructions.yscales[i].graph_type === "LINE") {
						paper.path("M " + (lx-20) + "," + ly + "L" + (lx-5) + "," + ly).attr({"stroke" : instructions.yscales[i].color, "stroke-width" : 3});
					} else {
						paper.rect(lx-15, ly-5, 10, 10).attr({"fill" : instructions.yscales[i].color, "stroke-opacity" : 0, "opacity" : 0.8});
					}
					paper.text(lx, ly, instructions.yscales[i].label).attr({"text-anchor" : "start", "font-family": "'Arial', serif", "font-size" : 12, "font-weight" : "bold"});
					c += 1;
				}
			}
		}
		
		// creates an axis
		// currently assumes independent is horizontal, dependent is vertical
		// info is the scales info for the dataset to be graphed
		axis = function(data, info, dependency) {
			//positioning of axes
			var position = {
				x : x + padding.left,
				y : y + height-padding.bottom,
				top : y + padding.top,
				right : x + width-padding.right
			},
			ticks = paper.set(),
			labels = paper.set(),
			top,
			bottom,
			left,
			right,
			c, d,
			label,
			range = get_min_max(data, info.name);
			
			//locate min/max and calculate interval if not specified. Functions in vis.raphael
			//TO DO -- guess when min should be 0
			info.min = typeof (info.min) !== "undefined" ? info.min : range.min;
			info.max = typeof (info.max) !== "undefined" ? info.max : range.max;
			info.interval = typeof (info.interval) !== "undefined" ? info.interval : guess_interval(info.max - info.min);

			if (dependency === 'independent') { //horizontal axis
				info.length = position.right-position.x;
				info.scale = info.length / (data.length); // This cuts off fills a bit, but we don't lose last bar in return
			} else { //vertical axis
				info.length = position.y-position.top;
				info.scale = info.length / (info.max-info.min);
			}

			//public axis methods
			return {
				get_info: function () { return info; },
				get_position: function () { return position; },
				//tick_type = "NONE", "BARS", "TICKS"	
				draw: function(tick_type) {
					var ax, ay;
					if (dependency === 'independent') {
						//draw axis
						paper.path('M' + position.x + ',' + position.y + 'L' + position.right + ',' + position.y);
						if (tick_type === 'BARS' || tick_type === 'TICKS') {
							if (tick_type === 'BARS') {
								bottom = position.y;
								top = position.top;
							} else if (tick_type === 'TICKS') {
								bottom = position.y-3;
								top = position.y + 3;
							}
							//Go through and draw the ticks or bars on the axis								
							for (c = 0; c < data.length; c += 1) {
								ax = c * info.scale + position.x + opts.xshift;
								if (info.type === 'Date') {	
									//make sure dates_to_tick is Array
									if (typeof (info.dates_to_tick) === 'number') {
										info.dates_to_tick = [info.dates_to_tick];
									}
									d = $.datepicker.parseDate(info.format, data[c][info.name]);
									if (info.dates_to_tick.indexOf(d.getDate()) !==-1) {
										label = typeof(info.output) !== "undefined" ? info.output : "m-d";
										label = label
											.replace('m', Raphael.vis.month_abbr[d.getMonth()])
											.replace('d', d.getDate())
											.replace(/Yy{4}/, d.getFullYear())
											.replace('yy', String(d.getFullYear()).substr(2));
										if (c !== 0 || opts.xshift !== 0) { // Looks weird to have a tick under the y-axis
											ticks.push(paper.path('M' + ax + ',' + bottom + 'L' + ax + ',' + top));
										}
										labels.push(paper.text(ax, bottom + 13, label));
										c += info.skip_after_tick;	
									}
								} else {
									if (c % info.interval === 0) {
										label = c + info.min;
										if (c !== 0 || opts.xshift !== 0) { // Looks weird to have a tick under the y-axis
											paper.path('M' + ax + ',' + bottom + 'L' + ax + ',' + top);
										}
										paper.text(ax, bottom + 13, label);
									}
								}
							}
						}		
					} else { //dependent variable
						paper.path('M' + position.x + ',' + position.y + 'L' + position.x + ',' + position.top);
						if (tick_type === 'BARS' || tick_type === 'TICKS') {							
							if (tick_type === 'BARS') {
								left = position.x;
								right = position.right;
							} else if (tick_type === 'TICKS') {
								left = position.x - 3;
								right = position.x + 3;
							}
							for (c=info.min; c <= info.max; c += 1) {
								if (c % info.interval === 0) {
									ay = position.y - (c-info.min) * info.scale;
									if (c > info.min) { // Looks weird to have a tick under the y-axis
										ticks.push(paper.path('M' + left + ',' + ay + 'L' + right + ',' + ay).attr({"stroke" : "#CCC" }));
									}
									labels.push(paper.text(left-5, ay, c).attr({'text-anchor' : 'end'}));
								}
							}
						}
					}
				}
			};
		};

		xaxis = axis(data, instructions.xscale, "independent");
		//Here we need to choose one set of y values for scale
		yaxis = axis(data, instructions.yscales[opts.datasets[0]], "dependent");
		if (opts.showx) {		
			xaxis.draw('TICKS');
		}
		if (opts.showy) {
			yaxis.draw('BARS');
		}
		//data_set = which set of values to graph
		graph = function(dataset) {
			var ax, ay,
				sign = 1,
				h,
				offset,
				path = "",
				g = paper.set(),
				attrs,
				w,
				bar_label,
				specs = instructions.yscales[dataset];
			specs.graph_type = typeof (specs.graph_type) !== 'undefined' ? specs.graph_type : "LINE";

			//make empty tags object if not exists, so that don't get error later
			specs.tags = typeof (specs.tags) !== "undefined" ? specs.tags : {};

			//DRAWING
			if (specs.graph_type === "BARS") {
				specs.bar_padding = typeof (specs.bar_padding) !== 'undefined' ? specs.bar_padding : 1;
				w = xaxis.get_info().length / data.length - specs.bar_padding;
				attrs = { "stroke-opacity" : 0, "fill" : specs.color  };
				for (c = 0; c < data.length; c += 1) {
					ax = c * xaxis.get_info().scale + xaxis.get_position().x;
					ay = yaxis.get_position().y-(data[c][dataset]-yaxis.get_info().min) * yaxis.get_info().scale;				
					shape = paper.rect(ax, ay, w, xaxis.get_position().y - ay).attr(attrs);
					//tether data to shape for easy event retrieval
					shape.info = {
						index: c,
						data: data[c][dataset]
					};
					g.push(shape);
				}
			} else { // LINE or FILL
				for (c = 0; c < data.length; c += 1) {
					ax = c * xaxis.get_info().scale + xaxis.get_position().x + opts.xshift;
					ay = yaxis.get_position().y-(data[c][dataset]-yaxis.get_info().min) * yaxis.get_info().scale;				
					if (path === "") {
						path = 'M' + ax + ',' + ay;
					} else {
						path += 'L' + ax + ',' + ay;			
					}
					//decoration
					if (typeof (specs.decorations) !== "undefined") {
						shape = paper.ellipse(ax, ay, 5, 5).attr({"fill" : specs.color, opacity: 0.6, "stroke-opacity" : 0});
						shape.info = {
							index: c,
							data: data[c][dataset]
						};
						g.push(shape);
					}
					
					//events
					if (typeof (specs.tags[data[c][instructions.xscale.name]]) !== "undefined") {
						event = specs.tags[data[c][instructions.xscale.name]];
						dot = paper.circle(ax, ay, 4).attr({"stroke" : "#000099", "stroke-width" : 3, "fill" : "#FFF" });
						dot.tooltip('<strong>' + event.name + '</strong><br /><em>Click to read story.</em>', data[c], 300);
						if (typeof (event.url) !== "undefined") {
							dot.attr({
								"href" : event.url,
								"target" : "blank"
							});
						}
						dots.push(dot);
					}
				}
				if (specs.graph_type === "FILL") {
					c -= 1;
					path += 'L' + (c * xaxis.get_info().scale + xaxis.get_position().x) + ',' + xaxis.get_position().y;
					path += 'L' + xaxis.get_position().x + ',' + xaxis.get_position().y;
					path += 'L' + xaxis.get_position().x + ',' + yaxis.get_position().y - (data[0][dataset]-yaxis.get_info().min) * yaxis.get_info().scale;
					attrs = { "fill" : specs.color, "opacity" : 0.8, "stroke" : specs.color, "stroke-width" : 2 };
				} else {
					attrs = { "stroke" : specs.color, "fill" : specs.color, "stroke-width" : 2, "opacity" : 1, "stroke-opacity" : 1};
				}
				shape = paper.path(path).attr(attrs);				
				shape.attr({ "fill-opacity" : 0 });

				//mouseover
				shape.mouseover(function(e) {
					this.attr({"stroke-width" : 4});
				}).mouseout(function(e) {
					this.attr({"stroke-width" : 2});
				});

				//TO DO: surface value in tooltip

				//g.push(shape);
				attrs['stroke-opacity'] = 0;
				g.attr(attrs);
				g.toFront();
			}
						
			// check for animation
			if (typeof (opts.animation) !== "undefined" && opts.animation) {
				opts.anim_time = typeof (opts.anim_time) !== "undefined" ? opts.anim_time : 2000;
				//draw graph invisibly, since needs to be full size to measure bounding box.
				if (typeof (opts.animate_from) !== "undefined" && opts.animate_from === "top") {
					sign = -1;
					offset = yaxis.get_position().top - g.getBBox().y;
				} else {
					sign = 1;
					offset = xaxis.get_position().y - g.getBBox().y2;
				}
				//breaks animation from top down
				h = sign * g.getBBox().height / 2 + offset;
				g.attr({
					"transform" : "t0 " + h + " s1 0",
					"opacity" : 0.8
				});// + xaxis.get_position().y);
				g.animate({
					//"path" : path
					"transform" : "t0 0 s1 1"
				}, opts.anim_time, "linear");
			} else {
				g.attr({"opacity" : 1});// = paper.path(path).attr(attrs);
			}
			
			//public methods for graph
			return {
				select: function(index, col, show_data) {				
					col = typeof (col) !== "undefined" ? col : specs.color;
					//see if set or single object
					if (typeof (g[1]) === "undefined") {
						g.attr({fill: col});
						return -1;
					}
					if (typeof (index) == "undefined") {
						return -1;
					}
					g.attr(attrs);
					//select
					g[index].attr({ fill: col, stroke: col });
					if (show_data) {
						if (typeof(bar_label) !== "undefined") {
							bar_label.remove();
						}
						if (specs.graph_type === "BARS") {
							bar_label = paper.text(g[index].attrs.x + g[index].attrs.width / 2, g[index].attrs.y - 8, add_commas(g[index].info.data)).attr({"text-anchor" : "middle", "fill" : col, "font-weight" : "bold", "font-size" : "10pt" });
						} else {
							if (g[index].attrs.cy > opts.height / 2) {					
								bar_label = paper.text(g[index].attrs.cx, g[index].attrs.cy - 14, add_commas(g[index].info.data)).attr({"text-anchor" : "middle", "fill" : col, "font-weight" : "bold", "font-size" : "12pt" });													
							} else {
								bar_label = paper.text(g[index].attrs.cx, g[index].attrs.cy + 14, add_commas(g[index].info.data)).attr({"text-anchor" : "middle", "fill" : col, "font-weight" : "bold", "font-size" : "12pt" });													
							}
						}
					}
					g[index].toFront();
					return g[index];
				},
				get_g: function() {
					return g;
				}
			};
			
		};
		for (i = 0; i < opts.datasets.length; i += 1) {
			graphs[opts.datasets[i]] = graph(opts.datasets[i]);
		}
		dots.toFront();

		return {
			select: function(name, index, col, show_data) {	
				var gr = typeof (graphs[name]) !== "undefined" ? graphs[name] : graphs[0];
				if (typeof (gr) === "undefined") {
					return;
				}
				var o = gr.select(index, col, show_data);
				return o;
			},
			get_graphs: function() {
				return graphs;
			}
		};
	}
	
	//inheritance
	var F = function () {};
	F.prototype = Raphael.scribe;
	Chart.prototype = new F;

	//public
	Raphael.fn.chart = function(opts) {
		var pr = this, lg;
		if (typeof (opts) === "undefined") {
			return;
		}
		switch(typeof (opts.data)) {
			case "undefined" : return;
			case "object" : {
				return loadGraph(opts.data);
			} break;
			case "string" : {
				//load JSON instructions from file
				$.ajax({
					url: opts.data,
					dataType: "json",
					async: false,
					success: function(inst) {
						lg = loadGraph(inst);
					}
				});	
			} break;
			default: return;
			return lg;
		}

		function loadGraph (inst) {
			if (typeof (inst.values) === "undefined") {
				return;
			}
			var chrt;
			//load csv
			if (typeof (inst.values) === "string") {
				$.ajax({
					url: inst.values,
					async: false, //should make this async with callback
					dataType: "text",
					success: function(csv) {
						var data = csv_to_object(csv, ",");
						chrt = new Chart(pr, inst, data, opts);
					}
				});
			} else if (typeof (inst.values) === "object") {
				chrt = new Chart(pr, inst, inst.values, opts);
			}
			return chrt;
		}
	}
})();