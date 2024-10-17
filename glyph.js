class GlyphSymbol {
    
    constructor(group = null, data = null, maxPixelSize = 400, maxCoordSize = 0.1) {
        this.data = data;
        this.group = group;
        this.maxCoordSize = maxCoordSize;
        this.maxPixelSize = maxPixelSize;
        
        this.isDrawn = false;
        this.surprises = null;
        this.displaySurprises = null;
        this.rules = null;
        this.displayRules = null;

        this.displayCategs = [];

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


        this.updateProportions();
        this.getPosition();
    }

    setDisplayCategories(categsChosen = null) {
        this.displayCategs = categsChosen;

        if (this.displayCategs == null) {
            this.displaySurprises = this.surprises;
            this.displayRules = this.rules;
        }

        this.displaySurprises = this.surprises.filter(surp =>
            this.displayCategs.includes(surp.name));

        //filtra somente as regras que possuem todos os seus antecessores
        //e consequentes nas categorias escolhidas
        this.displayRules = this.rules.filter(rule => {
            var isAnte = rule.antecedents.every(name => this.displayCategs.includes(name));
            var isConse = rule.consequents.every(name => this.displayCategs.includes(name));

            return isAnte && isConse;
        }).slice(0, this.group.maxRules);
    }

    setData(surprises, rules, displayCategs = null) {
        this.surprises = surprises;
        this.rules = rules;
        this.setDisplayCategories(displayCategs);

        this.updateScales();
    }

    getPosition() {
        var avrgLat = 0;
        var avrgLon = 0;

        for (let index = 0; index < this.data.length; index++) {
            avrgLat += this.data[index].lat;
            avrgLon += this.data[index].lon;
        }
        avrgLat /= this.data.length;
        avrgLon /= this.data.length;

        this.lat = avrgLat;
        this.lon = avrgLon;

        this.point = projectPoint(map, this.lat, this.lon);
    }

    setMaxCoordSize(size) {
        this.maxCoordSize = size;
        this.updateSize();
    }

    setMaxPixelSize(size) {
        this.maxMaxPixelSize = size;
        this.updateSize();
    }

    remove() {
        this.svgLayer.remove();
        this.isDrawn = false;
    }

    getBounds() {
        const point1 = projectPoint(map, this.lat + this.maxCoordSize, this.lon + this.maxCoordSize);
        const point2 = projectPoint(map, this.lat, this.lon);

        var coordOffset = this.maxCoordSize / 2;

        if (point1.x - point2.x > this.maxPixelSize) {
            const coords1 = map.layerPointToLatLng([0, 0]);
            const coords2 = map.layerPointToLatLng([this.maxPixelSize, 0]);
            coordOffset = (coords1.lng - coords2.lng) / 2;
        }

        const svgBounds = [[this.lat + 2 * coordOffset, this.lon + 2 * coordOffset],
        [this.lat - 2 * coordOffset, this.lon - 2 * coordOffset]];

        return svgBounds;
    }

    updateSize() {
        const svgBounds = this.getBounds();
        this.svgLayer.setBounds(svgBounds);
    }

    updateProportions() {
        this.startAngle = 0;
        this.width = this.maxPixelSize;
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

        this.pieData = this.borderPie(this.displaySurprises).map(d => ({
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

    draw() {
        if (this.isDrawn) {
            // this.remove();
            this.update();
            return;
        }
        this.isDrawn = true;

        this.svg = d3.create("svg");
        const bounds = this.getBounds();
        this.svgLayer = L.svgOverlay(this.svg.node(), bounds).addTo(map);
        this.updateSize();

        const svg = this.svg.attr('viewBox', `${-this.maxPixelSize}, ${-this.maxPixelSize}, ${this.maxPixelSize * 2}, ${this.maxPixelSize * 2}`);

        this.svgGroup = svg.append('g')
            .attr("class", "svg-group");

        //criação das outlines das setas
        this.arrowOutlines = this.svgGroup.append("g")
            .selectAll("path")
            .data(this.arrowData)
            .enter().append("g")
            .append("path")
            .attr("d", (d, i) => this.radialLine([d.ante, d.center, d.cons]))
            .attr("fill", "none")
            .attr("stroke", this.outlineColor)
            .attr("stroke-width", (this.outlineWidth ? this.arrowWidth : 0) + this.outlineWidth * 2);

        //criação das outlines das barras
        this.barOutlines = this.svgGroup.append("g")
            .selectAll("rect")
            .data(this.pieData)
            .enter("path")
            .append("rect")
            .attr("x", (d, i) => -(this.barWidth + this.outlineWidth * 2) / 2)
            .attr("y", this.innerRadius)
            .attr("width", this.barWidth + this.outlineWidth * 2)
            .attr("height", d => this.linScale(Math.abs(d.data.value)) + this.outlineWidth)
            .attr("fill", this.outlineColor)
            .attr("transform", (d, i) => `rotate(${d.middleAngle * RADIANS + 180}, 0, 0)`);

        //criação da borda circular
        this.circleBorder = this.svgGroup.append("g")
            .selectAll("path")
            .data(this.pieData)
            .enter()
            .append("path")
            .attr("fill", d => d.data.value < 0 ? "#2c4" : "#c24")
            .attr("stroke", this.outlineColor)
            .attr("stroke-width", this.outlineWidth)
            .attr("d", this.borderArc);

        //grupo que contem as linhas e cabeça das setas
        this.arrows = this.svgGroup.append("g")
            .selectAll("path")
            .data(this.arrowData)
            .enter().append("g");

        //criação dos triangulos das setas
        this.arrowTriangles = this.arrows.append("polygon")
            .attr("points", `0,-${this.arrowPointSize} ${this.arrowPointSize},${this.arrowPointSize} -${this.arrowPointSize},${this.arrowPointSize}`)
            .attr("transform", d =>
                `translate(0,${-this.innerRadius + this.arrowPointSize + this.outlineWidth + this.circleBorderWidth / 2}) 
            rotate(${d.cons[0] * RADIANS}, 0, ${this.innerRadius - this.arrowPointSize - this.outlineWidth - this.circleBorderWidth / 2})`)
            .attr("fill", d => this.colorScale(d.rule))
            .attr("stroke", this.outlineColor)
            .attr("stroke-width", this.outlineWidth);

        //criação das linhas das setas
        this.arrowLines = this.arrows.append("path")
            .attr("d", (d, i) => this.radialLine([d.ante, d.center, d.cons]))
            .attr("fill", "none")
            .attr("stroke", d => this.colorScale(d.rule))
            .attr("stroke-width", this.arrowWidth);

        //criação das barras
        this.bars = this.svgGroup.append("g")
            .selectAll("rect")
            .data(this.pieData)
            .enter("path")
            .append("rect")
            .attr("x", (d, i) => -this.barWidth / 2)
            .attr("y", x => this.innerRadius)
            .attr("width", this.barWidth)
            .attr("height", d => this.linScale(Math.abs(d.data.value)))
            .attr("fill", d => d.data.value < 0 ? "#2c4" : "#c24")
            .attr("transform", (d, i) => `rotate(${d.middleAngle * RADIANS + 180}, 0, 0)`);

        //cria o caminho em que o texto vai curvar sobre
        this.circleTextPath = d3.path();
        this.circleTextPath.moveTo(0, -this.textRadius);
        //circulo dá 3 voltas pra não cortar texto no começo e no fim
        this.circleTextPath.arc(0, 0, this.textRadius, -0.5 * Math.PI, 1.5 * Math.PI);
        this.circleTextPath.arc(0, 0, this.textRadius, -0.5 * Math.PI, 1.5 * Math.PI);
        this.circleTextPath.arc(0, 0, this.textRadius, -0.5 * Math.PI, 1.5 * Math.PI);

        this.textPath = this.svgGroup.append("path")
            .attr("id", `text-circle-${this.data.name}`)
            .attr("d", this.circleTextPath.toString())
            .attr("fill", "none")
            .attr("stroke", "none")

        //criação dos textos de cada barra
        this.barTexts = this.svgGroup.append("g")
            .attr("fill", this.textColor)
            .attr("font-family", "Trebuchet MS, monospace")
            .attr("font-size", this.textSize)
            .attr("text-anchor", "middle")                      //centraliza horizontalmente
            .attr("dominant-baseline", "middle")            //centraliza verticalmente
            .selectAll()
            .data(this.pieData)
            .join("text")
            // .attr("transform", d => `translate(${textArc.centroid(d)})
            //     rotate(${(d.middleAngle * RADIANS + 90) % 180 - 90}, 0, 0)`)
            .append("textPath")
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
            .attr("xlink:href", (d, i) => `#text-circle-${this.data.name}`)
            .call(text => text.append("tspan")
                .attr("y", -this.textSize / 2)
                .attr("font-weight", 900)
                .text(d => d.data.name))
            .call(text => text.append("tspan")
                .attr("x", 0)
                .attr("y", this.textSize / 2)
                .attr("font-weight", 200)
                .text(d => d.data.value.toLocaleString("pt-BR")));

        //texto principal
        this.mainText = this.svgGroup.append("g")
            .attr("class", "glyph-title")
            .attr("fill", "black")
            .attr("font-family", "Trebuchet MS, monospace")
            .attr("font-size", Math.max(this.width / 12, 16))
            .attr("text-anchor", "middle")                      //centraliza horizontalmente
            .attr("dominant-baseline", "middle")            //centraliza verticalmente
            .attr("visibility", "hidden")
            .append("text")
            .call(text => text.append("tspan")
                .attr("font-weight", 900)
                .text(this.name))
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .attr("paint-order", "stroke")

        //hitbox do svg para detectar hover
        this.hitbox = this.svgGroup.append("circle")
            .attr("r", this.width / 2)
            .style("pointer-events", "auto")
            .style("fill", "rgba(0, 0, 0, 0.0)")
            //mostra o texto quando o mouse está em cima
            .on("mouseover", function (event, d) {
                d3.select(d3.select(this).node().parentNode).selectAll(".glyph-title")
                .attr("visibility", "")
            })
            //esconde o texto quando o mouse nao está em cima
            .on("mouseout", function (event, d) {
                d3.select(d3.select(this).node().parentNode).selectAll(".glyph-title")
                    .attr("visibility", "hidden")
            });

        return this.svgGroup.node();
    }

    update() {
        this.arrowOutlines
            .data(this.arrowData)
            .attr("d", (d, i) => this.radialLine([d.ante, d.center, d.cons]))
            .attr("stroke-width", (this.outlineWidth ? this.arrowWidth : 0) + this.outlineWidth * 2);

        this.barOutlines
            .data(this.pieData)
            .attr("height", d => this.linScale(Math.abs(d.data.value)) + this.outlineWidth)
            .attr("transform", (d, i) => `rotate(${d.middleAngle * RADIANS + 180}, 0, 0)`);

        this.circleBorder
            .data(this.pieData)
            .attr("fill", d => d.data.value < 0 ? "#2c4" : "#c24")
            .attr("d", this.borderArc);

        this.arrowOutlines.remove();
        this.arrows.remove();

        this.arrowOutlines = this.svgGroup.append("g")
            .selectAll("path")
            .data(this.arrowData)
            .enter().append("g")
            .append("path")
            .attr("d", (d, i) => this.radialLine([d.ante, d.center, d.cons]))
            .attr("fill", "none")
            .attr("stroke", this.outlineColor)
            .attr("stroke-width", (this.outlineWidth ? this.arrowWidth : 0) + this.outlineWidth * 2);

        this.arrowTriangles
            .data(this.arrowData)
            .attr("transform", d =>
                `translate(0,${-this.innerRadius + this.arrowPointSize + this.outlineWidth + this.circleBorderWidth / 2}) 
                rotate(${d.cons[0] * RADIANS}, 0, ${this.innerRadius - this.arrowPointSize - this.outlineWidth - this.circleBorderWidth / 2})`)
            .attr("fill", d => this.colorScale(d.rule));

        this.arrows = this.svgGroup.append("g")
            .selectAll("path")
            .data(this.arrowData)
            .enter().append("g");

        //criação dos triangulos das setas
        this.arrowTriangles = this.arrows.append("polygon")
            .attr("points", `0,-${this.arrowPointSize} ${this.arrowPointSize},${this.arrowPointSize} -${this.arrowPointSize},${this.arrowPointSize}`)
            .attr("transform", d =>
                `translate(0,${-this.innerRadius + this.arrowPointSize + this.outlineWidth + this.circleBorderWidth / 2}) 
            rotate(${d.cons[0] * RADIANS}, 0, ${this.innerRadius - this.arrowPointSize - this.outlineWidth - this.circleBorderWidth / 2})`)
            .attr("fill", d => this.colorScale(d.rule))
            .attr("stroke", this.outlineColor)
            .attr("stroke-width", this.outlineWidth);

        //criação das linhas das setas
        this.arrowLines = this.arrows.append("path")
            .attr("d", (d, i) => this.radialLine([d.ante, d.center, d.cons]))
            .attr("fill", "none")
            .attr("stroke", d => this.colorScale(d.rule))
            .attr("stroke-width", this.arrowWidth);

        this.bars
            .data(this.pieData)
            .attr("height", d => this.linScale(Math.abs(d.data.value)))
            .attr("fill", d => d.data.value < 0 ? "#2c4" : "#c24")
            .attr("transform", (d, i) => `rotate(${d.middleAngle * RADIANS + 180}, 0, 0)`);

        this.barTexts
            .data(this.pieData)
            .attr("xlink:href", (d, i) => `#text-circle-${this.data.name}`)
            .call(text => text.selectAll("tspan")
                .data(d => [d.data.name, d.data.value.toLocaleString("pt-BR")])
                .join("tspan")
                .attr("y", (d, i) => i === 0 ? -this.textSize / 2 : this.textSize / 2)
                .text(d => d));

        this.mainText
            .select("tspan")
            .text(this.data.name);

    }

    distanceTo(otherGlyph) {
        const point1 = projectPoint(map, this.data.lat, this.data.lon);
        const point2 = projectPoint(map, otherGlyph.data.lat, otherGlyph.data.lon);
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

}