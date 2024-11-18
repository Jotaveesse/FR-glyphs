import { GlyphGroup } from './glyphs/glyph_group.js';
import * as common from './common.js';
import * as controls from './controls/index.js';

const controllers = {};

const initThreshVal = {
    supportMin: 0,
    supportMax: 1,
    confidenceMin: 0,
    confidenceMax: 1,
    liftMin: 1,
    liftMax: 2.5,
    maxCategs: 6
}

var importData = {
    name: "crimes",
    data: null,
    chosenColumns: new Set(),
    groupColumn: null,
    latColumn: null,
    lonColumn: null
};

var leafletMap = null;

const glyphGroups = {};

window.onload = function () {
    loadMap(glyphGroups);
    loadMenu();
}

function addGlyphGroup() {
    for (const groupKey in glyphGroups) {
        const group = glyphGroups[groupKey];

        group.remove();
    }

    var glyphData = new GlyphGroup(importData.data, leafletMap);

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
    const firstGlyph = glyphGroups.crimes.glyphs[firstKey];
    leafletMap.panTo([firstGlyph.lat, firstGlyph.lon]);
}

function toggleMenu() {
    const box = settings;
    const isExpanded = box.classList.contains("expand")

    box.classList.remove('expand', 'retract');

    void box.offsetWidth;

    if (isExpanded) {
        box.classList.add('retract');
    } else {
        box.classList.add('expand');
    }
}

export function loadMap() {
    leafletMap = L.map('map').setView([-15.793889, -47.882778], 4); // brasilia

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
        ext: 'png'
    }).addTo(leafletMap);

    L.control.scale().addTo(leafletMap);

    //coloca todos os glifos no tamanho normal,
    //para evitar que eles continuem grandes mesmo quando o mouse não está em cima
    leafletMap.on('zoomend', function () {
        const zoomLevel = leafletMap.getZoom();

        for (const groupKey in  glyphGroups) {
            const group = glyphGroups[groupKey];
            for (const glyphKey in group.glyphs) {
                const glyph = group.glyphs[glyphKey];
    
                glyph.hoverEnd();
            }
    
            group.clusterMarkers.forEach(function (marker) {
                const glyph = marker.glyph;
    
                glyph.hoverEnd();
    
            });
        }
    });
};

