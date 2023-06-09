let dataPath = "coffee.json";

let coffeeData

let canvas = d3.select('#canvas');

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
    hierarchy.sum(function(d){
        return d[1];
    });
    
    //Miktar olarak sıralama yapar
    hierarchy.sort(function(node1, node2){
        return node2["value"] - node1["value"];
    });
    
    //Treemap fonksiyonu
    let treemapLayout = d3.treemap()
                        .size([1600,800])
                        //.paddingOuter(10)
                        .paddingTop(20)
	                    .paddingInner(2);
    treemapLayout.tile(d3.treemapBinary)
    treemapLayout(hierarchy);
    console.log(hierarchy);

    //Veriye göre Rect ve Title grupları ekler
    var nodes = canvas.selectAll("g")
                    .data(hierarchy.descendants())
                    .join("g")
                    .attr("transform", (d) => {return "translate(" + [d.x0, d.y0] + ")"})
    //Veriye göre Rect'leri ekler
    rects = nodes.append("rect")
        .attr("width", (d) => {return d.x1 - d.x0})
        .attr("height", (d) => {return d.y1 - d.y0})
        
    //Title'ları ekler
    nodes.append("text")
        .attr("dx", 4)
        .attr("dy", 14)
        .text((d) => {
            return d["value"] >= 10000 ? d["data"][0]?.substring(0,13) : " "
        })
    
    //Farklı ülkelere rastgele farklı renk verir
    rects
    .attr("fill", (d) => {
        if(d["depth"] === 1){
           return  "#" + Math.floor(Math.random()*16777215).toString(16)
        }
    })
}

//Üretim miktarlarının toplamını döndürür
function sumOfProduction(group){ 
    return d3.sum(group, function(d){
        return d["Data.Production.Number of bags"] * d["Data.Production.Bag weight"]
    });
}

//Skor ortalamasını döndürür
function averageOfScore(group){
    return d3.mean(group, function(d){
        return d["Data.Scores.Total"]
    });
}

//Veriyi hiyerarşik olarak (tree yapısında) bir map yapısına çevirir
function grouper(data){
    return d3.rollup(data,
                    sumOfProduction,                   
                    function(d){return d["Location.Country"]},
                    function(d){return d["Location.Region"]}
                    )
}