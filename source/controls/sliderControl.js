import { Control } from "./control.js"

export class SliderControl extends Control {
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

        this.update();
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

    show() {
        super.show();
        this.updateTooltip();
    }
}