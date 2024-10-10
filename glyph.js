class GlyphData {
    #transTables = {};

    constructor(data) {
        this.origData = data;
        this.surpriseModels = [];
        this.maxRules = 5;
    }

    groupByColumn(segmentColumn) {
        this.groupedData = {};

        //divide os dados em provincias e cria as colunas de coordenadas
        this.origData.forEach(entry => {
            var segment = entry[segmentColumn];

            if (this.groupedData[segment] == undefined) {
                this.groupedData[segment] = []
            }

            this.groupedData[segment].push(entry);
        });
    }

    defaultCoords(lat, lon) {
        return [parseFloat(lat), parseFloat(lon)];
    }

    setCoords(latColumn, lonColumn, coordFunct = this.defaultCoords) {
        for (const groupKey in this.groupedData) {
            const group = this.groupedData[groupKey];

            for (let i = 0; i < group.length; i++) {
                const entry = group[i];
                [entry.lat, entry.lon] = coordFunct(entry[latColumn], entry[lonColumn]);
            }
        }
    }

    filterCategories(categsToKeep) {
        this.filteredData = {};

        for (const groupKey in this.groupedData) {
            const group = this.groupedData[groupKey];
            this.filteredData[groupKey] = [];

            for (let i = 0; i < group.length; i++) {
                const entry = group[i];
                this.filteredData[groupKey][i] = {};

                for (const category in entry) {
                    if (categsToKeep.includes(category)) {
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

    getAssocRules(minSupport, minConfidence, minLift) {
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
        [this.assocRules, this.assocFreqItems] = getAssociations(this.#transTables, minSupport, minConfidence, minLift);
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

    setDisplayCategs(categsChosen) {
        this.displayCategs = categsChosen;
    }

    setMaxRulesDisplayed(maxRules) {
        this.maxRules = maxRules;
    }

    filterMapCategories() {
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