class GlyphData {
    transTables = {};
    #updatedThresh = false;
    #lowestSupport;
    #lowestConfidence;
    #lowestLift;

    constructor(data) {
        this.origData = data;
        this.surpriseModels = [];
        this.maxRules = 5;
        this.minSupport = 0.5;
        this.minConfidence = 0.6;
        this.minLift = 1.3;
        this.#lowestSupport = Infinity;
        this.#lowestConfidence = Infinity;
        this.#lowestLift = Infinity;
        this.glyphs = [];
    }

    updateAll() {
        const startTime = performance.now();

        let t0 = performance.now();
        this.groupByColumn();
        let t1 = performance.now();
        console.log(`groupByColumn: ${(t1 - t0).toFixed(2)} ms`);

        t0 = performance.now();
        this.addCoords();
        t1 = performance.now();
        console.log(`addCoords: ${(t1 - t0).toFixed(2)} ms`);

        t0 = performance.now();
        this.filterCategories();
        t1 = performance.now();
        console.log(`filterCategories: ${(t1 - t0).toFixed(2)} ms`);

        t0 = performance.now();
        this.getFrequencies();
        t1 = performance.now();
        console.log(`getFrequencies: ${(t1 - t0).toFixed(2)} ms`);

        t0 = performance.now();
        this.addSurpriseModel(getPopulModel);
        t1 = performance.now();
        console.log(`addSurpriseModel: ${(t1 - t0).toFixed(2)} ms`);

        t0 = performance.now();
        this.getSurprise();
        t1 = performance.now();
        console.log(`getSurprise: ${(t1 - t0).toFixed(2)} ms`);

        t0 = performance.now();
        this.updateTransTables();
        this.updateFreqItemSets();
        this.updateAssociations();
        t1 = performance.now();
        console.log(`getAssocRules: ${(t1 - t0).toFixed(2)} ms`);

        t0 = performance.now();
        this.buildMapData();
        t1 = performance.now();
        console.log(`buildMapData: ${(t1 - t0).toFixed(2)} ms`);

        t0 = performance.now();
        this.filterMapCategories();
        t1 = performance.now();
        console.log(`filterMapCategories: ${(t1 - t0).toFixed(2)} ms`);

        t0 = performance.now();
        this.createGlyphs(this.filteredMapData);
        t1 = performance.now();
        console.log(`createGlyphs: ${(t1 - t0).toFixed(2)} ms`);

        const endTime = performance.now();
        console.log(`updateAll total time: ${(endTime - startTime).toFixed(2)} ms`);

        this.#lowestSupport = Math.min(this.minSupport, this.#lowestSupport);
        this.#lowestConfidence = Math.min(this.minConfidence, this.#lowestConfidence);
        this.#lowestLift = Math.min(this.minLift, this.#lowestLift);
    }

