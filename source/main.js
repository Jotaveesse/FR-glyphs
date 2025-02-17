import { GlyphGroup } from './glyphs/glyphGroup.js';
import * as common from './common.js';
import * as controls from './controls/index.js';

dayjs.extend(dayjs_plugin_customParseFormat);

const controllers = {
    importOptions: {},
    ruleFilters: {},
    classFilters: {},
    displayRuleFilters: {},
    ruleDisplays: [],
    buttons: {}
};

var layoutData = {
    menusOpen: {},
    importData: {},
    theme: null
};

const initThreshVal = {
    supportMin: 0,
    supportMax: 1,
    confidenceMin: 0,
    confidenceMax: 1,
    liftMin: 1,
    liftMax: 4,
    interestingnessMin: 0,
    interestingnessMax: 1,
    antecedentMin: 1,
    antecedentMax: 4,
    consequentMin: 1,
    consequentMax: 4,
    maxRules: 4,
    maxCategs: 6,
    maxRulesSampled: Infinity,
    maxRulesDisplayed: 100
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

const THEMES = {
    light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
}

const main = {
    leafletMap: null,
    importArea: document.getElementById("import-area"),
    optionsArea: document.getElementById("options-area"),
    filterArea: document.getElementById("filter-area"),
    rulesArea: document.getElementById("rules-area"),
    leftMenu: document.getElementById("left-menu"),
    rightMenu: document.getElementById("right-menu"),
    topMenu: document.getElementById("top-menu"),
    bottomMenu: document.getElementById("bottom-menu"),
    currTheme: null,
    glyphGroups: null,
};

window.onload = function () {
    const loadedLayoutData = common.retrieveObject("layoutData");
    if (loadedLayoutData != null)
        layoutData = loadedLayoutData;

    loadMap();
    loadMenu();
}

window.controllers = controllers;
window.importData = importData;
window.main = main;

function addGlyphGroup() {

    if (main.glyphGroups != null)
        main.glyphGroups.remove();

    var glyphGroup = new GlyphGroup(importData.data, main.leafletMap);

    glyphGroup.setGroupColumn(importData.groupColumn);
    glyphGroup.setDateColumn(importData.dateColumn);
    glyphGroup.setCoordsColumns(importData.latColumn, importData.lonColumn);
    glyphGroup.setDateFormat(importData.dateFormat);
    glyphGroup.setChosenColumns([...importData.chosenColumns]);

    glyphGroup.setDisplayMethod(controllers.classFilters.categRankComboBox.value);
    glyphGroup.setRuleRank(controllers.ruleFilters.ruleRankComboBox.value);
    glyphGroup.setSupport(controllers.ruleFilters.supportRange.range.begin, controllers.ruleFilters.supportRange.range.end);
    glyphGroup.setConfidence(controllers.ruleFilters.confidenceRange.range.begin, controllers.ruleFilters.confidenceRange.range.end);
    glyphGroup.setLift(controllers.ruleFilters.liftRange.range.begin, controllers.ruleFilters.liftRange.range.end);
    glyphGroup.setInterestingness(controllers.ruleFilters.interestingnessRange.range.begin, controllers.ruleFilters.interestingnessRange.range.end);
    glyphGroup.setMaxRules(controllers.classFilters.maxRulesSlider.value);
    glyphGroup.setAntecedentDisplayedRange(controllers.ruleFilters.antecedentRange.range.begin, controllers.ruleFilters.antecedentRange.range.end);
    glyphGroup.setConsequentDisplayedRange(controllers.ruleFilters.consequentRange.range.begin, controllers.ruleFilters.consequentRange.range.end);
    glyphGroup.setMaxCategories(controllers.classFilters.categSlider.value);

    glyphGroup.setRightClickFunction(openGlyphOption);
    glyphGroup.setLeftClickFunction(focusOnGlyph);

    glyphGroup.updateAll();

    console.log("glyph group", glyphGroup)

    main.glyphGroups = glyphGroup;
    const firstKey = Object.keys(glyphGroup.glyphs)[0];
    const firstGlyph = glyphGroup.glyphs[firstKey];
    main.leafletMap.panTo([firstGlyph.lat, firstGlyph.lon]);
}

function toggleMenu(chosenMenu, direction = "width", expand = null) {
    const isExpanded = chosenMenu.classList.contains("expand-" + direction)

    const oppositeDir = (direction.localeCompare("width") ? "width" : "height");

    //fecha os outros menus
    if (expand == true || (expand == null && !isExpanded)) {
        Array.from(document.getElementsByClassName("menu")).forEach(menu => {

            if (menu.classList.contains("expand-height") && menu != chosenMenu) {
                menu.classList.remove("expand-height");

                void menu.offsetHeight;

                menu.classList.add("retract-height");
            }
            if (menu.classList.contains("expand-width") && menu != chosenMenu) {
                menu.classList.remove("expand-width");

                void menu.offsetWidth;

                menu.classList.add("retract-width");
            }
        });

        layoutData.menusOpen.leftMenuOpen = false;
        layoutData.menusOpen.rightMenuOpen = false;
        layoutData.menusOpen.topMenuOpen = false;
        layoutData.menusOpen.bottomMenuOpen = false;

    }

    chosenMenu.classList.remove("expand-" + direction, "retract-" + direction);

    void chosenMenu.offsetWidth;

    if (expand != null) {
        chosenMenu.classList.add((expand ? "expand-" : "retract-") + direction);
        return expand;
    }
    else {
        chosenMenu.classList.add((isExpanded ? "retract-" : "expand-") + direction);
        return !isExpanded;
    }

}

function toggleTheme(theme = null) {

    if (theme == THEMES.light || (theme == null && main.currTheme != THEMES.light)) {
        L.tileLayer(THEMES.light).addTo(main.leafletMap);
        document.body.style.colorScheme = "light";
        main.currTheme = THEMES.light;
    }
    else if (theme == THEMES.dark || (theme == null && main.currTheme != THEMES.dark)) {
        L.tileLayer(THEMES.dark).addTo(main.leafletMap);
        document.body.style.colorScheme = "dark";
        main.currTheme = THEMES.dark;
    }

    layoutData.theme = main.currTheme;
    saveLayout();
}

function addControlPlaceholders(map) {
    var corners = map._controlCorners,
        l = 'leaflet-',
        container = map._controlContainer;

    function createCorner(vSide, hSide) {
        var className = l + vSide + ' ' + l + hSide;

        corners[vSide + hSide] = L.DomUtil.create('div', className, container);
    }

    createCorner('verticalcenter', 'left');
    createCorner('verticalcenter', 'right');
    createCorner('horizontalcenter', 'top');
    createCorner('horizontalcenter', 'bottom');
}

export function loadMap() {
    main.leafletMap = L.map('map', { attributionControl: false }).setView([-15.793889, -47.882778], 4); // brasilia

    addControlPlaceholders(main.leafletMap);
    toggleTheme(layoutData.theme);

    //coloca todos os glifos no tamanho normal,
    //para evitar que eles continuem grandes mesmo quando o mouse não está em cima
    main.leafletMap.on('zoomend', function () {
        const zoomLevel = main.leafletMap.getZoom();
        if (focusedGlyph != null) {
            focusedGlyph.showSmallIcon();
            focusedGlyph = null;
        }
    });
};

function loadMenu() {
    L.control.scale({ position: 'bottomleft', }).addTo(main.leafletMap);

    document.getElementById("compare-button").addEventListener("click", addToCompare);
    document.getElementById("rules-button").addEventListener("click", showRules);

    main.leftMenu.addEventListener('animationend', () => {
        main.leafletMap.invalidateSize();
    });
    main.topMenu.addEventListener('animationend', () => {
        main.leafletMap.invalidateSize();
    });
    main.bottomMenu.addEventListener('animationend', () => {
        main.leafletMap.invalidateSize();
    });
    main.rightMenu.addEventListener('animationend', () => {
        main.leafletMap.invalidateSize();
    });

    document.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        contextMenu.style.display = 'none';
    });

    document.addEventListener('click', (event) => {
        contextMenu.style.display = 'none';
    });

    toggleMenu(main.leftMenu, 'width', true);
    toggleMenu(main.rightMenu, 'width', false);
    toggleMenu(main.topMenu, 'height', false);
    toggleMenu(main.bottomMenu, 'height', false);

    controllers.buttons.leftMenuButton = new L.Control.Button({
        position: 'verticalcenterleft',
        text: '≡',
        onChange: function () {
            const expanded = toggleMenu(main.leftMenu, 'width');

            main.optionsArea.appendChild(main.optionsArea.menuAccordionItems);

            for (const controlKey in controllers.classFilters) {
                const control = controllers.classFilters[controlKey];
                control.show();
            }

            for (const controlKey in controllers.displayRuleFilters) {
                const control = controllers.displayRuleFilters[controlKey];
                control.hide();
            }

            layoutData.menusOpen.leftMenuOpen = expanded;

            const accordion = d3.select(main.optionsArea.menuAccordionItems);
            accordion.classed('collapsed', !(accordion.attr("isClosed") == "false"));

            saveLayout();
        }
    });
    controllers.buttons.leftMenuButton.addTo(main.leafletMap);

    controllers.buttons.bottomMenuButton = new L.Control.Button({
        position: 'horizontalcenterbottom',
        text: '☼',
        onChange: function () {
            const expanded = toggleMenu(main.bottomMenu, 'height');

            layoutData.menusOpen.bottomMenuOpen = expanded;
            saveLayout();
        }
    });
    controllers.buttons.bottomMenuButton.addTo(main.leafletMap);

    controllers.buttons.rightMenuButton = new L.Control.Button({
        position: 'verticalcenterright',
        text: '≠',
        onChange: function () {
            const expanded = toggleMenu(main.rightMenu, 'width');

            layoutData.menusOpen.rightMenuOpen = expanded;
            saveLayout();
        }
    });
    controllers.buttons.rightMenuButton.addTo(main.leafletMap);

    controllers.buttons.topMenuButton = new L.Control.Button({
        position: 'horizontalcentertop',
        text: '≫',
        onChange: function () {
            const expanded = toggleMenu(main.topMenu, 'height');

            main.filterArea.appendChild(main.optionsArea.menuAccordionItems);

            for (const controlKey in controllers.classFilters) {
                const control = controllers.classFilters[controlKey];
                control.hide();
            }

            for (const controlKey in controllers.displayRuleFilters) {
                const control = controllers.displayRuleFilters[controlKey];
                control.show();
            }

            layoutData.menusOpen.topMenuOpen = expanded;

            const accordion = d3.select(main.optionsArea.menuAccordionItems);
            accordion.classed('collapsed', false);

            saveLayout();
        }
    });
    controllers.buttons.topMenuButton.addTo(main.leafletMap);

    controllers.buttons.themeButton = new L.Control.Button({
        position: 'topright',
        text: '◐',
        onChange: function () {
            toggleTheme();
        }
    });
    controllers.buttons.themeButton.addTo(main.leafletMap);

    main.importArea.menuAccordionItems = main.importArea.querySelector(".menu-accordion-items");
    main.optionsArea.menuAccordionItems = main.optionsArea.querySelector(".menu-accordion-items");
    main.filterArea.menuAccordionItems = main.filterArea.querySelector(".menu-accordion-items");

    controllers.importAreaAccordion = new controls.MenuAccordionControl(main.importArea, {
        text: 'Importar',
        insertBefore: main.importArea.menuAccordionItems,
        onChange: async (self) => {
            if (self.opened) {
                self.opened = false;
            }
            else {
                self.opened = true;
            }

            const accordionIcon = d3.select('#import-area .menu-accordion-icon');
            accordionIcon.classed('upside-down', self.opened);

            const accordion = d3.select(main.importArea.menuAccordionItems);
            accordion.classed('collapsed', !self.opened);
        },
    });

    controllers.optionsAreaAccordion = new controls.MenuAccordionControl(main.optionsArea, {
        text: 'Filtros',
        insertBefore: main.optionsArea.menuAccordionItems,
        onChange: async (self) => {
            if (self.opened) {
                self.opened = false;
            }
            else {
                self.opened = true;
            }

            const accordionIcon = d3.select('#options-area .menu-accordion-icon');
            accordionIcon.classed('upside-down', self.opened);
            const accordion = d3.select(main.optionsArea.menuAccordionItems);
            accordion.classed('collapsed', !self.opened);
            accordion.attr("isClosed", !self.opened);
        },
    });

    controllers.importOptions.fileInput = new controls.FileInputControl(main.importArea.menuAccordionItems, {
        labelText: 'Escolha um arquivo CSV para importar',
        type: ".csv",

        onChange: async (value) => {
            const readFile = await common.readCsv(value);
            loadOptions(value, readFile);
        },
    });

    controllers.importOptions.chosenMultiBox = new controls.MultiBoxControl(main.importArea.menuAccordionItems, {
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

    controllers.importOptions.groupComboBox = new controls.ComboBoxControl(main.importArea.menuAccordionItems, {
        labelText: 'Coluna de Agrupamento',
        optionsList: [],
        startHidden: true,
        onChange: (value) => {
            importData.groupColumn = value;
        },
    });

    controllers.importOptions.latComboBox = new controls.ComboBoxControl(main.importArea.menuAccordionItems, {
        labelText: 'Coluna da Latitude',
        optionsList: [],
        startHidden: true,
        onChange: (value) => {
            importData.latColumn = value;
        },
    });

    controllers.importOptions.lonComboBox = new controls.ComboBoxControl(main.importArea.menuAccordionItems, {
        labelText: 'Coluna da Longitude',
        optionsList: [],
        startHidden: true,
        onChange: (value) => {
            importData.lonColumn = value;
        },
    });

    controllers.importOptions.dateComboBox = new controls.ComboBoxControl(main.importArea.menuAccordionItems, {
        labelText: 'Coluna das Datas',
        optionsList: [],
        startHidden: true,
        onChange: (value) => {
            importData.dateColumn = value == "" ? null : value;
            if (importData.dateColumn == null) {
                controllers.importOptions.dateInput.hide();
            }
            else {
                controllers.importOptions.dateInput.show();
            }
        },
    });

    controllers.importOptions.dateInput = new controls.TextInputControl(main.importArea.menuAccordionItems, {
        labelText: 'Formato da Data',
        initText: "DD/MM/YYYY, HH:mm:ss",
        optionsList: [],
        startHidden: true,
        onChange: (value) => {
            importData.dateFormat = value;
        },
    });

    controllers.buttons.importButton = new controls.ButtonControl(main.importArea.menuAccordionItems, {
        text: "Importar",
        startHidden: true,
        onChange: () => {
            importFile();
        },
    });

    //-------- menu de filtros ---------

    controllers.displayRuleFilters.groupsMultiBox = new controls.MultiBoxControl(main.optionsArea.menuAccordionItems, {
        data: [],
        labelText: 'Grupos Permitidos',
        placeholder: 'Permitir Todos',
        search: true,
        selectAll: true,
        unselectAll: true,
        listAll: true,
        startHidden: true,
        onChange: function (value, text, element) {
            updateDisplayRules();
        }
    });

    controllers.ruleFilters.supportRange = new controls.RangeControl(main.optionsArea.menuAccordionItems, {
        labelText: 'Suporte',
        rangeMin: initThreshVal.supportMin,
        rangeMax: initThreshVal.supportMax,
        rangeStep: 0.05,
        rangeInitMin: initThreshVal.supportMin,
        rangeInitMax: initThreshVal.supportMax,
        startHidden: true,
        onChange: function (range) {
            if (main.glyphGroups == null)
                return;

            main.glyphGroups.setSupport(range.begin, range.end);
            main.glyphGroups.update();

            updateDisplayRules();
        }
    });

    controllers.ruleFilters.confidenceRange = new controls.RangeControl(main.optionsArea.menuAccordionItems, {
        labelText: 'Confiança',
        rangeMin: initThreshVal.confidenceMin,
        rangeMax: initThreshVal.confidenceMax,
        rangeStep: 0.05,
        rangeInitMin: initThreshVal.confidenceMin,
        rangeInitMax: initThreshVal.confidenceMax,
        startHidden: true,
        onChange: function (range) {
            if (main.glyphGroups == null)
                return;

            main.glyphGroups.setConfidence(range.begin, range.end);
            main.glyphGroups.update();

            updateDisplayRules();
        }
    });

    controllers.ruleFilters.liftRange = new controls.RangeControl(main.optionsArea.menuAccordionItems, {
        labelText: 'Lift',
        rangeMin: initThreshVal.liftMin,
        rangeMax: initThreshVal.liftMax,
        rangeStep: 0.05,
        rangeInitMin: initThreshVal.liftMin,
        rangeInitMax: initThreshVal.liftMax,
        startHidden: true,
        onChange: function (range) {
            if (main.glyphGroups == null)
                return;

            main.glyphGroups.setLift(range.begin, range.end);
            main.glyphGroups.update();

            updateDisplayRules();
        }
    });

    controllers.ruleFilters.interestingnessRange = new controls.RangeControl(main.optionsArea.menuAccordionItems, {
        labelText: 'Interesse',
        rangeMin: initThreshVal.interestingnessMin,
        rangeMax: initThreshVal.interestingnessMax,
        rangeStep: 0.05,
        rangeInitMin: initThreshVal.interestingnessMin,
        rangeInitMax: initThreshVal.interestingnessMax,
        startHidden: true,
        onChange: function (range) {
            if (main.glyphGroups == null)
                return;

            main.glyphGroups.setInterestingness(range.begin, range.end);
            main.glyphGroups.update();

            updateDisplayRules();
        }
    });


    controllers.classFilters.categSlider = new controls.SliderControl(main.optionsArea.menuAccordionItems, {
        labelText: 'Número de classes',
        rangeMin: 1,
        rangeMax: 10,
        rangeStep: 1,
        initValue: initThreshVal.maxCategs,
        startHidden: true,
        onChange: function (value) {
            if (main.glyphGroups == null)
                return;

            main.glyphGroups.setMaxCategories(value);
            main.glyphGroups.update();
        }
    });

    controllers.classFilters.maxRulesSlider = new controls.SliderControl(main.optionsArea.menuAccordionItems, {
        labelText: 'Quantidade máxima de regras',
        rangeMin: 1,
        rangeMax: 10,
        rangeStep: 1,
        initValue: initThreshVal.maxRules,
        startHidden: true,
        onChange: function (value) {
            if (main.glyphGroups == null)
                return;

            main.glyphGroups.setMaxRules(value);
            main.glyphGroups.update();
        }
    });

    controllers.ruleFilters.ruleRankComboBox = new controls.ComboBoxControl(main.optionsArea.menuAccordionItems, {
        labelText: 'Ordenação das regras',
        initValue: 0,
        optionsList: [
            { text: 'Interesse', value: 'interestingness' },
            { text: 'Suporte Antecedente', value: 'antecedentSupport' },
            { text: 'Suporte Consequente', value: 'consequentSupport' },
            { text: 'Suporte', value: 'support' },
            { text: 'Confiança', value: 'confidence' },
            { text: 'Lift', value: 'lift' },
        ],
        startHidden: true,
        onChange: function (value) {
            if (main.glyphGroups == null)
                return;

            main.glyphGroups.setRuleRank(value);
            main.glyphGroups.update();

            updateDisplayRules();
        }
    });

    controllers.classFilters.categRankComboBox = new controls.ComboBoxControl(main.optionsArea.menuAccordionItems, {
        labelText: 'Escolha das classes',
        initValue: 0,
        optionsList: [
            { text: 'Regras Mais Interessantes', value: 4 },
            { text: 'Mais Regras No Grupo', value: 2 },
            { text: 'Mais Regras Geral', value: 3 },
            { text: 'Maior Surpresa No Grupo', value: 0 },
            { text: 'Maior Surpresa Geral', value: 1 },
        ],
        startHidden: true,
        onChange: function (value) {
            if (main.glyphGroups == null)
                return;

            main.glyphGroups.setDisplayMethod(parseInt(value));
            main.glyphGroups.update();

            updateDisplayRules();
        }
    });

    controllers.ruleFilters.antecedentsMultiBox = new controls.MultiBoxControl(main.optionsArea.menuAccordionItems, {
        data: [],
        labelText: 'Classes Permitidas nos Antecedentes',
        placeholder: 'Permitir Todas',
        search: true,
        selectAll: true,
        unselectAll: true,
        listAll: true,
        startHidden: true,
        onChange: function (value, text, element) {
            if (main.glyphGroups == null)
                return;

            main.glyphGroups.setAntecedentFilter(Array.from(controllers.ruleFilters.antecedentsMultiBox.value));
            main.glyphGroups.update();

            updateDisplayRules();
        }
    });

    controllers.ruleFilters.consequentsMultiBox = new controls.MultiBoxControl(main.optionsArea.menuAccordionItems, {
        data: [],
        labelText: 'Classes Permitidas nos Consequentes',
        placeholder: 'Permitir Todas',
        search: true,
        selectAll: true,
        unselectAll: true,
        listAll: true,
        startHidden: true,
        onChange: function (value, text, element) {
            console.log("udpate")
            if (main.glyphGroups == null)
                return;

            main.glyphGroups.setConsequentFilter(Array.from(controllers.ruleFilters.consequentsMultiBox.value));
            main.glyphGroups.update();

            updateDisplayRules();
        }
    });


    controllers.ruleFilters.antecedentRange = new controls.RangeControl(main.optionsArea.menuAccordionItems, {
        labelText: 'Quantidade de antecedentes nas regras',
        rangeMin: initThreshVal.antecedentMin,
        rangeMax: initThreshVal.antecedentMax,
        rangeStep: 1,
        rangeInitMin: initThreshVal.antecedentMin,
        rangeInitMax: initThreshVal.antecedentMax,
        startHidden: true,
        onChange: function (range) {
            if (main.glyphGroups == null)
                return;

            main.glyphGroups.setAntecedentDisplayedRange(range.begin, range.end);
            main.glyphGroups.update();

            updateDisplayRules();
        }
    });

    controllers.ruleFilters.consequentRange = new controls.RangeControl(main.optionsArea.menuAccordionItems, {
        labelText: 'Quantidade de consequentes nas regras',
        rangeMin: initThreshVal.consequentMin,
        rangeMax: initThreshVal.consequentMax,
        rangeStep: 1,
        rangeInitMin: initThreshVal.consequentMin,
        rangeInitMax: initThreshVal.consequentMax,
        startHidden: true,
        onChange: function (range) {
            if (main.glyphGroups == null)
                return;

            main.glyphGroups.setConsequentDisplayedRange(range.begin, range.end);
            main.glyphGroups.update();

            updateDisplayRules();
        }
    });

    controllers.ruleFilters.dateRange = new controls.DateRangeControl(main.optionsArea.menuAccordionItems, {
        labelText: 'Data',
        rangeMin: new Date("1/1/2000"),
        rangeMax: new Date(),
        rangeStep: 1,
        rangeTimeUnit: controls.DateRangeControl.TimeUnit.MONTHS,
        rangeInitMin: new Date("1/1/2000"),
        rangeInitMax: new Date(),
        startHidden: true,
        onChange: function (range) {
            if (main.glyphGroups == null)
                return;

            main.glyphGroups.setDateRange(range.begin, range.end);
            main.glyphGroups.update();

            updateDisplayRules();
        }
    });
}

function updateDisplayRules() {
    controllers.ruleDisplays.forEach(display => {
        display.remove();
    });

    controllers.ruleDisplays = [];

    const groupedRules = {};
    const groups = Array.from(controllers.displayRuleFilters.groupsMultiBox.value);

    const topRules = main.glyphGroups.getTopRulesFromGroups(groups, initThreshVal.maxRulesSampled);

    topRules.forEach(rule => {
        const ruleId = common.getRuleId(rule);
        if (groupedRules[ruleId] == undefined) {
            groupedRules[ruleId] = {};
        }

        groupedRules[ruleId][rule.group.name] = rule;
    });

    for (const ruleName in groupedRules) {
        const rule = groupedRules[ruleName];

        addRuleDisplay(rule);

        if (controllers.ruleDisplays.length >= initThreshVal.maxRulesDisplayed)
            break;
    }
}

function addRuleDisplay(ruleGroup) {
    if (controllers.ruleDisplays.length < initThreshVal.maxRulesDisplayed) {
        controllers.ruleDisplays.push(new controls.RuleDisplayControl(main.rulesArea, {
            ruleGroup: ruleGroup,
            columnNames: importData.columnsImported,
            startHidden: false,
            onChange: function (rule) {
                main.leafletMap.setView(new L.LatLng(rule.group.lat, rule.group.lon), 13);
            }
        })
        );
    }
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

    const { data, ...clonedImportData } = importData;
    layoutData.importData = clonedImportData;

    saveLayout();

    controllers.ruleFilters.ruleRankComboBox.show();
    controllers.classFilters.categRankComboBox.show();
    controllers.classFilters.categSlider.show();
    controllers.ruleFilters.supportRange.show();
    controllers.ruleFilters.confidenceRange.show();
    controllers.ruleFilters.liftRange.show();
    controllers.ruleFilters.interestingnessRange.show();
    controllers.ruleFilters.antecedentRange.show();
    controllers.ruleFilters.consequentRange.show();
    controllers.classFilters.maxRulesSlider.show();

    controllers.ruleFilters.antecedentsMultiBox.unselectAll();
    controllers.ruleFilters.antecedentsMultiBox.show();
    controllers.ruleFilters.consequentsMultiBox.unselectAll();
    controllers.ruleFilters.consequentsMultiBox.show();

    addGlyphGroup();

    const uniqueItems = common.getUniqueItems(importData.data, importData.chosenColumns);

    const classOptions = [];
    let columnIndex = 0;
    //cria os nomes para os filtros de ante e consequentes
    for (const column of importData.columnsImported) {
        if (importData.chosenColumns.has(column)) {
            const items = uniqueItems[column];

            if (items == undefined)
                continue;

            const uniqueItemsInColumn = Array.from(items);

            for (let index = 0; index < uniqueItemsInColumn.length; index++) {
                const value = uniqueItemsInColumn[index] + "_" + columnIndex;
                const text = uniqueItemsInColumn[index] + " - " + column;
                classOptions.push({ value: value, text: text });
            }
        }

        columnIndex++;
    }
    controllers.ruleFilters.antecedentsMultiBox.addOptions(classOptions);
    controllers.ruleFilters.consequentsMultiBox.addOptions(classOptions);

    const groupOptions = [];
    for (const groupName of main.glyphGroups.groupNames) {
        groupOptions.push({ value: groupName, text: groupName });
    }
    controllers.displayRuleFilters.groupsMultiBox.addOptions(groupOptions);


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

        controllers.ruleFilters.dateRange.options.rangeInitMin = minDate;
        controllers.ruleFilters.dateRange.options.rangeInitMax = maxDate;
        controllers.ruleFilters.dateRange.options.rangeMin = minDate;
        controllers.ruleFilters.dateRange.options.rangeMax = maxDate;
        controllers.ruleFilters.dateRange.show();
        controllers.ruleFilters.dateRange.reload();
    }
    else {
        controllers.ruleFilters.dateRange.hide();
    }

    updateDisplayRules();
}

