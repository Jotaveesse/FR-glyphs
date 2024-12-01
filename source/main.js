import { GlyphGroup } from './glyphs/glyphGroup.js';
import * as common from './common.js';
import * as controls from './controls/index.js';

dayjs.extend(dayjs_plugin_customParseFormat);

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
    lonColumn: null,
    dateColumn: null,
    dateFormat: null,
};

var leafletMap = null;

const glyphGroups = {};

window.onload = function () {
    loadMap(glyphGroups);
    loadMenu();
}

window.controllers = controllers;
window.importData = importData;
window.glyphGroups = glyphGroups;

function addGlyphGroup() {
    for (const groupKey in glyphGroups) {
        const group = glyphGroups[groupKey];

        group.remove();
    }

    var glyphGroup = new GlyphGroup(importData.data, leafletMap);

    glyphGroup.setGroupColumn(importData.groupColumn);
    glyphGroup.setDateColumn(importData.dateColumn);
    glyphGroup.setCoordsColumns(importData.latColumn, importData.lonColumn);
    glyphGroup.setDateFormat(importData.dateFormat);
    glyphGroup.setChosenColumns([...importData.chosenColumns]);

    glyphGroup.setSupport(initThreshVal.supportMin, initThreshVal.supportMax);
    glyphGroup.setConfidence(initThreshVal.confidenceMin, initThreshVal.confidenceMax);
    glyphGroup.setLift(initThreshVal.liftMin, initThreshVal.liftMax);
    glyphGroup.setMaxCategories(initThreshVal.maxCategs);

    glyphGroup.updateAll();

    console.log("glyph group", glyphGroup)

    glyphGroups[importData.name] = glyphGroup;
    const firstKey = Object.keys(glyphGroup.glyphs)[0];
    const firstGlyph = glyphGroup.glyphs[firstKey];
    leafletMap.panTo([firstGlyph.lat, firstGlyph.lon]);
}

