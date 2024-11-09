class GlyphGroup {
    transTables = {};

    constructor(data) {
        this.origData = data;
        this.surpriseModels = [];
        this.maxRules = 4;
        this.maxArrows = 2;
        this.maxCategories = 8;
        this.minSupport = 0;
        this.maxSupport = 1;
        this.minConfidence = 0;
        this.maxConfidence = 0;
        this.displayMethod = 0;
        this.minLift = 0;
        this.maxLift = 3;
        this.glyphs = [];
        this.glyphSize = 150;
        this.glyphHoverSize = 450;

        this.groupNames = [];

        this.clusterMarkers = [];

        this.markers = new L.markerClusterGroup({
            maxClusterRadius: this.glyphSize,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            iconCreateFunction: (cluster) => {

                this.clusterMarkers.push(cluster);
                const clusterMarkers = cluster.getAllChildMarkers();
                const clusterGlyphs = clusterMarkers.map(cl => cl.options.glyph);

                const mergedGlyph = Glyph.merge(clusterGlyphs);
                mergedGlyph.group=this;
                mergedGlyph.setSupport(this.minSupport, this.maxSupport);
                mergedGlyph.setConfidence(this.minConfidence, this.maxConfidence);
                mergedGlyph.setLift(this.minLift, this.maxLift);
                mergedGlyph.setSize(this.glyphSize);
                mergedGlyph.setDisplayMethod(this.displayMethod);
                mergedGlyph.setHoverSize(this.glyphHoverSize);
                mergedGlyph.setMaxCategories(this.maxCategories);
                mergedGlyph.applyUpdates();

                cluster.glyph = mergedGlyph;

                return mergedGlyph.icon;
                
            }
        });

        this.markers.on('clustermouseover', function (ev) {
            const childGlyph = ev.layer.getAllChildMarkers()[0].options.glyph;

            ev.layer.setIcon(ev.layer.glyph.hoverIcon);
        });

        this.markers.on('clustermouseout', function (ev) {
            const childGlyph = ev.layer.getAllChildMarkers()[0].options.glyph;

            ev.layer.setIcon(ev.layer.glyph.icon);
        });
    }

    updateAll() {
        console.log("===== Starting Update =====")
        const startTime = performance.now();

        this.logExecutionTime(() => this.groupByColumn(), 'groupByColumn');

        this.logExecutionTime(() => this.getCoords(), 'addCoords');

        this.logExecutionTime(() => this.filterCategories(), 'filterCategories');

        this.logExecutionTime(() => this.getFrequencies(), 'getFrequencies');

        this.logExecutionTime(() => this.addSurpriseModel(getPopulModel), 'addSurpriseModel');

        this.logExecutionTime(() => this.getSurprise(), 'getSurprise');

        const tGlyphsStart = performance.now();
        //cria os glifos
        this.glyphs = {};
        for (const groupKey in this.groupedData) {
            const glyph = new Glyph(groupKey, this, this.groupedData[groupKey], this.surpriseData[groupKey]);

            glyph.deferUpdate();
            glyph.setSupport(this.minSupport, this.maxSupport);
            glyph.setConfidence(this.minConfidence, this.maxConfidence);
            glyph.setLift(this.minLift, this.maxLift);
            glyph.setSize(this.glyphSize);
            glyph.setHoverSize(this.glyphHoverSize);
            glyph.setDisplayMethod(this.displayMethod);
            glyph.setMaxCategories(this.maxCategories);
            glyph.applyUpdates();

            this.glyphs[groupKey] = glyph;
            this.markers.addLayer(glyph.marker);
        };

        map.addLayer(this.markers);

        const tGlyphsEnd = performance.now();
        console.log(`createGlyphs for groups: ${(tGlyphsEnd - tGlyphsStart).toFixed(2)} ms`);


        const endTime = performance.now();
        console.log(`updateAll total time: ${(endTime - startTime).toFixed(2)} ms`);
        console.log("===== Finished Update =====")
    }

    update() {
        console.log("===== Starting Update =====")

        const startTime = performance.now();

        for (const groupKey in this.groupedData) {
            const glyph = this.glyphs[groupKey]
            glyph.applyUpdates();
        };

        // this.markers.refreshClusters();

        const endTime = performance.now();
        console.log(`updateAll total time: ${(endTime - startTime).toFixed(2)} ms`);

        console.log("===== Finished Update =====")
    }

    logExecutionTime(fn, label) {
        const t0 = performance.now();
        fn();
        const t1 = performance.now();
        console.log(`${label}: ${(t1 - t0).toFixed(2)} ms`);
    }

    setDisplayMethod(method) {
        this.displayMethod = method;
        // this.drawGlyphs();

        for (const groupKey in this.groupedData) {
            const glyph = this.glyphs[groupKey];

            glyph.setDisplayMethod(method);
        };

        this.clusterMarkers.forEach(function (marker) {
            const glyph = marker.glyph;

            glyph.setDisplayMethod(method);

        });
    }

    setChosenColumns(categsChosen) {
        this.chosenColumns = categsChosen;
    }

    setMaxRulesDisplayed(maxRules) {
        this.maxRules = maxRules;
    }

    setMaxCategories(maxCategs) {
        this.maxCategories = maxCategs;
        for (const groupKey in this.groupedData) {
            const glyph = this.glyphs[groupKey];

            glyph.setMaxCategories(this.maxCategories);
        }
    }

    setGroupColumn(groupColumn) {
        this.groupColumn = groupColumn;
    }

    setSupport(minSupport, maxSupport = Infinity) {
        this.minSupport = minSupport;
        this.maxSupport = maxSupport;

        for (const groupName of this.groupNames) {
            this.glyphs[groupName].setSupport(minSupport, maxSupport);
        }

        //atualiza clusters
        this.clusterMarkers.forEach(function (marker) {
            const glyph = marker.glyph;

            glyph.setSupport(minSupport, maxSupport);

        });

    }

    setConfidence(minConfidence, maxConfidence = Infinity) {
        this.minConfidence = minConfidence;
        this.maxConfidence = maxConfidence;

        for (const groupName of this.groupNames) {
            this.glyphs[groupName].setConfidence(minConfidence, maxConfidence);
        }

        //atualiza clusters
        this.clusterMarkers.forEach(function (marker) {
            const glyph = marker.glyph;

            glyph.setConfidence(minConfidence, maxConfidence);

        });
    }

    setLift(minLift, maxLift = Infinity) {
        this.minLift = minLift;
        this.maxLift = maxLift;

        for (const groupName of this.groupNames) {
            this.glyphs[groupName].setLift(minLift, maxLift);
        }

        //atualiza clusters
        this.clusterMarkers.forEach(function (marker) {
            const glyph = marker.glyph;

            glyph.setLift(minLift, maxLift);

        });
    }

    setCoordsColumns(latColumn, lonColumn, coordFunct = this.defaultCoords) {
        this.latColumn = latColumn;
        this.lonColumn = lonColumn;
        this.coordFunct = coordFunct
    }

    getCoords() {
        for (const groupKey in this.groupedData) {
            const group = this.groupedData[groupKey];

            for (let i = 0; i < group.length; i++) {
                const entry = group[i];
                [entry.lat, entry.lon] = this.coordFunct(entry[this.latColumn], entry[this.lonColumn]);
            }
        }
    }

    groupByColumn() {
        this.groupedData = {};
        this.groupNames = [];

        //divide os dados em provincias e cria as colunas de coordenadas
        this.origData.forEach(entry => {
            var group = entry[this.groupColumn];

            if (this.groupedData[group] == undefined) {
                this.groupedData[group] = []
                this.groupNames.push(group);
            }

            this.groupedData[group].push(entry);
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

                for (const category in entry) {
                    if (this.chosenColumns.includes(category)) {
                        const value = entry[category];

                        this.filteredData[groupKey][i][category] = value;
                    }
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

                    if (value != "") {
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
                    if (value != "") {
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


    getSurprise() {
        // this.testSurprises = {};
        // for (const groupKey in this.freqData) {
        //     this.testFreq = {};

        //     for (const groupKey2 in this.freqData) {
        //         const group = {};
        //         for (const item in this.freqData[groupKey2]) {
        //             if (groupKey == groupKey2)
        //                 group[item] = this.freqData[groupKey2][item];
        //             else
        //                 group[item] = 0;
        //         }
        //         this.testFreq[groupKey2] = group;
        //     }
        //     // freq[groupKey] = this.freqData[groupKey];

        //     let mod = {};
        //     mod[groupKey] = this.surpriseModels[0][groupKey];
        //     var [newSurprise, beliefs] = calcSurpriseNew(this.testFreq, this.surpriseModels);
        //     this.testSurprises[groupKey] = newSurprise;
        // }

        //calcula a surpresa
        var [newSurprise, beliefs] = calcSurpriseNew(this.freqData, this.surpriseModels);
        this.beliefs = beliefs;
        this.surpriseData = {};

        for (const groupKey in this.freqData) {
            const group = this.freqData[groupKey];

            var dataPoint = {};

            for (const category in newSurprise[groupKey]) {
                const values = newSurprise[groupKey][category];

                dataPoint[category] = { value: values[0] };
            }

            var dataPointArray = Object.entries(dataPoint).map(([name, data]) => ({
                name,
                ...data
            }));


            this.surpriseData[groupKey] = dataPointArray;
        }
    }
}