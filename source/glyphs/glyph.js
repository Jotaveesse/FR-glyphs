import { Surprise } from './surprise.js';
import { FPGrowth } from './association.js';
import * as models from './models.js';
import { getRuleId, isSubset, removeColumnId, extractColumnId } from '../common.js';

const RADIANS = 180 / Math.PI;

export class Glyph {
    constructor(name, group = null, data = []) {
        this.rawData = data;
        this.group = group;
        this.name = name;
        this.itemCount = this.rawData.length;
        this.displayedCount = 0;

        this.isCluster = false;

        this.size = 400;
        this.hoverSize = 400;
        this.displaySize = this.size;

        this.minSupport = 0;
        this.maxSupport = 1;
        this.minConfidence = 0;
        this.maxConfidence = 1;
        this.minLift = 0;
        this.maxLift = 3;
        this.minInterestingness = 0;
        this.maxInterestingness = 1;

        this.minAntecedents = 0;
        this.maxAntecedents = 4;
        this.minConsequents = 0;
        this.maxConsequents = 4;
        this.maxRules = 4;

        this.ruleRank = 'interestingness';
        this.displayMethod = 0;

        this.maxCategories = 4;

        this.deferredUpdate = false;
        this.needsDataUpdate = true;
        this.needsIconUpdate = true;
        this.needsPosUpdate = true;
        this.needsDateUpdate = true;
        this.needsFilterUpdate = true;

        this.chosenData = [];
        this.transTable = [];
        this.frequentItemsets = [];
        this.dates = [];
        this.latitudes = [];
        this.longitudes = [];
        this.columnOrder = [];

        this.associations = null;
        this.filteredRules = [];

        this.displayItems = [];
        this.displayRules = [];
        this.displaySurprises = [];

        this.startDate = new Date(0);
        this.endDate = new Date(864000000000000);
        this.dateFormat = "DD/MM/YYYY, HH:mm:ss";

        this.dateColumn = null;
        this.latColumn = null;
        this.lonColumn = null;

        this.allowedAntecedents = [];
        this.allowedConsequents = [];

        this.surprise = new Surprise();

        this.rightClickFunction = null;
        this.leftClickFunction = null;

        this.isSmall = true;

        this.colorRange = [
            "#8F8F3C", //laranja
            "#D62C2C", //vermelho
            "#EAEA3C", //amarelo
            "#4CE685", //verde claro
            "#222222", //preto
            "#4C85E0", //azul
            "#452CA6",  //roxo
            "#3CD6D6", //ciano
            "#555555", //cinza
        ];


        // this.applyDataChanges();
    }

    applyIconChanges() {
        this.updateProportions();
        this.updateScales();
        this.updateIconSize();

        this.updateMarker();
    }

    applyFilterChanges() {
        this.updateRuleOrder();
        this.updateFilteredRules();
        this.updateDisplayItems();
        this.updateDisplayRules();
        this.updateScales();

        this.updateMarker();
    }

    applyDateChanges() {
        this.updateDates();

        this.applyDataChanges();
    }

    applyDataChanges() {
        this.updateChosenData();

        this.updateSurprise();

        this.updateTransTable();
        this.updateFreqItems();
        this.updateRules();


        this.updateCoordinates();
        this.updateDefaultPosition();
        this.updatePosition();
        this.updateProportions();
        this.updateIconSize();

        this.updateRuleOrder();
        this.updateFilteredRules();
        this.updateDisplayItems();
        this.updateDisplayRules();
        this.updateScales();

        this.updateMarker();
    }

    markForUpdate() {
        if (!this.deferredUpdate) {
            this.applyUpdates();
        }
    }

    deferUpdate() {
        this.deferredUpdate = true
    }

    applyUpdates() {
        if (this.needsDateUpdate) {
            this.applyDateChanges();
        }
        else if (this.needsDataUpdate) {
            this.applyDataChanges();
        }
        else {
            if (this.needsIconUpdate) {
                this.applyIconChanges();
            }
            if (this.needsFilterUpdate) {
                this.applyFilterChanges();
            }
            if (this.needsPosUpdate) {
                this.updateCoordinates();
                this.updatePosition();
            }

        }
        this.deferredUpdate = false;
        this.needsDataUpdate = false;
        this.needsIconUpdate = false;
        this.needsPosUpdate = false;
        this.needsDateUpdate = false;
        this.needsFilterUpdate = false;
    }

    setSize(size) {
        this.size = size;
        this.needsIconUpdate = true;
        this.markForUpdate();
    }

    setHoverSize(size) {
        this.hoverSize = size;
        this.needsIconUpdate = true;
        this.markForUpdate();
    }

    updateIconSize() {
        if (this.marker) {
            this.hoverIcon.options.iconSize = [this.hoverSize * 2, this.hoverSize * 2];
            this.hoverIcon.options.iconAnchor = [this.hoverSize, this.hoverSize];

            this.icon.options.iconSize = [this.size * 2, this.size * 2];
            this.icon.options.iconAnchor = [this.size, this.size];
            this.marker.setIcon(this.icon);
        }
    }

    setName(name) {
        this.name = name;
        this.needsIconUpdate = true;
        this.markForUpdate();
    }

    setPosition(lat, lon) {
        this.lat = lat;
        this.lon = lon;

        this.needsPosUpdate = true;
        this.markForUpdate();
    }

    setMaxCategories(maxCategories) {
        this.maxCategories = maxCategories;

        this.needsFilterUpdate = true
        this.markForUpdate();
    }

    setDisplayCategories(categsChosen = null) {
        this.displayItems = categsChosen;

        this.needsFilterUpdate = true
        this.markForUpdate();
    }

    setSupport(minSupport, maxSupport = Infinity) {
        this.minSupport = minSupport;
        this.maxSupport = maxSupport;

        this.needsFilterUpdate = true
        this.markForUpdate();
    }

    setConfidence(minConfidence, masConfidence = Infinity) {
        this.minConfidence = minConfidence;
        this.maxConfidence = masConfidence;

        this.needsFilterUpdate = true
        this.markForUpdate();
    }

    setLift(minLift, maxLift = Infinity) {
        this.minLift = minLift;
        this.maxLift = maxLift;

        this.needsFilterUpdate = true
        this.markForUpdate();
    }

    setInterestingness(minInterestingness, maxInterestingness = Infinity) {
        this.minInterestingness = minInterestingness;
        this.maxInterestingness = maxInterestingness;

        this.needsFilterUpdate = true
        this.markForUpdate();
    }

