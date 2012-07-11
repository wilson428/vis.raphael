// Raphael Charts v0.12a
//v0.12r will allow for pure raw data, no info
function visualization(opts, info, xval) {
	if (typeof (opts) === 'undefined' || typeof (opts.el) === 'undefined') {
		return;
	}

	//default dimensions if unspecified
	if (!opts.x) { opts.x = 0; }
	if (!opts.y) { opts.y = 0; }
	if (!opts.width) { opts.width = 600; }
	if (!opts.height) { opts.height = 400; }

	//properties (private to object via closure)
	//TO DO: Allow for opts.el to already by a Raphael paper instance
	var paper = Raphael(opts.el, opts.width + opts.x, opts.height + opts.y),
		axis, 	//function definition for axis
		xaxis, 	//instance
		yaxis,
		xset,
		columns,
		load_data; 	//instance
		
	//shift for data points relative to opts.x axis
	//useful if aligning line chart to a bar chart, where bar is centered between opts.x values
	opts.xshift = typeof (opts.xshift) !== 'undefined' ? opts.xshift : 0;

	//area around axes. Mimics css syntax for opts.padding, default is 75 50 50 25
	if (typeof(opts.padding) === "undefined") {
		opts.padding = [75, 50, 50, 25];
	} else if (typeof(opts.padding) === "string") {
		opts.padding = opts.padding.split(" ");
	}
	
	opts.padding = {
		'top' : parseInt(opts.padding[0], 10) || 75,
		'right' : parseInt(opts.padding[1], 10) || 50,
		'bottom' : parseInt(opts.padding[2], 10) || 50,
		'left' : parseInt(opts.padding[3], 10) || 50
	};
		
	//set size of parent element
	/*
	$('#' + opts.el).css({
		opts.width: opts.width + opts.x,
		opts.height: opts.height + opts.y
	});*/

	//DRAWING
	//shell + top rule
	if (typeof (opts.shell) === "undefined" || opts.shell) {
		paper.rect(opts.x, opts.y, opts.width, opts.height).attr({"stroke" : "#CCCCCC"});
		paper.path("M " + (opts.x + 10) + "," + (opts.y + 15) + "L" + (opts.x + opts.width-10) + "," + (opts.y + 15)).attr({"stroke" : "#000000", "stroke-width" : 3});		
	}

	//title
	if (typeof (opts.title) !== "undefined" && opts.title !== "") {
		paper.text(opts.x + 10, opts.y + 35, opts.title).attr({"font-family": "'Convergence', sans-serif", "font-size" : 20, "text-anchor" : "start", "fill" : "#000000", "opacity" : 1 });
	}
			
	// axis object
	// currently assumes independent is horizontal, dependent is vertical
	axis = function(dependency) {
		//positioning of axes
		var position = {
			x : opts.x + opts.padding.left,
			y : opts.y + opts.height - opts.padding.bottom,
			top : opts.y + opts.padding.top,
			right : opts.x + opts.width - opts.padding.right
		},
		info,
		min,
		max,
		interval,
		scale,
		length,
		ticks = paper.set(),
		labels = paper.set(),
		inst,
		label,
		draw_tick;

		if (dependency === 'independent') { //horizontal axis
			length = position.right-position.x;
			paper.path('M' + position.x + ',' + position.y + 'L' + position.right + ',' + position.y);
		} else { //vertical axis
			length = position.y-position.top;
			paper.path('M' + position.x + ',' + position.y + 'L' + position.x + ',' + position.top);
		}

		//public axis methods
		return {
			get_info: function() {
				return {
					position: position,
					scale: scale,
					length: length,
					min: min,
					max: max,
					interval: interval
				}
			},
			set_mm: function (ds, animate) {


			},
			bind_to_axis: function (info, dataset) {
				var top, bottom, left, right, c;
				if (dependency === 'independent') {
					scale = length / (info.values.length - 0.8); // This cuts off bars
					inst = info.xscale;
					min = inst.min || opts.xmin;
					max = inst.max || opts.xmax;

					//snap to nearest interval
					if (typeof(opts.ymin) === "undefined") {
						min = interval * Math.floor(min / interval);
					} 
					if (typeof(opts.ymax) === "undefined") {
						max = interval * Math.ceil(max / interval);
					}
				} else {
					if (!dataset) {
						dataset = info.datasets[0]; //if which set of opts.y values to bind to not specified, bind to first
					}
					inst = info.yscales[dataset];
					min = opts.ymin;
					max = opts.ymax;
					if (typeof(min) === "undefined" || typeof(max) === "undefined") {
						//get most extreme max-min for all graphed datasets
						for (c = 0; c < info.datasets.length; c += 1) {
							di = info.datasets[c];
							if (typeof(min) === "undefined" || parseInt(info.yscales[di].min, 10) < min) {
								min = info.yscales[di].min;
							}
							if (typeof(max) === "undefined" || parseInt(info.yscales[di].max, 10) > max) {
								max = info.yscales[di].max;
							}
						}
					}
					
					interval = guess_interval (max - min);

					//snap to nearest interval
					if (typeof(opts.ymin) === "undefined") {
						min = interval * Math.floor(min / interval);
					} 
					if (typeof(opts.ymax) === "undefined") {
						max = interval * Math.ceil(max / interval);
					}

					scale = length / (max - min); // This cuts off fills a bit, but we don't lose last bar in return
				}

				if (dependency === "independent") {
					tick_type = opts.xticks;
				} else {
					tick_type = opts.yticks;					
				}

				if (tick_type === 'BARS' || tick_type === 'TICKS') {
					if (tick_type === 'BARS') {
						left = position.x;
						right = position.right;
						bottom = position.y;
						top = position.top;
					} else if (tick_type === 'TICKS') {
						left = position.x - 3;
						right = position.x + 3;
						bottom = position.y - 3;
						top = position.y + 3;
					}

					//add ticks or bars
					if (inst.type === 'Date') {
						//make sure dates_to_tick is Array, if applicable
						if (typeof (inst.dates_to_tick) === 'number') {
							inst.dates_to_tick = [inst.dates_to_tick];
						}

						for (c = 0; c < info.values.length; c += 1) {	
							draw_tick = false;
							d = $.datepicker.parseDate(inst.format, info.values[c][inst.name]);
							if (info.xscale.dates_to_tick && info.xscale.dates_to_tick.indexOf(d.getDate()) !== -1) {
								draw_tick = true;
								label = typeof(inst.output) !== "undefined" ? inst.output : "m-d";
								label = label
									.replace('m', Raphael.vis.month_abbr[d.getMonth()])
									.replace('d', d.getDate())
									.replace(/Yy{4}/, d.getFullYear())
									.replace('yy', "'" + String(d.getFullYear()).substr(2));

								if (dependency === "independent") {
									ax = c * scale + position.x + opts.xshift;
									if (c !== 0 || opts.xshift !== 0) { // Looks weird to have a tick under the opts.y-axis
										ticks.push(paper.path('M' + ax + ',' + bottom + 'L' + ax + ',' + top));
									}
									labels.push(paper.text(ax, bottom + 13, label));
								} else {
									ay = position.y - c * scale;
									if (c !== 0 || opts.xshift !== 0) { // Looks weird to have a tick under the opts.y-axis
										ticks.push(paper.path('M' + left + ',' + ay + 'L' + right + ',' + ay));
									}
									labels.push(paper.text(left - 10, ay, label));
								}
							}
							if (inst.skip_after_tick) {
								c += inst.skip_after_tick;	
							}
						}
					} else {
						for (c = 0; c <= (max - min); c += 1) { // <= to be inclusive of top boundary
							if ((c + min) % interval === 0) {
								if (dependency === "independent") {
									ax = c * scale + position.x + opts.xshift;
									if (c !== 0 || opts.xshift !== 0) { // Looks weird to have a tick under the opts.y-axis
										ticks.push(paper.path('M' + ax + ',' + bottom + 'L' + ax + ',' + top));
									}
									labels.push(paper.text(ax, bottom + 13, c + min));
								} else {
									ay = position.y - c * scale;
									if (c !== 0 || opts.xshift !== 0) { // Looks weird to have a tick under the opts.y-axis
										ticks.push(paper.path('M' + left + ',' + ay + 'L' + right + ',' + ay));
									}
									labels.push(paper.text(left - 5, ay, c + min).attr({"text-anchor" : "end"}));
								}
							}
						}
					}
					if (tick_type === "BARS") {
						ticks.attr({"stroke" : "#CCC"});
					}				
				}
			}
		}
	}; //close axis

	//AXES
	xaxis = axis("independent");
	yaxis = axis("dependent");
	
	if (info) {
		load_data(info, xval);
	}

	load_data = function(inf, xval) {
		info = inf;
		columns = make_data_object(info);

		//check if we've specified which opts.y values to graph.
		//If not, graph all except first column, which is assumed to be xvals
		if (!xset) {
			xset = columns[0];
		}
		if (!opts.datasets) {
			opts.datasets = columns.slice(1);
		} else if (typeof(info.datasets) === 'string') { //else if we've specified one column to graph, make array
			info.datasets = [info.datasets];
		}
		xaxis.bind_to_axis();
		yaxis.bind_to_axis();			
	}
	
	console.log(this);

	//chart methods
	return {
		bind: function (info, ds) {
			load_data(info, ds);
		},
		get_axes_info: function() {
			return {
				xaxis: xaxis.get_info(),
				yaxis: yaxis.get_info()
			}
		},
		set_min_max: function(axis, ds, animate) {
			if (axis === "x" || axi === "xaxis") {
				axis.set_mm(ds, animate);
			} else {
				axis.set_mm(ds, animate);
			}
		},
		get_paper: function() {
			return paper;
		}
	}
}