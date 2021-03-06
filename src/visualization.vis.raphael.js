// Raphael Charts v0.12a
//v0.12r will allow for pure raw data, no info
/*global $, Raphael, guess_interval, add_commas, make_data_object*/

function visualization(opts, info, xval, yvals) {
    'use strict';    
    if (typeof (opts) === 'undefined' || typeof (opts.el) === 'undefined') {
		return;
	}

    var paper,
        axis, //function definition for axis
        xaxis, //instance
        yaxis,
        load_data,
        tick_type,
        ax,
        ay,
        d; //instance

	//dummy data if none provided	
    if (!info) {
        info = [{x:0,y:0},{x:100,y:100}];
        xval = 'x';
        yvals = ['y'];
    }	
	
	$('body').append("<link rel='stylesheet' id='colorbox-css'  href='http://fonts.googleapis.com/css?family=Arvo' type='text/css' media='all' />");
	
	//default dimensions if unspecified
	if (!opts.x) { opts.x = 0; }
	if (!opts.y) { opts.y = 0; }
	if (!opts.width) { opts.width = 600; }
	if (!opts.height) { opts.height = 400; }

	//properties (private to object via closure)
	if (opts.paper) {
		paper = opts.paper;
	} else {
		paper = Raphael(opts.el, 630, opts.height + opts.y);
	}
		
	//shift for data points relative to opts.x axis
	//useful if aligning line chart to a bar chart, where bar is centered between opts.x values
	opts.xshift = typeof (opts.xshift) !== 'undefined' ? opts.xshift : 0;

	//area around axes. Mimics css syntax for opts.padding, default is 75 50 50 25
	if (typeof (opts.padding) === "undefined") {
		opts.padding = [75, 50, 50, 25];
	} else if (typeof (opts.padding) === "string") {
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
	});
	*/

	//DRAWING
	//shell + top rule
	var mat = paper.rect(opts.x, opts.y, opts.width, opts.height).attr({"stroke" : "#CCCCCC", "fill" : "#FFF"});
    
	if (typeof opts.shell === "undefined" || opts.shell === 1) {
	    var rule = paper.path("M " + (opts.x + 10) + "," + (opts.y + 40) + "L" + (opts.x + opts.width - 10) + "," + (opts.y + 40)).attr({"stroke" : "#000000", "stroke-width" : 3});
	}
	
	//title
	if (typeof (opts.title) !== "undefined" && opts.title !== "") {
		var title = paper.text(opts.x + 10, opts.y + 22, opts.title).attr({"font-family": "'Arvo', serif", "font-size" : '18pt', "font-weight" : "400", "text-anchor" : "start", "fill" : "#000000", "opacity" : 1 });
	}
			
	// axis object
	// currently assumes independent is horizontal, dependent is vertical
	axis = function (dependency) {
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
			length = position.right - position.x;
			paper.path('M' + position.x + ',' + position.y + 'L' + position.right + ',' + position.y);
		} else { //vertical axis
			length = position.y - position.top;
			paper.path('M' + position.x + ',' + position.y + 'L' + position.x + ',' + position.top);
		}

		//public axis methods
		return {
			get_info: function () {
				return {
					position: position,
					scale: scale,
					length: length,
					min: min,
					max: max,
					type: inst.type.toLowerCase() || "",
					interval: interval
				};
			},
			get_mat: function () {
				return mat;
			},
			get_labels: function () {
				return {
					labels: labels,
					ticks: ticks
				};
			},
			bind_to_axis: function (info, val, mn, mx, intv) {
				var top,
					bottom,
					left,
					right,
					c;
                    
				if (dependency === 'independent') {
				
					inst = info.metadata[val];
                    
					//set max + min to specific values, then option values, then native values
					min = typeof(mn) !== "undefined" && mn !== "auto" ? mn : inst.min;
					max = typeof(mx) !== "undefined" && mx !== "auto" ? mx : inst.max;

					if (inst.type.toLowerCase() !== "date") {
						interval = intv || inst.interval || opts.xinterval || guess_interval(max - min);
						scale = length / (max - min); // This cuts off fills a bit, but we don't lose last bar in return
					} else {				
						scale = length / (info.values.length - 0.8); // This cuts off bars
					} 

					//snap to nearest interval
					if (typeof (min) === "undefined") {
						min = interval * Math.floor(min / interval);
					}
					if (typeof (max) === "undefined") {
						max = interval * Math.ceil(max / interval);
					}
				} else {
					inst = info.metadata[val];
				
					min = typeof(mn) !== "undefined" && mn !== "auto" ? mn : opts.ymin;
					max = typeof(mx) !== "undefined" && mx !== "auto" ? mx : opts.ymax;
					if (typeof (min) === "undefined") {
						//get most extreme max-min for all graphed datasets
						for (c = 0; c < opts.yvals.length; c += 1) {
							if (typeof (min) === "undefined" || parseInt(info.metadata[opts.yvals[c]].min, 10) < min) {
								min = info.metadata[opts.yvals[c]].min;
							}
						}
					}
					if (typeof (max) === "undefined") {
						//get most extreme max-min for all graphed datasets
						for (c = 0; c < opts.yvals.length; c += 1) {
							if (typeof (max) === "undefined" || parseInt(inst.max, 10) > max) {
								max = inst.max;
							}
						}
					}
					interval = intv || inst.interval || opts.yinterval || guess_interval(max - min);

					//snap to nearest interval. Currently does this even with explicit max/min
					//if (typeof (min) === "undefined")
					min = interval * Math.floor(min / interval);
					
					//if (typeof (max) === "undefined")
					max = interval * Math.ceil(max / interval);
					
					scale = length / (max - min); // This cuts off fills a bit, but we don't lose last bar in return
					if (min < 0) {
						var yy = Math.round(position.y + min * scale);
						paper.path('M' + position.x + ',' + yy + 'L' + position.right + ',' + yy).attr({"stroke-width" : 1});
					}
				}

				if (dependency === "independent") {
					tick_type = opts.xticks || "TICKS";
				} else {
					tick_type = opts.yticks || "BARS";
				}

				ticks.remove();
				ticks.clear();
				labels.remove();
				labels.clear();

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

					if (inst && inst.type.toLowerCase() === 'date') {
						//make sure dates_to_tick is Array, if applicable
						if (typeof (inst.dates_to_tick) === 'number') {
							inst.dates_to_tick = [inst.dates_to_tick];
						}

						for (c = 0; c < info.values.length; c += 1) {
							draw_tick = false;
							d = $.datepicker.parseDate(inst.format, info.values[c][inst.name]);
							if (inst.dates_to_tick && inst.dates_to_tick.indexOf(d.getDate()) !== -1) {
								draw_tick = true;
								label = typeof (inst.output) !== "undefined" ? inst.output : "m-d";
								label = label
									.replace('m', Raphael.vis.month_abbr[d.getMonth()])
									.replace('d', d.getDate())
									.replace(/yyyy/, d.getFullYear())
									.replace('yy', String(d.getFullYear()).substr(2));

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
								if (inst.skip_after_tick) {
									c += inst.skip_after_tick;
								}
							}
						}
					} else {
						for (c = 0; c <= (max - min); c += interval) { // <= to be inclusive of top boundary
							if (parseInt(c + min, 10) % interval === 0) {
								if (dependency === "independent") {
									ax = c * scale + position.x + opts.xshift;
									if (c !== 0 || opts.xshift !== 0) { // Looks weird to have a tick under the opts.y-axis
										ticks.push(paper.path('M' + ax + ',' + bottom + 'L' + ax + ',' + top));
									}
									labels.push(paper.text(ax, bottom + 13, parseInt(c + min)));
								} else {
									ay = position.y - (c * scale);
									if (c !== 0 || opts.xshift !== 0) { // Looks weird to have a tick under the opts.y-axis
										ticks.push(paper.path('M' + left + ',' + ay + 'L' + right + ',' + ay));
									}
									if (inst.name === "letter") {
										labels.push(paper.text(left - 5, ay, String.fromCharCode(65 + 25 - c)).attr({"text-anchor" : "end"}));
									} else {
										labels.push(paper.text(left - 5, ay, add_commas(c + min)).attr({"text-anchor" : "end"}));
									}
								}
							}
						}
					}
					if (tick_type === "BARS") {
						ticks.attr({"stroke" : "#CCC"});
					}
					//ticks.toBack();
				}
			}
		};
	}; //close axis

	//AXES
	xaxis = axis("independent");
	yaxis = axis("dependent");

	load_data = function (inf, xval, yvals) {
		inf = make_data_object(inf);
		//check if we've specified which opts.y values to graph.
		//If not, graph all except first column, which is assumed to be xvals

		if (xval === "") {
			xval = "object_index";
		}
		opts.xval = xval || opts.xval || inf.columns[0];
		opts.yvals = yvals || opts.yvals || inf.columns.slice(1);

        if (typeof (opts.yvals) === 'string') { //else if we've specified one column to graph, make array
			opts.yvals = [opts.yvals];
		}

		xaxis.bind_to_axis(inf, opts.xval);
		yaxis.bind_to_axis(inf, opts.yvals[0]);
		
		return inf;
	};
	
	if (info) {
		info = load_data(info, xval, yvals);
	}

	//chart methods
	return {
        get_info: function() {
            return info;  
        },
		bind: function (info, ds) {
			load_data(info, ds);
		},
		get_axes_info: function () {
			return {
				xaxis: xaxis.get_info(),
				yaxis: yaxis.get_info()
			};
		},
		get_labels: function () {
			return {
				xaxis: xaxis.get_labels(),
				yaxis: yaxis.get_labels()
			};
		},
		set_axis: function (axis, mn, mx, intv) {
			if (axis === "x" || axis === "xaxis") {
				xaxis.bind_to_axis(info, opts.xval, mn, mx, intv);
			} else {
				yaxis.bind_to_axis(info, opts.yvals, mn, mx, intv);
			}
		},
		plot: function (x, y) {
			var chart_info = {
				xaxis: xaxis.get_info(),
				yaxis: yaxis.get_info()
			};
			
			if (chart_info.xaxis.type === "date") {
				return {
					x: Math.round(x * chart_info.xaxis.scale + chart_info.xaxis.position.x + opts.xshift),
					y: Math.round(chart_info.yaxis.position.y - (y - chart_info.yaxis.min) * chart_info.yaxis.scale)
				};
			} else {
				return {
					x: Math.round((x - chart_info.xaxis.min) * chart_info.xaxis.scale + chart_info.xaxis.position.x + opts.xshift),
					y: Math.round(chart_info.yaxis.position.y - (y - chart_info.yaxis.min) * chart_info.yaxis.scale)
				};
			}
		},
		unplot: function (x, y, snapx) {
			var chart_info = {
				xaxis: xaxis.get_info(),
				yaxis: yaxis.get_info()
			};
			var cx = (x - chart_info.xaxis.position.x - opts.xshift) / chart_info.xaxis.scale + chart_info.xaxis.min,
				cy = (chart_info.yaxis.position.y - y) / chart_info.yaxis.scale + chart_info.yaxis.min;

			//snap to previous interval. Should be optional for both axes
            if (snapx) {
                cx = cx - cx % chart_info.xaxis.interval;
            }
            
			return {
				x: Math.round(cx),
				y: Math.round(cy)
			};			
		},
		get_paper: function () {
			return paper;
		},
        get_padding: function () {
            return opts.padding;  
        },
		get_mat: function () {
			return mat;
		}
	};
}