import { RangeControl, createD3RangeSlider } from "./rangeControl.js"

export class DateRangeControl extends RangeControl {
    constructor(selector, options) {
        super(selector, options);
        this.wrapper.classed('range-control', true);
    }

    addSlider() {
        this.slider.node().innerHTML = "";
        const timeUnitsCount = dayjs(this.options.rangeMax).diff(dayjs(this.options.rangeMin), this.options.rangeTimeUnit);
        const slider = createD3RangeSlider(0, timeUnitsCount, this.options.rangeStep, this.slider);

        slider.onChange(function (newRange) {
            const begin = dayjs(this.options.rangeMin)
                .add(newRange.begin, this.options.rangeTimeUnit)
                .startOf(this.options.rangeTimeUnit).toDate();

            const end = dayjs(this.options.rangeMin)
                .add(newRange.end, this.options.rangeTimeUnit)
                .startOf(this.options.rangeTimeUnit).toDate();

            this.range = {begin: begin, end: end};
            this.updateToolTip();
        }.bind(this));

        slider.onTouchEnd(function (newRange) {
            const begin = dayjs(this.options.rangeMin)
                .add(newRange.begin, this.options.rangeTimeUnit)
                .startOf(this.options.rangeTimeUnit).toDate();

            const end = dayjs(this.options.rangeMin)
                .add(newRange.end, this.options.rangeTimeUnit)
                .startOf(this.options.rangeTimeUnit).toDate();

            this.range = {begin: begin, end: end};
            this.updateToolTip();
            this.update();
        }.bind(this));

        const initDate = dayjs(this.options.rangeInitMin).diff(dayjs(this.options.rangeMin), this.options.rangeTimeUnit);
        const endDate = dayjs(this.options.rangeInitMax).diff(dayjs(this.options.rangeMin), this.options.rangeTimeUnit);

        slider.range(initDate, endDate);

        this.update();
    }

    updateToolTip() {
        if (this.options.updateTooltip) {
            this.options.updateTooltip(this.tooltip, this.range);
        }
        else{
            const start = dayjs(this.range.begin)
                .format("DD/MM/YYYY");

            const end = dayjs(this.range.end)
                .format("DD/MM/YYYY");

            this.tooltip.text(start + " - " + end);
        }
    }

    static TimeUnit = Object.freeze({
        HOURS: "hours",
        DAYS: "days",
        WEEKS: "weeks",
        MONTHS: "months",
        YEARS: "years",
    });

}