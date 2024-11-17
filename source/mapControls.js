L.Control.Button = L.Control.extend({
    initialize: function (options) {
        L.Control.prototype.initialize.call(this, options);
        this.options = options;
    },

    onAdd: function (map) {
        const div = L.DomUtil.create('div', 'leaflet-control map-button');

        div.innerHTML = `
            <button>${this.options.text}
            </button>
        `;

        //impede que o clique se propague para outros elementos
        L.DomEvent.disableClickPropagation(div);

        this.button = div.querySelector("button");

        L.DomEvent.on(this.button, 'click', this.update.bind(this));

        return div;
    },

    onRemove: function (map) {
    },


    update: function () {
        this.options.onChange();
    },
});

class Control {
    constructor(selector, options) {
        if (new.target === Control) {
            throw new Error("Control is an abstract class and cannot be instantiated directly.");
        }

        this.value = options.initValue || null;
        this.selector = selector;
        this.options = options;

        this.init();
    }

    init() {
        const container = d3.select(this.selector);

        this.wrapper = container.append('div').attr('class', 'control');
        if (this.options.labelText)
            this.wrapper
                .append('label')
                .attr('for', this.getId())
                .attr('class', 'control-label')
                .text(this.options.labelText);

        this.createControl();
    }

    getId() {
        return this.options.id;
    }

    update() {
        if (this.options.onChange) {
            this.options.onChange(this.value);
        }
    }
}

class RangeControl extends Control {
    constructor(selector, options) {
        super(selector, options);
        this.wrapper.classed('range-control', true);
        this.addSlider();
    }

    createControl() {
        const div = this.wrapper;

        div.node().innerHTML = `
        <div class="range-label">${this.options.labelText}</div>
        <div class="range-container"></div>
        <div class="range-tooltip">0 - 10</div>
    `;

        const d3Div = div;
        console.log(d3Div)
        this.slider = d3Div.select(".range-container");
        this.label = d3Div.select(".range-label");
        this.tooltip = d3Div.select(".range-tooltip");


        return div;
    }

    addSlider() {
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
    }

    updateToolTip() {
        this.tooltip.text(this.range.begin + " - " + this.range.end);
    }

    update() {
        if (this.options.onChange) {
            this.options.onChange(this.range);
        }
    }
}

class ButtonControl extends Control {
    constructor(selector, options) {
        super(selector, options);
        this.wrapper.classed('button-control', true);

    }

    createControl() {
        this.button = this.wrapper
            .append('button')
            .attr('id', this.getId())
            .attr('class', 'button-container')
            .text(this.options.text);

        this.button.on('click', () => {
            this.update();
        });
    }

    update() {
        if (this.options.onChange) {
            this.options.onChange();
        }
    }
}

class SliderControl extends Control {
    constructor(selector, options) {
        super(selector, options);
        this.wrapper.classed('slider-control', true);
        this.updateTooltip();
    }

    createControl() {
        this.sliderWrapper = this.wrapper;

        const sliderContainer = this.sliderWrapper
            .append('div')
            .attr('class', 'slider-container');

        this.tooltip = sliderContainer
            .append('div')
            .attr('id', 'tooltip')
            .attr('class', 'tooltip')
            .text(this.value);

        this.slider = sliderContainer
            .append('input')
            .attr('type', 'range')
            .attr('id', `${this.options.id}-slider`)
            .attr('min', this.options.rangeMin)
            .attr('max', this.options.rangeMax)
            .attr('step', this.options.rangeStep)
            .attr('value', this.value);

        this.slider
            .on('input', (event) => this.handleSliderInput(event))
            .on('change', () => this.update());

    }

    handleSliderInput(event) {
        this.value = parseFloat(this.slider.node().value);
        this.updateTooltip();
    }

    updateTooltip() {
        this.tooltip.text(this.value);

        // Calculate the tooltip position
        const percentage = (this.value - this.slider.node().min) / (this.slider.node().max - this.slider.node().min);
        const offset = percentage * (this.slider.node().offsetWidth - 32);
        this.tooltip.style('left', `${offset}px`);
    }

    update() {
        if (this.options.onChange) {
            this.options.onChange(this.value);
        }
    }
}

class ComboBoxControl extends Control {
    constructor(selector, options) {
        super(selector, options);
        this.optionsList = [];
        this.wrapper.classed('combobox-control', true);
    }

    createControl() {
        this.combobox = this.wrapper
            .append('select')
            .attr('id', this.getId())
            .attr('class', 'combobox-container');

        this.addDefaultOptions();

        this.combobox.on('change', () => {
            this.update(this.value);
        });
    }

    addDefaultOptions() {
        this.addOptions(this.options.optionsList);
    }

    addOptions(optionsList = []) {
        optionsList.forEach(option => {
            this.combobox.append('option')
                .attr('value', option.value)
                .text(option.text);
        });

        console.log(this.combobox)


        this.optionsList = Array.from(this.combobox.node().options).map(option => (
            option.value
        ));

        if (optionsList.length > 0) {
            this.value = optionsList[0].value;
            this.setValue(this.value);
        }
    }

    setValue(value) {
        if (this.optionsList.includes(value)) {
            this.combobox.node().value = value;
            this.update();

            return true;
        }

        return false;
    }

    removeOptions() {
        this.combobox.selectAll("option").remove();
        this.optionsList = [];

    }

    update() {
        this.value = this.combobox.node().value;
        if (this.options.onChange) {
            this.options.onChange(this.value);
        }
    }
}

class FileInputControl extends Control {
    constructor(selector, options) {
        super(selector, options);
        this.value = options.rangeInit || null;
        this.wrapper.classed('file-control', true);
    }

    createControl() {
        const container = this.wrapper;

        this.inputWrapper = container.append('div')
            .attr('class', 'file-input-control')
            .attr('id', this.options.id || null);

        const inputContainer = this.inputWrapper
            .append('div')
            .attr('class', 'file-input-container');

        this.fileInput = inputContainer
            .append('input')
            .attr('type', 'file')
            .attr('id', `${this.options.id}-file-input`)
            .attr('accept', this.options.type);

        this.fileInput
            .on('change', (event) => this.update(event));
    }

    update(event) {
        const file = event.target.files[0];
        if (file) {
            if (!file.name.endsWith(this.options.type)) {
                alert('Por favor escolha um arquivo ' + this.options.type);
                this.fileInput.node().value = null;
                return;
            }
            this.value = file;

            if (this.options.onChange) {
                this.options.onChange(file);
            }
        }
    }
}
