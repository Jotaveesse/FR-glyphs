class GlyphData {
    #transTables = {};

    constructor(data) {
        this.origData = data;
        this.surpriseModels = [];
        this.maxRules = 5;
        this.minSupport = 0.5;
        this.minConfidence = 0.6;
        this.minLift = 1.3;
    }

    updateAll() {
        this.groupByColumn();
        this.addCoords();
        this.filterCategories();
        this.getFrequencies();
        this.addSurpriseModel(getPopulModel);
        this.getSurprise();
        this.getAssocRules();
        this.buildMapData();
        this.filterMapCategories();
        createGlyphs(this.filteredMapData);
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

    setAssocThresh(minSupport, minConfidence, minLift) {
        this.minSupport = minSupport;
        this.minConfidence = minConfidence;
        this.minLift = minLift;
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

    getAssocRules() {
        this.#transTables = {};

        //transforma os objetos de arrays de cada grupo em arrays de array
        for (const groupKey in this.filteredData) {
            const group = this.filteredData[groupKey];
            this.#transTables[groupKey] = [];

            for (let i = 0; i < group.length; i++) {
                const entry = group[i];
                this.#transTables[groupKey][i] = [];

                for (const category in entry) {
                    const value = entry[category];

                    this.#transTables[groupKey][i].push(value);
                }
            }
        }

        //calcula as regras de associação
        this.assocRules = {};
        this.assocFreqItems = {};
        [this.assocRules, this.assocFreqItems] = getAssociations(this.#transTables, this.minSupport, this.minConfidence, this.minLift);
        console.log(this.#transTables)
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
            this.mapData[index].rules = this.assocRules[groupKey];
            this.mapData[index].dataPoints = this.surpriseData[groupKey];

            index++;
        }
    }

    processDisplayCategs(){
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
}
