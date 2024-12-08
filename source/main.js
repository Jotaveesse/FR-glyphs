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
    antecedentMin: 1,
    antecedentMax: 4,
    consequentMin: 1,
    consequentMax: 4,
    maxRules: 4,
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
    columnsImported: [],
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

    glyphGroup.setSupport(controllers.supportRange.range.begin, controllers.supportRange.range.end);
    glyphGroup.setConfidence(controllers.confidenceRange.range.begin, controllers.confidenceRange.range.end);
    glyphGroup.setLift(controllers.liftRange.range.begin, controllers.liftRange.range.end);
    glyphGroup.setMaxRules(controllers.maxRulesSlider.value);
    glyphGroup.setAntecedentDisplayedRange(controllers.antecedentRange.range.begin, controllers.antecedentRange.range.end);
    glyphGroup.setConsequentDisplayedRange(controllers.consequentRange.range.begin, controllers.consequentRange.range.end);
    glyphGroup.setMaxCategories(controllers.categSlider.value);

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

    //desativa o click com botao direito no mapa
    leafletMap._container.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

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
        unselectAll: false,
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
        initText: "DD/MM/YYYY, HH:mm:ss",
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

    //-------- menu de filtros ---------

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

    
    controllers.categSlider = new controls.SliderControl('#options-area .menu-accordion-items', {
        labelText: 'Número de classes',
        rangeMin: 1,
        rangeMax: 10,
        rangeStep: 1,
        initValue: initThreshVal.maxCategs,
        startHidden: true,
        onChange: function (value) {
            for (const key in glyphGroups) {
                const glyph = glyphGroups[key];
                glyph.setMaxCategories(value);
                glyph.update();
            }
        }
    });

    controllers.maxRulesSlider = new controls.SliderControl('#options-area .menu-accordion-items', {
        labelText: 'Quantidade máxima de regras',
        rangeMin: 1,
        rangeMax: 10,
        rangeStep: 1,
        initValue: initThreshVal.maxCategs,
        startHidden: true,
        onChange: function (value) {
            for (const key in glyphGroups) {
                const glyph = glyphGroups[key];
                glyph.setMaxRules(value);
                glyph.update();
            }
        }
    });

    controllers.categRankComboBox = new controls.ComboBoxControl('#options-area .menu-accordion-items', {
        labelText: 'Escolha das classes',
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

    controllers.antecedentsMultiBox = new controls.MultiBoxControl('#options-area .menu-accordion-items', {
        data: [],
        labelText: 'Classes Permitidas nos Antecedentes',
        placeholder: 'Permitir Todas',
        search: true,
        selectAll: false,
        unselectAll: true,
        listAll: true,
        startHidden: true,
        onChange: function (value, text, element) {
            for (const key in glyphGroups) {
                const glyphGroup = glyphGroups[key];
                glyphGroup.setAntecedentFilter(Array.from(controllers.antecedentsMultiBox.value));
                glyphGroup.update();
            }
        }
    });

    controllers.consequentsMultiBox = new controls.MultiBoxControl('#options-area .menu-accordion-items', {
        data: [],
        labelText: 'Classes Permitidas nos Consequentes',
        placeholder: 'Permitir Todas',
        search: true,
        selectAll: false,
        unselectAll: true,
        listAll: true,
        startHidden: true,
        onChange: function (value, text, element) {
            for (const key in glyphGroups) {
                const glyphGroup = glyphGroups[key];
                glyphGroup.setConsequentFilter(Array.from(controllers.consequentsMultiBox.value));
                glyphGroup.update();
            }
        }
    });


    controllers.antecedentRange = new controls.RangeControl('#options-area .menu-accordion-items', {
        labelText: 'Quantidade de antecedentes nas regras',
        rangeMin: initThreshVal.antecedentMin,
        rangeMax: initThreshVal.antecedentMax,
        rangeStep: 1,
        rangeInitMin: initThreshVal.antecedentMin,
        rangeInitMax: initThreshVal.antecedentMax,
        startHidden: true,
        onChange: function (range) {
            for (const key in glyphGroups) {
                const glyphGroup = glyphGroups[key];
                glyphGroup.setAntecedentDisplayedRange(range.begin, range.end);
                glyphGroup.update();
            }
        }
    });

    controllers.consequentRange = new controls.RangeControl('#options-area .menu-accordion-items', {
        labelText: 'Quantidade de consequentes nas regras',
        rangeMin: initThreshVal.consequentMin,
        rangeMax: initThreshVal.consequentMax,
        rangeStep: 1,
        rangeInitMin: initThreshVal.consequentMin,
        rangeInitMax: initThreshVal.consequentMax,
        startHidden: true,
        onChange: function (range) {
            for (const key in glyphGroups) {
                const glyphGroup = glyphGroups[key];
                glyphGroup.setConsequentDisplayedRange(range.begin, range.end);
                glyphGroup.update();
            }
        }
    });
    
    controllers.dateRange = new controls.DateRangeControl('#options-area .menu-accordion-items', {
        labelText: 'Data',
        rangeMin: new Date("1/1/2000"),
        rangeMax: new Date(),
        rangeStep: 1,
        rangeTimeUnit: controls.DateRangeControl.TimeUnit.MONTHS,
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

function validateImportData() {
    var valid = true;

    //coluna de grupos
    const uniqueGroups = [...new Set(
        importData.data.map(
            data => data[importData.groupColumn]
        )
    )];

    if (uniqueGroups.length > 500) {
        valid &&= confirm(`A coluna de agrupamento "${importData.groupColumn}" possui ${uniqueGroups.length} valores únicos, cada um irá ser representado por um glifo, isso pode causar travamentos. Quer continuar?`);
        if (!valid) return valid;
    }


    //colunas escolhidas
    for (let column of importData.chosenColumns) {
        const uniqueGroups = [...new Set(
            importData.data.map(
                data => data[column]
            )
        )];

        if (uniqueGroups.length > 100) {
            valid &&= confirm(`A coluna "${column}" possui ${uniqueGroups.length} valores únicos. Esse é um número muito alto de categorias e pode causar demora no carregamento dos glifos, certifique-se que escolheu a coluna correta. Quer continuar?`);
        }

        if (!valid) return valid;
    }

    //colunas latitude e longitude
    const latSample = parseFloat(importData.data[0][importData.latColumn]);
    const lonSample = parseFloat(importData.data[0][importData.lonColumn]);

    if (isNaN(latSample) || latSample < -90 || latSample > 90) {
        alert("A coluna de latitude está no formato errado.");
        return false;
    }

    if (isNaN(lonSample) || lonSample < -180 || latSample > 180) {
        alert("A coluna de longitude está no formato errado.");
        return false;
    }

    //coluna das datas
    const dateSample = importData.data[0][importData.dateColumn];
    const validDate = dayjs(dateSample, importData.dateFormat, true).isValid();

    if (importData.dateColumn != null && !validDate) {
        alert("O formato da data fornecido não corresponde ao valor das datas na coluna das datas.");
        return false;
    }

    return valid;
}

function importFile() {
    if (!validateImportData()) {
        return;
    }

    addGlyphGroup();

    controllers.categRankComboBox.show();
    controllers.categSlider.show();
    controllers.supportRange.show();
    controllers.confidenceRange.show();
    controllers.liftRange.show();
    controllers.antecedentRange.show();
    controllers.consequentRange.show();
    controllers.maxRulesSlider.show();

    controllers.antecedentsMultiBox.show();
    controllers.consequentsMultiBox.show();

    const uniqueItems = common.getUniqueItems(importData.data, importData.chosenColumns);

    const classOptions = [];
    let columnIndex = 0;
    for (const column of importData.columnsImported) {
        if (importData.chosenColumns.has(column)) {
            const uniqueItemsInColumn = Array.from(uniqueItems[column]);

            for (let index = 0; index < uniqueItemsInColumn.length; index++) {
                const value = uniqueItemsInColumn[index] + "_" + columnIndex;
                const text = uniqueItemsInColumn[index] + " - " + column;
                classOptions.push({ value: value, text: text });
            }
        }

        columnIndex++;
    }
    controllers.antecedentsMultiBox.addOptions(classOptions);
    controllers.consequentsMultiBox.addOptions(classOptions);

    if (importData.dateColumn != null) {
        var minDate = new Date(864000000000000);
        var maxDate = new Date(0);

        for (let i = 0; i < importData.data.length; i++) {
            const date = dayjs(importData.data[i][importData.dateColumn], importData.dateFormat);

            if (date < minDate)
                minDate = date;
            if (date > maxDate) {
                maxDate = date;
            }
        }

        minDate = minDate.toDate();
        maxDate = maxDate.toDate();

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
        days: null,
        dateFormat: "DD/MM/YYYY, HH:mm:ss",
        columnsImported: [],
    };

    const columnsImported = [];
    for (const key in data[0]) {
        columnsImported.push({ value: key, text: key });
        importData.columnsImported.push(key);
    }

    columnsImported.sort((a, b) => a.text.localeCompare(b.text));
    importData.columnsImported.sort((a, b) => a.localeCompare(b));

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

    controllers.groupComboBox.addOptions(columnsImported);
    controllers.latComboBox.addOptions(columnsImported);
    controllers.lonComboBox.addOptions(columnsImported);
    controllers.chosenMultiBox.addOptions(columnsImported);

    columnsImported.unshift({ value: "", text: "Sem data" })
    controllers.dateComboBox.addOptions(columnsImported);

    const latColumn = common.findMostSimilar("latitude", controllers.latComboBox.optionsList);
    controllers.latComboBox.setValue(latColumn);
    const lonColumn = common.findMostSimilar("longitude", controllers.lonComboBox.optionsList);
    controllers.lonComboBox.setValue(lonColumn);

    controllers.dateComboBox.setValue("");
}