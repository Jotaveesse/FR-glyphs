import { Control } from "./control.js"

export class MenuAccordionControl extends Control {
    constructor(selector, options) {
        super(selector, options);
        this.wrapper.classed('menu-accordion', true);
    }

    createControl() {
        this.wrapper.append("span")
            .text(this.options.text);

        this.wrapper.append("div")
            .attr("class", "menu-accordion-icon");

        this.wrapper.on('click', () => {
            this.update();
        });
    }

    update() {
        if (this.options.onChange) {
            this.options.onChange(this);
        }
    }
}