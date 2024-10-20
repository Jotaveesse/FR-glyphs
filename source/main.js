proj4.defs("EPSG:28992", "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.2369,50.0087,465.658,0.4068573303224,-0.350732676542563,-1.8703473836068,4.0812 +units=m +no_defs");

function RDToCoords(x, y) {
    [lon, lat] = proj4("EPSG:28992", "EPSG:4326", [parseFloat(x), parseFloat(y)]);
    return [lat, lon];
}

const initThreshVal = {
    supportMin: 0,
    supportMax: 1,
    confidenceMin: 0,
    confidenceMax: 1,
    liftMin: 1,
    liftMax: 2.5
}

window.onload = function () {
    loadMap();

    fetch('data/crimes.csv')
        .then(response => response.text())
        .then(csvData => {
            Papa.parse(csvData, {
                header: true,
                complete: function (results) {
                    const dataObj = results.data.slice(0, 2000);
                    addGlyph(dataObj, "crimes");
                }
            })
        })
        .catch(error => console.error('Error fetching the CSV file:', error));
}
const glyphGroups = {};

function addGlyph(data, name) {
    var glyphData = new GlyphData(data);

    glyphData.setGroupColumn('city');
    glyphData.setCoordsColumns('latitude', 'longitude');
    const columnsToKeep = ['main_reason', 'situation', 'personType', 'ageGroup', 'genre', 'place',];
    // glyphData.setGroupColumn('province')
    // glyphData.setCoordsColumns('x', 'y', RDToCoords);
    // const columnsToKeep = ['road_situation', 'road_surface', 'maximun_speed', 'type_of_accident'];
    glyphData.setProcCategs(columnsToKeep);
    // glyphData.setAssocThresh(initThreshVal.support, initThreshVal.confidence, initThreshVal.lift);
    glyphData.setSupport(initThreshVal.supportMin, initThreshVal.supportMax);
    glyphData.setConfidence(initThreshVal.confidenceMin, initThreshVal.confidenceMax);
    glyphData.setLift(initThreshVal.liftMin, initThreshVal.liftMax);

    glyphData.setDisplayCategs(0);
    glyphData.updateAll();

    console.log("glyph", glyphData)

    glyphGroups[name] = glyphData;
    const firstKey = Object.keys(glyphGroups.crimes.glyphs)[0];
    firstGlyph = glyphGroups.crimes.glyphs[firstKey];
    map.panTo([firstGlyph.lat, firstGlyph.lon]);
}