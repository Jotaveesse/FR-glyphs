const RADIANS = 180 / Math.PI;
var map;


var tempData = [
    {
        lat: 51.505, lon: -0.05, name: 'London1', dataPoints: [
            { name: "Carros", value: 279786 },
            { name: "Motos", value: -205182 },
            { name: "Caminhao", value: 279786 },
            { name: "Onibus", value: 254481 },
            { name: "Bicicleta", value: -220432 },
            { name: "Pedestre", value: 195782 },
            { name: "Lancha", value: 107618 },
            { name: "Aviao", value: -217038 },
        ],
        rules: [
            { antecedents: ["Carros"], consequents: ["Caminhao", "Bicicleta"] },
            { antecedents: ["Carros"], consequents: ["Aviao"] },
            { antecedents: ["Aviao"], consequents: ["Motos"] },
            { antecedents: ["Lancha", "Bicicleta"], consequents: ["Caminhao", "Motos"] },
        ]
    },

];

window.onload = function () {
    map = L.map('map').setView([51.505, -0.05], 12); // London

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
        ext: 'png'
    }).addTo(map);

    L.control.scale().addTo(map);

    L.Control.Slider = L.Control.extend({

        initialize: function (options) {
            L.Control.prototype.initialize.call(this, options);
            this.options=options;
            this.minSupp = options.rangeInit; //suporte inicial
        },


        onAdd: function (map) {
            const div = L.DomUtil.create('div', 'leaflet-control slider-control');

            div.innerHTML = `
                <label for="supp-slider" class="slider-label">${this.options.labelText}</label>
                <div class="slider-container">
                    <div id="tooltip" class="tooltip">${this.minSupp}</div>
                    <input type="range" id="supp-slider"
                    min="${this.options.rangeMin}"
                    max="${this.options.rangeMax}"
                    step="${this.options.rangeStep}"
                    value="${this.minSupp}">
                </div>
            `;

            //impede que o clique se propague para outros elementos
            L.DomEvent.disableClickPropagation(div);

            this.slider = div.querySelector("#supp-slider");
            this.tooltip = div.querySelector(".tooltip");

            // atualiza inicialmente
            this.updateTooltip(this.slider.value);

            L.DomEvent.on(this.slider, 'input', this.handleSliderInput.bind(this));
            L.DomEvent.on(this.slider, 'change', this.update.bind(this));

            return div;
        },

        onRemove: function (map) {
        },


        handleSliderInput: function (e) {
            this.minSupp = parseFloat(this.slider.value);
            this.updateTooltip();
        },

        updateTooltip: function () {
            this.tooltip.textContent = this.minSupp;
            const percentage = (this.minSupp - this.slider.min) / (this.slider.max - this.slider.min);
            const offset = percentage * (this.slider.offsetWidth - 30);
            this.tooltip.style.left = `${offset}px`;
        },

        update: function () {
            this.options.onChange(this.minSupp);
        },
    });

    var supportSlider = new L.Control.Slider({
        position: 'topright',
        labelText : 'Suporte Mínimo',
        rangeMin : 0.0,
        rangeMax : 1,
        rangeStep : 0.05,
        rangeInit : 0.5,
        onChange:  function (value) {
            for (const key in glyphsOnMap) {
                const glyph = glyphsOnMap[key];
                glyph.minSupport = value;
                glyph.updateAll();
            }
        }
    });
    supportSlider.addTo(map);
    supportSlider.updateTooltip(map);

    var confidenceSlider = new L.Control.Slider({
        position: 'topright',
        labelText : 'Confiança Mínima',
        rangeMin : 0.0,
        rangeMax : 1,
        rangeStep : 0.05,
        rangeInit : 0.5,
        onChange:  function (value) {
            for (const key in glyphsOnMap) {
                const glyph = glyphsOnMap[key];
                glyph.minConfidence = value;
                glyph.updateAll();
            }
        }
    });
    confidenceSlider.addTo(map);
    confidenceSlider.updateTooltip(map);

    
    var liftSlider = new L.Control.Slider({
        position: 'topright',
        labelText : 'Lift Mínimo',
        rangeMin : 1,
        rangeMax : 2,
        rangeStep : 0.1,
        rangeInit : 1.5,
        onChange:  function (value) {
            for (const key in glyphsOnMap) {
                const glyph = glyphsOnMap[key];
                glyph.minLift = value;
                glyph.updateAll();
            }
        }
    });
    liftSlider.addTo(map);
    liftSlider.updateTooltip(map);


    // createGlyphs(tempData);

};



function getDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function findSmallestDistance(glyphPos) {
    let minDistance = Infinity;
    let closestPair = { glyph1: 0, glyph2: 0, distance: 1 };

    for (let i = 0; i < glyphPos.length; i++) {
        for (let j = i + 1; j < glyphPos.length; j++) {
            const distance = getDistance(glyphPos[i], glyphPos[j])

            if (distance < minDistance) {
                minDistance = distance;
                closestPair = { glyph1: i, glyph2: j, distance: minDistance };
            }
        }
    }

    return closestPair;
}

function projectPoint(map, lat, lon) {
    return map.latLngToLayerPoint(new L.LatLng(lat, lon));
}

function clearGlyphs() {
    d3.selectAll(".svg-layer").remove();
}

function createGlyphs(glyphs, maxSize = 400) {
    var glyphPos = [];

    //gera as camadas para cada glifo
    glyphs.forEach((glyph, i) => {
        var svgLayer = L.svg().addTo(map);

        drawGlyph(svgLayer, glyph);

        const point = projectPoint(map, glyph.lat, glyph.lon);
        glyphPos.push(point);
    });

    var closestPair = findSmallestDistance(glyphPos);

    //TO-DO cria evento diversas vezes
    //atualiza a posição quando dá zoom
    map.on('moveend', function () {
        clearGlyphs();

        const glyph1 = glyphs[closestPair.glyph1];
        const glyph2 = glyphs[closestPair.glyph2];

        const point1 = projectPoint(map, glyph1.lat, glyph1.lon);
        const point2 = projectPoint(map, glyph2.lat, glyph2.lon);
        const smallestDist = getDistance(point1, point2);

        //diminui o tamanho dos glifos quando o nivel de zoom é baixo
        glyphs.forEach((glyph, i) => {
            const svgLayer = L.svg().addTo(map);

            var newSize = Math.min(smallestDist * 0.9, maxSize);
            drawGlyph(svgLayer, glyph, newSize);
        });
    });

    map.setView([glyphs[0].lat, glyphs[0].lon]);

}

