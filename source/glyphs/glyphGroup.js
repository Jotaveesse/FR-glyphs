import * as models from './models.js';
import { isEmpty } from './association.js';
import { Glyph } from './glyph.js';

export class GlyphGroup {
    transTables = {};

    constructor(data, map) {
        this.origData = data;
        this.map = map;

        this.surpriseModels = [];
        this.maxRules = 4;

        this.minAntecedents = 0;
        this.maxAntecedents = 4;
        this.minConsequents = 0;
        this.maxConsequents = 4;

        this.maxCategories = 8;
        this.minSupport = 0;
        this.maxSupport = 1;
        this.minConfidence = 0;
        this.maxConfidence = 0;
        this.displayMethod = 0;
        this.minLift = 0;
        this.maxLift = 3;
        this.startDate = new Date(0);
        this.endDate = new Date(864000000000000);
        this.dateFormat = "DD/MM/YYYY, HH:mm:ss";
        this.allowedConsequents = [];
        this.allowedAntecedents = [];
        this.glyphs = [];
        this.glyphSize = 150;
        this.glyphHoverSize = 450;

        this.leftClickFunction = null;
        this.rightClickFunction = null;

        this.groupNames = [];

        this.clusterMarkers = [];

        this.markers = new L.markerClusterGroup({
            maxClusterRadius: this.glyphSize,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: false,
            iconCreateFunction: this.createClusterIcon.bind(this)
        });

    }

    remove() {
        for (const groupKey in this.groupedData) {
            const glyph = this.glyphs[groupKey];
            glyph.removeMarker();
        }

        this.clusterMarkers.forEach(function (marker) {
            const glyph = marker.glyph;
            glyph.removeMarker();
        });

        this.clusterMarkers = [];

        this.markers.clearLayers();
    }

    updateAll() {
        console.log("===== Starting Update =====")
        const startTime = performance.now();

        this.groupByColumn();

        this.filterCategories();

        this.getFrequencies();

        this.addSurpriseModel(models.getAverageModel);

        this.setTotals(this.freqData);
        var transformedModels = this.transformModels(this.surpriseModels);

        const tGlyphsStart = performance.now();
        //cria os glifos
        this.glyphs = {};
        for (const groupKey in this.groupedData) {
            const glyph = new Glyph(groupKey, this, this.groupedData[groupKey]);

            glyph.deferUpdate();

            glyph.setSize(this.glyphSize);
            glyph.setHoverSize(this.glyphHoverSize);
            glyph.setSupport(this.minSupport, this.maxSupport);
            glyph.setConfidence(this.minConfidence, this.maxConfidence);
            glyph.setLift(this.minLift, this.maxLift);
            glyph.setAntecedentFilter(this.allowedAntecedents);
            glyph.setConsequentFilter(this.allowedConsequents);
            glyph.setAntecedentDisplayedRange(this.minAntecedents, this.maxAntecedents);
            glyph.setConsequentDisplayedRange(this.minConsequents, this.maxConsequents);
            glyph.setDisplayMethod(this.displayMethod);
            glyph.setMaxCategories(this.maxCategories);
            glyph.setMaxRules(this.maxRules);
            glyph.setModels(transformedModels[groupKey]);
            glyph.setCategSums(this.categFreq);
            glyph.setDateFormat(this.dateFormat);
            glyph.setDateColumn(this.dateColumn);
            glyph.setDateRange(this.startDate, this.endDate);
            glyph.setCoordsColumns(this.latColumn, this.lonColumn);
            glyph.setRightClickFunction(this.rightClickFunction);
            glyph.setLeftClickFunction(this.leftClickFunction);

            glyph.applyUpdates();

            this.glyphs[groupKey] = glyph;
            this.markers.addLayer(glyph.marker);
        };

        this.map.addLayer(this.markers);

        const tGlyphsEnd = performance.now();
        console.log(`createGlyphs for groups: ${(tGlyphsEnd - tGlyphsStart).toFixed(2)} ms`);


        const endTime = performance.now();
        console.log(`updateAll total time: ${(endTime - startTime).toFixed(2)} ms`);
        console.log("===== Finished Update =====")
    }

    update() {
        console.log("===== Starting Update =====")

        const startTime = performance.now();

        this.getAllGlyphs().forEach(glyph => {
            glyph.applyUpdates();
        });

        // this.markers.refreshClusters();

        const endTime = performance.now();
        console.log(`update total time: ${(endTime - startTime).toFixed(2)} ms`);

        console.log("===== Finished Update =====")
    }

    updateClusterList() {
        var visibleClusterMarkers = [];
        var foundIds = [];
        this.markers.eachLayer((marker) => {
            const parent = this.markers.getVisibleParent(marker);
            if (parent && !isNaN(parent._childCount) && !foundIds.includes(parent._leaflet_id)) {
                visibleClusterMarkers.push(parent);
                foundIds.push(parent._leaflet_id);
            }
        });

        this.clusters = visibleClusterMarkers;
    }