    setAntecedentDisplayedRange(minAntecedents, maxAntecedents) {
        this.minAntecedents = minAntecedents;
        this.maxAntecedents = maxAntecedents;

        this.needsFilterUpdate = true
        this.markForUpdate();
    }

    setConsequentDisplayedRange(minConsequents, maxConsequents) {
        this.minConsequents = minConsequents;
        this.maxConsequents = maxConsequents;

        this.needsFilterUpdate = true
        this.markForUpdate();
    }

    setMaxRules(maxRules) {
        this.maxRules = maxRules;

        this.needsFilterUpdate = true
        this.markForUpdate();
    }

    setRuleRank(method) {
        this.ruleRank = method;

        this.needsFilterUpdate = true
        this.markForUpdate();
    }

    setDisplayMethod(method) {
        this.displayMethod = method;

        this.needsFilterUpdate = true
        this.markForUpdate();
    }

    setData(data) {
        this.rawData = data;

        this.needsDataUpdate = true
        this.markForUpdate();
    }

    setSurprise(surprises) {
        this.surprise = surprises;

        this.needsFilterUpdate = true
        this.markForUpdate();
    }

    setRuleTree(tree) {
        this.associations = tree;
    }

    setModels(models) {
        this.surprise.models = models;
    }

    setCategSums(categSums) {
        this.surprise.categSums = categSums;
    }

    setCount(count, displayedCount = null) {
        this.itemCount = count;
        if (displayedCount != null)
            this.displayedCount = displayedCount;
    }

    /**
     * @param {Date} startDate A data inicial para fitlrar os dados
     * @param {string} endDate A data final para fitlrar os dados
     */
    setDateRange(startDate, endDate) {
        this.startDate = startDate;
        this.endDate = endDate;

        this.needsDataUpdate = true
        this.markForUpdate();
    }

    /**
     * @param {string} format Formato da data que será usada
     */
    setDateFormat(format) {
        this.dateFormat = format;

        this.needsDateUpdate = true
        this.markForUpdate();
    }

    /**
     * @param {string} format Coluna da data que será usada
     */
    setDateColumn(dateColumn) {
        this.dateColumn = dateColumn;

        this.needsDateUpdate = true
        this.markForUpdate();
    }

    /**
     * @param {string} latColumn Coluna da latitude que será usada
     * @param {string} lonColumn Coluna da longitude que será usada
     */
    setCoordsColumns(latColumn, lonColumn) {
        this.latColumn = latColumn;
        this.lonColumn = lonColumn;

        this.needsPosUpdate = true
        this.markForUpdate();
    }

    setLeftClickFunction(leftClickFunction) {
        this.leftClickFunction = leftClickFunction;

        this.needsIconUpdate = true;
        this.markForUpdate();
    }

    setRightClickFunction(rightClickFunction) {
        this.rightClickFunction = rightClickFunction;

        this.needsIconUpdate = true;
        this.markForUpdate();
    }

    setAntecedentFilter(allowedClasses) {
        this.allowedAntecedents = allowedClasses;

        this.needsFilterUpdate = true;
        this.markForUpdate();
    }

    setConsequentFilter(allowedClasses) {
        this.allowedConsequents = allowedClasses;

        this.needsFilterUpdate = true;
        this.markForUpdate();
    }

    setDates(dates) {
        this.dates = dates;

        this.needsDataUpdate = true
        this.markForUpdate();
    }

    setIsCluster(isCluster) {
        this.isCluster = isCluster;
    }

    static merge(glyphs) {
        const name = `${glyphs.length}`;
        var mergedDisplayedCount = 0;
        var mergedCount = 0;
        var newRuleData = null;
        var newSurp = null;
        var avrgLat = 0;
        var avrgLon = 0;

        glyphs.forEach(glyph => {
            //merge cada associação, uma por uma
            if (newRuleData) {
                newRuleData = newRuleData.mergePatterns(glyph.associations, false);
                newSurp = Surprise.merge(glyph.surprise, newSurp);
                mergedCount += glyph.itemCount;
                mergedDisplayedCount += glyph.displayedCount;
            }
            else {
                newRuleData = glyph.associations;
                newSurp = glyph.surprise;
                mergedCount = glyph.itemCount;
                mergedDisplayedCount = glyph.displayedCount;
            }

            avrgLat += glyph.lat;
            avrgLon += glyph.lon;
        });

        avrgLat /= glyphs.length;
        avrgLon /= glyphs.length;

        newRuleData.updatePatterns();

        const mergedGlyph = new Glyph(name);
        mergedGlyph.deferUpdate();
        mergedGlyph.setCount(mergedCount, mergedDisplayedCount);
        mergedGlyph.setRuleTree(newRuleData);
        mergedGlyph.setSurprise(newSurp);
        mergedGlyph.setPosition(avrgLat, avrgLon);
        mergedGlyph.setIsCluster(true);
        mergedGlyph.columnOrder = glyphs[0].columnOrder;

        return mergedGlyph;
    }

    /**
     * @param {Date} format Data inicial da filtragem dos dados
     * @param {Date} format Data final da filtragem dos dados
     */
    getRulesBetweenDates(dateStart, dateEnd) {
        const newGlyph = new Glyph(this.name, this.group)

        newGlyph.deferUpdate();
        newGlyph.setData(this.rawData);
        newGlyph.setDateRange(dateStart, dateEnd);
        newGlyph.setDisplayMethod(-1);
        newGlyph.setRuleRank(this.ruleRank);

        newGlyph.setDateColumn(this.dateColumn)
        newGlyph.setDates(this.dates);
        newGlyph.updateChosenData();

        newGlyph.updateTransTable();
        newGlyph.updateFreqItems();
        newGlyph.updateRules();
        newGlyph.updateRuleOrder();

        return newGlyph.associations;
    }

    updateDates() {
        this.dates = [];

        if (this.rawData != null && this.rawData.length > 0 && this.dateColumn != null) {
            for (let i = 0; i < this.rawData.length; i++) {
                const entry = this.rawData[i];
                this.dates[i] = dayjs(entry[this.dateColumn], this.dateFormat);;
            }
        }
    }

    updateCoordinates() {
        this.latitudes = [];
        this.longitudes = [];
        for (let i = 0; i < this.rawData.length; i++) {
            const entry = this.rawData[i];
            let lat, lon;
            [lat, lon] = [parseFloat(entry[this.latColumn]), parseFloat(entry[this.lonColumn])];
            if (isNaN(lat) || Math.abs(lat) > 90)
                lat = null;
            if (isNaN(lon) || Math.abs(lon) > 180)
                lon = null;
            this.latitudes.push(lat);
            this.longitudes.push(lon);
        }
    }

