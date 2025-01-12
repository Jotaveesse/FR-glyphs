import { Control } from "./control.js"

export class TextInputControl extends Control {
    constructor(selector, options) {
        super(selector, options);
        this.wrapper.classed('input-control', true);
    }

    createControl() {
        this.input = this.wrapper
            .append('input')
            .attr('id', this.getId())
            .attr('class', 'input-container')
            .attr('placeholder', "DD/MM/YYYY")
            .text(this.options.text);

        this.input.node().value = this.options.initText;
        this.input.on('change', () => {
            this.setValue(this.input.node().value);
        });

        this.update();
    }

    update() {
        if (this.options.onChange) {
            this.options.onChange(this.value);
        }
    }

    setValue(value){
        this.value = value;
        this.update();
    }
}