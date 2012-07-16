// Raphael Charts v0.11a
/*global Raphael, make_data_object, visualization, makepath, endpoint, getXPost, getYPos*/
var stack = function (opts, info, xval, yvals) {
    'use strict';
	var chrt,
		c,
		i,
		ax,
		ay,
        val,
        mm,
        percent = false,
        total,
		stack,
		shape,
        shp,
		chart_info,
        path,
        path_base,
        stack_values = { "total": [], "percent": [] },
		paths = [],
		shapes = {},
		trackers = [];
    
    //need to do this here instead of in make_data_obj bc can't pass primitive by reference (right?)
	if (typeof (info) === "string") {
		info = {
			values: info
		};
	}

	info = make_data_object(info);
	opts.yvals = opts.yvals || yvals || info.columns.slice(1);

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

	mm = percent ? get_min_max(stack_values.percent[stack_values.percent.length - 1]) : get_min_max(stack_values.total[stack_values.total.length - 1]);

	chrt = visualization(opts, info, xval, opts.yvals);
	chrt.set_axis("y", 0, mm.max);

	chart_info = chrt.get_axes_info();
	
	// legend
	if (typeof (opts.legend) === "undefined" || opts.legend) {
		if (typeof (opts.legend_position) === "undefined") {
			opts.legend_position = [250, 35, 100, 15];
		} /* else if (typeof (opts.legend_position) === "string") {
			opts.legend_position = opts.legend_position.split(" ");
		} */

		i = 0;
		for (c = 0; c < opts.yvals.length; c += 1) {
			ax = opts.x + opts.padding.left + opts.legend_position[0] + Math.floor(i / 2) * opts.legend_position[2];
			ay = opts.y + opts.legend_position[1] + (i % 2) * opts.legend_position[3];
			chrt.get_paper().rect(ax - 15, ay - 5, 10, 10).attr({"fill" : info.metadata[opts.yvals[c]].color, "stroke-opacity" : 0, "opacity" : 0.8});
			chrt.get_paper().text(ax, ay, info.metadata[opts.yvals[c]].label).attr({"text-anchor" : "start", "font-family": "'Arial', serif", "font-size" : 12, "font-weight" : "bold"});
			i += 1;
		}
	}

	for (i = 0; i < stack_values.total.length; i += 1) {
		paths[i] = [];
		for (c = 0; c < info.values.length; c += 1) {
			ax = Math.round(c * chart_info.xaxis.scale + chart_info.xaxis.position.x + opts.xshift);
			val = percent ? stack_values.percent[i][c] : stack_values.total[i][c];
			ay = Math.round(chart_info.yaxis.position.y - (val - chart_info.yaxis.min) * chart_info.yaxis.scale);
			paths[i].push({ x: ax, y: ay });
		}
	}

	shape = function (path, attrs, n, index) {
		var paper = chrt.get_paper(),
			s = paper.path(path).attr(attrs),
			name = n,
			tracker = paper.ellipse(-10, -10, 5, 5).attr({ fill: info.metadata[name].color, 'stroke-width': 2, 'stroke': "#FFF" }),
			text = paper.text(-10, -10, "").attr({ 'text-anchor': 'start', 'fill': "#999" });

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
			move_tracker: function (tx) {
				var c = Math.round((tx - chart_info.xaxis.position.x) / chart_info.xaxis.scale),
					ty;
				tx = c * chart_info.xaxis.scale + chart_info.xaxis.position.x;

				ty = Math.round(chart_info.yaxis.position.y - (stack_values.total[index + 1][c] - chart_info.yaxis.min) * chart_info.yaxis.scale);	

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
				text.attr({
					x: tx + 8,
					y: ty,
					text: info.values[c][name]
				});
			},
			front: function () {
				tracker.toFront();
				text.toFront();
			}
		};
	};
	
	for (c = 0; c < paths.length - 1; c += 1) {
		path = makepath(paths[c + 1]) + "L" + endpoint(paths[c], true) + makepath(paths[c], true) + paths[c] + "L" + endpoint(paths[c + 1]);
		shapes[opts.yvals[c]] = shape(path, {"fill" : info.metadata[opts.yvals[c]].color}, opts.yvals[c], c);
		shp = shapes[opts.yvals[c]].get_shape();

		shp.drag(
			//move
			function(dx, dy, x, y, e) {
				this.path[0][1] = this.xorig + dx;
				this.path[0][2] = this.yorig + dy;
				this.drg.attr({
					path: this.path
				});
			},
			//start
			function(x, y, e) {
				this.drg = this.clone().attr({
					opacity: 0.6,
					'stroke-opacity': 0
				});
			},
			//end
			function(e) {
				this.drg.remove();
				/*
				this.path[0][1] = this.xorig;
				this.path[0][2] = this.yorig;
				this.drg.attr({
					path: this.path
				});
				*/
			}
		);
	}
	for (i = 0; i < opts.yvals.length; i += 1) {
		shapes[opts.yvals[i]].front();
	}
}