    createClusterIcon(cluster) {
        this.clusterMarkers.push(cluster);
        const clusterMarkers = cluster.getAllChildMarkers();
        const clusterGlyphs = clusterMarkers.map(cl => cl.options.glyph);

        const mergedGlyph = Glyph.merge(clusterGlyphs);
        mergedGlyph.group = this;

        mergedGlyph.setSize(this.glyphSize);
        mergedGlyph.setHoverSize(this.glyphHoverSize);
        mergedGlyph.setSupport(this.minSupport, this.maxSupport);
        mergedGlyph.setConfidence(this.minConfidence, this.maxConfidence);
        mergedGlyph.setLift(this.minLift, this.maxLift);
        mergedGlyph.setAntecedentFilter(this.allowedAntecedents);
        mergedGlyph.setConsequentFilter(this.allowedConsequents);
        mergedGlyph.setAntecedentDisplayedRange(this.minAntecedents, this.maxAntecedents);
        mergedGlyph.setConsequentDisplayedRange(this.minConsequents, this.maxConsequents);
        mergedGlyph.setDisplayMethod(this.displayMethod);
        mergedGlyph.setMaxRules(this.maxRules);
        mergedGlyph.setMaxCategories(this.maxCategories);
        mergedGlyph.setRightClickFunction(this.rightClickFunction);
        mergedGlyph.setLeftClickFunction(this.leftClickFunction);

        mergedGlyph.applyUpdates();

        mergedGlyph.marker = cluster;
        cluster.glyph = mergedGlyph;


        return mergedGlyph.icon;
    }

    setTotals() {
        this.categFreq = {};
        this.uniqueValues = [];

        for (const group of Object.values(this.filteredData)) {
            for (const entry of group) {
                for (const value of Object.values(entry)) {
                    if (!isEmpty(value)) {
                        if (!this.categFreq[value]) {
                            this.categFreq[value] = [0];
                            this.uniqueValues.push(value);
                        }

                        this.categFreq[value][0] += 1;
                    }
                }
            }
        }
    }

    transformModels(models) {
        const transformed = {};

        for (let modelInd = 0; modelInd < models.length; modelInd++) {
            const model = models[modelInd];

            for (const group in model) {
                const groupData = model[group];

                if (!transformed[group]) {
                    transformed[group] = [];
                }

                for (const categ in groupData) {
                    const categoryData = groupData[categ];

                    if (!transformed[group][modelInd]) {
                        transformed[group][modelInd] = {};
                    }

                    transformed[group][modelInd][categ] = categoryData;
                }
            }
        }

        return transformed;
    }

    getAllGlyphs() {
        const allGlyphs = this.clusterMarkers.map(marker => marker.glyph);
        for (const groupKey in this.groupedData) {
            const glyph = this.glyphs[groupKey];

            allGlyphs.push(glyph);
        };

        return allGlyphs;
    }

    groupByColumn() {
        this.groupedData = {};
        this.groupNames = [];

        //divide os dados em grupos e cria as colunas de coordenadas
        this.origData.forEach(entry => {
            var group = entry[this.groupColumn];

            if (group) {
                if (this.groupedData[group] == undefined) {
                    this.groupedData[group] = []
                    this.groupNames.push(group);
                }

                this.groupedData[group].push(entry);
            }
        });
    }

    defaultCoords(lat, lon) {
        return [parseFloat(lat), parseFloat(lon)];
    }

    filterCategories() {
        this.filteredData = {};

        for (const groupKey in this.groupedData) {
            const group = this.groupedData[groupKey];
            this.filteredData[groupKey] = [];

            for (let i = 0; i < group.length; i++) {
                const entry = group[i];
                this.filteredData[groupKey][i] = {};

                let columnIndex = 0;
                for (const category of Object.keys(entry).sort()) {
                    if (this.chosenColumns.includes(category)) {
                        const value = entry[category];
                        this.filteredData[groupKey][i][category] = value + "_" + columnIndex;
                    }
                    columnIndex++;
                }
            }
        }
    }

    getFrequencies() {
        this.freqData = {};
        this.uniqueValues = [];

        //acha todos os valores distintos
        for (const groupKey in this.groupedData) {
            const group = this.filteredData[groupKey];
            this.freqData[groupKey] = {};

            for (let i = 0; i < group.length; i++) {
                const entry = group[i];

                for (const category in entry) {
                    const value = entry[category];

                    if (!isEmpty(value)) {
                        if (!this.uniqueValues.includes(value))
                            this.uniqueValues.push(value)
                    }
                }
            }
        }

        for (const groupKey in this.filteredData) {
            const group = this.filteredData[groupKey];
            this.freqData[groupKey] = {};

            for (let i = 0; i < this.uniqueValues.length; i++) {
                this.freqData[groupKey][this.uniqueValues[i]] = [0];
            }

            for (let i = 0; i < group.length; i++) {
                const entry = group[i];

                for (const category in entry) {
                    const value = entry[category];

                    //incrementa a quantidade para esse valor, cria uma array de frequencias
                    //caso tenham dados de varias anos
                    if (!isEmpty(value)) {
                        this.freqData[groupKey][value][0] += 1;
                    }
                }
            }
        }
    }

