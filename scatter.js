/**
 * Gets a single column of a dataset by name
 * @param  object		data 	the dataset to extract a column from
 * @param  string		attr 	a string denoting the column name in data
 * @return object					the single column from data identified by attr
 */
function get_column(data, attr) {
	return data.map(function(d) {
		return d[attr];
	});
}

/**
 * Gets multiple columns (subset) of a dataset by names
 * @param  object		data 	the dataset to extract columns from
 * @param  [string]	attr 	a string denoting the column name in data
 * @return object					the subset data object of columns
 */
function get_columns(data, attrs) {
	return data.map(row => attrs.reduce((acc, v) => ({ ...acc, [v]: row[v] }), {}));
}

function distinct(value, index, self) { 
    return self.indexOf(value) === index;
}

function create_scatter(data,groupKey) {
	d3.select("#scatter-area").selectAll("*").remove();

	// Create color scales
	var groupKeys = d3.keys(d3.nest()
        .key(function(d){return d[groupKey]})
        .object(data)
    )
	var scatter_color = d3.scaleOrdinal(d3.schemeCategory20).domain(groupKeys)

	data = data.filter(function(d){return d.Critic_Score>0 && d.User_Score>0});
	// console.log(data.length)

	var w = 700,
		h = 650,
		padding = 50;

	d3.select("#scatter-controls").style('width', w + "px");

	// Use "Global_Sales", "Critic_Score", "User_Score" for this visual
	const data_columns = ["Name","Global_Sales", "Critic_Score", "User_Score", groupKey],
				scatter_columns = ["Global_Sales", "Critic_Score", "User_Score"],
				x_select = document.getElementById("scatter-x"),
				y_select = document.getElementById("scatter-y");

	// Create axis selection options
	
	var scatterDiv = d3.select("#scatter-controls");
	var scatter_selects = scatterDiv.selectAll(".scatter-select");
	scatter_selects.selectAll("option")
								 .data(scatter_columns)
								 .enter()
								 .append("option")
								 .text(function(d) { return d.replace("_", " "); })
								 .attr("value", function(d) { return d; });

	var removeList = ["GG","PCFX","","AO","RP"];
	const dataset = get_columns(data, data_columns),
	groupKey_unique = get_column(dataset, groupKey).filter(distinct)
	.filter(function(d){return removeList.includes(d) ? 0:1});
	

	

	// Create SVG element
	var scatter_svg = d3.select("#scatter-area")
						.append("svg")
						.attr("width", w)
						.attr("height", h)
						.attr('id', "scatter-svg")
						.style('border-radius', '4px')
						.style('border', 'rgba(206, 212, 218, 0.25)');

	x_select.selectedIndex = 1;
	y_select.selectedIndex = 2;
	var x_option = x_select.options[x_select.selectedIndex].value,
			y_option = y_select.options[y_select.selectedIndex].value;

	//Create scale functions
	var xScale = d3.scaleLinear()
						 .domain([0, d3.max(dataset, function(d) { return d[x_option]; })])
						 .range([1.5*padding, w - padding])
						 .nice();

	var yScale = d3.scaleLinear()
						 .domain([0, d3.max(dataset, function(d) { return d[y_option]; })])
						 .range([h - padding, padding])
						 .nice();

	// Define X axis
	var xAxis = d3.axisBottom()
						.scale(xScale)
						.ticks(5);

	// Define Y axis
	var yAxis = d3.axisLeft()
						.scale(yScale)
						.ticks(5);

	// Create points
	scatter_svg.selectAll("circle")
		 .data(dataset)
		 .enter()
		 .append("circle")
		 .attr("cx", function(d) {
		 		var x = d[x_option];
		 		if (x < 0) {
					d.out_of_range = true;
		 		} else {
					d.out_of_range = false;
		 		}
				return xScale(d[x_option]);
		 })
		 .attr("cy", function(d) {
		 		var y = d[y_option];
		 		if (y < 0) {
		 			d.out_of_range = true;
		 		} else {
		 			d.out_of_range = false;
		 		}
				return yScale(d[y_option]);
		 })
		 .attr("r", 5)
		 .attr("fill", function(d) {
			if (d.out_of_range) {
				return "transparent";
			} else {
				return scatter_color(d[groupKey]);
			}
		 })
		 .on("mouseover", function(d,i) {
				d3.select(this)
				.attr('fill-opacity', 0.5);
	
				div.transition()
					.duration(50)
					.style("opacity", 1);
				
				div.html("<p> Name: "+ d.Name + "<br/>" + 
						"Global Sales: " + d.Global_Sales + "<br/>" +
						"Critic Score: " + d.Critic_Score + "<br/>" +
						"User Score: " + d.User_Score + "<br/>" +
						groupKey + ": " + d[groupKey])
					.style("left", (d3.event.pageX + 10) + "px")
					.style("top", (d3.event.pageY - 15) + "px");

		})
		.on("mouseout", function(d) {
			d3.select(this)
			.attr('fill-opacity', 1.0);
			div.transition()
				.duration('50')
				.style("opacity", 0);
		});;
	
	//Create X axis
	scatter_svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(" + 0 + "," + (h - padding) + ")")
		.call(xAxis);
	
	scatter_svg.append("text")             
			.attr("class", "x-label")
	    .attr("transform",
	          "translate(" + (w - padding) + " ," + 
	                         (h - padding / 4) + ")")
	    .style("text-anchor", "middle")
	    .text(x_option.replace("_", " "));

	//Create Y axis
	scatter_svg.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(" + (padding * 1.5) + ", 0)")
		.call(yAxis);

	scatter_svg.append("text")
			.attr("class", "y-label")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 0 + (padding / 3))
	    .attr("x",0 - (padding * 2))
	    .attr("dy", "1em")
	    .style("text-anchor", "middle")
	    .text(y_option.replace("_", " "));

	update_scatter = function() {
		var x_option = x_select.options[x_select.selectedIndex].value,
				y_option = y_select.options[y_select.selectedIndex].value;

		//Update scale domains
		xScale.domain([0, d3.max(dataset, function(d) { return d[x_option]; })]);
		yScale.domain([0, d3.max(dataset, function(d) { return d[y_option]; })]);

		//Update all circles
		scatter_svg.selectAll("circle")
			 .data(dataset)
			 .transition()
			 .duration(1500)
			 .on("start", function() {
			 })
			 .attr("cx", function(d) {
					return xScale(d[x_option]);
			 })
			 .attr("cy", function(d) {
					return yScale(d[y_option]);
			 })
			 .attr("r", 5)
			 .attr("fill", function(d) {
			 		if (d[x_option] < 0 || d[y_option] < 0) {
				 		return "transparent";
			 		} else {
				 		return scatter_color(d[groupKey]);
			 		}
			 });

		// Update X axis
		scatter_svg.select(".x.axis")
				.transition()
				.duration(1500)
				.call(xAxis);
	
		scatter_svg.select(".x-label")
				.transition()
				.duration(1500)
		    .text(x_option.replace("_", " "));
		
		// Update Y axis
		scatter_svg.select(".y.axis")
				.transition()
				.duration(1500)
				.call(yAxis);

		scatter_svg.select(".y-label")
				.transition()
				.duration(1500)
		    .text(y_option.replace("_", " "));
	}	

	scatter_selects.on("change", update_scatter);

}