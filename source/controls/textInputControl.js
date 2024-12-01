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
            this.update();
        });

        this.update();
    }

    update() {
        this.value = this.input.node().value;
        if (this.options.onChange) {
            this.options.onChange(this.value);
        }
    }
}