function toggleMenu() {
    const box = document.getElementById("menu");
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

    L.tileLayer('https://{s}.basemaps.cartocdn.com/{style}/{z}/{x}/{y}{r}.png', {
        style: 'light_all'
    }).addTo(leafletMap);

    L.control.scale().addTo(leafletMap);

    //coloca todos os glifos no tamanho normal,
    //para evitar que eles continuem grandes mesmo quando o mouse não está em cima
    leafletMap.on('zoomend', function () {
        const zoomLevel = leafletMap.getZoom();

        for (const groupKey in glyphGroups) {
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
        text: '≡',
        onChange: function () {
            toggleMenu()
        }
    });

    menuButton.addTo(leafletMap);

    controllers.importAreaAccordion = new controls.MenuAccordionControl('#import-area', {
        text: 'Importar',
        insertBefore: '#import-area .menu-accordion-items',
        onChange: async (self) => {
            if (self.opened) {
                self.opened = false;
            }
            else {
                self.opened = true;
            }

            const accordionIcon = d3.select('#import-area .menu-accordion-icon');
            accordionIcon.classed('upside-down', self.opened);

            const accordion = d3.select('#import-area .menu-accordion-items');
            accordion.classed('collapsed', !self.opened);
        },
    });

    controllers.optionsAreaAccordion = new controls.MenuAccordionControl('#options-area', {
        text: 'Filtros',
        insertBefore: '#options-area .menu-accordion-items',
        onChange: async (self) => {
            if (self.opened) {
                self.opened = false;
            }
            else {
                self.opened = true;
            }

            const accordionIcon = d3.select('#options-area .menu-accordion-icon');
            accordionIcon.classed('upside-down', self.opened);
            const accordion = d3.select('#options-area .menu-accordion-items');
            accordion.classed('collapsed', !self.opened);
        },
    });

    controllers.optionsAreaAccordion = new controls.MenuAccordionControl('#compare-area', {
        text: 'Comparar',
        insertBefore: '#compare-area .menu-accordion-items',
        onChange: async (self) => {
            if (self.opened) {
                self.opened = false;
            }
            else {
                self.opened = true;
            }

            const accordionIcon = d3.select('#compare-area .menu-accordion-icon');
            accordionIcon.classed('upside-down', self.opened);

            const accordion = d3.select('#compare-area .menu-accordion-items');
            accordion.classed('collapsed', !self.opened);
        },
    });

    controllers.fileInput = new controls.FileInputControl('#import-area .menu-accordion-items', {
        labelText: 'Escolha um arquivo CSV para importar',
        type: ".csv",

        onChange: async (value) => {
            const readFile = await common.readCsv(value);
            importData.data = readFile;
            loadOptions(readFile);
        },
    });

    controllers.chosenMultiBox = new controls.MultiBoxControl('#import-area .menu-accordion-items', {
        data: [],
        labelText: 'Colunas escolhidas',
        placeholder: 'Escolha as colunas',
        search: true,
        selectAll: false,
        listAll: true,
        startHidden: true,
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

    controllers.groupComboBox = new controls.ComboBoxControl('#import-area .menu-accordion-items', {
        labelText: 'Coluna de Agrupamento',
        optionsList: [],
        startHidden: true,
        onChange: (value) => {
            importData.groupColumn = value;
        },
    });

    controllers.latComboBox = new controls.ComboBoxControl('#import-area .menu-accordion-items', {
        labelText: 'Coluna da Latitude',
        optionsList: [],
        startHidden: true,
        onChange: (value) => {
            importData.latColumn = value;
        },
    });

    controllers.lonComboBox = new controls.ComboBoxControl('#import-area .menu-accordion-items', {
        labelText: 'Coluna da Longitude',
        optionsList: [],
        startHidden: true,
        onChange: (value) => {
            importData.lonColumn = value;
        },
    });

    controllers.dateComboBox = new controls.ComboBoxControl('#import-area .menu-accordion-items', {
        labelText: 'Coluna das Datas',
        optionsList: [],
        startHidden: true,
        onChange: (value) => {
            importData.dateColumn = value == "" ? null : value;
            if (importData.dateColumn == null) {
                controllers.dateInput.hide();
            }
            else {
                controllers.dateInput.show();
            }
        },
    });

    controllers.dateInput = new controls.TextInputControl('#import-area .menu-accordion-items', {
        labelText: 'Formato da Data',
        initText: "DD/MM/YYYY",
        optionsList: [],
        startHidden: true,
        onChange: (value) => {
            importData.dateFormat = value;
        },
    });

    controllers.importButton = new controls.ButtonControl('#import-area .menu-accordion-items', {
        text: "Importar",
        startHidden: true,
        onChange: () => {
            importFile();
        },
    });

    controllers.categRankComboBox = new controls.ComboBoxControl('#options-area .menu-accordion-items', {
        labelText: 'Escolha das categorias',
        initValue: 0,
        optionsList: [
            { text: 'Maior Surpresa No Grupo', value: 0 },
            { text: 'Maior Surpresa Geral', value: 1 },
            { text: 'Mais Regras No Grupo', value: 2 },
            { text: 'Mais Regras Geral', value: 3 },
        ],
        startHidden: true,
        onChange: function (value) {
            for (const key in glyphGroups) {
                const glyphGroup = glyphGroups[key];
                glyphGroup.setDisplayMethod(parseInt(value));
                glyphGroup.update();
            }
        }
    });

    controllers.categSlider = new controls.SliderControl('#options-area .menu-accordion-items', {
        position: 'topright',
        labelText: 'Número de categorias',
        rangeMin: 1,
        rangeMax: 8,
        rangeStep: 1,
        initValue: 8,
        startHidden: true,
        onChange: function (value) {
            for (const key in glyphGroups) {
                const glyph = glyphGroups[key];
                glyph.setMaxCategories(value);
                glyph.update();
            }
        }
    });

    controllers.supportRange = new controls.RangeControl('#options-area .menu-accordion-items', {
        labelText: 'Suporte',
        rangeMin: initThreshVal.supportMin,
        rangeMax: initThreshVal.supportMax,
        rangeStep: 0.05,
        rangeInitMin: initThreshVal.supportMin,
        rangeInitMax: initThreshVal.supportMax,
        startHidden: true,
        onChange: function (range) {
            for (const key in glyphGroups) {
                const glyphGroup = glyphGroups[key];
                glyphGroup.setSupport(range.begin, range.end);
                glyphGroup.update();
            }
        }
    });

    controllers.confidenceRange = new controls.RangeControl('#options-area .menu-accordion-items', {
        position: 'topright',
        labelText: 'Confiança',
        rangeMin: initThreshVal.confidenceMin,
        rangeMax: initThreshVal.confidenceMax,
        rangeStep: 0.05,
        rangeInitMin: initThreshVal.confidenceMin,
        rangeInitMax: initThreshVal.confidenceMax,
        startHidden: true,
        onChange: function (range) {
            for (const key in glyphGroups) {
                const glyphGroup = glyphGroups[key];
                glyphGroup.setConfidence(range.begin, range.end);
                glyphGroup.update();
            }
        }
    });

    controllers.liftRange = new controls.RangeControl('#options-area .menu-accordion-items', {
        labelText: 'Lift',
        rangeMin: initThreshVal.liftMin,
        rangeMax: initThreshVal.liftMax,
        rangeStep: 0.05,
        rangeInitMin: initThreshVal.liftMin,
        rangeInitMax: initThreshVal.liftMax,
        startHidden: true,
        onChange: function (range) {
            for (const key in glyphGroups) {
                const glyphGroup = glyphGroups[key];
                glyphGroup.setLift(range.begin, range.end);
                glyphGroup.update();
            }
        }
    });

    controllers.dateRange = new controls.DateRangeControl('#options-area .menu-accordion-items', {
        labelText: 'Data',
        rangeMin: new Date("1/1/2000"),
        rangeMax: new Date(),
        rangeStep: 1,
        rangeTimeUnit: controls.DateRangeControl.TimeUnit.HOURS,
        rangeInitMin: new Date("1/1/2000"),
        rangeInitMax: new Date(),
        startHidden: true,
        onChange: function (range) {
            for (const key in glyphGroups) {
                const glyphGroup = glyphGroups[key];
                glyphGroup.setDateRange(range.begin, range.end);
                glyphGroup.update();
            }
        }
    });
}

function importFile() {
    addGlyphGroup();

    controllers.categRankComboBox.show();
    controllers.categSlider.show();
    controllers.supportRange.show();
    controllers.confidenceRange.show();
    controllers.liftRange.show();

    if (importData.dateColumn != null) {
        var minDate = new Date(864000000000000);
        var maxDate = new Date(0);

        for (let i = 0; i < importData.data.length; i++) {
            const date = dayjs(importData.data[i][importData.dateColumn], importData.dateFormat).toDate();

            if (date < minDate)
                minDate = date;
            if (date > maxDate) {
                maxDate = date;
            }
        }

        controllers.dateRange.options.rangeInitMin = minDate;
        controllers.dateRange.options.rangeInitMax = maxDate;
        controllers.dateRange.options.rangeMin = minDate;
        controllers.dateRange.options.rangeMax = maxDate;
        controllers.dateRange.show();
        controllers.dateRange.reload();
    }
    else {
        controllers.dateRange.hide();
    }

}

function loadOptions(data) {
    importData = {
        name: "crimes",
        data: data,
        chosenColumns: new Set(),
        groupColumn: null,
        latColumn: null,
        lonColumn: null,
        dateColumn: null,
        dateFormat: "DD/MM/YYYY",
    };

    const newOptions = [];

    for (const key in data[0]) {
        newOptions.push({ value: key, text: key });
    }

    newOptions.sort((a, b) => a.text.localeCompare(b.text));

    controllers.groupComboBox.show();
    controllers.latComboBox.show();
    controllers.lonComboBox.show();
    controllers.dateComboBox.show();
    controllers.chosenMultiBox.show();
    controllers.importButton.show();

    controllers.groupComboBox.removeOptions();
    controllers.latComboBox.removeOptions();
    controllers.lonComboBox.removeOptions();
    controllers.dateComboBox.removeOptions();

    controllers.groupComboBox.addOptions(newOptions);
    controllers.latComboBox.addOptions(newOptions);
    controllers.lonComboBox.addOptions(newOptions);
    controllers.chosenMultiBox.addOptions(newOptions);

    newOptions.unshift({ value: "", text: "Sem data" })
    controllers.dateComboBox.addOptions(newOptions);

    const latColumn = common.findMostSimilar("latitude", controllers.latComboBox.optionsList);
    controllers.latComboBox.setValue(latColumn);
    const lonColumn = common.findMostSimilar("longitude", controllers.lonComboBox.optionsList);
    controllers.lonComboBox.setValue(lonColumn);

    controllers.dateComboBox.setValue("");
}