    addSurpriseModel(modelFunct) {
        const model = modelFunct(this.freqData);
        this.surpriseModels.push(model);
    }

    getAllSurprises() {
        const allSuprises = {};
        for (const groupName of this.groupNames) {
            allSuprises[groupName] = this.glyphs[groupName].surprise.surprises;
        }

        return allSuprises;
    }

    getAllFilteredRules() {
        const allRules = {};
        for (const groupName of this.groupNames) {
            allRules[groupName] = this.glyphs[groupName].filteredRules;
        }

        return allRules;
    }

    getTopRulesFromGroups(amount) {
        var topRules = [];

        for (const groupName of this.groupNames) {

            const sortedRules = this.glyphs[groupName].filteredRules.slice(0, amount);

            sortedRules.forEach(rule => {
                rule.group = this.glyphs[groupName];
            });


            topRules = topRules.concat(sortedRules);
            topRules = topRules.sort((a, b) => b.interestingness - a.interestingness).slice(0, amount);
        }

        return topRules;
    }


    setDisplayMethod(method) {
        this.displayMethod = method;

        this.getAllGlyphs().forEach(glyph => {
            glyph.setDisplayMethod(method);
        });

    }

    setChosenColumns(categsChosen) {
        this.chosenColumns = categsChosen;
    }

    setAntecedentDisplayedRange(minAntecedents, maxAntecedents) {
        this.minAntecedents = minAntecedents;
        this.maxAntecedents = maxAntecedents;

        this.getAllGlyphs().forEach(glyph => {
            glyph.setAntecedentDisplayedRange(minAntecedents, maxAntecedents);
        });
    }

    setConsequentDisplayedRange(minConsequents, maxConsequents) {
        this.minConsequents = minConsequents;
        this.maxConsequents = maxConsequents;

        this.getAllGlyphs().forEach(glyph => {
            glyph.setConsequentDisplayedRange(minConsequents, maxConsequents);
        });
    }

    setMaxRules(maxRules) {
        this.maxRules = maxRules;

        this.getAllGlyphs().forEach(glyph => {
            glyph.setMaxRules(maxRules);
        });
    }

    setMaxCategories(maxCategs) {
        this.maxCategories = maxCategs;

        this.getAllGlyphs().forEach(glyph => {
            glyph.setMaxCategories(maxCategs);
        });
    }

    setGroupColumn(groupColumn) {
        this.groupColumn = groupColumn;
    }

    setDateColumn(dateColumn) {
        this.dateColumn = dateColumn;

        this.getAllGlyphs().forEach(glyph => {
            glyphs.setDateColumn(dateColumn);
        });
    }

    setSupport(minSupport, maxSupport = Infinity) {
        this.minSupport = minSupport;
        this.maxSupport = maxSupport;

        this.getAllGlyphs().forEach(glyph => {
            glyph.setSupport(minSupport, maxSupport);
        });
    }

    setConfidence(minConfidence, maxConfidence = Infinity) {
        this.minConfidence = minConfidence;
        this.maxConfidence = maxConfidence;

        this.getAllGlyphs().forEach(glyph => {
            glyph.setConfidence(minConfidence, maxConfidence);
        });
    }

    setLift(minLift, maxLift = Infinity) {
        this.minLift = minLift;
        this.maxLift = maxLift;

        this.getAllGlyphs().forEach(glyph => {
            glyph.setLift(minLift, maxLift);
        });
    }

    setDateFormat(format) {
        this.dateFormat = format;

        this.getAllGlyphs().forEach(glyph => {
            glyph.setDateFormat(format);
        });
    }

    setAntecedentFilter(allowedClasses) {
        this.allowedAntecedents = allowedClasses;

        this.getAllGlyphs().forEach(glyph => {
            glyph.setAntecedentFilter(allowedClasses);
        });
    }

    setConsequentFilter(allowedClasses) {
        this.allowedConsequents = allowedClasses;

        this.getAllGlyphs().forEach(glyph => {
            glyph.setConsequentFilter(allowedClasses);
        });
    }

    setDateRange(startDate, endDate) {
        this.startDate = startDate;
        this.endDate = endDate;

        for (const groupKey in this.groupedData) {
            const glyph = this.glyphs[groupKey]
            glyph.setDateRange(startDate, endDate);
        };

        this.markers.refreshClusters();
    }

    setCoordsColumns(latColumn, lonColumn) {
        this.latColumn = latColumn;
        this.lonColumn = lonColumn;

        this.getAllGlyphs().forEach(glyph => {
            glyph.deferUpdate();
            glyph.setCoordsColumns(latColumn, lonColumn);
        });
    }

    setRightClickFunction(rightClickFunction) {
        this.rightClickFunction = rightClickFunction;

        this.getAllGlyphs().forEach(glyph => {
            glyph.deferUpdate();
            glyph.setRightClickFunction(rightClickFunction);
        });
    }

    setLeftClickFunction(leftClickFunction) {
        this.leftClickFunction = leftClickFunction;

        this.getAllGlyphs().forEach(glyph => {
            glyph.deferUpdate();
            glyph.setLeftClickFunction(leftClickFunction);
        });
    }
}