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