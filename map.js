const RADIANS = 180 / Math.PI;
var map;

function loadMap() {
    map = L.map('map').setView([51.505, -0.05], 12); // London

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
        ext: 'png'
    }).addTo(map);

    L.control.scale().addTo(map);

    //cria controles slider
    L.Control.Slider = L.Control.extend({
        initialize: function (options) {
            L.Control.prototype.initialize.call(this, options);
            this.options = options;
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

    //criação dos slider de suporte
    var supportSlider = new L.Control.Slider({
        position: 'topright',
        labelText: 'Suporte Mínimo',
        rangeMin: 0.0,
        rangeMax: 1,
        rangeStep: 0.05,
        rangeInit: initThreshVal.support,
        onChange: function (value) {
            for (const key in glyphGroups) {
                const glyph = glyphGroups[key];
                glyph.setAssocThresh(value, null, null);
                glyph.update();
            }
        }
    });
    supportSlider.addTo(map);
    supportSlider.updateTooltip(map);

    //criação dos slider de confiança
    var confidenceSlider = new L.Control.Slider({
        position: 'topright',
        labelText: 'Confiança Mínima',
        rangeMin: 0.0,
        rangeMax: 1,
        rangeStep: 0.05,
        rangeInit:  initThreshVal.confidence,
        onChange: function (value) {
            for (const key in glyphGroups) {
                const glyph = glyphGroups[key];
                glyph.setAssocThresh(null, value, null);
                glyph.update();
            }
        }
    });
    confidenceSlider.addTo(map);
    confidenceSlider.updateTooltip(map);

    //criação dos slider de lift
    var liftSlider = new L.Control.Slider({
        position: 'topright',
        labelText: 'Lift Mínimo',
        rangeMin: 1,
        rangeMax: 2,
        rangeStep: 0.1,
        rangeInit:  initThreshVal.lift,
        onChange: function (value) {
            for (const key in glyphGroups) {
                const glyph = glyphGroups[key];
                glyph.setAssocThresh(null, null, value);
                glyph.update();
            }
        }
    });
    liftSlider.addTo(map);
    liftSlider.updateTooltip(map);

    //atualiza a posição quando move e da zoom
    map.on('moveend', function () {
        for (const key in glyphGroups) {
            const glyphGroup = glyphGroups[key];

            var newSize = glyphGroup.getMaxSize();

            //diminui o tamanho dos glifos quando o nivel de zoom é baixo
            for (const key in glyphGroup.glyphs) {
                const glyph = glyphGroup.glyphs[key];

                glyph.setSize(newSize);
                glyph.updatePosition();
            };
        }
    });
    // createGlyphs(tempData);

};

function projectPoint(map, lat, lon) {
    return map.latLngToLayerPoint(new L.LatLng(lat, lon));
}

function clearGlyphs() {
    d3.selectAll(".svg-layer").remove();
}