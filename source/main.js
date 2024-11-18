const initThreshVal = {
    supportMin: 0,
    supportMax: 1,
    confidenceMin: 0,
    confidenceMax: 1,
    liftMin: 1,
    liftMax: 2.5,
    maxCategs: 6
}

window.onload = function () {
    loadMap();
    loadMenu();
}
const glyphGroups = {};

function addGlyphGroup() {
    for (const groupKey in glyphGroups) {
        const group = glyphGroups[groupKey];

        group.remove();
    }

    var glyphData = new GlyphGroup(importData.data);

    glyphData.setGroupColumn(importData.groupColumn);
    glyphData.setCoordsColumns(importData.latColumn, importData.lonColumn);
    glyphData.setChosenColumns([...importData.chosenColumns]);

    glyphData.setSupport(initThreshVal.supportMin, initThreshVal.supportMax);
    glyphData.setConfidence(initThreshVal.confidenceMin, initThreshVal.confidenceMax);
    glyphData.setLift(initThreshVal.liftMin, initThreshVal.liftMax);
    glyphData.setMaxCategories(initThreshVal.maxCategs);

    glyphData.updateAll();

    console.log("glyph", glyphData)

    glyphGroups[importData.name] = glyphData;
    const firstKey = Object.keys(glyphGroups.crimes.glyphs)[0];
    firstGlyph = glyphGroups.crimes.glyphs[firstKey];
    map.panTo([firstGlyph.lat, firstGlyph.lon]);
}