function createLine(data,groupKey){
    d3.select("#line").selectAll("*").remove();

    var margin = {top: 20, right: 100, bottom: 50, left: 30},
    width = 700 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    var xScale = d3.scaleLinear()
        .range([0, width]);

    var yScaleLine = d3.scaleLinear()
        .range([height, 0]);

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var xAxis = d3.axisBottom()
        .scale(xScale);
    var yAxis = d3.axisLeft().scale(yScaleLine);

    var line = d3.line()
        .x(function(d) { return xScale(d.year); })
        .y(function(d) { return yScaleLine(d.sales); })
        .defined(function(d) { return d.sales; })
        .curve(d3.curveMonotoneX);
    
    var maxY;

    var svgLine = d3.select("#line").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom) //height + margin.top + margin.bottom
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var salesByYear = d3.nest()
        .key(function(d){return d.Year_of_Release})
        .key(function(d){return d[groupKey]})
        .rollup(function(v){return d3.sum(v, function(d){return d.Global_Sales})})
        .object(data);
    delete salesByYear["N/A"]
    delete salesByYear["2020"]

    removeList = ["GG","PCFX","","AO","RP"];
    var groupKeys = d3.keys(d3.nest()
        .key(function(d){return d[groupKey]})
        .object(data)
    ).filter(function(d){return removeList.includes(d) ? 0:1});
    defaultKey = groupKeys.slice(0,3);
    // console.log("here")
    // console.log(groupKeys)

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
    // console.log(lineData);


    color.domain(groupKeys);

    var categories = color.domain().map(function(name) { // Nest the data into an array of objects with new keys
        return {
        name: name, // "name": the csv headers except year
        values: lineData.map(function(d) { // "values": which has an array of the dates and saless
                            return {
                                year: d.year, 
                                sales: +(d[name]),
                            };
                        }),
                        visible: ( defaultKey.includes(name)  ? true : false) 
                        // visible: true
        }
        
    });
    // console.log(categories);

    minX = findMinX(categories);
    maxX = findMaxX(categories);
    maxY = findMaxY(categories);
    // maxY = d3.max(categories, function(c) { return d3.max(c.values, function(v) { return v.sales; }); })
    // console.log(maxY);

    // xScale.domain(d3.extent(years, function(d) { return d;}))
    xScale.domain([minX, maxX]);
    yScaleLine.domain([0, maxY]);

    svgLine.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svgLine.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("x", -10)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Global Sales");

    var issue = svgLine.selectAll(".issue")
        .data(categories) // Select nested data and append to new svg group elements
        .enter().append("g")
        .attr("class", "issue");

    // console.log(color("PC"))

    issue.append("path")
        .attr("class", "line")
        .style("pointer-events", "none") // Stop line interferring with cursor
        .attr("id", function(d) {
            return "line-" + d.name.replace(" ", "").replace("/", ""); // Give line id of line-(insert issue name, with any spaces replaced with no spaces)
        })
        .attr("d", function(d) { 
            return d.visible ? line(d.values) : null; // If array key "visible" = true then draw line, if not then don't 
        })
        .attr("clip-path", "url(#clip)")//use clip path to make irrelevant part invisible
        .style("stroke", function(d) { return color(d.name); })
    
    // // control scatter chart
    // var scatter_svg = d3.select("#scatter-area");
    // var points = scatter_svg.selectAll("circle");
    // points.attr("fill", function(d) {
    //     if (d.out_of_range) {
    //         return "transparent";
    //     } else {
    //         return color(d[groupKey]);
    //     }
    // })
    // .attr('fill-opacity',function(d){
    //     if(d[groupKey] === defaultKey){
    //         d.visible = true;
    //         return 1.0;
    //     }else{
    //         d.visible = false;
    //         return 0.0;
    //     }
    // });



    // draw legend
    var legendSpace = 350 / categories.length;

    issue.append("rect")
        .attr("width", 9)
        .attr("height", 9)                                    
        .attr("x", width + (margin.right/3) - 15) 
        .attr("y", function (d, i) { return (legendSpace)+i*(legendSpace) - 16; })  // spacing
        .attr("fill",function(d) {
            return d.visible ? color(d.name) : "#DDDDDD"; // If array key "visible" = true then color rect, if not then make it grey 
        })
        .attr("class", "legend-box")
        .on("click", function(d){ // On click make d.visible 
            // console.log(d)
            d.visible = !d.visible; // If array key for this data selection is "visible" = true then make it false, if false then make it true

            maxY = findMaxY(categories); // Find max Y rating value categories data with "visible"; true
            yScaleLine.domain([0,maxY]); // Redefine yAxis domain based on highest y value of categories data with "visible"; true
            svgLine.select(".y.axis")
            .transition()
            .call(yAxis);  
            
            minX = findMinX(categories); 
            maxX = findMaxX(categories); 
            // console.log(minX,maxX)
            xScale.domain([minX,maxX]); // Redefine yAxis domain based on highest y value of categories data with "visible"; true
            svgLine.select(".x.axis")
            .transition()
            .call(xAxis);

            issue.select("path")
            .transition()
            .duration(500)
            .ease(d3.easeLinear)
            .attr("d", function(d){
                return d.visible ? line(d.values) : null; // If d.visible is true then draw line for this d selection
            })


            issue.select("rect")
            .transition()
            .attr("fill", function(d) {
            return d.visible ? color(d.name) : "#DDDDDD";
            });

            // clickedGroupKey = d.name;
            // points.attr('fill-opacity',function(dd){
            //     if(dd[groupKey]==clickedGroupKey){
            //         if(dd.visible == true){
            //             dd.visible = false;
            //             return 0.0;
            //         }else{
            //             dd.visible = true;
            //             return 1.0;
            //         }
            //     }
            // });
        })
        
    issue.append("text")
        .attr("x", width + (margin.right/3)) 
        .attr("y", function (d, i) { return (legendSpace)+i*(legendSpace) - 8; })  // (return (11.25/2 =) 5.625) + i * (5.625) 
        .style("font-size","12px")
        .text(function(d) { return d.name; }); 
}

function findMaxY(data){  // Define function "findMaxY"
var maxYValues = data.map(function(d) { 
    if (d.visible){
        return d3.max(d.values, function(value) { // Return max rating value
        return value.sales; })
    }
});
return d3.max(maxYValues);
}

function findSumMaxY(data){  // Define function "findMaxY"
var maxYValues = data.map(function(d) { 
    if (d.visible){
        return d3.max(d.values, function(value) { // Return max rating value
        return value.sales; })
    }
});
return d3.max(maxYValues);
}

function findMinX(data){  // Define function "findMaxY"
var minXValues = data.map(function(d) { 
    if (d.visible){
        return d3.min(d.values, function(value) { // Return max rating value
        if (value.sales > 0.1 )
            return value.year; })
    }
});
return d3.min(minXValues);
}

function findMaxX(data){  // Define function "findMaxY"
var maxXValues = data.map(function(d) { 
    if (d.visible){
        return d3.max(d.values, function(value) { // Return max rating value
        if (value.sales != 0 )
            return value.year; })
    }
});
return d3.max(maxXValues);
}