import { Control } from "./control.js"

export class ComboBoxControl extends Control {
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