    updateChosenData() {
        this.chosenData = [];
        if (this.rawData != null && this.rawData.length > 0) {
            this.displayedCount = 0;
            this.columnOrder = Object.keys(this.rawData[0]).sort();

            for (let i = 0; i < this.rawData.length; i++) {
                const entry = this.rawData[i];

                const passesDateFilter = this.dateColumn == null ||
                    (this.dates[i] >= this.startDate &&
                        this.dates[i] <= this.endDate);

                if (passesDateFilter) {
                    this.chosenData.push({});
                    this.displayedCount++;

                    let columnIndex = 0;
                    for (const category of Object.keys(entry).sort()) {
                        if (this.group.chosenColumns.includes(category)) {
                            const value = entry[category];
                            this.chosenData[this.chosenData.length - 1][category] = value + "_" + columnIndex;
                        }
                        columnIndex++;
                    }
                }
            }
        }
    }

    updateSurprise() {
        if (this.chosenData.length > 0)
            this.surprise.setFrequency(this.chosenData);
        const [surp, beliefs] = this.surprise.generateSurprise();
    }

    updateTransTable() {
        //transforma os objetos de arrays de cada grupo em arrays de arrays
        if (this.chosenData.length > 0) {
            this.transTable = [];

            for (let i = 0; i < this.chosenData.length; i++) {
                const entry = this.chosenData[i];
                this.transTable[i] = [];

                for (const category in entry) {
                    const value = entry[category];

                    this.transTable[i].push(value);
                }
            }
        }
    }

    updateFreqItems() {
        if (this.transTable.length > 0) {
            const tree = new FPGrowth();
            tree.generatePatterns(this.transTable, this.minSupport);
            this.associations = tree;
        }
    }

    updateRules() {
        this.associations.generateRules();

        this.filteredRules = this.associations.rules;

    }

    updateRuleOrder() {
        this.associations.rules = this.associations.rules.sort((a, b) => {
            return b[this.ruleRank] - a[this.ruleRank];
        });
       
    }

    updateFilteredRules() {    //filtra as regras que estao dentro dos limites dos limiares
        this.filteredRules = [];
        for (let i = 0; i < this.associations.rules.length; i++) {
            const rule = this.associations.rules[i];

            if (
                rule.antecedents.length >= this.minAntecedents &&
                rule.antecedents.length <= this.maxAntecedents &&
                rule.consequents.length >= this.minConsequents &&
                rule.consequents.length <= this.maxConsequents &&
                rule.antecedentSupport >= this.minSupport &&
                rule.antecedentSupport <= this.maxSupport &&
                rule.consequentSupport >= this.minSupport &&
                rule.consequentSupport <= this.maxSupport &&
                rule.support >= this.minSupport &&
                rule.support <= this.maxSupport &&
                rule.confidence >= this.minConfidence &&
                rule.confidence <= this.maxConfidence &&
                rule.lift >= this.minLift &&
                Math.min(rule.lift, 4) <= this.maxLift &&
                rule.interestingness >= this.minInterestingness &&
                rule.interestingness <= this.maxInterestingness &&
                (this.allowedAntecedents.length == 0 || isSubset(rule.antecedents, this.allowedAntecedents)) &&
                (this.allowedConsequents.length == 0 || isSubset(rule.consequents, this.allowedConsequents))
            ) {
                this.filteredRules.push(rule);
            }
        }
    }

    updateDisplayRules() {
        // tira apenas a quantidade necessaria e ordena alfabeticamente
        const slicedCategs = this.displayItems.slice(0, this.maxCategories);

        if (this.surprise.surprises)
            this.displaySurprises = this.surprise.surprises.filter(surp =>
                slicedCategs.includes(surp.name));

        //arredonda pra 3 casas decimais
        this.displaySurprises.forEach((val) => {
            val.value = Math.round((val.value + Number.EPSILON) * 1000) / 1000;
        });

        //filtra somente as regras que possuem todos os seus antecessores
        //e consequentes nas categorias escolhidas
        this.displayRules = this.filteredRules.filter(rule => {
            var isAnte = rule.antecedents.every(name => slicedCategs.includes(name));
            var isConse = rule.consequents.every(name => slicedCategs.includes(name));

            return isAnte && isConse;
        }).slice(0, this.maxRules);
    }

    updateDisplayItems() {
        this.displayItems = [];
        switch (this.displayMethod) {
            //escolhe categorias com maiores surpresas de cada grupo
            case 0:
                this.displayItems = models.getItemsBySurpriseGrouped(this.surprise.surprises);
                break;

            //escolhe categorias com as maiores surpresas gerais
            case 1:
                this.displayItems = models.getItemsBySurpriseGlobal(this.group.getAllSurprises());
                break;

            //escolhe as categorias com mais regras em cada grupo
            case 2:
                this.displayItems = models.getItemsByFrequencyGrouped(this.filteredRules);
                break;

            //escolhe as categorias com mais regras globalmente
            case 3:
                this.displayItems = models.getItemsByFrequencyGlobal(this.group.getAllFilteredRules());
                break;

            case 4:
                this.displayItems = models.getItemsByInterestingnessGrouped(this.filteredRules);
                break;
            //escolhe qualquer categoria
            default:
                this.displayItems = this.group.uniqueValues;

                break;
        }

        //adiciona items para preencher a quantidade maxima
        this.displayItems = [...new Set([...this.displayItems, ...this.group.uniqueValues])];
    }

    updateDefaultPosition() {
        if (this.rawData != null && this.rawData.length > 0) {
            var avrgLat = 0;
            var avrgLon = 0;
            var length = 0;

            for (let index = 0; index < this.rawData.length; index++) {
                if (this.latitudes[index] != null && this.longitudes[index] !== null) {
                    avrgLat += this.latitudes[index];
                    avrgLon += this.longitudes[index];
                    length++;
                }
            }

            if (length > 0) {
                avrgLat /= length;
                avrgLon /= length;
            }

            this.lat = avrgLat;
            this.lon = avrgLon;
        }
    }

    updatePosition() {
        if (this.marker) {
            const newLatLng = new L.LatLng(this.lat, this.lon);

            const oldLatLng = this.marker.getLatLng();

            if (oldLatLng.lat != newLatLng.lat || oldLatLng.lon != newLatLng.lon)
                this.marker.setLatLng(newLatLng);
        }
    }