function drawGlyph(svgLayer, data, size = 320) {
    const startAngle = 0;
    const width = size;

    const barWidth = width / 20;
    const maxBarLength = width / 4

    const height = width;
    const innerRadius = (width - maxBarLength * 2) / 2;

    const circleBorderWidth = width / 120;

    const arrowWidth = width / 120;
    const arrowPointSize = width / 64;

    const outlineWidth = width / 320;
    const outlineColor = "black";

    const textSize = width / 25;
    const textRadius = innerRadius + maxBarLength + textSize * 1.5;
    const textColor = "black";

    const dataPoints = data.dataPoints;

    const svg = d3.select(svgLayer._container).classed("svg-layer", true);
    const point = projectPoint(map, data.lat, data.lon);

    //adiciona os dados de lat e lon pra serem usados depois
    const svgGroup = svg.append('g')
        .attr("class", "svg-group")
        .attr("transform", `translate(${point.x}, ${point.y})`)
        .datum([data.lat, data.lon]);

    const colorRange = [
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

    const color = d3.scaleOrdinal()
        .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        .range(colorRange);

    //escala da barra
    const linScale = d3.scaleLinear()
        .domain([0, d3.max(dataPoints, d => Math.abs(d.value))])
        .range([0, maxBarLength]);

    //arco do circulo
    const borderArc = d3.arc()
        .innerRadius(innerRadius - circleBorderWidth / 2)
        .outerRadius(innerRadius + circleBorderWidth / 2)
        .cornerRadius(20);

    //arco do texto
    const textArc = d3.arc()
        .innerRadius(textRadius)
        .outerRadius(textRadius)

    //controle das linhas das setas
    const radialLine = d3.lineRadial()
        .angle(d => d[0])
        .radius(d => d[1])
        .curve(d3.curveBasis);

    const borderPie = d3.pie()
        .padAngle(4 / innerRadius)
        .sort(null)
        .startAngle(-Math.PI / dataPoints.length - startAngle / RADIANS)
        .endAngle(Math.PI * 3 + startAngle / RADIANS) // garante que sempre vai ser um circulo completo
        .value(1);

    const pieData = borderPie(dataPoints).map(d => ({
        ...d,
        middleAngle: (d.startAngle + d.endAngle) / 2
    }));


    //cria um objeto que associa o nome da categoria ao seu indice
    const dataPointsIndex = data.dataPoints.reduce((acc, item, index) => {
        acc[item.name] = index;
        return acc;
    }, {});

    //inicializa dados auxiliares
    dataPoints.forEach(dp => {
        dp.consCount = 0;
        dp.anteCount = 0;
        dp.consCalc = 0;
        dp.anteCalc = 0;
    });

    //conta quantos antecessores e cosequentes cada categoria tem
    data.rules.forEach(rule => {
        for (let anteIndex = 0; anteIndex < rule.antecedents.length; anteIndex++) {
            const antecedent = rule.antecedents[anteIndex];
            const dpAnteIndex = dataPointsIndex[antecedent];

            for (let consIndex = 0; consIndex < rule.consequents.length; consIndex++) {
                const consequent = rule.consequents[consIndex];
                const dpConsIndex = dataPointsIndex[consequent];

                dataPoints[dpAnteIndex].consCount++;
                dataPoints[dpConsIndex].anteCount++;
            }
        }
    });

    var arrowData = [];

    //calcula a posição de partida e chegada das setas com base nas regras de associação
    data.rules.forEach((rule, ruleIndex) => {
        for (let anteIndex = 0; anteIndex < rule.antecedents.length; anteIndex++) {
            const antecedent = rule.antecedents[anteIndex];
            const dpAnteIndex = dataPointsIndex[antecedent];
            const dpAnte = dataPoints[dpAnteIndex];

            for (let consIndex = 0; consIndex < rule.consequents.length; consIndex++) {
                const consequent = rule.consequents[consIndex];
                const dpConsIndex = dataPointsIndex[consequent];
                const dpCons = dataPoints[dpConsIndex];

                var arrowPos = { center: [0, 0], rule: ruleIndex };

                //calcula qual o angulo em que a seta vai se originar, levando em conta as outras setas
                var anteArrowCount = dpAnte.consCount + dpAnte.anteCount;
                var anteArrowIndex = dpAnte.consCalc++;
                // dpCons.anteCalc++;

                var anteAngleStep = (pieData[dpAnteIndex].endAngle - pieData[dpAnteIndex].startAngle) / (anteArrowCount + 1);
                var anteAngle = pieData[dpAnteIndex].startAngle + (anteArrowIndex + 1) * anteAngleStep;

                arrowPos.ante = [anteAngle, innerRadius];

                //calcula qual o ponto em que a seta ira apontar, levando em conta as outras setas
                var consArrowCount = dpCons.consCount + dpCons.anteCount;
                var consArrowIndex = dpCons.consCount + dpCons.anteCalc++;

                var consAngleStep = (pieData[dpConsIndex].endAngle - pieData[dpConsIndex].startAngle) / (consArrowCount + 1);
                var consAngle = pieData[dpConsIndex].startAngle + (consArrowIndex + 1) * consAngleStep;

                arrowPos.cons = [consAngle, innerRadius - arrowPointSize - outlineWidth - circleBorderWidth / 2];

                arrowData.push(arrowPos);
            }
        }
    });

    //criação das outlines das setas
    svgGroup.append("g")
        .selectAll("path")
        .data(arrowData)
        .enter().append("g")
        .append("path")
        .attr("d", (d, i) => radialLine([d.ante, d.center, d.cons]))
        .attr("fill", "none")
        .attr("stroke", outlineColor)
        .attr("stroke-width", (outlineWidth ? arrowWidth : 0) + outlineWidth * 2);

    //criação das outlines das barras
    svgGroup.append("g")
        .selectAll("rect")
        .data(pieData)
        .enter("path")
        .append("rect")
        .attr("x", (d, i) => -(barWidth + outlineWidth * 2) / 2)
        .attr("y", innerRadius)
        .attr("width", barWidth + outlineWidth * 2)
        .attr("height", d => linScale(Math.abs(d.data.value)) + outlineWidth)
        .attr("fill", outlineColor)
        .attr("transform", (d, i) => `rotate(${d.middleAngle * RADIANS + 180}, 0, 0)`);

    //criação da borda circular
    svgGroup.append("g")
        .selectAll("path")
        .data(pieData)
        .enter()
        .append("path")
        .attr("fill", d => d.data.value < 0 ? "#2c4" : "#c24")
        .attr("stroke", outlineColor)
        .attr("stroke-width", outlineWidth)
        .attr("d", borderArc);

    //grupo que contem as linhas e cabeça das setas
    var arrows = svgGroup.append("g")
        .selectAll("path")
        .data(arrowData)
        .enter().append("g");

    //criação dos triangulos das setas
    arrows.append("polygon")
        .attr("points", `0,-${arrowPointSize} ${arrowPointSize},${arrowPointSize} -${arrowPointSize},${arrowPointSize}`)
        .attr("transform", d =>
            `translate(0,${-innerRadius + arrowPointSize + outlineWidth + circleBorderWidth / 2}) 
            rotate(${d.cons[0] * RADIANS}, 0, ${innerRadius - arrowPointSize - outlineWidth - circleBorderWidth / 2})`)
        .attr("fill", d => color(d.rule))
        .attr("stroke", outlineColor)
        .attr("stroke-width", outlineWidth);

    //criação das linhas das setas
    arrows.append("path")
        .attr("d", (d, i) => radialLine([d.ante, d.center, d.cons]))
        .attr("fill", "none")
        .attr("stroke", d => color(d.rule))
        .attr("stroke-width", arrowWidth);

    //criação das barras
    svgGroup.append("g")
        .selectAll("rect")
        .data(pieData)
        .enter("path")
        .append("rect")
        .attr("x", (d, i) => -barWidth / 2)
        .attr("y", x => innerRadius)
        .attr("width", barWidth)
        .attr("height", d => linScale(Math.abs(d.data.value)))
        .attr("fill", d => d.data.value < 0 ? "#2c4" : "#c24")
        .attr("transform", (d, i) => `rotate(${d.middleAngle * RADIANS + 180}, 0, 0)`);

    //cria o caminho em que o texto vai curvar sobre
    const circlePath = d3.path();
    circlePath.moveTo(0, -textRadius);
    //circulo dá 3 voltas pra não cortar texto no começo e no fim
    circlePath.arc(0, 0, textRadius, -0.5 * Math.PI, 1.5 * Math.PI);
    circlePath.arc(0, 0, textRadius, -0.5 * Math.PI, 1.5 * Math.PI);
    circlePath.arc(0, 0, textRadius, -0.5 * Math.PI, 1.5 * Math.PI);

    svgGroup.append("path")
        .attr("id", `text-circle-${data.name}`)
        .attr("d", circlePath.toString())
        .attr("fill", "none")
        .attr("stroke", "none")

    //criação dos textos de cada barra
    svgGroup.append("g")
        .attr("fill", textColor)
        .attr("font-family", "Trebuchet MS, monospace")
        .attr("font-size", textSize)
        .attr("text-anchor", "middle")                      //centraliza horizontalmente
        .attr("dominant-baseline", "middle")            //centraliza verticalmente
        .selectAll()
        .data(pieData)
        .join("text")
        // .attr("transform", d => `translate(${textArc.centroid(d)})
        //     rotate(${(d.middleAngle * RADIANS + 90) % 180 - 90}, 0, 0)`)
        .append("textPath")
        .attr("startOffset", (d, i) => `${100 / 3 + i / pieData.length * 100 / 3}%`)    //texto é colocado na 2° volta pra evitar cortes
        .attr("xlink:href", (d, i) => `#text-circle-${data.name}`)
        .call(text => text.append("tspan")
            .attr("y", -textSize / 2)
            .attr("font-weight", 900)
            .text(d => d.data.name))
        .call(text => text.append("tspan")
            .attr("x", 0)
            .attr("y", textSize / 2)
            .attr("font-weight", 200)
            .text(d => d.data.value.toLocaleString("pt-BR")));

    //texto principal
    svgGroup.append("g")
        .attr("class", "glyph-title")
        .attr("fill", "black")
        .attr("font-family", "Trebuchet MS, monospace")
        .attr("font-size", Math.max(width / 12, 16))
        .attr("text-anchor", "middle")                      //centraliza horizontalmente
        .attr("dominant-baseline", "middle")            //centraliza verticalmente
        .attr("visibility", "hidden")
        .append("text")
        .call(text => text.append("tspan")
            .attr("font-weight", 900)
            .text(data.name))
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("paint-order", "stroke")

    //hitbox do svg para detectar hover
    svgGroup.append("circle")
        .attr("r", textRadius + textSize * 1.5)
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

    return svgGroup.node();
}