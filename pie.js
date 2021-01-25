function createPie(data,groupKey){
    d3.select("#gPie").selectAll("*").remove();

    var w = 300;
    var h = 200;
    var svgPie = d3.select("#gPie")
                .attr("width", w)
                .attr("height", h)
                .attr("transform", "translate(" + 70 + "," + 20+ ")");
                
    var div = d3.select("body").append("div")
        .attr("class", "tooltip-donut")
        .style("opacity", 0);

    radius = Math.min(w, h) / 2 + 10;
    var outerRadius = radius;
    var innerRadius = 0;
    var arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);
    var pie = d3.pie();
    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var groupKeySalseByYear = d3.nest()
        .key(function(d){return d.Year_of_Release})
        .key(function(d){return d[groupKey]})
        .rollup(function(v){return d3.sum(v, function(d){return d.Global_Sales})})
        .object(data);
    delete groupKeySalseByYear["N/A"]
    delete groupKeySalseByYear["2020"]
    var yearRange = d3.keys(groupKeySalseByYear);
    // console.log(groupKeySalseByYear)
    
    var groupKeys = d3.keys(d3.nest()
        .key(function(d){return d[groupKey]})
        .object(data)
    )
    // console.log(groupKeys)
    color.domain(groupKeys);

    var pieSlider = d3.select("#pieSlider");
    // console.log(yearRange)
    var xScale = d3.scaleLinear().domain(["1980","2017"]).range([0, 670]);
    var yScale = d3.scaleLinear().domain([0, 671.8]).range([364, 0]);

    pieSlider.attr("defaultValue",1980)
        .attr("min",Math.min(...yearRange))
        .attr("max",Math.max(...yearRange))
        .on("change", function(){
            year = this.value
            // console.log(year)
            d3.select("#sliderValue").text(year);
            drawPie(year);

            x = xScale(year);
            y = yScale(d3.values(groupKeySalseByYear[year]).reduce(function(sum,value){return sum+value}))-10;

            d3.select("#sliderRect")
                .attr("x",x-2)
                .attr("y", y)
                .attr("height",370-y)
    })

    drawPie("2000");

    function drawPie(year){
        pieData = d3.values(groupKeySalseByYear[year])
        // console.log(pieData);

        svgPie.selectAll("*").remove();

        var arcs = svgPie.selectAll(".arc")
            .data(pie(pieData))
            .enter();
            
        arcs.append("path")
            .attr("class", "arc")
            .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")")
            .attr("fill", function(d, i) {
                return color(d3.keys(groupKeySalseByYear[year])[i]);
            })
            .attr('fill-opacity', 1.0)
            .attr("d", arc)
            .on("mouseover", function(d,i) {
                d3.select(this)
                .attr('fill-opacity', 0.5);

                percent = (d.endAngle-d.startAngle)/(Math.PI*2)*100

                div.transition()
                    .duration(50)
                    .style("opacity", 1);
                
                key = d3.keys(groupKeySalseByYear[year])[i]
                div.html(key + ": " + groupKeySalseByYear[year][key].toFixed(2) 
                        + ", " + percent.toFixed(2) + "%")
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 15) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                .attr('fill-opacity', 1.0);
                div.transition()
                    .duration('50')
                    .style("opacity", 0);
            });;
        
        // arcs

        
        var rects = svgPie.selectAll("rect")
            .data(d3.keys(groupKeySalseByYear[year]))
            .enter()
            .append("rect")
            .attr("x",255)
            .attr("y",function(d,i){return i*16 + 20})
            .attr("width",10)
            .attr("height",10)
            .attr("fill", function(d, i) {
                return color(d);
            });
        
        // console.log(groupKeySalseByYear)
        var pieText = svgPie.selectAll("text")
            .data(d3.keys(groupKeySalseByYear[year]))
            .enter()
            .append("text")
            .text(function(d) {
                    return d;
            })
            .attr("font-size",13)
            .attr("text-anchor", "left")
            .attr("x", 275)
            .attr("y", function(d,i) {
                return i*16 + 30;
            });
    }
}