function loadMenu() {
    const menuButton = new L.Control.Button({
        position: 'topleft',
        text:'≡',
        onChange: function () {
            toggleMenu()
        }
    });

    menuButton.addTo(leafletMap);

    controllers.fileInput = new controls.FileInputControl('#import-area', {
        labelText: 'Escolha um arquivo CSV para importar',
        type: ".csv",

        onChange: async (value) => {
            const readFile = await common.readCsv(value);
            importData.data = readFile;
            loadOptions(readFile);
        },
    });

    controllers.groupComboBox = new controls.ComboBoxControl('#import-area', {
        labelText: 'Coluna de Agrupamento',
        optionsList: [],
        onChange: (value) => {
            importData.groupColumn = value;
        },
    });

    controllers.latComboBox = new controls.ComboBoxControl('#import-area', {
        labelText: 'Coluna da Latitude',
        optionsList: [],
        onChange: (value) => {
            importData.latColumn = value;
        },
    });

    controllers.lonComboBox = new controls.ComboBoxControl('#import-area', {
        labelText: 'Coluna da Longitude',
        optionsList: [],
        onChange: (value) => {
            importData.lonColumn = value;
        },
    });

    controllers.chosenMultiBox = new controls.MultiBoxControl('#import-area', {
        data: [],
        labelText: 'Colunas escolhidas',
        placeholder: 'Escolha as colunas',
        search: true,
        selectAll: false,
        listAll: true,
        onChange: function (value, text, element) {
            // console.log('Change:', value, text, element);
        },
        onSelect: function (value, text, element) {
            importData.chosenColumns.add(value);
        },
        onUnselect: function (value, text, element) {
            importData.chosenColumns.delete(value);
        }
    });

    controllers.importButton = new controls.ButtonControl('#import-area', {
        text: "Importar",
        onChange: () => {
            addGlyphGroup(importData);
        },
    });

    controllers.categRankComboBox = new controls.ComboBoxControl('#options-area', {
        labelText: 'Escolha das categorias',
        initValue: 0,
        optionsList: [
            { text: 'Maior Surpresa No Grupo', value: 0 },
            { text: 'Maior Surpresa Geral', value: 1 },
            { text: 'Mais Regras No Grupo', value: 2 },
            { text: 'Mais Regras Geral', value: 3 },
        ],
        onChange: function (value) {
            for (const key in glyphGroups) {
                const glyphGroup = glyphGroups[key];
                glyphGroup.setDisplayMethod(parseInt(value));
                glyphGroup.update();
            }
        }
    });

    controllers.categSlider = new controls.SliderControl('#options-area', {
        position: 'topright',
        labelText: 'Número de categorias',
        rangeMin: 1,
        rangeMax: 8,
        rangeStep: 1,
        initValue: 6,
        onChange: function (value) {
            for (const key in glyphGroups) {
                const glyph = glyphGroups[key];
                glyph.setMaxCategories(value);
                // glyph.update();
            }
        }
    });

    controllers.supportRange = new controls.RangeControl('#options-area', {
        labelText: 'Suporte',
        rangeMin: initThreshVal.supportMin,
        rangeMax: initThreshVal.supportMax,
        rangeStep: 0.05,
        rangeInitMin: initThreshVal.supportMin,
        rangeInitMax: initThreshVal.supportMax,
        onChange: function (range) {
            for (const key in glyphGroups) {
                const glyphGroup = glyphGroups[key];
                glyphGroup.setSupport(range.begin, range.end);
                glyphGroup.update();
            }
        }
    });

    controllers.confidenceRange = new controls.RangeControl('#options-area', {
        position: 'topright',
        labelText: 'Confiança',
        rangeMin: initThreshVal.confidenceMin,
        rangeMax: initThreshVal.confidenceMax,
        rangeStep: 0.05,
        rangeInitMin: initThreshVal.confidenceMin,
        rangeInitMax: initThreshVal.confidenceMax,
        onChange: function (range) {
            for (const key in glyphGroups) {
                const glyphGroup = glyphGroups[key];
                glyphGroup.setConfidence(range.begin, range.end);
                glyphGroup.update();
            }
        }
    });

    controllers.supportRange = new controls.RangeControl('#options-area', {
        labelText: 'Lift',
        rangeMin: initThreshVal.liftMin,
        rangeMax: initThreshVal.liftMax,
        rangeStep: 0.05,
        rangeInitMin: initThreshVal.liftMin,
        rangeInitMax: initThreshVal.liftMax,
        onChange: function (range) {
            for (const key in glyphGroups) {
                const glyphGroup = glyphGroups[key];
                glyphGroup.setLift(range.begin, range.end);
                glyphGroup.update();
            }
        }
    });
}

function loadOptions(data) {
    importData = {
        name: "crimes",
        data: data,
        chosenColumns: new Set(),
        groupColumn: null,
        latColumn: null,
        lonColumn: null
    };

    const newOptions = [];

    for (const key in data[0]) {
        newOptions.push({ value: key, text: key });
    }

    newOptions.sort((a, b) => a.text.localeCompare(b.text));

    controllers.groupComboBox.removeOptions();
    controllers.latComboBox.removeOptions();
    controllers.lonComboBox.removeOptions();

    controllers.groupComboBox.addOptions(newOptions);
    controllers.latComboBox.addOptions(newOptions);
    controllers.lonComboBox.addOptions(newOptions);
    controllers.chosenMultiBox.addOptions(newOptions);

    const latColumn = common.findMostSimilar("latitude", controllers.latComboBox.optionsList);
    controllers.latComboBox.setValue(latColumn);
    const lonColumn = common.findMostSimilar("longitude", controllers.lonComboBox.optionsList);
    controllers.lonComboBox.setValue(lonColumn);
}