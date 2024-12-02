import { Surprise } from './surprise.js';
import { FPGrowth } from './association.js';
import * as models from './models.js';

const RADIANS = 180 / Math.PI;

export class Glyph {
    constructor(name, group = null, data = []) {
        this.rawData = data;
        this.group = group;
        this.name = name;
        this.itemCount = this.rawData.length;
        this.displayedCount = 0;

        this.size = 400;
        this.hoverSize = 400;
        this.displaySize = this.size;

        this.minSupport = 0;
        this.maxSupport = 1;
        this.minConfidence = 0;
        this.maxConfidence = 1;
        this.minLift = 0;
        this.maxLift = 3;

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

        this.associations = null;
        this.filteredRules = [];

        this.displayItems = [];
        this.displayRules = [];
        this.displaySurprises = [];

        this.startDate = new Date(0);
        this.endDate = new Date(864000000000000);
        this.dateFormat = "DD/MM/YYYY, HH:mm:ss";

        this.surprise = new Surprise();

        this.colorRange = [
            "#8F8F3C", //laranja
            "#D62C2C", //vermelho
            "#EAEA3C", //amarelo
            "#4CE685", //verde claro
            "#FFFFFF", //branco
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

        this.updateDefaultPosition();
        this.updatePosition();
        this.updateProportions();
        this.updateIconSize();

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
     * @param {string} format Formato da data que será usada
     */
    setDateColumn(dateColumn) {
        this.dateColumn = dateColumn;

        this.needsDateUpdate = true
        this.markForUpdate();
    }

    setDates(dates){
        this.dates = dates;

        this.needsDataUpdate = true
        this.markForUpdate();
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
                newRuleData = newRuleData.mergePatterns(glyph.associations);
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


        const mergedGlyph = new Glyph(name);
        mergedGlyph.deferUpdate();
        mergedGlyph.setCount(mergedCount, mergedDisplayedCount);
        mergedGlyph.setRuleTree(newRuleData);
        mergedGlyph.setSurprise(newSurp);
        mergedGlyph.setPosition(avrgLat, avrgLon);

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

        newGlyph.setDateColumn(this.dateColumn)
        newGlyph.setDates(this.dates);
        newGlyph.updateChosenData();

        newGlyph.updateTransTable();
        newGlyph.updateFreqItems();
        newGlyph.updateRules();
        
        return newGlyph.associations;
    }

    updateDates() {
        this.dates = [];

        if (this.rawData != null && this.rawData.length > 0) {
            for (let i = 0; i < this.rawData.length; i++) {
                const entry = this.rawData[i];
                this.dates[i] = dayjs(entry[this.dateColumn], this.dateFormat);;
            }
        }

    }

    updateChosenData() {
        this.chosenData = [];
        if (this.rawData != null && this.rawData.length > 0) {
            this.displayedCount = 0;

            for (let i = 0; i < this.rawData.length; i++) {
                const entry = this.rawData[i];

                const passesDateFilter = this.dateColumn == null ||
                    (this.dates[i] >= this.startDate &&
                        this.dates[i] <= this.endDate);

                if (passesDateFilter) {
                    this.chosenData.push({});
                    this.displayedCount++;

                    for (const category in entry) {
                        if (this.group.chosenColumns.includes(category)) {
                            const value = entry[category];
                            this.chosenData[this.chosenData.length-1][category] = value;
                        }
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

        this.filteredRules = structuredClone(this.associations.rules);
        //ordena as regras por maior score
        this.associations.rules = this.associations.rules.sort((a, b) => {
            return Glyph.getRuleScore(b) - Glyph.getRuleScore(a);
        });
    }

    updateDisplayRules() {
        // tira apenas a quantidade necessaria e ordena alfabeticamente
        const slicedCategs = this.displayItems.slice(0, this.maxCategories);

        if (this.surprise.surprises)
            this.displaySurprises = this.surprise.surprises.filter(surp =>
                slicedCategs.includes(surp.name));

        //filtra somente as regras que possuem todos os seus antecessores
        //e consequentes nas categorias escolhidas
        this.displayRules = this.filteredRules.filter(rule => {
            var isAnte = rule.antecedents.every(name => slicedCategs.includes(name));
            var isConse = rule.consequents.every(name => slicedCategs.includes(name));

            return isAnte && isConse;
        }).slice(0, this.group.maxRules);
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

            for (let index = 0; index < this.rawData.length; index++) {
                avrgLat += this.rawData[index].lat;
                avrgLon += this.rawData[index].lon;
            }
            avrgLat /= this.rawData.length;
            avrgLon /= this.rawData.length;

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

    updateFilteredRules() {    //filtra as regras que estao dentro dos limites dos limiares
        this.filteredRules = [];
        for (let i = 0; i < this.associations.rules.length; i++) {
            const rule = this.associations.rules[i];

            if (rule.antecedentSupport >= this.minSupport &&
                rule.consequentSupport >= this.minSupport &&
                rule.antecedentSupport <= this.maxSupport &&
                rule.consequentSupport <= this.maxSupport &&
                rule.confidence >= this.minConfidence &&
                rule.confidence <= this.maxConfidence &&
                rule.lift >= this.minLift &&
                rule.lift <= this.maxLift &&
                rule.antecedents.length + rule.consequents.length <= this.group.maxArrows) {
                this.filteredRules.push(rule);
            }
        }
    }

    updateProportions() {
        this.startAngle = 0;
        this.width = this.size;
        this.textSize = this.width / 25;

        this.barWidth = this.width / 20;
        this.maxBarLength = this.width / 5;

        this.height = this.width;
        this.innerRadius = (this.width - this.maxBarLength * 2 - this.textSize * 6) / 2;

        this.circleBorderWidth = this.width / 120;

        this.arrowWidth = this.width / 120;
        this.arrowPointSize = this.width / 64;

        this.outlineWidth = this.width / 320;
        this.outlineColor = "black";

        this.textRadius = this.innerRadius + this.maxBarLength + this.textSize * 1.5;
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

                for (let consIndex = 0; consIndex < rule.consequents.length; consIndex++) {
                    const consequent = rule.consequents[consIndex];
                    const dpConsIndex = this.surprisesIndex[consequent];

                    this.displaySurprises[dpAnteIndex].consCount++;
                    this.displaySurprises[dpConsIndex].anteCount++;
                }
            }
        });

        this.arrowData = [];

        //calcula a posição de partida e chegada das setas com base nas regras de associação
        this.displayRules.forEach((rule, ruleIndex) => {
            for (let anteIndex = 0; anteIndex < rule.antecedents.length; anteIndex++) {
                const antecedent = rule.antecedents[anteIndex];
                const dpAnteIndex = this.surprisesIndex[antecedent];
                const dpAnte = this.displaySurprises[dpAnteIndex];

                for (let consIndex = 0; consIndex < rule.consequents.length; consIndex++) {
                    const consequent = rule.consequents[consIndex];
                    const dpConsIndex = this.surprisesIndex[consequent];
                    const dpCons = this.displaySurprises[dpConsIndex];

                    var arrowPos = { center: [0, 0], rule: ruleIndex };

                    //calcula qual o angulo em que a seta vai se originar, levando em conta as outras setas
                    var anteArrowCount = dpAnte.consCount + dpAnte.anteCount;
                    var anteArrowIndex = dpAnte.consCalc++;
                    // dpCons.anteCalc++;

                    var anteAngleStep = (this.pieData[dpAnteIndex].endAngle - this.pieData[dpAnteIndex].startAngle) / (anteArrowCount + 1);
                    var anteAngle = this.pieData[dpAnteIndex].startAngle + (anteArrowIndex + 1) * anteAngleStep;

                    arrowPos.ante = [anteAngle, this.innerRadius];

                    //calcula qual o ponto em que a seta ira apontar, levando em conta as outras setas
                    var consArrowCount = dpCons.consCount + dpCons.anteCount;
                    var consArrowIndex = dpCons.consCount + dpCons.anteCalc++;

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

        this.background = this.svgGroup.append("circle")
            .attr("r", this.width / 2)
            .style("pointer-events", "auto")
            .style("fill", "rgba(255, 255, 255)")
            .attr("stroke", "black")
            .attr("stroke-width", "1px")
            .style("opacity", 0);

        //criação das outlines das setas
        this.arrowOutlines = this.svgGroup.append("g")
            .attr("class", "glyph-arrow-outlines");

        //criação das outlines das barras
        this.barOutlines = this.svgGroup.append("g")
            .attr("class", "glyph-bar-outlines");


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
            .attr("id", `text-circle-${this.name}`)
            .attr("d", this.circleTextPath.toString())
            .attr("fill", "none")
            .attr("stroke", "none")

        //criação dos textos de cada barra
        this.barTexts = this.svgGroup.append("g")
            .attr("fill", this.textColor)
            .attr("font-family", "Trebuchet MS, monospace")
            .attr("font-size", this.textSize)
            .attr("text-anchor", "middle")                      //centraliza horizontalmente
            .attr("dominant-baseline", "middle");           //centraliza verticalmente

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
            .attr("font-size", this.width / 12)
            .attr("text-anchor", "middle")                      //centraliza horizontalmente
            .attr("dominant-baseline", "middle")            //centraliza verticalmente
            .attr("visibility", "");

        //hitbox do svg para detectar hover
        this.hitbox = this.svgGroup.append("circle")
            .attr("r", this.width / 2)
            .style("pointer-events", "auto")
            .style("fill", "rgba(0, 0, 0, 0.0)")
            .on("mouseover", this.hoverBegin.bind(this))
            .on("mouseout", this.hoverEnd.bind(this));

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
                    .attr("fill", d => d.data.value < 0 ? "#2c4" : "#c24")
                    .attr("stroke", this.outlineColor)
                    .attr("stroke-width", this.outlineWidth)
                    .attr("d", this.borderArc),
                update => update
                    .attr("fill", d => d.data.value < 0 ? "#2c4" : "#c24")
                    .attr("d", this.borderArc),
                exit => exit.remove()
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
                        .attr("fill", d => this.colorScale(d.rule))
                        .attr("stroke", this.outlineColor)
                        .attr("stroke-width", this.outlineWidth);

                    //criação das linhas
                    arrowGroup.append("path")
                        .attr("d", (d) => this.radialLine([d.ante, d.center, d.cons]))
                        .attr("fill", "none")
                        .attr("stroke", d => this.colorScale(d.rule))
                        .attr("stroke-width", this.arrowWidth);

                    return arrowGroup;
                },
                update => {
                    //atualização dos triangulos
                    update.select("polygon")
                        .attr("transform", d => `translate(0,${-this.innerRadius + this.arrowPointSize + this.outlineWidth + this.circleBorderWidth / 2}) rotate(${d.cons[0] * RADIANS}, 0, ${this.innerRadius - this.arrowPointSize - this.outlineWidth - this.circleBorderWidth / 2})`)
                        .attr("fill", d => this.colorScale(d.rule));
                    //atualização das linhas
                    update.select("path")
                        .attr("d", (d) => this.radialLine([d.ante, d.center, d.cons]))
                        .attr("stroke", d => this.colorScale(d.rule))
                        .attr("stroke-width", this.arrowWidth);
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
                    .attr("fill", d => d.data.value < 0 ? "#2c4" : "#c24")
                    .attr("transform", (d, i) => `rotate(${d.middleAngle * RADIANS + 180}, 0, 0)`),
                update => update
                    .attr("height", d => this.linScale(Math.abs(d.data.value)))
                    .attr("fill", d => d.data.value < 0 ? "#2c4" : "#c24")
                    .attr("transform", (d, i) => `rotate(${d.middleAngle * RADIANS + 180}, 0, 0)`),
                exit => exit.remove()
            );

        this.barTexts
            .selectAll("text")
            .data(this.pieData)
            .join(
                enter => enter.append("text").append("textPath")
                    .attr('side', d => {
                        const isUpsideDown = Math.PI / 2 < d.middleAngle && d.middleAngle < 3 * Math.PI / 2;
                        return isUpsideDown ? 'right' : 'left';
                    })
                    .attr("startOffset", (d, i) => {
                        const isUpsideDown = Math.PI / 2 < d.middleAngle && d.middleAngle < 3 * Math.PI / 2;
                        var startOffset;

                        if (isUpsideDown)
                            startOffset = (1 - d.middleAngle / (Math.PI * 2));
                        else
                            startOffset = d.middleAngle / (Math.PI * 2);

                        return `${100 / 3 + startOffset * 100 / 3}%`;   //texto é colocado na 2° volta pra evitar cortes
                    })
                    .attr("xlink:href", `#${this.textPath.node().id}`)
                    .call(text => text.append("tspan")
                        .attr("y", -this.textSize / 2)
                        .attr("font-weight", 900)
                        .text(d => d.data.name.slice(0, 16)))
                    .call(text => text.append("tspan")
                        .attr("x", 0)
                        .attr("y", this.textSize / 2)
                        .attr("font-weight", 200)
                        .text(d => d.data.value.toLocaleString("pt-BR"))),
                update => update
                    .select("textPath").attr("xlink:href", (d, i) => `#${this.textPath.node().id}`)
                    .attr('side', d => {
                        const isUpsideDown = Math.PI / 2 < d.middleAngle && d.middleAngle < 3 * Math.PI / 2;
                        return isUpsideDown ? 'right' : 'left';
                    })
                    .attr("startOffset", (d, i) => {
                        const isUpsideDown = Math.PI / 2 < d.middleAngle && d.middleAngle < 3 * Math.PI / 2;
                        var startOffset;

                        if (isUpsideDown)
                            startOffset = (1 - d.middleAngle / (Math.PI * 2));
                        else
                            startOffset = d.middleAngle / (Math.PI * 2);

                        return `${100 / 3 + startOffset * 100 / 3}%`;   //texto é colocado na 2° volta pra evitar cortes
                    })
                    .call(text => text.selectAll("tspan")
                        .data(d => [d.data.name.slice(0, 16), d.data.value.toLocaleString("pt-BR")])
                        .join("tspan")
                        .attr("y", (d, i) => i === 0 ? -this.textSize / 2 : this.textSize / 2)
                        .text(d => d)),
                exit => exit.remove()
            );

        this.mainText
            .selectAll("text")
            .data([this.name])
            .join(
                enter => enter.append("text")
                    .call(text => text.append("tspan")
                        .attr("font-weight", 900)
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
                        .attr("y", "20")
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

    hoverBegin() {
        this.mainText.attr("visibility", "hidden");
        this.countText.attr("visibility", "hidden");
        this.marker.setIcon(this.hoverIcon);
        this.background.style("opacity", 0.6);
        this.svg.node().parentElement.style.zIndex = 9000;
    }

    hoverEnd() {
        this.mainText.attr("visibility", "");
        this.countText.attr("visibility", "");
        this.marker.setIcon(this.icon);
        this.background.style("opacity", 0);
        if (this.svg.node().parentElement)
            this.svg.node().parentElement.style.zIndex = -9000;
    }

    static getRuleScore(rule) {
        const base = rule.confidence + rule.antecedentSupport + rule.consequentSupport - (rule.antecedents.length + rule.consequents.length) * 2;
        return base * rule.lift * rule.lift;
    }

    removeMarker() {
        this.marker.remove();
    }
}