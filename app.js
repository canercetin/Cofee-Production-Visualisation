let dataPath = "coffee.json";

let coffeeData

let canvas = d3.select('#canvas');

let info = d3.select("#info")

d3.json(dataPath).then(
    (data, error) => {
        if (error) {
            console.log(error);
        }
        else {
            drawTreeMap(data)
        }
    }
)

let drawTreeMap = (data) => {

    let groups = grouper(data);

    //Map yapısındaki veiyi özelleştirilmiş bir objeye çevirir
    let hierarchy = d3.hierarchy(groups);

    //Her bir node için value değeri gösterir, bu değer yapraklardaki değerlerin toplamıdır
    hierarchy.sum(function (d) {
        return d[1];
    });

    //Miktar olarak sıralama yapar
    hierarchy.sort(function (node1, node2) {
        return node2["value"] - node1["value"];
    });

    //Treemap fonksiyonu
    let treemapLayout = d3.treemap()
        .size([1200, 600])
        .paddingTop(20) //Üst boşlukları belirler
    treemapLayout.tile(d3.treemapBinary)
    treemapLayout(hierarchy);
    console.log(hierarchy);

    //Veriye göre Rect ve Title grupları ekler
    var nodes = canvas.selectAll("g")
        .data(hierarchy.descendants())
        .join("g")
        .attr("transform", (d) => { return "translate(" + [d.x0, d.y0] + ")" })
    //Veriye göre Rect'leri ekler
    rects = nodes.append("rect")
        .attr("width", (d) => { return d.x1 - d.x0 })
        .attr("height", (d) => { return d.y1 - d.y0 })
        
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
    /*************
     * TOOLTİP EKLER
    *************/
    nodes.append("title")
        .text((d) => {
            if (d["height"] === 0) {
                return "Country: " + d["parent"]["parent"]["data"][0] + "\n" +
                    "Region: " + d["parent"]["data"][0] + "\n" +
                    "Specie: " + d["data"][0] + "\n" +
                    "Production: " + d["value"] + " kg"
            }
            if (d["height"] === 1) {
                return "Country: " + d["parent"]["data"][0] + "\n" +
                    "Region: " + d["data"][0] + "\n" +
                    "Production: " + d["value"]
            }
            if (d["height"] === 2) {
                return "Country: " + d["data"][0] + "\n" +
                    "Production: " + d["value"]
            }
            if (d["height"] === 3) {
                return "Total Production: " + d["value"]
            }
        })
    
    //Farklı ülkelere rastgele farklı renk verir
    var maxValue = d3.max(hierarchy.leaves(), (d)=>{return d["value"]})
    var minValue = d3.min(hierarchy.leaves(), (d)=>{return d["value"]})

    let colorScale = d3.scaleLinear()
                        .range(['sandybrown', 'saddlebrown'])
                        .domain([minValue, maxValue]);  

    rects
        .style("opacity", (d) => {
            if (d["height"] === 0) {
                return "1";
            }
        })
        .attr("fill", (d) => {
            if (d["height"] === 0) {
                return colorScale(d["value"]);
            }
            else if(d["depth"] === 1) return randomColor();
        })
    //Random Color
    function randomColor(){
        return "#" + Math.floor(Math.random() * 16777215).toString(16)
    }

    //Color Legend
    let colorLegend = d3.select("#color-legend");
    
    colorLegend.append("rect")
                .style("opacity", 1).attr("x", 10).attr("y", 10).attr("width", 40).attr("height", 40).attr("fill", (d)=>{return colorScale(maxValue)})
    colorLegend.append("text")
    .attr("dx", 60)
    .attr("dy", 35)
    .style("fill", "black")
    .style("font-size", "15px")
    .text(maxValue + " kg")

    colorLegend.append("rect")
                .style("opacity", 1).attr("x", 10).attr("y", 60).attr("width", 40).attr("height", 40).attr("fill", (d)=>{return colorScale(minValue)})
    colorLegend.append("text")
    .attr("dx", 60)
    .attr("dy", 85)
    .style("fill", "black")
    .style("font-size", "15px")
    .text(minValue + " kg")
    
}

//Üretim miktarlarının toplamını döndürür
function sumOfProduction(group) {
    return d3.sum(group, function (d) {
        return d["Data.Production.Number of bags"] * d["Data.Production.Bag weight"]
    });
}

//Veriyi hiyerarşik olarak (tree yapısında) bir map yapısına çevirir
function grouper(data) {
    return d3.rollup(data,
        sumOfProduction,
        function (d) { return d["Location.Country"] },
        function (d) { return d["Location.Region"] },
        function (d) { return d["Data.Type.Species"] }
    )
}