function loadOptions(file, data) {
    importData = {
        name: file.name,
        data: data,
        chosenColumns: new Set(),
        groupColumn: null,
        latColumn: null,
        lonColumn: null,
        dateColumn: null,
        dateFormat: "DD/MM/YYYY, HH:mm:ss",
        columnsImported: [],
    };

    const columnsImported = [];
    for (const key in data[0]) {
        columnsImported.push({ value: key, text: key });
        importData.columnsImported.push(key);
    }

    //ordena alfabeticamente
    columnsImported.sort((a, b) => a.text.localeCompare(b.text));

    importData.columnsImported.sort();

    controllers.importOptions.chosenMultiBox.show();
    controllers.importOptions.groupComboBox.show();
    controllers.importOptions.latComboBox.show();
    controllers.importOptions.lonComboBox.show();
    controllers.importOptions.dateComboBox.show();
    controllers.buttons.importButton.show();

    controllers.importOptions.groupComboBox.removeOptions();
    controllers.importOptions.latComboBox.removeOptions();
    controllers.importOptions.lonComboBox.removeOptions();
    controllers.importOptions.dateComboBox.removeOptions();

    controllers.importOptions.chosenMultiBox.addOptions(columnsImported);
    controllers.importOptions.groupComboBox.addOptions(columnsImported);
    controllers.importOptions.latComboBox.addOptions(columnsImported);
    controllers.importOptions.lonComboBox.addOptions(columnsImported);

    columnsImported.unshift({ value: "", text: "Sem data" })
    controllers.importOptions.dateComboBox.addOptions(columnsImported);

    if (layoutData.importData.name == file.name) {
        controllers.importOptions.chosenMultiBox.toggleSelectSet(layoutData.importData.chosenColumns);
        controllers.importOptions.groupComboBox.setValue(layoutData.importData.groupColumn);
        controllers.importOptions.latComboBox.setValue(layoutData.importData.latColumn);
        controllers.importOptions.lonComboBox.setValue(layoutData.importData.lonColumn);
        controllers.importOptions.dateComboBox.setValue(layoutData.importData.dateColumn);
        controllers.importOptions.dateInput.setValue(layoutData.importData.dateFormat);
    }
    else {
        const latColumn = common.findMostSimilar("latitude", controllers.importOptions.latComboBox.optionsList);
        controllers.importOptions.latComboBox.setValue(latColumn);
        const lonColumn = common.findMostSimilar("longitude", controllers.importOptions.lonComboBox.optionsList);
        controllers.importOptions.lonComboBox.setValue(lonColumn);

        controllers.importOptions.dateComboBox.setValue("");
    }
}

