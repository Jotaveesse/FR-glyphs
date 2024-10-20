/*jslint browser: true */
/*jslint this */


/**
 * Create a d3 range slider that selects ranges between `rangeMin` and `rangeMax`, and add it to the
 * `containerSelector`. The contents of the container is laid out as follows
 * <code>
 * <div class="drag">
 *     <div class="handle WW"></div>
 *     <div class="handle EE"></div>
 * </div>
 * </code>
 * The appearance can be changed with CSS, but the `position` must be `relative`, and the width of `.slider` should be
 * left unaltered.
 *
 * @param rangeMin Minimum value of the range
 * @param rangeMax Maximum value of the range
 * @param rangeStep Step for value change
 * @param containerSelector A CSS selection indicating exactly one element in the document
 * @returns {{range: function(number, number), onChange: function(function)}}
 */
function createD3RangeSlider(rangeMin, rangeMax, rangeStep, container, playButton) {
    "use strict";

    if (container instanceof Element)
        container = d3.select(container);

    var minWidth = 10;

    var sliderRange = { begin: rangeMin, end: rangeMin };
    var changeListeners = [];
    var touchEndListeners = [];
    var playing = false;
    var resumePlaying = false; // Used by drag-events to resume playing on release
    var playingRate = 100;
    var containerHeight = container.node().offsetHeight;

    var sliderBox = container.append("div")
        .style("position", "relative")
        // .style("height", containerHeight + "px")
        .style("min-width", (minWidth * 2) + "px")
        .classed("slider-container", true);


    //Create elements in container
    var slider = sliderBox
        .append("div")
        .attr("class", "slider");
    var handleW = slider.append("div").attr("class", "handle WW");
    var handleE = slider.append("div").attr("class", "handle EE");

    /** Update the `left` and `width` attributes of `slider` based on `sliderRange` */
    function updateUIFromRange() {
        var conW = sliderBox.node().clientWidth;
        var rangeW = sliderRange.end - sliderRange.begin;
        var slope = (conW - minWidth) / (rangeMax - rangeMin);
        var uirangeW = minWidth + rangeW * slope;
        var ratio = (sliderRange.begin - rangeMin) / (rangeMax - rangeMin - rangeW);
        if (isNaN(ratio)) {
            ratio = 0;
        }
        var uirangeL = ratio * (conW - uirangeW);

        slider
            .style("left", uirangeL + "px")
            .style("width", uirangeW + "px");
    }

    /** Update the `sliderRange` based on the `left` and `width` attributes of `slider` */
    function updateRangeFromUI() {
        var uirangeL = parseFloat(slider.style("left"));
        var uirangeW = parseFloat(slider.style("width"));
        var conW = sliderBox.node().clientWidth; //parseFloat(container.style("width"));
        var slope = (conW - minWidth) / (rangeMax - rangeMin);
        var rangeW = (uirangeW - minWidth) / slope;
        if (conW == uirangeW) {
            var uislope = 0;
        } else {
            var uislope = (rangeMax - rangeMin - rangeW) / (conW - uirangeW);
        }
        var rangeL = rangeMin + uislope * uirangeL;
        sliderRange.begin = roundToStep(rangeL, rangeStep);
        sliderRange.end = roundToStep(rangeL + rangeW, rangeStep);

        //Fire change listeners
        changeListeners.forEach(function (callback) {
            callback({ begin: sliderRange.begin, end: sliderRange.end });
        });
    }

    function roundToStep(value, step) {
        const rounded = Math.round(value / step) * step;
        return parseFloat(rounded.toFixed(6));
    }

    // configure drag behavior for handles and slider
    var dragResizeE = d3.drag()
        .on("start", function (event) {
            event.sourceEvent.stopPropagation();
            resumePlaying = playing;
            playing = false;
        })
        .on("end", function () {
            if (resumePlaying) {
                startPlaying();
            }
            touchEndListeners.forEach(function (callback) {
                callback({ begin: sliderRange.begin, end: sliderRange.end });
            });
        })
        .on("drag", function (event) {
            var dx = event.dx;
            if (dx == 0) return;

            var conWidth = sliderBox.node().clientWidth; //parseFloat(container.style("width"));
            var newLeft = parseInt(slider.style("left"));
            var newWidth = parseFloat(slider.style("width")) + dx;
            newWidth = Math.max(newWidth, minWidth);
            newWidth = Math.min(newWidth, conWidth - newLeft);
            slider.style("width", newWidth + "px");
            updateRangeFromUI();
        });

    var dragResizeW = d3.drag()
        .on("start", function (event) {

            this.startX = d3.pointer(event, this)[0];
            event.sourceEvent.stopPropagation();
            resumePlaying = playing;
            playing = false;
        })
        .on("end", function () {
            if (resumePlaying) {
                startPlaying();
            }
            touchEndListeners.forEach(function (callback) {
                callback({ begin: sliderRange.begin, end: sliderRange.end });
            });
        })
        .on("drag", function (ev) {
            var dx = d3.pointer(ev, this)[0] - this.startX;

            if (dx == 0) return;
            var newLeft = parseFloat(slider.style("left")) + dx;
            var newWidth = parseFloat(slider.style("width")) - dx;

            if (newLeft < 0) {
                newWidth += newLeft;
                newLeft = 0;
            }
            if (newWidth < minWidth) {
                newLeft -= minWidth - newWidth;
                newWidth = minWidth;
            }

            slider.style("left", newLeft + "px");
            slider.style("width", newWidth + "px");

            updateRangeFromUI();
        });

    var dragMove = d3.drag()
        .on("start", function (event) {
            event.sourceEvent.stopPropagation();
            resumePlaying = playing;
            playing = false;
        })
        .on("end", function () {
            if (resumePlaying) {
                startPlaying();
            }
            touchEndListeners.forEach(function (callback) {
                callback({ begin: sliderRange.begin, end: sliderRange.end });
            });
        })
        .on("drag", function (event) {
            var dx = event.dx;
            var conWidth = sliderBox.node().clientWidth; //parseInt(container.style("width"));
            var newLeft = parseInt(slider.style("left")) + dx;
            var newWidth = parseInt(slider.style("width"));

            newLeft = Math.max(newLeft, 0);
            newLeft = Math.min(newLeft, conWidth - newWidth);
            slider.style("left", newLeft + "px");

            updateRangeFromUI();
        });

    handleE.call(dragResizeE);
    handleW.call(dragResizeW);
    slider.call(dragMove);

    //Click on bar
    sliderBox.on("mousedown", function (ev) {
        var x = d3.pointer(ev)[0];
        var props = {};
        var sliderWidth = parseFloat(slider.style("width"));
        var conWidth = sliderBox.node().clientWidth; //parseFloat(container.style("width"));
        props.left = Math.min(conWidth - sliderWidth, Math.max(x - sliderWidth / 2, 0));
        props.left = Math.round(props.left);
        props.width = Math.round(props.width);
        slider.style("left", props.left + "px")
            .style("width", props.width + "px");
        updateRangeFromUI();
    });

    //Reposition slider on window resize
    window.addEventListener("resize", function () {
        updateUIFromRange();
    });

    function onChange(callback) {
        changeListeners.push(callback);
        return this;
    }

    function onTouchEnd(callback) {
        touchEndListeners.push(callback);
        return this;
    }

    function setRange(b, e) {
        sliderRange.begin = b;
        sliderRange.end = e;

        updateUIFromRange();

        //Fire change listeners
        changeListeners.forEach(function (callback) {
            callback({ begin: sliderRange.begin, end: sliderRange.end });
        });
    }


    /**
     * Returns or sets the range depending on arguments.
     * If `b` and `e` are both numbers then the range is set to span from `b` to `e`.
     * If `b` is a number and `e` is undefined the beginning of the slider is moved to `b`.
     * If both `b` and `e` are undefined the currently set range is returned as an object with `begin` and `end`
     * attributes.
     * If any arguments cause the range to be outside of the `rangeMin` and `rangeMax` specified on slider creation
     * then a warning is printed and the range correspondingly clamped.
     * @param b beginning of range
     * @param e end of range
     * @returns {{begin: number, end: number}}
     */
    function range(b, e) {
        var rLower;
        var rUpper;

        if (typeof b === "number" && typeof e === "number") {

            rLower = Math.min(b, e);
            rUpper = Math.max(b, e);

            //Check that lower and upper range are within their bounds
            if (rLower < rangeMin || rUpper > rangeMax) {
                console.log("Warning: trying to set range (" + rLower + "," + rUpper + ") which is outside of bounds (" + rangeMin + "," + rangeMax + "). ");
                rLower = Math.max(rLower, rangeMin);
                rUpper = Math.min(rUpper, rangeMax);
            }

            //Set the range
            setRange(rLower, rUpper);
        } else if (typeof b === "number") {

            rLower = b;
            var dif = sliderRange.end - sliderRange.begin;
            rUpper = rLower + dif;

            if (rLower < rangeMin) {
                console.log("Warning: trying to set range (" + rLower + "," + rUpper + ") which is outside of bounds (" + rangeMin + "," + rangeMax + "). ");
                rLower = rangeMin;
            }
            if (rUpper > rangeMax) {
                console.log("Warning: trying to set range (" + rLower + "," + rUpper + ") which is outside of bounds (" + rangeMin + "," + rangeMax + "). ");
                rLower = rangeMax - dif;
                rUpper = rangeMax;
            }

            setRange(rLower, rUpper);
        }

        return { begin: sliderRange.begin, end: sliderRange.end };
    }

    function togglePlayButton() {
        if (playing) {
            stopPlaying();
        } else {
            startPlaying();
        }
    }

    function frameTick() {
        if (!playing) {
            return;
        }

        var limitWidth = rangeMax - rangeMin + 1;
        var rangeWidth = sliderRange.end - sliderRange.begin + 1;
        var delta = Math.min(Math.ceil(rangeWidth / 10), Math.ceil(limitWidth / 100));

        // Check if playback has reached the end
        if (sliderRange.end + delta > rangeMax) {
            delta = rangeMax - sliderRange.end;
            stopPlaying();
        }

        setRange(sliderRange.begin + delta, sliderRange.end + delta);

        setTimeout(frameTick, playingRate);
    }

    setRange(sliderRange.begin, sliderRange.end);

    return {
        range: range,
        onChange: onChange,
        onTouchEnd: onTouchEnd,
        updateUIFromRange: updateUIFromRange
    };
}

