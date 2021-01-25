function createArea(data,groupKey){
    // d3.select("#pieArea").selectAll("svg > *").remove();
    d3.select("#gArea").selectAll("*").remove();

    var margin = {top: 20, right: 100, bottom: 16, left: 30},
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    var xScale = d3.scaleLinear()
        .range([0, width]);

    var yScaleArea = d3.scaleLinear()
        .range([height, 0]);

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var xAxis = d3.axisBottom().scale(xScale);
    var yAxis = d3.axisLeft().scale(yScaleArea);
       

    var area = d3.area()
        .x(function(d) { return xScale(+d.data.year); })
        .y0(function(d) { return yScaleArea(d[0]); })
        .y1(function(d) { return yScaleArea(d[1]); })
        .curve(d3.curveMonotoneX);;

    var stack = d3.stack();
    
    // var svgPieArea = d3.select("#pieArea").append("svg")
    d3.select("#svgPieArea")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom) //height + margin.top + margin.bottom
    // var svgArea = svgPieArea.append("g")
    var svgArea = d3.select("#gArea")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var div = d3.select("body").append("div")
        .attr("class", "tooltip-donut")
        .style("opacity", 0);    

        var salesByYear = d3.nest()
        .key(function(d){return d.Year_of_Release})
        .key(function(d){return d[groupKey]})
        .rollup(function(v){return d3.sum(v, function(d){return d.Global_Sales})})
        .object(data);
    delete salesByYear["N/A"]
    delete salesByYear["2020"]

    var groupKeys = d3.keys(d3.nest()
        .key(function(d){return d[groupKey]})
        .object(data)
    )
    var years = d3.keys(salesByYear).sort();
    // console.log(years);

    var lineData = [];
    for(var i in years){
        lineData.push({});
        for(var j in groupKeys){
            lineData[i][groupKeys[j]] = 0;
        }
        for(var key in salesByYear[years[i]]){
            lineData[i][key] = salesByYear[years[i]][key];
        }
    }
    lineData.forEach(function(d,i){
        d.year = years[i];
    })
    // console.log("lineData");
    // console.log(lineData);

    // color.domain(groupKeys);
    color.domain(d3.keys(lineData[0]).filter(function(key) {return key !== "year"; }));
    // console.log(color.domain())

    var maxYearVal = d3.max(lineData, function(d){
        var vals = d3.keys(d).map(
        function(key){ 
            return key !== "year" ? d[key] : 0 });
        return d3.sum(vals);
    });
    // console.log(maxYearVal)

    // console.log(d3.extent(lineData, function(d) { return d.year; }))
    xScale.domain(d3.extent(lineData, function(d) { return d.year; }));
    yScaleArea.domain([0, maxYearVal])
    

    stack.keys(groupKeys)
    stack.order(d3.stackOrderNone);
    stack.offset(d3.stackOffsetNone);

    // var browsers = stack(lineData);
    // console.log(browsers)

    var browser = svgArea.selectAll('.browser')
        .data(stack(lineData))
        .enter().append('g')
        .attr('class', function(d){ return 'browser ' + d.key; })
        .attr('fill-opacity', 1.0);

    browser.append('path')
        .attr('class', 'area')
        .attr('d', area)
        .style('fill', function(d) { return color(d.key); })
        .on("mouseover", function(d,i) {
            d3.select(this)
            .attr('fill-opacity', 0.5);

            div.transition()
                .duration(50)
                .style("opacity", 1);
            
            div.html(groupKeys[i])
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 15) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
            .attr('fill-opacity', 1.0);
            div.transition()
                .duration('50')
                .style("opacity", 0);
        });

    svgArea.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

    svgArea.append('g')
        .attr('class', 'y axis')
        .call(yAxis);
    
    
    var pieSlider = d3.select("#pieSlider");
    svgArea.append("rect")
        .attr("id","sliderRect")
        .attr("name","sliderRect")
        .attr("x",xScale("2000")-2)
        .attr("y", 245)
        .attr("width",4)
        .attr("height",145)
        .attr("fill", "red")
        .attr('fill-opacity', 0.5);
}