const contextMenu = document.getElementById('contextMenu');

function addToCompare(e) {
    const glyph = contextMenu.glyph;
    const iconClone = glyph.icon.options.html.cloneNode(true);

    new controls.CompareGlyphControl('#compare-area', {
        labelText: glyph.name,
        icon: iconClone,
        glyph: glyph,
        startHidden: false,
    });
}

function showRules(e) {
    const glyph = contextMenu.glyph;
    controllers.displayRuleFilters.groupsMultiBox.unselectAll();
    controllers.displayRuleFilters.groupsMultiBox.toggleSelect(glyph.name);

    const topExpanded = main.topMenu.classList.contains("expand-height");

    if (!topExpanded)
        controllers.buttons.topMenuButton.update();

}

function openGlyphOption(e, glyph) {
    e.preventDefault();
    e.stopImmediatePropagation();
    const { clientX: mouseX, clientY: mouseY } = e;

    contextMenu.glyph = glyph;

    contextMenu.style.top = `${mouseY}px`;
    contextMenu.style.left = `${mouseX}px`;
    contextMenu.style.display = 'block';

    document.getElementById("rules-button").style.display = glyph.isCluster ? "none" : "";
}

var focusedGlyph = null;

function focusOnGlyph(e, glyph) {
    if (focusedGlyph != null) {
        focusedGlyph.showSmallIcon();
    }

    if (focusedGlyph != glyph) {
        glyph.showBigIcon();
        focusedGlyph = glyph;
    }
    else {
        glyph.showSmallIcon();
        focusedGlyph = null;
    }
}

function saveLayout() {
    common.storeObject("layoutData", layoutData);
}