    updateProportions() {
        this.startAngle = 0;
        this.width = this.size;
        this.textSize = this.width / 25;

        this.barWidth = this.width / 20;
        this.maxBarLength = this.width / 6;

        this.height = this.width;
        const textAmount = 3;
        const textPadding = (textAmount + (textAmount - 1) / 2) * 2;
        this.innerRadius = (this.width - this.maxBarLength * 2 - this.textSize * textPadding) / 2;

        this.circleBorderWidth = this.width / 120;

        this.arrowWidth = this.width / 120;
        this.arrowPointSize = this.width / 64;

        this.outlineWidth = this.width / 320;
        this.outlineColor = "black";

        this.textRadius = this.innerRadius + this.maxBarLength + this.textSize * 2;
        this.textColor = "black";
    }

    updateScales() {
        this.colorScale = d3.scaleOrdinal()
            .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
            .range(this.colorRange);

        //escala da barra
        this.linScale = d3.scaleLinear()
            .domain([0, d3.max(this.displaySurprises, d => Math.abs(d.value))])
            .range([0, this.maxBarLength]);

        //arco do circulo
        this.borderArc = d3.arc()
            .innerRadius(this.innerRadius - this.circleBorderWidth / 2)
            .outerRadius(this.innerRadius + this.circleBorderWidth / 2)
            .cornerRadius(20);

        //controle das linhas das setas
        this.radialLine = d3.lineRadial()
            .angle(d => d[0])
            .radius(d => d[1])
            .curve(d3.curveBasis);

        this.borderPie = d3.pie()
            .padAngle(4 / this.innerRadius)
            .sort(null)
            .startAngle(-Math.PI / this.displaySurprises.length - this.startAngle / RADIANS)
            .endAngle(Math.PI * 3 + this.startAngle / RADIANS) // garante que sempre vai ser um circulo completo
            .value(1);

        this.pieData = this.borderPie(this.displaySurprises.sort((a, b) => a.name.localeCompare(b.name))).map(d => ({
            ...d,
            middleAngle: (d.startAngle + d.endAngle) / 2
        }));

        //cria um objeto que associa o nome da categoria ao seu indice
        this.surprisesIndex = this.displaySurprises.reduce((acc, item, index) => {
            acc[item.name] = index;
            return acc;
        }, {});

        //inicializa dados auxiliares
        this.displaySurprises.forEach(dp => {
            dp.consCount = 0;
            dp.anteCount = 0;
            dp.consCalc = 0;
            dp.anteCalc = 0;
        });

        //conta quantos antecessores e consequentes cada categoria tem
        this.displayRules.forEach(rule => {
            for (let anteIndex = 0; anteIndex < rule.antecedents.length; anteIndex++) {
                const antecedent = rule.antecedents[anteIndex];
                const dpAnteIndex = this.surprisesIndex[antecedent];

                this.displaySurprises[dpAnteIndex].consCount++;
            }
            for (let consIndex = 0; consIndex < rule.consequents.length; consIndex++) {
                const consequent = rule.consequents[consIndex];
                const dpConsIndex = this.surprisesIndex[consequent];

                this.displaySurprises[dpConsIndex].anteCount++;
            }
        });

        this.arrowData = [];

        //calcula a posição de partida e chegada das setas com base nas regras de associação
        this.displayRules.forEach((rule, ruleIndex) => {
            for (let anteIndex = 0; anteIndex < rule.antecedents.length; anteIndex++) {
                const antecedent = rule.antecedents[anteIndex];
                const dpAnteIndex = this.surprisesIndex[antecedent];
                const dpAnte = this.displaySurprises[dpAnteIndex];

                var anteArrowIndex = dpAnte.consCalc++;


                for (let consIndex = 0; consIndex < rule.consequents.length; consIndex++) {
                    const consequent = rule.consequents[consIndex];
                    const dpConsIndex = this.surprisesIndex[consequent];
                    const dpCons = this.displaySurprises[dpConsIndex];

                    var arrowPos = { center: [0, 0], rule: rule, ruleIndex: ruleIndex };

                    //calcula qual o angulo em que a seta vai se originar, levando em conta as outras setas
                    var anteArrowCount = dpAnte.consCount + dpAnte.anteCount;
                    // dpCons.anteCalc++;

                    var anteAngleStep = (this.pieData[dpAnteIndex].endAngle - this.pieData[dpAnteIndex].startAngle) / (anteArrowCount + 1);
                    var anteAngle = this.pieData[dpAnteIndex].startAngle + (anteArrowIndex + 1) * anteAngleStep;

                    arrowPos.ante = [anteAngle, this.innerRadius];

                    //calcula qual o ponto em que a seta ira apontar, levando em conta as outras setas
                    var consArrowCount = dpCons.consCount + dpCons.anteCount;


                    var consArrowIndex = dpCons.consCount + dpCons.anteCalc
                    if (anteIndex == rule.antecedents.length - 1) {
                        dpCons.anteCalc++;
                    }

                    var consAngleStep = (this.pieData[dpConsIndex].endAngle - this.pieData[dpConsIndex].startAngle) / (consArrowCount + 1);
                    var consAngle = this.pieData[dpConsIndex].startAngle + (consArrowIndex + 1) * consAngleStep;

                    arrowPos.cons = [consAngle, this.innerRadius - this.arrowPointSize - this.outlineWidth - this.circleBorderWidth / 2];

                    this.arrowData.push(arrowPos);
                }

            }
        });
    }

