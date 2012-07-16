var timeline = function () {
	var start = null;

	return function (opts) {
		if (!opts || !opts.data) {
			return;
		}

		if (typeof (opts.data) === "string") {
			$.ajax({
				url: opts.data,
				async: false,
				dataType: "text",
				success: function (csv) {
					opts.data = csv_to_object(csv, "\t").object;
				}
			});
		}

		var c = 0,
			yr = new Date(),
			tmln = [];

		yr = yr.getFullYear();
		
		for (c = 0; c < opts.data.length; c += 1) {
			if (opts.data[c]["end"] === "present") {
				opts.data[c]["end"] = yr;
			}
		}

		var x = typeof (opts.x) !== 'undefined' ? opts.x : 0,
			y = typeof (opts.y) !== 'undefined' ? opts.y : 0,
			width = typeof (opts.width) !== 'undefined' ? opts.width : 600,
			height = typeof (opts.height) !== 'undefined' ? opts.height : 400,
			paper = Raphael(opts.el, width + x, height + y),
			starts = get_min_max(opts.data, "start"),
			ends = get_min_max(opts.data, "end");
			
		if (!opts.start) {
			opts.start = Math.min(starts.min, ends.min);	
		}
		if (!opts.end) {
			opts.end = Math.max(starts.max, ends.max);
		}

		opts.start = Math.round(parseInt(opts.start, 10) / 10) * 10;

		for (c = opts.start; c <= opts.end; c += 1) {
			tmln.push({"year" : "1/1/"+c, "value" : 1});
		}
		
		var info = {
			values: tmln,
			metadata: {
				year : {
					name: "year",
					type: "Date",
					dates_to_tick: 1,
					format: "m/d/yy",
					output: "yyyy",
					skip_after_tick : 0,
					ticks: "TICKS",
					skip_after_tick: 9
				},
				value: {
					name: "value",
					type: "F",
					color: "#990000",
					min: 0,
					max: 10,
					interval: 1,
					ticks: "NONE"
				}
			}
		};
		
		var chrt = visualization(opts, info, "year", "value");
		//chrt.bind(info);
		chart_info = chrt.get_axes_info();

		chrt.get_labels().xaxis.labels.attr({ "fill" : "#999", 'font-weight' : 'bold' });
		chrt.get_labels().xaxis.ticks.attr({ "stroke" : "#e6e6e6" });

		// legend
		if (typeof (opts.legend_position) === "undefined") {
			opts.legend_position = [250, 35, 100, 15];
		}
		c = 0; i = 0;
		ax = opts.x + opts.padding.left + opts.legend_position[0] + Math.floor(i / 2) * opts.legend_position[2];
		ay = opts.y + opts.legend_position[1] + (i % 2) * opts.legend_position[3];
		chrt.get_paper().rect(ax - 15, ay - 5, 10, 10).attr({"fill" : '#80cdd1', "stroke-opacity" : 0, "opacity" : 0.8});
		chrt.get_paper().text(ax, ay, "President").attr({"fill" : "#666", "text-anchor" : "start", "font-family": "'Arial', serif", "font-size" : 12, "font-weight" : "bold"});
		i += 1;
		ax = opts.x + opts.padding.left + opts.legend_position[0] + Math.floor(i / 2) * opts.legend_position[2];
		ay = opts.y + opts.legend_position[1] + (i % 2) * opts.legend_position[3];
		chrt.get_paper().rect(ax - 15, ay - 5, 5, 10).attr({"fill" : '#4d9aa1', "stroke-opacity" : 0, "opacity" : 0.8});
		chrt.get_paper().rect(ax - 10, ay - 5, 5, 10).attr({"fill" : '#FF9933', "stroke-opacity" : 0, "opacity" : 0.8});
		chrt.get_paper().text(ax, ay, "Draft age").attr({"fill" : "#666", "text-anchor" : "start", "font-family": "'Arial', serif", "font-size" : 12, "font-weight" : "bold"});
		i += 1;
		ax = opts.x + opts.padding.left + opts.legend_position[0] + Math.floor(i / 2) * opts.legend_position[2];
		ay = opts.y + opts.legend_position[1] + (i % 2) * opts.legend_position[3];
		chrt.get_paper().rect(ax - 15, ay - 5, 10, 10).attr({"fill" : '#FFCC99', "stroke-opacity" : 0, "opacity" : 0.8});
		chrt.get_paper().text(ax, ay, "Candidate").attr({"fill" : "#666", "text-anchor" : "start", "font-family": "'Arial', serif", "font-size" : 12, "font-weight" : "bold"});

		vert = 0;
		for (c = 0; c < opts.data.length; c += 1) {
			x_start = Math.round((parseInt(opts.data[c].start, 10) - parseInt(opts.start, 10)) * chart_info.xaxis.scale + chart_info.xaxis.position.x + opts.xshift);
			x_end = Math.round((parseInt(opts.data[c].end, 10) - parseInt(opts.start, 10)) * chart_info.xaxis.scale + chart_info.xaxis.position.x + opts.xshift);

			xe_start = Math.round((parseInt(opts.data[c].start, 10)  + 16 - parseInt(opts.start, 10)) * chart_info.xaxis.scale + chart_info.xaxis.position.x + opts.xshift);
			xe_end = Math.round((parseInt(opts.data[c].start, 10) + 26 - parseInt(opts.start, 10)) * chart_info.xaxis.scale + chart_info.xaxis.position.x + opts.xshift);

			y = Math.round(chart_info.yaxis.position.top) + vert * 25 + 20;

			if (opts.data[c].status === "president") {
				color1 = "#80cdd1";
				color2 = "#4d9aa1";
			} else {
				color1 = "#FFCC99";
				color2 = "#FF9933";			
			}

			if (opts.data[c].type === "widespan") {
				chrt.get_paper().rect(x_start, y - 20, x_end - x_start, chart_info.yaxis.position.y - chart_info.yaxis.position.top).attr({"fill" : "#ddd", "stroke-opacity" : 0});
				chrt.get_paper().text(x_start + (x_end - x_start) /2, y - 25, opts.data[c].label.toUpperCase()).attr({"fill" : "#999", "text-anchor" : "middle", "font-size" : 11, 'font-weight' : 'bold'});
			} else {
				chrt.get_paper().rect(x_start, y, x_end - x_start, 14).attr({"fill" : color1, "stroke-opacity" : 0});
				chrt.get_paper().rect(xe_start, y, xe_end - xe_start, 14).attr({"fill" : color2, "stroke-opacity" : 0});

				chrt.get_paper().text(x_start + 2, y + 8, opts.data[c].label.toUpperCase()).attr({"fill" : "#FFF", "text-anchor" : "start", "font-size" : 11, 'font-weight' : 'bold'});
				vert += 1;

				if (opts.data[c].end === 2012) {
					var pth = "M" + x_end + "," + y + "L" + (x_end + 7) + "," + (y + 7) + "L" + x_end + "," + (y + 14) + "L" + x_end + "," + y;
					chrt.get_paper().path(pth).attr({"fill" : color1, "stroke-opacity" : 0});				
				}

			}		
		}
		
		return {
			bind: function() {}
		}	
	};
}();