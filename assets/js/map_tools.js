/* =============================== map_tools.js =============================== */
let map
let markers

function initMap(){
    map=L.map("map").setView([20,0],2)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
    markers=L.layerGroup().addTo(map)
}

function plotStudies(){
    markers.clearLayers()
    papers.forEach(p=>{
        if(!p.lat) return
        const m=L.marker([p.lat,p.lng])
        m.bindPopup(p.title)
        markers.addLayer(m)
    })

}
function generateTimeline(){
    let years={}
    papers.forEach(p=>{years[p.year]=(years[p.year]||0)+1})
    const canvas=document.getElementById("timeline")
    const ctx=canvas.getContext("2d")
    let x=10
    Object.entries(years).forEach(([year,count])=>{
        ctx.fillRect(x,200-count*10,20,count*10)
        ctx.fillText(year,x,220)
        x+=30
    })
}