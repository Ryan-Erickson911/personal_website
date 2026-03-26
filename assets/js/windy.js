
const options = {
	key: 'S19Fy6OJO1V98atmX1rzhiLhYXhPJMyV',
	lat: 47.25,
	lon: -122.44, 
    verbose: true,
	zoom: 8,
};

windyInit(options, windyAPI => {
	var map = windyAPI.map;
    var observer = windyAPI.weatherLayer;
    L.popup()
        .setLatLng([50.4, 14.3])
        .setContent('Hello World')
        .openOn(map);
// Customize the map here
});