    update() {
        let t0, t1;
        const startTime = performance.now();

        // let t0 = performance.now();
        // this.groupByColumn();
        // let t1 = performance.now();
        // console.log(`groupByColumn: ${(t1 - t0).toFixed(2)} ms`);

        // t0 = performance.now();
        // this.addCoords();
        // t1 = performance.now();
        // console.log(`addCoords: ${(t1 - t0).toFixed(2)} ms`);

        // t0 = performance.now();
        // this.filterCategories();
        // t1 = performance.now();
        // console.log(`filterCategories: ${(t1 - t0).toFixed(2)} ms`);

        // t0 = performance.now();
        // this.getFrequencies();
        // t1 = performance.now();
        // console.log(`getFrequencies: ${(t1 - t0).toFixed(2)} ms`);

        // t0 = performance.now();
        // this.addSurpriseModel(getPopulModel);
        // t1 = performance.now();
        // console.log(`addSurpriseModel: ${(t1 - t0).toFixed(2)} ms`);

        // t0 = performance.now();
        // this.getSurprise();
        // t1 = performance.now();
        // console.log(`getSurprise: ${(t1 - t0).toFixed(2)} ms`);
        // this.updateTransTables();

        if (this.#updatedThresh) {

            t0 = performance.now();

            this.updateFreqItemSets();

            if (this.minSupport < this.#lowestSupport) {
                this.updateFreqItemSets();
                this.updateAssociations();
                this.#lowestConfidence = this.minConfidence;
                this.#lowestLift = this.minLift;
            }
            else if (this.minConfidence < this.#lowestConfidence || this.minLift < this.#lowestLift) {
                this.filterAssocRules();    //tem que filtrar caso o suporte tenha mudado
                this.updateAssociations();
            }
            else {
                this.filterAssocRules();
            }


            this.#lowestSupport = Math.min(this.minSupport, this.#lowestSupport);
            this.#lowestConfidence = Math.min(this.minConfidence, this.#lowestConfidence);
            this.#lowestLift = Math.min(this.minLift, this.#lowestLift);

            t1 = performance.now();
            console.log(`getAssocRules: ${(t1 - t0).toFixed(2)} ms`);

            t0 = performance.now();
            this.buildMapData();
            t1 = performance.now();
            console.log(`buildMapData: ${(t1 - t0).toFixed(2)} ms`);

            t0 = performance.now();
            this.filterMapCategories();
            t1 = performance.now();
            console.log(`filterMapCategories: ${(t1 - t0).toFixed(2)} ms`);
        }

        t0 = performance.now();
        this.createGlyphs(this.filteredMapData);
        t1 = performance.now();
        console.log(`createGlyphs: ${(t1 - t0).toFixed(2)} ms`);


        const endTime = performance.now();
        console.log(`updateAll total time: ${(endTime - startTime).toFixed(2)} ms`);
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

    setAssocThresh(minSupport = null, minConfidence = null, minLift = null) {
        if (minSupport != null) {
            this.minSupport = minSupport;
        }

        if (minConfidence != null) {
            this.minConfidence = minConfidence;
        }

        if (minLift != null) {
            this.minLift = minLift;
        }

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

        for (const groupKey in this.filteredData) {
            const group = this.filteredData[groupKey];
            this.freqData[groupKey] = {};

            for (let i = 0; i < group.length; i++) {
                const entry = group[i];

                for (const category in entry) {
                    const value = entry[category];

                    //incrementa a quantidade para esse valor, cria uma array de frequencias
                    //caso tenham dados de varias anos
                    if (value != "") {
                        if (this.freqData[groupKey][value] == undefined)
                            this.freqData[groupKey][value] = [0];

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



    filterAssocRules() {
        this.filteredAssocRules = {};

        for (const groupKey in this.filteredData) {
            const group = this.assocRules[groupKey];
            this.filteredAssocRules[groupKey] = [];

            for (let i = 0; i < group.length; i++) {
                const rule = group[i];

                if (rule.antecedentSupport >= this.minSupport &&
                    rule.consequentSupport >= this.minSupport &&
                    rule.confidence >= this.minConfidence &&
                    rule.lift >= this.minLift) {
                    this.filteredAssocRules[groupKey].push(rule);
                }

            }
        }
    }

    updateFreqItemSets() {
        this.assocFreqItems = {};
        for (const tableKey in this.transTables) {
            const table = this.transTables[tableKey];
            this.assocFreqItems[tableKey] = apriori(table, this.minSupport);
        }
    }

    updateAssociations() {
        this.assocRules = {};
        this.filteredAssocRules = {};
        for (const tableKey in this.transTables) {
            const table = this.transTables[tableKey];
            this.assocRules[tableKey] = generateAssociationRules(this.assocFreqItems[tableKey], table, this.minConfidence, this.minLift);
            this.filteredAssocRules[tableKey] = structuredClone(this.assocRules[tableKey]);
        }
    }

    getAverageCoords() {
        var positions = {};
        for (const groupKey in this.groupedData) {
            const group = this.groupedData[groupKey];

            var avrgLat = 0;
            var avrgLon = 0;

            for (let index = 0; index < group.length; index++) {
                avrgLat += group[index].lat;
                avrgLon += group[index].lon;
            }
            avrgLat /= group.length;
            avrgLon /= group.length;

            positions[groupKey] = {};
            positions[groupKey].lat = avrgLat;
            positions[groupKey].lon = avrgLon;
        }
        return positions;
    }

    buildMapData() {
        this.mapData = [];
        var mapCoords = this.getAverageCoords();

        var index = 0;

        for (const groupKey in this.groupedData) {
            this.mapData[index] = {};

            this.mapData[index].name = groupKey;
            this.mapData[index].lat = mapCoords[groupKey].lat;
            this.mapData[index].lon = mapCoords[groupKey].lon;
            this.mapData[index].rules = this.filteredAssocRules[groupKey];
            this.mapData[index].dataPoints = this.surpriseData[groupKey];

            index++;
        }
    }

    processDisplayCategs() {
        this.displayCategs = {};
        switch (this.displayMethod) {
            case 0:
                for (const groupKey in this.groupedData) {
                    this.displayCategs[groupKey] = this.assocFreqItems[groupKey].filter(item => item.length == 1 && item[0] != ""
                    ).slice(0, 10).map(item => item[0]);
                }
                break;

            default:
                break;
        }
    }

    filterMapCategories() {
        this.processDisplayCategs();

        this.filteredMapData = [];
        var index = 0;

        for (const group of this.mapData) {
            const groupKey = group.name;

            if (this.filteredMapData[index] == undefined)
                this.filteredMapData[index] = { name: group.name, lat: group.lat, lon: group.lon };

            this.filteredMapData[index].dataPoints = this.mapData[index].dataPoints.filter(point =>
                this.displayCategs[groupKey].includes(point.name));

            //filtra somente as regras que possuem todos os seus antecessores
            //e cosequentes nas categorias escolhidas
            this.filteredMapData[index].rules = this.mapData[index].rules.filter(rule => {
                var isAnte = rule.antecedents.every(name => this.displayCategs[groupKey].includes(name));
                var isConse = rule.consequents.every(name => this.displayCategs[groupKey].includes(name));

                return isAnte && isConse;
            }).slice(0, this.maxRules);

            index++;
        }

    }

    findSmallestDistance() {
        let minDistance = Infinity;
        let closestPair = { glyph1: 0, glyph2: 0 };

        for (let i = 0; i < this.glyphs.length; i++) {
            for (let j = i + 1; j < this.glyphs.length; j++) {
                const lat1 = this.glyphs[i].data.lat;
                const lon1 = this.glyphs[i].data.lon;
                const lat2 = this.glyphs[j].data.lat;
                const lon2 = this.glyphs[j].data.lon;

                const dLat = lat2 - lat1;
                const dLon = lon2 - lon1;
                const distance = dLat * dLat + dLon * dLon;

                if (distance < minDistance) {
                    minDistance = distance;
                    closestPair = { glyph1: this.glyphs[i], glyph2: this.glyphs[j] };
                }
            }
        }

        return closestPair;
    }

    getMaxSize() {
        const glyph1 = this.closestPair.glyph1;
        const glyph2 = this.closestPair.glyph2;

        const smallestDist = glyph1.distanceTo(glyph2)
        const newSize = Math.min(smallestDist * 0.8, 420);

        return newSize;
    }

    createGlyphs() {
        this.glyphs.forEach(glyph => {
            glyph.remove();
        });

        this.glyphs = [];

        for (const groupKey in this.filteredMapData) {
            const groupData = this.filteredMapData[groupKey];
            const glyph = new GlyphSymbol(groupData);

            this.glyphs.push(glyph);
        }

        this.closestPair = this.findSmallestDistance();

        const newSize = this.getMaxSize();

        this.glyphs.forEach(glyph => {
            glyph.drawGlyph();
            glyph.setSize(newSize);
        });
    }
}