
//cria controles slider
L.Control.Slider = L.Control.extend({
    initialize: function (options) {
        L.Control.prototype.initialize.call(this, options);
        this.options = options;
        this.minSupp = options.rangeInitMin; //suporte inicial
    },

    onAdd: function (map) {
        const div = L.DomUtil.create('div', 'leaflet-control slider-control');

        div.innerHTML = `
            <div class="range-label">${this.options.labelText}</div>
            <div class="slider-container"></div>
            <div class="range-tooltip">0 - 10</div>
        `;


        //impede que o clique se propague para outros elementos
        L.DomEvent.disableClickPropagation(div);

        const d3Div = d3.select(div);

        this.slider = d3Div.select(".slider-container");
        this.label = d3Div.select(".range-label");
        this.tooltip = d3Div.select(".range-tooltip");

        return div;
    },

    addSlider: function () {
        const slider = createD3RangeSlider(this.options.rangeMin, this.options.rangeMax, this.options.rangeStep, this.slider);


        slider.onChange(function (newRange) {
            this.range = newRange;
            this.updateToolTip();
        }.bind(this));

        slider.onTouchEnd(function (newRange) {
            this.range = newRange;
            this.updateToolTip();
            this.update();
        }.bind(this));

        slider.range(this.options.rangeInitMin, this.options.rangeInitMax);

        this.update();
    },

    onRemove: function (map) {
    },

    updateToolTip() {
        this.tooltip.text(this.range.begin + " - " + this.range.end);
    },

    update: function () {

        this.options.onChange(this.range);
    },
});


L.Control.ComboBox = L.Control.extend({
    initialize: function (options) {
        L.Control.prototype.initialize.call(this, options);
        this.options = options;
        this.selectedValue = options.initValue || '';
    },

    onAdd: function (map) {
        const div = L.DomUtil.create('div', 'leaflet-control combobox-control');

        div.innerHTML = `
            <div class="combobox-label">${this.options.labelText}</div>
            <select class="combobox-container"></select>
        `;

        L.DomEvent.disableClickPropagation(div);

        const d3Div = d3.select(div);
        this.combobox = d3Div.select(".combobox-container");
        this.label = d3Div.select(".combobox-label");

        this.addOptions();

        this.combobox.on("change", function() {
            this.selectedValue = this.combobox.node().value;
            this.update();
        }.bind(this));

        return div;
    },

    addOptions: function () {
        const optionsList = this.options.optionsList || [];

        optionsList.forEach(option => {
            this.combobox.append("option")
                .attr("value", option.value)
                .text(option.label);
        });

        if (this.selectedValue) {
            this.combobox.node().value = this.selectedValue;
        }
    },

    onRemove: function (map) {
    },

    update: function () {
        this.options.onChange(this.selectedValue);
    },
});
