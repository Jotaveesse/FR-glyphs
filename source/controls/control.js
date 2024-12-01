export class Control {
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

        if (this.options.insertBefore) {
            const nextSib = d3.select(this.options.insertBefore);

            this.wrapper = d3.select(container.node().insertBefore(d3.create("div").node(), nextSib.node()));
            this.wrapper.attr('class', 'control');
        }
        else
            this.wrapper = container.append('div').attr('class', 'control');

        if (this.options.labelText)
            this.wrapper
                .append('label')
                .attr('for', this.getId())
                .attr('class', 'control-label')
                .text(this.options.labelText);

        this.createControl();

        if(this.options.startHidden)
            this.hide();
    }

    getId() {
        return this.options.id;
    }

    update() {
        if (this.options.onChange) {
            this.options.onChange(this.value);
        }
    }

    reload() {
        this.wrapper.node().innerHTML = "";
        this.createControl();
    }

    show() {
        this.wrapper.style("display", "");
    }

    hide() {
        this.wrapper.style("display", "none");
    }

    toggleShow() {
        const display = this.wrapper.style("display");

        if (display != "none") {
            this.wrapper.style("display", "none");
        }
        else {
            this.wrapper.style("display", "");
        }
    }
}