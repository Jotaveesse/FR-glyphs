const controllers = {};

var importData = {
    name: "crimes",
    data: null,
    chosenColumns: new Set(),
    groupColumn: null,
    latColumn: null,
    lonColumn: null
};

function toggleMenu() {
    const box = settings;
    const isExpanded = box.classList.contains("expand")

    // Reset any existing animation by removing both classes
    box.classList.remove('expand', 'retract');

    // Trigger a reflow to reset the animation
    void box.offsetWidth;

    // Add the appropriate class based on the current state
    if (isExpanded) {
        box.classList.add('retract'); // Retract the box
    } else {
        box.classList.add('expand'); // Expand the box
    }

    // Toggle the state
}

function loadMenu() {
    controllers.fileInput = new FileInputControl('#import-area', {
        labelText: 'Escolha um arquivo CSV para importar',
        type: ".csv",

        onChange: async (value) => {
            const readFile = await readCsv(value);
            importData.data = readFile;
            loadOptions(readFile);
        },
    });

    controllers.groupComboBox = new ComboBoxControl('#import-area', {
        labelText: 'Coluna de Agrupamento',
        optionsList: [],
        onChange: (value) => {
            importData.groupColumn = value;
        },
    });

    controllers.latComboBox = new ComboBoxControl('#import-area', {
        labelText: 'Coluna da Latitude',
        optionsList: [],
        onChange: (value) => {
            importData.latColumn = value;
        },
    });

    controllers.lonComboBox = new ComboBoxControl('#import-area', {
        labelText: 'Coluna da Longitude',
        optionsList: [],
        onChange: (value) => {
            importData.lonColumn = value;
        },
    });

    controllers.chosenMultiBox = new MultiBoxControl('#import-area', {
        data: [],
        labelText: 'Colunas escolhidas',
        placeholder: 'Escolha as colunas',
        search: true,
        selectAll: false,
        listAll: true,
        onChange: function (value, text, element) {
            console.log('Change:', value, text, element);
        },
        onSelect: function (value, text, element) {
            importData.chosenColumns.add(value);
        },
        onUnselect: function (value, text, element) {
            importData.chosenColumns.delete(value);
        }
    });

    controllers.importButton = new ButtonControl('#import-area', {
        text: "Importar",
        onChange: () => {
            addGlyphGroup(importData);
        },
    });

    controllers.categRankComboBox = new ComboBoxControl('#options-area', {
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

    controllers.categSlider = new SliderControl('#options-area', {
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

    controllers.supportRange = new RangeControl('#options-area', {
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

    controllers.confidenceRange = new RangeControl('#options-area', {
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

    controllers.supportRange = new RangeControl('#options-area', {
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

    const latColumn = findMostSimilar("latitude", controllers.latComboBox.optionsList);
    controllers.latComboBox.setValue(latColumn);
    const lonColumn = findMostSimilar("longitude", controllers.lonComboBox.optionsList);
    controllers.lonComboBox.setValue(lonColumn);
}