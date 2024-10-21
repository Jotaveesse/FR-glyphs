const RADIANS = 180 / Math.PI;
var map;

function loadMap() {
    map = L.map('map').setView([51.505, -0.05], 12); // London

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
        ext: 'png'
    }).addTo(map);

    L.control.scale().addTo(map);

    const comboboxControl = new L.Control.ComboBox({
        position: 'topright',
        labelText: 'Escolha das categorias',
        initValue:2,
        optionsList: [
            { label: 'Mais Regras No Grupo', value: 0 },
            { label: 'Mais Regras Geral', value: 1 },
            { label: 'Maior Surpresa No Grupo', value: 2 },
            { label: 'Maior Surpresa Geral', value: 3 },
        ],
        onChange: function (value) {
            for (const key in glyphGroups) {
                const glyph = glyphGroups[key];
                glyph.setDisplayMethod(parseInt(value));
            }
        }
    });

    comboboxControl.addTo(map);

    //criação dos slider de suporte
    const supportSlider = new L.Control.Slider({
        position: 'topright',
        labelText: 'Suporte',
        rangeMin:  initThreshVal.supportMin,
        rangeMax:  initThreshVal.supportMax,
        rangeStep: 0.05,
        rangeInitMin: initThreshVal.supportMin,
        rangeInitMax: initThreshVal.supportMax,
        onChange: function (range) {
            for (const key in glyphGroups) {
                const glyph = glyphGroups[key];
                glyph.setSupport(range.begin, range.end);
                glyph.update();
            }
        }
    });
    supportSlider.addTo(map);
    supportSlider.addSlider();;

    //criação dos slider de confiança
    const confidenceSlider = new L.Control.Slider({
        position: 'topright',
        labelText: 'Confiança',
        rangeMin:  initThreshVal.confidenceMin,
        rangeMax:  initThreshVal.confidenceMax,
        rangeStep: 0.05,
        rangeInitMin: initThreshVal.confidenceMin,
        rangeInitMax: initThreshVal.confidenceMax,
        onChange: function (range) {
            for (const key in glyphGroups) {
                const glyph = glyphGroups[key];
                glyph.setConfidence(range.begin, range.end);
                glyph.update();
            }
        }
    });
    confidenceSlider.addTo(map);
    confidenceSlider.addSlider();

    //criação dos slider de lift
    const liftSlider = new L.Control.Slider({
        position: 'topright',
        labelText: 'Lift',
        rangeMin: initThreshVal.liftMin,
        rangeMax: initThreshVal.liftMax,
        rangeStep: 0.05,
        rangeInitMin: initThreshVal.liftMin,
        rangeInitMax: initThreshVal.liftMax,
        onChange: function (range) {
            for (const key in glyphGroups) {
                const glyph = glyphGroups[key];
                glyph.setLift(range.begin, range.end);
                glyph.update();
            }
        }
    });
    liftSlider.addTo(map);
    liftSlider.addSlider();


    // //atualiza a posição quando move e da zoom
    // map.on('zoomend', function () {
    //     for (const key in glyphGroups) {
    //         const glyphGroup = glyphGroups[key];

    //         //diminui o tamanho dos glifos quando o nivel de zoom é baixo
    //         for (const key in glyphGroup.newGlyphs) {
    //             const glyph = glyphGroup.newGlyphs[key];
    //             // glyph.updateSize();
    //         };
    //     }
    // });
};

function projectPoint(map, lat, lon) {
    return map.latLngToLayerPoint(new L.LatLng(lat, lon));
}

function clearGlyphs() {
    d3.selectAll(".svg-layer").remove();
}