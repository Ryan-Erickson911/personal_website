
const options = {
	key: 'S19Fy6OJO1V98atmX1rzhiLhYXhPJMyV',
	lat: 40.03592442006402, 
	lon: -98.48352577082942,
	verbose: true,
	zoom: 7,
    timestamp: Date.now() + 3 * 24 * 60 * 60 * 1000,
    hourFormat: '12h',
};

windyInit(options, windyAPI => {
	let polygonData;   // from test.geojson
	let pointData;     // from mypoints.geojson
	let drawnItems;    // user drawings
	const { map } = windyAPI;

	// ----- PANES (guarantee order) -----
	map.createPane('polygonsPane');
	map.getPane('polygonsPane').style.zIndex = 400;

	map.createPane('pointsPane');
	map.getPane('pointsPane').style.zIndex = 500;

	// ----- Color function for points -----
	function getColor(category) {
		switch(category) {
			case "School": return "#e41a1c";
			case "Home": return "#377eb8";
			case "Road Trip": return "#4daf4a";
			case "GIS Analysis": return "#984ea3";
			default: return "#ff7f00";
		}
	}

	function showSummary(points, polygons) {

		// ---- Point category summary ----
		const categoryCount = {};

		points.features.forEach(pt => {
			const cat = pt.properties.Category || "Other";
			categoryCount[cat] = (categoryCount[cat] || 0) + 1;
		});

		let html = `<h3>Selection Summary</h3>`;

		html += `<b>Polygons Selected:</b> ${polygons.length}<br><br>`;

		html += `<b>Points by Category:</b><br>`;
		for (const [cat, count] of Object.entries(categoryCount)) {
			html += `${cat}: ${count}<br>`;
		}

		html += `<br><b>Point Names:</b><br>`;
		points.features.forEach(pt => {
			html += `• ${pt.properties.Name}<br>`;
		});

		L.popup({ maxWidth: 400 })
			.setLatLng(drawnItems.getBounds().getCenter())
			.setContent(html)
			.openOn(map);
	}
	// ----- LOAD POLYGONS -----
	$.getJSON("/assets/data/rerickson_2018_us_state_500k.geojson", function(data){
		polygonData = data; 
		const polygonLayer = L.geoJson(data, {
			pane: 'polygonsPane',
			style: {
				color: 'purple',
				weight: 4,
				fillColor: '#ffffff',
				fillOpacity: 0.1,
				opacity: 1
			},
			onEachFeature: function(feature, layer) {
				layer.bindPopup(
					`<center><b>${feature.properties.alt_title}</b></center><br><br>
					<img src="${feature.properties.image}" style="width:100%;max-width:200px;display:block;margin:8px auto;"><br>
					${feature.properties.description}`
				);
			},
		}).addTo(map);

		map.fitBounds(polygonLayer.getBounds());
	});

	// ----- LOAD POINTS -----
	$.getJSON("assets/data/mypoints.geojson", function(data){
		pointData = data;
		const pointLayer = L.geoJson(data, {
			pointToLayer: function(feature, latlng) {
				return L.circleMarker(latlng, {
					pane: 'pointsPane',
					radius: 5,
					interactive: true,
					title:feature.properties.Name,
					alt:feature.properties.Description,
					fillColor: getColor(feature.properties.Category),
					color: "#000",
					weight: 1,
					opacity: 1,
					fillOpacity: 0.9,
				});
			},

			onEachFeature: function(feature, layer) {
				layer.bindPopup(
					`<b>${feature.properties.Name}</b><br>
					${feature.properties.Description}`
				);
			}
		}).addTo(map);

		map.fitBounds(pointLayer.getBounds());
	});

	drawnItems = new L.FeatureGroup().addTo(map);

	const drawControl = new L.Control.Draw({
		draw: {
			polygon: true,
			rectangle: true,
			polyline: false,
			marker: false,
			circle: false,
			circlemarker: false
		},
		edit: {
			featureGroup: drawnItems
		}
	});

	map.addControl(drawControl);
	
	map.on(L.Draw.Event.CREATED, function (e) {

		drawnItems.clearLayers();   // only allow one query polygon
		drawnItems.addLayer(e.layer);

		const userPolygon = e.layer.toGeoJSON();

		// ---- Turf selections ----
		const selectedPoints = turf.pointsWithinPolygon(pointData, userPolygon);

		// ---- Turf polygon selection (handles MultiPolygons safely) ----
		const selectedPolygons = polygonData.features.filter(f => {
			// Flatten MultiPolygons → individual Polygon features
			const flattened = turf.flatten(f);

			// flattened.features is an array of Polygon features
			return flattened.features.some(poly =>
				turf.booleanIntersects(poly, userPolygon)
			);
		});

		showSummary(selectedPoints, selectedPolygons);
	});
});