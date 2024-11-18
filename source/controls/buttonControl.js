import { Control } from "./control.js"

export class ButtonControl extends Control {
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