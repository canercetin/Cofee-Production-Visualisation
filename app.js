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
        
        //MOUSEOVERları ekler
        .on("mouseover", (e, d)=>{
            info.transition()
                .duration(200)
                .style("opacity", 0.9)
            if(d["height"] === 0){
                info.html(
                    " Detailed Information " + "<br/>" +  "<hr/>" +
                    " Country: " + d["parent"]["parent"]["data"][0] + "<br/>" + 
                    " Region: " + d["parent"]["data"][0] + "<br/>" + 
                    " Specie: " + d["data"][0] + "<br/>" + 
                    " Production: " + d["value"] + " kg"
                )
            }
            if(d["height"] === 1){
                info.html(
                    " Detailed Information " + "<br/>" +  "<hr/>" +
                    " Country: " + d["parent"]["data"][0] + "<br/>" + 
                    " Region: " + d["data"][0] + "<br/>" +
                    " Production: " + d["value"] + " kg"
                )
            }
            if(d["height"] === 2){
                info.html(
                    " Detailed Information " + "<br/>" +  "<hr/>" +
                    " Country: " + d["data"][0] + "<br/>" + 
                    " Production: " + d["value"] + " kg"
                )
            }
            if(d["height"] === 3){
                info.html(
                    " Detailed Information " + "<br/>" +  "<hr/>" +
                    " Total Production: " + d["value"] + " kg"
                )
            }
            
        })
        .on("mouseout", ()=>{
            info.transition()
                .duration(200)
                .style("opacity", 0)
        })

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

    //Farklı ülkelere rastgele farklı renk verir
    rects
        .attr("fill", (d) => {
            if (d["depth"] === 1) {
                return "#" + Math.floor(Math.random() * 16777215).toString(16)
            }
        })
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