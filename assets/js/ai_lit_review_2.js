/* =====================================================
   AI Literature Review Research Platform
   Ryan Erickson – Natural Hazards Center 
===================================================== */


/* =============================== GLOBAL VARIABLES =============================== */

let collectedPapers = []

let map
let markerCluster


/* =============================== INITIALIZE PAGE =============================== */
document.addEventListener("DOMContentLoaded", () => {

    initializeMap()

    document.getElementById("focusTermsForm")
        .addEventListener("submit", generateLiteratureReview)

    document.getElementById("downloadBib")
        ?.addEventListener("click", exportBib)

    document.getElementById("downloadRIS")
        ?.addEventListener("click", exportRIS)

    document.getElementById("downloadCSV")
        ?.addEventListener("click", exportCSV)

    document.getElementById("downloadGeoJSON")
        ?.addEventListener("click", exportGeoJSON)

})

/* =============================== MAP INITIALIZATION =============================== */
function initializeMap() {

    map = L.map("studyMap").setView([20,0],2)

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution:"© OpenStreetMap contributors" }
    ).addTo(map)

    markerCluster = L.markerClusterGroup()

    map.addLayer(markerCluster)
}

/* =============================== PLOT STUDY LOCATIONS =============================== */
function plotStudyLocations() {
    markerCluster.clearLayers()
    const locationCounts = {}
    collectedPapers.forEach(p => {
        if(!p.lat || !p.lng) return
        const key = `${p.lat},${p.lng}`
        if(!locationCounts[key]){
            locationCounts[key] = {
                lat:p.lat,
                lng:p.lng,
                count:0,
                titles:[]
            }
        }
        locationCounts[key].count++
        locationCounts[key].titles.push(p.title)
    })
    Object.values(locationCounts).forEach(loc => {
        const marker = L.marker([loc.lat,loc.lng])
        const popup = `
            <b>${loc.count} Studies</b><br><br>
            ${loc.titles.map(t=>"• "+t).join("<br>")}
        `
        marker.bindPopup(popup)
        markerCluster.addLayer(marker)
    })
}

/* =============================== SEMANTIC SCHOLAR SEARCH =============================== */
async function searchSemanticScholar(query){
    const url = `
    https://api.semanticscholar.org/graph/v1/paper/search
    ?query=${encodeURIComponent(query)}
    &limit=20
    &fields=title,authors,year,abstract,venue,doi
    `
    const res = await fetch(url)
    const data = await res.json()
    return data.data
}

/* =============================== GEOCODING (OpenStreetMap) =============================== */
async function geocodeLocation(location){
    if(!location) return null
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location)}`
    try{
        const res = await fetch(url)
        const data = await res.json()
        if(data.length === 0) return null
        return {
            lat:parseFloat(data[0].lat),
            lng:parseFloat(data[0].lon)
        }
    }catch(err){
        return null
    }
}

/* =============================== STORE PAPER =============================== */
async function storePaper(p){
    let location = ""
    if(p.venue) location = p.venue
    const geo = await geocodeLocation(location)
    const paper = {
        title:p.title || "",
        authors:p.authors?.map(a=>a.name).join(", ") || "",
        year:p.year || "",
        journal:p.venue || "",
        doi:p.doi || "",
        abstract:p.abstract || "",
        location:location,
        lat:geo?.lat,
        lng:geo?.lng
    }
    collectedPapers.push(paper)
}

/* =============================== AI LITERATURE REVIEW =============================== */

async function generateLiteratureReview(e){
    e.preventDefault()
    collectedPapers = []
    const mainTopic = document.getElementById("term1").value
    const focus1 = document.getElementById("term2").value
    const focus2 = document.getElementById("term3").value
    const query = `${mainTopic} ${focus1} ${focus2}`
    const results = await searchSemanticScholar(query)
    for(const r of results){
        await storePaper(r)
    }
    const review = await generateAISummary()
    displayResults(review)
    plotStudyLocations()
}

/* =============================== AI SUMMARY (local aggregation) =============================== */
async function generateAISummary(){
    let text = ""
    collectedPapers.forEach(p=>{
        text += p.abstract + "\n\n"
    })
    const summary = `
    <h2>
    Literature Review Summary
    </h2>
    <p>${simpleSummarize(text)}</p>
    `
    return summary
}

/* =============================== SIMPLE LOCAL SUMMARIZER =============================== */
function simpleSummarize(text){
    const sentences = text.split(". ")
    return sentences.slice(0,10).join(". ")
}

/* =============================== DISPLAY RESULTS =============================== */
function displayResults(html){
    const container = document.getElementById("resultContent")
    container.innerHTML = html
    container.innerHTML += generateReferenceList()
}

/* =============================== REFERENCE LIST =============================== */
function generateReferenceList(){
    let html = "<h2>References</h2><ol>"
    collectedPapers.forEach(p=>{
        html += `
        <li>
        ${p.authors} (${p.year}). 
        <i>${p.title}</i>. 
        ${p.journal}.
        </li>
        `
    })
    html += "</ol>"
    return html
}

/* =============================== FILE DOWNLOAD HELPER =============================== */
function downloadFile(name,text){
    const blob = new Blob([text])
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
}

/* =============================== EXPORT BIBTEX =============================== */
function exportBib(){
    let bib=""
    collectedPapers.forEach((p,i)=>{
        bib += `
        @article{paper${i},
        title={${p.title}},
        author={${p.authors}},
        year={${p.year}},
        journal={${p.journal}},
        doi={${p.doi}}
        }
        `
    })
    downloadFile("citations.bib",bib)
}

/* =============================== EXPORT RIS =============================== */
function exportRIS(){
    let ris=""
    collectedPapers.forEach(p=>{
        ris += `
        TY  - JOUR
        TI  - ${p.title}
        AU  - ${p.authors}
        PY  - ${p.year}
        JO  - ${p.journal}
        DO  - ${p.doi}
        ER  -

        `
    })
    downloadFile("citations.ris",ris)
}

/* =============================== EXPORT CSV =============================== */
function exportCSV(){
    let csv="title,authors,year,journal,doi\n"
    collectedPapers.forEach(p=>{
        csv += `"${p.title}","${p.authors}","${p.year}","${p.journal}","${p.doi}"\n`
    })
    downloadFile("citations.csv",csv)
}

/* =============================== EXPORT GIS (GeoJSON) =============================== */
function exportGeoJSON(){
    const geojson = {
        type:"FeatureCollection",
        features:[]
    }
    collectedPapers.forEach(p=>{
        if(!p.lat || !p.lng) return
        geojson.features.push({
            type:"Feature",
            geometry:{
                type:"Point",
                coordinates:[p.lng,p.lat]
            },
            properties:{
                title:p.title,
                authors:p.authors,
                year:p.year,
                journal:p.journal
            }
        })
    })
    downloadFile(
        "study_locations.geojson",
        JSON.stringify(geojson,null,2)
    )
}