import { RangeControl, createD3RangeSlider } from "./rangeControl.js"

export class DateRangeControl extends RangeControl {
    constructor(selector, options) {
        super(selector, options);
        this.wrapper.classed('data-range-control', true);
    }

    dateDiff(date1, date2, timeUnit) {
        return Math.ceil(
            dayjs(date1).diff(
                dayjs(date2),
                timeUnit,
                true
            )
        );
    }

    addSlider() {
        this.slider.node().innerHTML = "";
        const timeUnitsCount = this.dateDiff(this.options.rangeMax,
            this.options.rangeMin, this.options.rangeTimeUnit);

        const slider = createD3RangeSlider(0, timeUnitsCount, this.options.rangeStep, this.slider);

        slider.onChange(function (newRange) {
            const begin = dayjs(this.options.rangeMin)
                .add(newRange.begin, this.options.rangeTimeUnit)
                .startOf(this.options.rangeTimeUnit).toDate();

            const end = dayjs(this.options.rangeMin)
                .add(newRange.end, this.options.rangeTimeUnit)
                .endOf(this.options.rangeTimeUnit).toDate();

            this.range = { begin: begin, end: end };
            this.updateTooltip();
        }.bind(this));

        slider.onTouchEnd(function (newRange) {
            const begin = dayjs(this.options.rangeMin)
                .add(newRange.begin, this.options.rangeTimeUnit)
                .startOf(this.options.rangeTimeUnit).toDate();

            const end = dayjs(this.options.rangeMin)
                .add(newRange.end, this.options.rangeTimeUnit)
                .endOf(this.options.rangeTimeUnit).toDate();

            this.range = { begin: begin, end: end };
            this.updateTooltip();
            this.update();
        }.bind(this));

        const initDate = this.dateDiff(this.options.rangeInitMin,
            this.options.rangeMin, this.options.rangeTimeUnit);

        const endDate = this.dateDiff(this.options.rangeInitMax,
            this.options.rangeMin, this.options.rangeTimeUnit);

        slider.range(initDate, endDate);

        this.update();
    }

    updateTooltip() {
        if (this.options.updateTooltip) {
            this.options.updateTooltip(this.tooltip, this.range);
        }
        else {
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