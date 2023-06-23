let dataPath = "education.json";
let canvas = d3.select('#canvas');
let info = d3.select("#info")

//Gets data from json file
d3.json(dataPath).then(
    (data) => {
        drawTreeMap(data)
    }
)

//Converts data into a hierarchical map structure
function grouper(data) {
    return d3.rollup(data,
        sumOfStudents,
        function (d) { return d["Domicile"] },
        function (d) { return d["Mode of study"] },
        function (d) { return d["Region of HE provider"] }
    )
}

//Returns the sum of production quantities
function sumOfStudents(group) {
    return d3.sum(group, function (d) {
        return d["Number"]
    });
}

//All treemap creation takes place in this method
let drawTreeMap = (data) => {

    let groups = grouper(data);

    //Converts data in a map structure to a customized object
    let hierarchy = d3.hierarchy(groups);

    //Shows the "value" for each node, which is the sum of the values in the leaves
    hierarchy.sum(function (d) {
        return d[1];
    });

    //Sort by quantity
    hierarchy.sort(function (node1, node2) {
        return node2["value"] - node1["value"];
    });

    //D3's treemap function
    let treemapLayout = d3.treemap()
        .size([1200, 600])
        .paddingTop(20) 
    treemapLayout.tile(d3.treemapBinary)
    treemapLayout(hierarchy);

    //To see data as object
    console.log(hierarchy);

    //Adds groups based on data
    var nodes = canvas.selectAll("g")
        .data(hierarchy.descendants())
        .join("g")
        .attr("transform", (d) => { return "translate(" + [d.x0, d.y0] + ")" })
    //Adds Rect to each group based on data
    rects = nodes.append("rect")
        .attr("width", (d) => { return d.x1 - d.x0 })
        .attr("height", (d) => { return d.y1 - d.y0 })

    //Adds Text to each group based on data
    nodes.append("text")
        .attr("dx", 2)
        .attr("dy", 14)
        .text((d) => {
            if (d["depth"] < 3) {
                return d["value"] >= 10000 ? d["data"][0]?.substring(0, 13) : " "
            }
            if (d["height"] == 0) {
                return d["value"] >= 10000 ? d["data"][0]?.substring(0, 13) : " "
            }
        })
    nodes.append("text")
        .attr("dx", 2)
        .attr("dy", 26)
        .text((d) => {
            if (d["height"] == 0) {
                return d["value"] >= 10000 ? d["value"] : " "
            }
        })

    
    //Adds mouse hover tooltip
    nodes.append("title")
        .text((d) => {
            if (d["height"] === 0) {
                return "Domicile: " + d["parent"]["parent"]["data"][0] + "\n" +
                    "Mode of study: " + d["parent"]["data"][0] + "\n" +
                    "Region of HE provider: " + d["data"][0] + "\n" +
                    "Number of Students: " + d["value"]
            }
            if (d["height"] === 1) {
                return "Domicile: " + d["parent"]["data"][0] + "\n" +
                    "Mode of study: " + d["data"][0] + "\n" +
                    "Number of Students: " + d["value"]
            }
            if (d["height"] === 2) {
                return "Domicile: " + d["data"][0] + "\n" +
                    "Number of Students: " + d["value"]
            }
            if (d["height"] === 3) {
                return "Total Number of Students: " + d["value"]
            }
        })

    //COLORS

    //Sets the opacity of the lowest level rectangles to one.
    rects
        .style("opacity", (d) => {
            if (d["height"] === 0) {
                return "1";
            }
        })

    //Generates a color between the maximum and minimum based on the "value".
    var maxValue = d3.max(hierarchy.leaves(), (d) => { return d["value"] })
    var minValue = d3.min(hierarchy.leaves(), (d) => { return d["value"] })
    
    let colorScale = d3.scaleLinear()
        .range(['darkseagreen', 'dodgerblue'])
        .domain([minValue, maxValue]);

    //Randomly generates different color to different countries
    function randomColor() {
        return "#" + Math.floor(Math.random() * 16777215).toString(16)
    }

    //Fills rects
    rects
        .attr("fill", (d) => {
            if (d["height"] === 0) {
                return colorScale(d["value"]);
            }
            else if (d["depth"] === 1) return randomColor();
        })

    //Creates color legend
    let rectWidth = 400;
    let colorLegend = d3.select("#color-legend")
        .attr("height", 40)
        .attr("width", rectWidth+100)
        .style("background-color", "white")
    let grad = d3.select("#grad1")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
    grad.append("stop")
        .attr("id", "grad1")
        .attr("offset", "0%")
        .style("stop-color", () => { return colorScale(minValue) })
        .style("stop-opacity", "1")
    grad.append("stop")
        .attr("offset", "100%")
        .style("stop-color", () => { return colorScale(maxValue) })
        .style("stop-opacity", "1")
    colorLegend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", rectWidth)
        .attr("height", 20)
        .style("opacity", 1)
        .attr("fill", "url(#grad1)")
    colorLegend.append("text")
        .attr("x",0)
        .attr("y", 35)
        .style("fill", "black")
        .style("font-size", 15)
        .text((d)=>{return minValue})
    colorLegend.append("text")
        .attr("x",rectWidth-10)
        .attr("y", 35)
        .style("fill", "black")
        .style("font-size", 15)
        .text((d)=>{return maxValue})
}



