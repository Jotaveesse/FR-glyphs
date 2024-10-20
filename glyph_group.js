class GlyphData {
    transTables = {};
    #updatedThresh = false;
    #lowestSupport;
    #lowestConfidence;
    #lowestLift;

    constructor(data) {
        this.origData = data;
        this.surpriseModels = [];
        this.maxRules = 4;
        this.maxCategories = 8;
        this.minSupport = 0;
        this.maxSupport = 1;
        this.minConfidence = 0;
        this.mmaxConfidence = 0;
        this.minLift = 0;
        this.maxLift = 3;
        this.glyphs = [];
    }

    updateAll() {
        console.log("===== Starting Update =====")
        const startTime = performance.now();

        this.logExecutionTime(() => this.groupByColumn(), 'groupByColumn');

        this.logExecutionTime(() => this.addCoords(), 'addCoords');

        const tGlyphsStart = performance.now();
        //cria os glifos
        this.newGlyphs = {};
        for (const groupKey in this.groupedData) {
            const glyph = new GlyphSymbol(this, this.groupedData[groupKey]);
            glyph.name = groupKey;
            this.newGlyphs[groupKey] = glyph;
        }
        const tGlyphsEnd = performance.now();
        console.log(`createGlyphs for groups: ${(tGlyphsEnd - tGlyphsStart).toFixed(2)} ms`);

        this.logExecutionTime(() => this.filterCategories(), 'filterCategories');

        this.logExecutionTime(() => this.getFrequencies(), 'getFrequencies');

        this.logExecutionTime(() => this.addSurpriseModel(getPopulModel), 'addSurpriseModel');

        this.logExecutionTime(() => this.getSurprise(), 'getSurprise');

        this.logExecutionTime(() => this.updateTransTables(), 'updateTrans');

        this.logExecutionTime(() => this.updateFreqItemSets(), 'updateFreqItems');

        this.logExecutionTime(() => this.updateAssociations(), 'updateAssoc');
        
        this.logExecutionTime(() => this.filterAssocRules(), 'filterAssoc');

        this.logExecutionTime(() => this.createGlyphs(this.filteredMapData), 'createGlyphs');

        const endTime = performance.now();
        console.log(`updateAll total time: ${(endTime - startTime).toFixed(2)} ms`);
        console.log("===== Finished Update =====")
    }

    update() {
        console.log("===== Starting Update =====")

        const startTime = performance.now();

        if (this.#updatedThresh) {
            this.logExecutionTime(() => this.filterAssocRules(this.filteredMapData), 'filterAssoc');
        }

        this.logExecutionTime(() => this.createGlyphs(this.filteredMapData), 'createGlyphs');

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

    setDisplayCategs(method) {
        this.displayMethod = method;
    }

    setProcCategs(categsChosen) {
        this.procCategs = categsChosen;
    }

    setMaxRulesDisplayed(maxRules) {
        this.maxRules = maxRules;
    }

    setGroupColumn(groupColumn) {
        this.groupColumn = groupColumn;
    }

    setSupport(minSupport, maxSupport = Infinity) {
        this.minSupport = minSupport;
        this.maxSupport = maxSupport;
        this.#updatedThresh = true;
    }

    setConfidence(minConfidence, maxConfidence = Infinity) {
        this.minConfidence = minConfidence;
        this.maxConfidence = maxConfidence;
        this.#updatedThresh = true;
    }

    setLift(minLift, maxLift = Infinity) {
        this.minLift = minLift;
        this.maxLift = maxLift;
        this.#updatedThresh = true;
    }

    setCoordsColumns(latColumn, lonColumn, coordFunct = this.defaultCoords) {
        this.latColumn = latColumn;
        this.lonColumn = lonColumn;
        this.coordFunct = coordFunct
    }

    addCoords() {
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

        //divide os dados em provincias e cria as colunas de coordenadas
        this.origData.forEach(entry => {
            var segment = entry[this.groupColumn];

            if (this.groupedData[segment] == undefined) {
                this.groupedData[segment] = []
            }

            this.groupedData[segment].push(entry);
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
                    if (this.procCategs.includes(category)) {
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
        for (const groupKey in this.filteredData) {
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

    updateTransTables() {
        this.transTables = {};

        //transforma os objetos de arrays de cada grupo em arrays de array
        for (const groupKey in this.filteredData) {
            const group = this.filteredData[groupKey];
            this.transTables[groupKey] = [];

            for (let i = 0; i < group.length; i++) {
                const entry = group[i];
                this.transTables[groupKey][i] = [];

                for (const category in entry) {
                    const value = entry[category];

                    this.transTables[groupKey][i].push(value);
                }
            }
        }
    }

    getAssocRules() {
        this.updateTransTables();
        this.updateFreqItemSets();
        this.updateAssociations();
    }

    filterAssocRules() {    //filtra as regras que estao dentro dos limites dos limiares
        this.filteredAssocRules = {};

        for (const groupKey in this.filteredData) {
            const group = this.assocRules[groupKey];
            this.filteredAssocRules[groupKey] = [];

            for (let i = 0; i < group.length; i++) {
                const rule = group[i];

                if (rule.antecedentSupport >= this.minSupport &&
                    rule.consequentSupport >= this.minSupport &&
                    rule.antecedentSupport <= this.maxSupport &&
                    rule.consequentSupport <= this.maxSupport &&
                    rule.confidence >= this.minConfidence &&
                    rule.confidence <= this.maxConfidence &&
                    rule.lift >= this.minLift &&
                    rule.lift <= this.maxLift) {
                    this.filteredAssocRules[groupKey].push(rule);
                }

            }
        }
    }

    updateFreqItemSets() {
        this.assocFreqItems = {};
        for (const tableKey in this.transTables) {
            const table = this.transTables[tableKey];
            this.assocFreqItems[tableKey] = apriori(table, 0);
        }
    }

    updateAssociations() {
        this.assocRules = {};
        this.filteredAssocRules = {};

        for (const groupKey in this.transTables) {
            const table = this.transTables[groupKey];
            this.assocRules[groupKey] = generateAssociationRules(this.assocFreqItems[groupKey], table, 0,0);

            this.filteredAssocRules[groupKey] = structuredClone(this.assocRules[groupKey]);
        }
    }

    processDisplayCategs() {
        this.displayCategs = {};

        switch (this.displayMethod) {
            //escolhe as categorias com mais regras
            case 0:
                var freqRules = getItemsByFrequency(this.filteredAssocRules);
                freqRules = [...new Set([...freqRules, ...this.uniqueValues])].slice(0, this.maxCategories);

                for (const groupKey in this.groupedData) {
                    this.displayCategs[groupKey] = freqRules;
                }
                break;

            //escolhe qualquer categoria
            case 1:
                for (const groupKey in this.groupedData) {
                    this.displayCategs[groupKey] = Object.keys(this.freqData[groupKey]).slice(0, this.maxCategories);
                }
                break;
            //escolhe as categorias mais frequentes
            case 2:
                for (const groupKey in this.groupedData) {
                    this.displayCategs[groupKey] = this.assocFreqItems[groupKey].filter(item => item.length == 1 && item[0] != ""
                    ).slice(0, this.maxCategories).map(item => item[0]);
                }
                break;

            //escolhe as maiores surpresas de cada grupo
            case 3:
                var freqRules = getOrderedAbsoluteValuesPerCity(this.surpriseData);

                for (const groupKey in this.groupedData) {
                    this.displayCategs[groupKey] = freqRules[groupKey].slice(0, this.maxCategories);
                }
                break;

            //escolhe as maiores surpresas gerais
            case 4:
                var freqRules = getHighestAbsoluteValuesOverall(this.surpriseData).slice(0, this.maxCategories);

                for (const groupKey in this.groupedData) {
                    this.displayCategs[groupKey] = freqRules;
                }
                break;

            default:
                break;
        }
    }

    findClosestPair() {
        let minDistance = Infinity;
        let closestPair = { glyph1: null, glyph2: null, dist: Infinity };

        const glyphNames = Object.keys(this.newGlyphs);

        for (let i = 0; i < glyphNames.length; i++) {
            for (let j = i + 1; j < glyphNames.length; j++) {
                const glyph1 = this.newGlyphs[glyphNames[i]];
                const glyph2 = this.newGlyphs[glyphNames[j]];

                const lat1 = glyph1.lat;
                const lon1 = glyph1.lon;
                const lat2 = glyph2.lat;
                const lon2 = glyph2.lon;

                const dLat = lat2 - lat1;
                const dLon = lon2 - lon1;
                const distance = Math.sqrt(dLat * dLat + dLon * dLon);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestPair = { glyph1, glyph2, dist: distance };
                }
            }
        }

        return closestPair;
    }


    getMaxSize() {
        const newSize = Math.min(Math.max(this.closestPair.dist, 0.02), 1)

        return newSize;
    }

    createGlyphs() {
        this.processDisplayCategs();

        for (const groupKey in this.groupedData) {
            const glyph = this.newGlyphs[groupKey];

            glyph.surprises = this.surpriseData[groupKey];
            glyph.rules = this.filteredAssocRules[groupKey];

            glyph.setData(this.surpriseData[groupKey], this.filteredAssocRules[groupKey], this.displayCategs[groupKey]);

            glyph.draw();
        };

        this.closestPair = this.findClosestPair();

        const newSize = this.getMaxSize();

        for (const groupKey in this.groupedData) {
            const glyph = this.newGlyphs[groupKey];
            glyph.setMaxCoordSize(newSize);
            glyph.updateSize();
        };
    }
}