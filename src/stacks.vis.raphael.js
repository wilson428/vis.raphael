// Raphael Charts v0.11a
/*global Raphael, make_data_object, visualization, makepath, endpoint, getXPost, getYPos*/
var stack = function (opts, info, xval, yvals, percent) {
    'use strict';

	//properties
	var vis,
        stack_values,
		shapes = {},
		trackers = {},
		shape,
		stack,
		vis_info,

	//cogs
		c,
		i,
		ax, 
		ay,
        total;

	/* ---data--- */
    //need to do this here instead of in make_data_obj bc can't pass primitive by reference (right?)
	if (typeof (info) === "string") {
		info = {
			values: info
		};
	}

	//sets up viz, which initializes info and key opts properties
	vis = visualization(opts, info, xval, yvals);

	stack_values = { "total": [], "percent": [] };
	
	for (i = 0; i <= opts.yvals.length; i += 1) {
		stack_values["total"].push([]);
		stack_values["percent"].push([]);
	}

	//add up data for stack
	for (c = 0; c < info.values.length; c += 1) {
		total = 0;
		for (i = 0; i <= opts.yvals.length; i += 1) {
			stack_values.total[i][c] = total;
			if (i < opts.yvals.length) {
				total += parseInt(info.values[c][opts.yvals[i]], 10);
			}
		}
	}

	//calculate percents
	for (c = 0; c < info.values.length; c += 1) {
		for (i = 0; i <= opts.yvals.length; i += 1) {
			stack_values.percent[i][c] = 100 * stack_values.total[i][c] / stack_values.total[stack_values.total.length - 1][c];
		}
	}
	
	// legend
	if (typeof (opts.legend) === "undefined" || opts.legend) {
		if (typeof (opts.legend_position) === "undefined") {
			opts.legend_position = [250, 35, 100, 15];
		}

		i = 0;
		for (c = 0; c < opts.yvals.length; c += 1) {
			ax = opts.x + opts.padding.left + opts.legend_position[0] + Math.floor(i / 2) * opts.legend_position[2];
			ay = opts.y + opts.legend_position[1] + (i % 2) * opts.legend_position[3];
			vis.get_paper().rect(ax - 15, ay - 5, 10, 10).attr({"fill" : info.metadata[opts.yvals[c]].color, "stroke-opacity" : 0, "opacity" : 0.8});
			vis.get_paper().text(ax, ay, info.metadata[opts.yvals[c]].label).attr({"text-anchor" : "start", "font-family": "'Arial', serif", "font-size" : 12, "font-weight" : "bold"});
			i += 1;
		}
	}
	
	stack = function(percent) {
		//properties
		var paths = [],
			minmax = percent ? {min: 0, max: 100} : get_min_max(stack_values.total[stack_values.total.length - 1]),
			
		//cogs
			i,
			c,
			ax,
			ay,
			val,
			shp,
			path;
			
		//set axis, since viz guesses based on max individual extremes
		vis.set_axis("y", 0, minmax.max);
		vis_info = vis.get_axes_info();

		//values to paths
		for (i = 0; i < stack_values.total.length; i += 1) {
			paths[i] = [];
			for (c = 0; c < info.values.length; c += 1) {
				ax = Math.round(c * vis_info.xaxis.scale + vis_info.xaxis.position.x + opts.xshift);
				val = percent ? stack_values.percent[i][c] : stack_values.total[i][c];
				ay = Math.round(vis_info.yaxis.position.y - (val - vis_info.yaxis.min) * vis_info.yaxis.scale);
				paths[i].push({ x: ax, y: ay });
			}
		}

		for (c = 0; c < paths.length - 1; c += 1) {
			path = makepath(paths[c + 1]) + "L" + endpoint(paths[c], true) + makepath(paths[c], true) + paths[c] + "L" + endpoint(paths[c + 1]);
			shapes[opts.yvals[c]] = shape(path, {"fill" : info.metadata[opts.yvals[c]].color}, opts.yvals[c], c);	
		}
		for (i = 0; i < opts.yvals.length; i += 1) {
			shapes[opts.yvals[i]].front();
		}
	}

	shape = function (path, attrs, n, index) {
		var paper = vis.get_paper(),
			s = paper.path(path).attr(attrs),
			name = n,
			tracker = paper.ellipse(-10, -10, 5, 5).attr({ fill: info.metadata[name].color, 'stroke-width': 2, 'stroke': "#FFF" }),
			text = paper.text(-10, -10, "").attr({ 'text-anchor': 'middle', 'fill': "#999" }),
			label,
			shadow,
			xorig,
			yorig,
			shape_path = Raphael.pathToRelative(s.attrs.path),
			drag;

		label = paper.rect(-200, -200, 50, 35, 5).attr({ fill: '#E6E6E6', 'stroke-opacity' : 0 });
		shadow = label.clone().attr({ fill: '#999', 'stroke-opacity' : 0 });

			/*			
			shadow.drag(
				//move
				function(dx, dy) {
					shape_path[0][1] = xorig + dx;
					shape_path[0][2] = yorig + dy;
					this.attr({
						path: this.path
					});
				},
				//start
				function(x, y, e) {
					xorig = shape_path[0][1];
					yorig = shape_path[0][2];
				}
			); */

		s.mousemove(function (e) {
			for (var s in shapes) {
				if (shapes.hasOwnProperty(s)) {
					shapes[s].move_tracker(getXPos(e));
				}
			}
		});
			
		return {
			get_shape: function () {
				return s;
			},
			set_percent: function (p) {
				if (p !== percent) {
					percent = p;
				}
			},
			move_tracker: function (tx) {
				var c = Math.round((tx - vis_info.xaxis.position.x) / vis_info.xaxis.scale),
					ty;
				tx = c * vis_info.xaxis.scale + vis_info.xaxis.position.x;
				ty = Math.round(vis_info.yaxis.position.y - (stack_values.total[index + 1][c] - vis_info.yaxis.min) * vis_info.yaxis.scale);	

				if (info.values[c][name] === 0) {
					tracker.hide();
					text.hide();
				} else {
					tracker.show();
					text.show();
				}
				tracker.attr({
					cx: tx,
					cy: ty
				});
				label.attr({
					x: tx,
					y: ty - label.attr('height')
				});
				shadow.attr({
					x: tx + 2,
					y: ty - label.attr('height') - 2
				});
				//if there's a date output, assume it's a date and convert
				if (info.metadata[opts.xval].label) {
					var txt = dateview(info.values[c][opts.xval], info.metadata[opts.xval].label, info.metadata[opts.xval].format); 
				} else {
					var txt = info.values[c][opts.xval];
				}
				text.attr({
					x: tx + 24,
					y: ty - 16,
					text: txt+"\n"+add_commas(info.values[c][name])
				});
			},
			front: function () {
				shadow.toFront();
				label.toFront();
				text.toFront();
				tracker.toFront();
			}
		};
	};	
	stack();	
}