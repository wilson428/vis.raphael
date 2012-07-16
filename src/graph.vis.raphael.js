// Raphael Charts v0.11a

var graph = function(opts, info, xval, yvals, graph_types) {
	var vis = visualization(opts, info, xval, yvals),
	c,
	i,
	lx,
	ly,
	graph,
	shapes = {};

	graph_types = graph_types || {};
	for (c = 0; c < opts.yvals.length; c += 1) {
		//console.log(opts.yvals[c], graph_types);
		info.metadata[opts.yvals[c]].graph_type = info.metadata[opts.yvals[c]].graph_type || graph_types[opts.yvals[c]] || "LINE";
	}
		
	// legend	
	if (typeof (opts.legend) === "undefined" || opts.legend) {
		opts.legend_position = opts.legend_position || [250, 35, 100, 15];
		if (typeof (opts.legend_position) === "string") {
			opts.legend_position = opts.legend_position.split(" ");			
		}

		i = 0;
		for (c = 0; c < opts.yvals.length; c += 1) {
			ax = opts.x + opts.padding.left + opts.legend_position[0] + Math.floor(i / 2) * opts.legend_position[2];
			ay = opts.y + opts.legend_position[1] + (i % 2) * opts.legend_position[3];
			//draw a line for LINE graph, rect for FILL graph		
			if (info.metadata[opts.yvals[c]].graph_type === "LINE") {
				vis.get_paper().path("M " + (ax - 20) + "," + ay + "L" + (ax - 5) + "," + ay).attr({"stroke" : info.metadata[opts.yvals[c]].color, "stroke-width" : 3});
			} else {
				vis.get_paper().rect(ax - 15, ay - 5, 10, 10).attr({"fill" : info.metadata[opts.yvals[c]].color, "stroke-opacity" : 0, "opacity" : 0.8});
			}
			vis.get_paper().text(ax, ay, info.metadata[opts.yvals[c]].label).attr({"text-anchor" : "start", "font-family": "'Arial', serif", "font-size" : 12, "font-weight" : "bold"});
			i += 1;
		}
	}

	graph = function () {
		var graph_type,
			path,
			ax,
			ay,
			chart_info = vis.get_axes_info();

		for (i = 0; i < opts.yvals.length; i += 1) {
			graph_type = info.metadata[opts.yvals[i]].graph_type;
			if (graph_type === "LINE" || graph_type === "FILL") {
				path = "";
				for (c = 0; c < info.values.length; c += 1) {
					ax = Math.round(c * chart_info.xaxis.scale + chart_info.xaxis.position.x + opts.xshift);
					ay = Math.round(chart_info.yaxis.position.y - (info.values[c][opts.yvals[i]] - chart_info.yaxis.min) * chart_info.yaxis.scale);
					if (path === "") {
						path = 'M' + ax + ',' + ay;
					} else {
						path += 'L' + ax + ',' + ay;
					}
				}
			}
			if (graph_type === "FILL") {
				c -= 1;
				path += 'L' + (c * chart_info.xaxis.scale + chart_info.xaxis.position.x) + ',' + chart_info.xaxis.position.y;
				path += 'L' + chart_info.xaxis.position.x + ',' + chart_info.xaxis.position.y;
				path += 'L' + chart_info.xaxis.position.x + ',' + chart_info.xaxis.position.y - (info.values[0][opts.yvals[i]]-chart_info.min) * chart_info.xaxis.position.scale;
				attrs = { "fill" : info.metadata[opts.yvals[i]].color, "opacity" : 0.8, "stroke" : info.metadata[opts.yvals[i]].color, "stroke-width" : 2 };
			} else {
				attrs = { "stroke" : info.metadata[opts.yvals[i]].color, "stroke-width" : 2, "opacity" : 1, "stroke-opacity" : 1};
			}			
			vis.add_shape(vis.make_shape(path, attrs, opts.yvals[i]), opts.yvals[i]);
		}
		
	}
	graph();
	
	vis.set_axis("y", 0, 110);
}
						
		/*
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
		
		//mouseover
		shape.mouseover(function(e) {
			this.attr({"stroke-width" : 4});
		}).mouseout(function(e) {
			this.attr({"stroke-width" : 2});
		});
		
		specs.tags = typeof (specs.tags) !== "undefined" ? specs.tags : {};

		//DRAWING
		if (specs.graph_type === "BARS") {
			specs.bar_opts.padding = typeof (specs.bar_opts.padding) !== 'undefined' ? specs.bar_opts.padding : 1;
			w = xaxis.get_info().length / data.length - specs.bar_opts.padding;
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
		}
		
		//animation
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
	for (i = 0; i < opts.yvals.length; i += 1) {
		graphs[opts.yvals[i]] = graph(opts.yvals[i]);
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
		*/