    initializeMarker() {
        if (this.marker) {
            this.updateMarker();
            return this.marker;
        }

        this.svg = d3.create("svg");

        this.svg.attr('viewBox', `${-this.size}, ${-this.size}, ${this.size * 2}, ${this.size * 2}`)

        this.svgGroup = this.svg.append('g')
            .attr("class", "svg-group");

        this.rulesInfo = this.svgGroup.append("g")
            .attr("class", "glyph-rules-info");

        this.background = this.svgGroup.append("circle")
            .attr("class", "glyph-background")
            .attr("r", this.width / 2)
            .style("pointer-events", "auto")
            .style("fill", "rgba(255, 255, 255)")
            .attr("stroke", "black")
            .attr("stroke-width", "1px")
            .style("opacity", 0);


        //criação das outlines das setas
        this.arrowOutlines = this.svgGroup.append("g")
            .attr("class", "glyph-arrow-outlines")
            .attr("visibility", this.isSmall ? "hidden" : "");

        //criação das outlines das barras
        this.barOutlines = this.svgGroup.append("g")
            .attr("class", "glyph-bar-outlines")
            .attr("visibility", this.isSmall ? "hidden" : "");

        //criação da borda circular
        this.circleBorder = this.svgGroup.append("g")
            .attr("class", "glyph-border");

        //grupo que contem as linhas e cabeça das setas
        this.arrows = this.svgGroup.append("g")
            .attr("class", "glyph-arrows");

        //criação das barras
        this.bars = this.svgGroup.append("g")
            .attr("class", "glyph-bars");


        //cria o caminho em que o texto vai curvar sobre
        this.circleTextPath = d3.path();
        this.circleTextPath.moveTo(0, -this.textRadius);
        //circulo dá 3 voltas pra não cortar texto no começo e no fim
        this.circleTextPath.arc(0, 0, this.textRadius, -0.5 * Math.PI, 1.5 * Math.PI);
        this.circleTextPath.arc(0, 0, this.textRadius, -0.5 * Math.PI, 1.5 * Math.PI);
        this.circleTextPath.arc(0, 0, this.textRadius, -0.5 * Math.PI, 1.5 * Math.PI);

        this.textPath = this.svgGroup.append("path")
            .attr("class", "glyph-text-circle")
            .attr("id", `text-circle-${this.name}`)
            .attr("d", this.circleTextPath.toString())
            .attr("fill", "none")
            .attr("stroke", "none")

        //criação dos textos de cada barra
        this.barTexts = this.svgGroup.append("g")
            .attr("class", "glyph-bar-texts")
            .attr("fill", this.textColor)
            .attr("font-family", "Trebuchet MS, monospace")
            .attr("font-size", this.textSize)
            .attr("text-anchor", "middle")                      //centraliza horizontalmente
            .attr("dominant-baseline", "middle")           //centraliza verticalmente
            .attr("visibility", "hidden");                              //inicialmente não é mostrado

        //texto principal
        this.mainText = this.svgGroup.append("g")
            .attr("class", "glyph-title")
            .attr("fill", "black")
            .attr("font-family", "Trebuchet MS, monospace")
            .attr("font-size", this.width / (4 + 0.2 * this.name.length))
            .attr("text-anchor", "middle")                      //centraliza horizontalmente
            .attr("dominant-baseline", "middle")            //centraliza verticalmente
            .attr("visibility", "");

        //texto da quantidade de items
        this.countText = this.svgGroup.append("g")
            .attr("class", "glyph-count")
            .attr("fill", "black")
            .attr("font-family", "Trebuchet MS, monospace")
            .attr("font-size", this.width / 10)
            .attr("text-anchor", "middle")                      //centraliza horizontalmente
            .attr("dominant-baseline", "middle")            //centraliza verticalmente
            .attr("visibility", "");

        //hitbox do svg para detectar hover
        this.hitbox = this.svgGroup.append("circle")
            .attr("class", "glyph-hitbox")
            .attr("r", this.width / 2)
            .style("pointer-events", "auto")
            .style("fill", "rgba(0, 0, 0, 0.0)")
            .on("contextmenu", (event) => this.rightClickFunction(event, this))
            .on("dblclick", (event) => {
                event.stopPropagation();
            })
            .on("click", (event) => {
                this.leftClickFunction(event, this);
                this.showBigIcon.bind(this);
            });
        // .on("mouseout", this.showSmallIcon.bind(this));

        // this.updateMarker();

        const svgIcon = this.svg.node();

        this.icon = L.divIcon({
            className: 'custom-icon',
            html: svgIcon,
            iconSize: [this.size * 2, this.size * 2],
            iconAnchor: [this.size, this.size],
            popupAnchor: [0, 0]
        });

        this.hoverIcon = L.divIcon({
            className: 'custom-icon',
            html: svgIcon,
            iconSize: [this.hoverSize * 2, this.hoverSize * 2],
            iconAnchor: [this.hoverSize, this.hoverSize],
            popupAnchor: [0, 0]
        });

        this.marker = L.marker([this.lat, this.lon], { icon: this.icon, zIndexOffset: -9000, glyph: this });

        return this.marker;
    }