//cria controles slider
L.Control.Slider = L.Control.extend({
    initialize: function (options) {
        L.Control.prototype.initialize.call(this, options);
        this.options = options;
        this.minSupp = options.rangeInitMin; //suporte inicial
    },

    onAdd: function (map) {
        const div = L.DomUtil.create('div', 'leaflet-control slider-control');

        div.innerHTML = `
            <div class="range-label">${this.options.labelText}</div>
            <div class="slider-container"></div>
            <div class="range-tooltip">0 - 10</div>
        `;


        //impede que o clique se propague para outros elementos
        L.DomEvent.disableClickPropagation(div);

        const d3Div = d3.select(div);

        this.slider = d3Div.select(".slider-container");
        this.label = d3Div.select(".range-label");
        this.tooltip = d3Div.select(".range-tooltip");

        return div;
    },

    addSlider: function () {
        const slider = createD3RangeSlider(this.options.rangeMin, this.options.rangeMax, this.options.rangeStep, this.slider);


        slider.onChange(function (newRange) {
            this.range = newRange;
            this.updateToolTip();
        }.bind(this));

        slider.onTouchEnd(function (newRange) {
            this.range = newRange;
            this.updateToolTip();
            this.update();
        }.bind(this));

        slider.range(this.options.rangeInitMin, this.options.rangeInitMax);

        this.update();
    },

    onRemove: function (map) {
    },

    updateToolTip() {
        this.tooltip.text(this.range.begin + " - " + this.range.end);
    },

    update: function () {

        this.options.onChange(this.range);
    },
});