    updateMarker() {
        if (!this.marker)
            this.initializeMarker();

        this.arrowOutlines
            .selectAll("g")
            .data(this.arrowData)
            .join(
                enter => enter.append("g")
                    .append("path")
                    .attr("d", (d, i) => this.radialLine([d.ante, d.center, d.cons]))
                    .attr("fill", "none")
                    .attr("stroke", this.outlineColor)
                    .attr("stroke-width", (this.outlineWidth ? this.arrowWidth : 0) + this.outlineWidth * 2),
                update => update
                    .select("path")
                    .attr("d", (d, i) => this.radialLine([d.ante, d.center, d.cons]))
                    .attr("stroke-width", (this.outlineWidth ? this.arrowWidth : 0) + this.outlineWidth * 2),
                exit => exit.remove()
            );

        this.barOutlines
            .selectAll("rect")
            .data(this.pieData)
            .join(
                enter => enter.append("rect")
                    .attr("x", (d, i) => -(this.barWidth + this.outlineWidth * 2) / 2)
                    .attr("y", this.innerRadius)
                    .attr("width", this.barWidth + this.outlineWidth * 2)
                    .attr("height", d => this.linScale(Math.abs(d.data.value)) + this.outlineWidth)
                    .attr("fill", this.outlineColor)
                    .attr("transform", (d, i) => `rotate(${d.middleAngle * RADIANS + 180}, 0, 0)`),
                update => update
                    .attr("height", d => this.linScale(Math.abs(d.data.value)) + this.outlineWidth)
                    .attr("transform", (d, i) => `rotate(${d.middleAngle * RADIANS + 180}, 0, 0)`),
                exit => exit.remove()
            );

        this.circleBorder
            .selectAll("path")
            .data(this.pieData)
            .join(
                enter => enter.append("path")
                    .attr("fill", d => d.data.value == 0 ? "#888" : (d.data.value < 0 ? "#2c4" : "#c24"))
                    .attr("stroke", this.outlineColor)
                    .attr("stroke-width", this.isSmall ? 0 : this.outlineWidth)
                    .attr("d", this.borderArc),
                update => update
                    .attr("fill", d => d.data.value == 0 ? "#888" : (d.data.value < 0 ? "#2c4" : "#c24"))
                    .attr("d", this.borderArc),
                exit => exit.remove()
            );

        const lineCount = 6;
        const infoTextSize = this.textSize * 0.6;
        const infoHeight = infoTextSize * (lineCount + 1);
        const infoWidth = 15 * infoTextSize + 64;
        const horizontalPadding = 1;
        const decimalPlaces = 3;

        this.rulesInfo.selectAll('*').remove();

        this.rulesInfo
            .attr("transform", `translate(0, ${-infoHeight * (parseInt((this.displayRules.length - 1) / 2) / 2)} )`)
            .attr("visibility", this.isSmall ? "hidden" : "")
            .selectAll("g")
            .data(this.displayRules, d => JSON.stringify(d.antecedents) + JSON.stringify(d.consequents))
            .join(
                enter => {
                    const infoGroup = enter.append("g")
                        .attr("id", (d, i) => JSON.stringify(d.antecedents) + JSON.stringify(d.consequents) + i)
                        .attr("class", "info-group")
                        .attr("transform", (d, i) => i % 2 == 0
                            ? `translate(${-infoWidth}, ${i * infoHeight / 2})`
                            : `translate(${infoWidth}, ${(i - 1) * infoHeight / 2})`);

                    infoGroup.append("rect")
                        .attr("x", (d, i) => i % 2 == 0 ? - infoTextSize * 2.5 : -infoWidth + infoTextSize * 2.5)
                        .attr("y", -infoTextSize * lineCount / 2 - infoTextSize / lineCount - 1)
                        .attr("width", infoWidth)
                        .attr("height", infoTextSize * lineCount + 1)
                        .attr("fill", "#fff")
                        .attr("rx", 0)
                        .attr("ry", 0)
                        .attr("stroke", "black")
                        .attr("stroke-width", "1px");

                    infoGroup.append("path")
                        .attr("d", d => {
                            const width = infoTextSize * lineCount + 1;
                            const height = infoTextSize * 2;
                            const thickness = infoTextSize * 2.5;
                            return `
                                M ${-width / 2}, 0 
                                L 0, ${-height} 
                                L ${width / 2}, 0 
                                L ${width / 2}, ${-thickness} 
                                L 0, ${-height - thickness} 
                                L ${-width / 2}, ${-thickness}  
                                Z
                            `;
                        })
                        .attr("transform", (d, i) => `translate(${i % 2 == 0 ? 0 : -0}, ${-infoTextSize / lineCount - 0.5}) rotate(${i % 2 == 0 ? -90 : 90}, 0, 0)`)
                        .attr("fill", (d, i) => this.colorScale(i))
                        .attr("stroke", "black")
                        .attr("stroke-width", "1px");

                    const anteSupGroup = infoGroup.append("g").attr("class", "antecedent-info");
                    const consSupGroup = infoGroup.append("g").attr("class", "consequent-info");
                    const supGroup = infoGroup.append("g").attr("class", "support-info");
                    const confGroup = infoGroup.append("g").attr("class", "confidence-info");
                    const liftGroup = infoGroup.append("g").attr("class", "lift-info");
                    const interestGroup = infoGroup.append("g").attr("class", "interestingness-info");

                    anteSupGroup.append("text")
                        .call(text => text.append("tspan")
                            .attr("font-weight", 600)
                            .attr("text-anchor", (d, i) => i % 2 == 0 ? "start" : "end")
                            .attr("x", (d, i) => i % 2 == 0 ? horizontalPadding : -horizontalPadding)
                            .attr("y", -infoTextSize * 2.5)
                            .attr("font-size", infoTextSize)
                            .attr("stroke", "#fffc")
                            .attr("stroke-width", 0.75)
                            .attr("paint-order", "stroke")
                            .text(d => "Suporte Ante.: " + d.antecedentSupport.toFixed(decimalPlaces))
                        );

                    consSupGroup.append("text")
                        .call(text => text.append("tspan")
                            .attr("font-weight", 600)
                            .attr("text-anchor", (d, i) => i % 2 == 0 ? "start" : "end")
                            .attr("x", (d, i) => i % 2 == 0 ? horizontalPadding : -horizontalPadding)
                            .attr("y", -infoTextSize * 1.5)
                            .attr("font-size", infoTextSize)
                            .attr("stroke", "#fffc")
                            .attr("stroke-width", 0.75)
                            .attr("paint-order", "stroke")
                            .attr("font-size", infoTextSize)
                            .text(d => "Suporte Conse.: " + d.consequentSupport.toFixed(decimalPlaces))
                        );

                    supGroup.append("text")
                        .call(text => text.append("tspan")
                            .attr("font-weight", 600)
                            .attr("text-anchor", (d, i) => i % 2 == 0 ? "start" : "end")
                            .attr("x", (d, i) => i % 2 == 0 ? horizontalPadding : -horizontalPadding)
                            .attr("y", -infoTextSize * 0.5)
                            .attr("font-size", infoTextSize)
                            .attr("stroke", "#fffc")
                            .attr("stroke-width", 0.75)
                            .attr("paint-order", "stroke")
                            .attr("font-size", infoTextSize)
                            .text(d => "Suporte: " + d.support.toFixed(decimalPlaces))
                        );

                    confGroup.append("text")
                        .call(text => text.append("tspan")
                            .attr("font-weight", 600)
                            .attr("text-anchor", (d, i) => i % 2 == 0 ? "start" : "end")
                            .attr("x", (d, i) => i % 2 == 0 ? horizontalPadding : -horizontalPadding)
                            .attr("y", infoTextSize * 0.5)
                            .attr("font-size", infoTextSize)
                            .attr("stroke", "#fffc")
                            .attr("stroke-width", 0.75)
                            .attr("paint-order", "stroke")
                            .attr("font-size", infoTextSize)
                            .text(d => "Confiança: " + d.confidence.toFixed(decimalPlaces))
                        );

                    liftGroup.append("text")
                        .call(text => text.append("tspan")
                            .attr("font-weight", 600)
                            .attr("text-anchor", (d, i) => i % 2 == 0 ? "start" : "end")
                            .attr("x", (d, i) => i % 2 == 0 ? horizontalPadding : -horizontalPadding)
                            .attr("y", infoTextSize * 1.5)
                            .attr("font-size", infoTextSize)
                            .attr("stroke", "#fffc")
                            .attr("stroke-width", 0.75)
                            .attr("paint-order", "stroke")
                            .attr("font-size", infoTextSize)
                            .text(d => "Lift: " + d.lift.toFixed(decimalPlaces))
                        );

                    interestGroup.append("text")
                        .call(text => text.append("tspan")
                            .attr("font-weight", 600)
                            .attr("text-anchor", (d, i) => i % 2 == 0 ? "start" : "end")
                            .attr("x", (d, i) => i % 2 == 0 ? horizontalPadding : -horizontalPadding)
                            .attr("y", infoTextSize * 2.5)
                            .attr("font-size", infoTextSize)
                            .attr("stroke", "#fffc")
                            .attr("stroke-width", 0.75)
                            .attr("paint-order", "stroke")
                            .attr("font-size", infoTextSize)
                            .text(d => "Interesse: " + d.interestingness.toFixed(decimalPlaces))
                        );
                },
                update => {
                    update.attr("transform", (d, i) => i % 2 == 0
                        ? `translate(${-infoWidth}, ${i * infoHeight / 2})`
                        : `translate(${infoWidth}, ${(i - 1) * infoHeight / 2})`);

                    const anteSupGroup = update.append("g").attr("class", "antecedent-info");
                    const consSupGroup = update.append("g").attr("class", "consequent-info");
                    const supGroup = update.append("g").attr("class", "support-info");
                    const confGroup = update.append("g").attr("class", "confidence-info");
                    const liftGroup = update.append("g").attr("class", "lift-info");
                    const interestGroup = update.append("g").attr("class", "interestingness-info");

                    update.append("path")
                        .attr("transform", (d, i) => `translate(0, ${-infoTextSize / 4}) rotate(${i % 2 == 0 ? -90 : 90}, 0, 0)`)
                        .attr("fill", (d, i) => this.colorScale(i));


                    anteSupGroup.append("text")
                        .call(text => text.append("tspan")
                            .attr("font-weight", 600)
                            .attr("text-anchor", (d, i) => i % 2 == 0 ? "start" : "end")
                            .attr("x", (d, i) => i % 2 == 0 ? horizontalPadding : -horizontalPadding)
                            .attr("y", -infoTextSize * 2.5)
                            .attr("font-size", infoTextSize)
                            .text(d => "Suporte Ante.: " + d.antecedentSupport.toFixed(2))
                        );

                    consSupGroup.append("text")
                        .call(text => text.append("tspan")
                            .attr("font-weight", 600)
                            .attr("text-anchor", (d, i) => i % 2 == 0 ? "start" : "end")
                            .attr("x", (d, i) => i % 2 == 0 ? horizontalPadding : -horizontalPadding)
                            .attr("y", -infoTextSize * 1.5)
                            .attr("font-size", infoTextSize)
                            .text(d => "Suporte Conse.: " + d.consequentSupport.toFixed(2))
                        );

                    supGroup.append("text")
                        .call(text => text.append("tspan")
                            .attr("font-weight", 600)
                            .attr("text-anchor", (d, i) => i % 2 == 0 ? "start" : "end")
                            .attr("x", (d, i) => i % 2 == 0 ? horizontalPadding : -horizontalPadding)
                            .attr("y", -infoTextSize * 0.5)
                            .attr("font-size", infoTextSize)
                            .text(d => "Suporte Conse.: " + d.consequentSupport.toFixed(2))
                        );

                    confGroup.append("text")
                        .call(text => text.append("tspan")
                            .attr("font-weight", 600)
                            .attr("text-anchor", (d, i) => i % 2 == 0 ? "start" : "end")
                            .attr("x", (d, i) => i % 2 == 0 ? horizontalPadding : -horizontalPadding)
                            .attr("y", infoTextSize * 0.5)
                            .attr("font-size", infoTextSize)
                            .text(d => "Confiança: " + d.confidence.toFixed(2))
                        );

                    liftGroup.append("text")
                        .call(text => text.append("tspan")
                            .attr("font-weight", 600)
                            .attr("text-anchor", (d, i) => i % 2 == 0 ? "start" : "end")
                            .attr("x", (d, i) => i % 2 == 0 ? horizontalPadding : -horizontalPadding)
                            .attr("y", infoTextSize * 1.5)
                            .attr("font-size", infoTextSize)
                            .text(d => "Lift: " + d.lift.toFixed(2))
                        );

                    interestGroup.append("text")
                        .call(text => text.append("tspan")
                            .attr("font-weight", 600)
                            .attr("text-anchor", (d, i) => i % 2 == 0 ? "start" : "end")
                            .attr("x", (d, i) => i % 2 == 0 ? horizontalPadding : -horizontalPadding)
                            .attr("y", infoTextSize * 2.5)
                            .attr("font-size", infoTextSize)
                            .text(d => "Interesse: " + d.interestingness.toFixed(2))
                        );

                },

            );


        this.arrows
            .selectAll("g")
            .data(this.arrowData, d => d.id)
            .join(
                enter => {
                    const arrowGroup = enter.append("g");
                    //criação dos triangulos
                    arrowGroup.append("polygon")
                        .attr("points", `0,-${this.arrowPointSize} ${this.arrowPointSize},${this.arrowPointSize} -${this.arrowPointSize},${this.arrowPointSize}`)
                        .attr("transform", d => `translate(0,${-this.innerRadius + this.arrowPointSize + this.outlineWidth + this.circleBorderWidth / 2}) rotate(${d.cons[0] * RADIANS}, 0, ${this.innerRadius - this.arrowPointSize - this.outlineWidth - this.circleBorderWidth / 2})`)
                        .attr("fill", d => this.colorScale(d.ruleIndex))
                        .attr("stroke", this.outlineColor)
                        .attr("stroke-width", this.isSmall ? 0 : this.outlineWidth);

                    //criação das linhas
                    arrowGroup.append("path")
                        .attr("d", (d) => this.radialLine([d.ante, d.center, d.cons]))
                        .attr("fill", "none")
                        .attr("stroke", d => this.colorScale(d.ruleIndex))
                        .attr("stroke-width", this.isSmall ? this.arrowWidth * 2 : this.arrowWidth);

                    return arrowGroup;
                },
                update => {
                    //atualização dos triangulos
                    update.select("polygon")
                        .attr("transform", d => `translate(0,${-this.innerRadius + this.arrowPointSize + this.outlineWidth + this.circleBorderWidth / 2}) rotate(${d.cons[0] * RADIANS}, 0, ${this.innerRadius - this.arrowPointSize - this.outlineWidth - this.circleBorderWidth / 2})`)
                        .attr("fill", d => this.colorScale(d.ruleIndex));
                    //atualização das linhas
                    update.select("path")
                        .attr("d", (d) => this.radialLine([d.ante, d.center, d.cons]))
                        .attr("stroke", d => this.colorScale(d.ruleIndex))
                        .attr("stroke-width", this.isSmall ? this.arrowWidth * 2 : this.arrowWidth);
                },
                exit => exit.remove()
            );

        this.bars
            .selectAll("rect")
            .data(this.pieData)
            .join(
                enter => enter.append("rect")
                    .attr("x", (d, i) => -this.barWidth / 2)
                    .attr("y", d => this.innerRadius)
                    .attr("width", this.barWidth)
                    .attr("height", d => this.linScale(Math.abs(d.data.value)))
                    .attr("fill", d => d.data.value == 0 ? "#888" : (d.data.value < 0 ? "#2c4" : "#c24"))
                    .attr("transform", (d, i) => `rotate(${d.middleAngle * RADIANS + 180}, 0, 0)`),
                update => update
                    .attr("height", d => this.linScale(Math.abs(d.data.value)))
                    .attr("fill", d => d.data.value == 0 ? "#888" : (d.data.value < 0 ? "#2c4" : "#c24"))
                    .attr("transform", (d, i) => `rotate(${d.middleAngle * RADIANS + 180}, 0, 0)`),
                exit => exit.remove()
            );

        this.barTexts
            .selectAll("text")
            .data(this.pieData)
            .join(
                enter => enter.append("text")
                    .call(text => text.append("textPath")
                        .attr("side", d => {
                            const isUpsideDown = Math.PI / 2 < d.middleAngle && d.middleAngle < 3 * Math.PI / 2;
                            return isUpsideDown ? "right" : "left";
                        })
                        .attr("startOffset", d => {
                            const isUpsideDown = Math.PI / 2 < d.middleAngle && d.middleAngle < 3 * Math.PI / 2;
                            const startOffset = isUpsideDown ? 1 - d.middleAngle / (Math.PI * 2) : d.middleAngle / (Math.PI * 2);
                            return `${100 / 3 + startOffset * 100 / 3}%`;
                        })
                        .attr("xlink:href", `#${this.textPath.node().id}`)
                        .call(textPath => {

                            textPath.selectAll("tspan")
                                .data(d => [
                                    this.columnOrder[extractColumnId(d.data.name)].slice(0, parseInt(128 / this.maxCategories)), // First tspan data
                                    removeColumnId(d.data.name).slice(0, parseInt(128 / this.maxCategories)), // Second tspan data
                                    d.data.value.toLocaleString("pt-BR") // Third tspan data
                                ])
                                .join("tspan")
                                .attr("x", 0)
                                .attr("y", (d, i) => [-this.textSize, 0, this.textSize][i])
                                .attr("font-weight", (d, i) => [900, 200, 200][i])
                                .attr("font-size", (d, i) => [this.textSize * 0.8, this.textSize, this.textSize][i])
                                .text(d => d);
                        })
                    ),
                update => update
                    .select("textPath")
                    .attr("side", d => {
                        const isUpsideDown = Math.PI / 2 < d.middleAngle && d.middleAngle < 3 * Math.PI / 2;
                        return isUpsideDown ? "right" : "left";
                    })
                    .attr("startOffset", d => {
                        const isUpsideDown = Math.PI / 2 < d.middleAngle && d.middleAngle < 3 * Math.PI / 2;
                        const startOffset = isUpsideDown ? 1 - d.middleAngle / (Math.PI * 2) : d.middleAngle / (Math.PI * 2);
                        return `${100 / 3 + startOffset * 100 / 3}%`;
                    })
                    .attr("xlink:href", `#${this.textPath.node().id}`)
                    .call(textPath => {

                        textPath.selectAll("tspan")
                            .data(d => [
                                this.columnOrder[extractColumnId(d.data.name)].slice(0, parseInt(160 / this.maxCategories)), // First tspan data
                                removeColumnId(d.data.name).slice(0, parseInt(128 / this.maxCategories)), // Second tspan data
                                d.data.value.toLocaleString("pt-BR") // Third tspan data
                            ])
                            .join(
                                enter => enter.append("tspan")
                                    .attr("x", 0)
                                    .attr("y", (d, i) => [-this.textSize, 0, this.textSize][i])
                                    .attr("font-weight", (d, i) => [900, 200, 200][i])
                                    .attr("font-size", (d, i) => [this.textSize * 0.8, this.textSize, this.textSize][i])
                                    .text(d => d),
                                update => update
                                    .attr("x", 0)
                                    .attr("y", (d, i) => [-this.textSize, 0, this.textSize][i])
                                    .attr("font-weight", (d, i) => [900, 200, 200][i])
                                    .attr("font-size", (d, i) => [this.textSize * 0.8, this.textSize, this.textSize][i])
                                    .text(d => d),
                                exit => exit.remove()
                            );
                    }),
                exit => exit.remove()
            );

        this.mainText
            .selectAll("text")
            .data([this.name])
            .join(
                enter => enter.append("text")
                    .call(text => text.append("tspan")
                        .attr("font-weight", 900)
                        .attr("y", "80")
                        .text(this.name))
                    .attr("stroke", "white")
                    .attr("stroke-width", 2)
                    .attr("paint-order", "stroke"),
                update => update
                    .select('tspan').text(this.name),
                exit => exit.remove()
            );

        this.countText
            .selectAll("text")
            .data([this.displayedCount])
            .join(
                enter => enter.append("text")
                    .call(text => text.append("tspan")
                        .attr("font-weight", 900)
                        .attr("y", "-70")
                        .text(this.displayedCount))
                    .attr("stroke", "white")
                    .attr("stroke-width", 2)
                    .attr("paint-order", "stroke"),
                update => update
                    .select('tspan').text(this.displayedCount),
                exit => exit.remove()
            );

        return this.marker;
    }

    showBigIcon() {
        this.isSmall = false;
        this.mainText.attr("visibility", "hidden");
        this.countText.attr("visibility", "hidden");
        this.barOutlines.attr("visibility", "");
        this.barTexts.attr("visibility", "");
        this.arrowOutlines.attr("visibility", "");
        this.rulesInfo.attr("visibility", "");

        this.circleBorder.selectAll("path")
            .attr("stroke-width", this.outlineWidth);

        this.arrows.selectAll("polygon")
            .attr("stroke-width", this.outlineWidth);

        this.arrows.selectAll("path")
            .attr("stroke-width", this.arrowWidth);

        this.marker.setIcon(this.hoverIcon);
        this.background.style("opacity", 1);
        this.svg.node().parentElement.style.zIndex = 9000;
    }

    showSmallIcon() {
        this.isSmall = true;
        this.mainText.attr("visibility", "");
        this.countText.attr("visibility", "");
        this.barTexts.attr("visibility", "hidden");
        this.barOutlines.attr("visibility", "hidden");
        this.arrowOutlines.attr("visibility", "hidden");
        this.rulesInfo.attr("visibility", "hidden");

        this.circleBorder.selectAll("path")
            .attr("stroke-width", 0);

        this.arrows.selectAll("polygon")
            .attr("stroke-width", 0);

        this.arrows.selectAll("path")
            .attr("stroke-width", this.arrowWidth * 2);

        this.marker.setIcon(this.icon);
        this.background.style("opacity", 0);
        if (this.svg.node().parentElement)
            this.svg.node().parentElement.style.zIndex = -9000;
    }

    removeMarker() {
        this.marker.remove();
    }
}