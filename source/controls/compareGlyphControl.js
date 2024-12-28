import { Control } from "./control.js"

export class CompareGlyphControl extends Control {
    constructor(selector, options) {
        super(selector, options);
        this.wrapper.classed('compare-glyph-control', true);
    }

    createControl() {
        this.buttonArea = this.wrapper
            .append('div')
            .attr('class', 'glyph-control-button-area');

        this.upButton = this.buttonArea
            .append('div')
            .attr('class', 'glyph-control-button glyph-control-up-button')
            .append('button');

        this.upButton.on('click', () => {
            this.upClick();
        });

        this.downButton = this.buttonArea
            .append('div')
            .attr('class', 'glyph-control-button glyph-control-down-button')
            .append('button');

        this.downButton.on('click', () => {
            this.downClick();
        });

        this.removeButton = this.buttonArea
            .append('div')
            .attr('class', 'glyph-control-button glyph-control-remove-button')
            .append('button');

        this.removeButton.on('click', () => {
            this.removeClick();
        });

        this.glyphArea = this.wrapper
            .append('div')
            .attr('class', 'glyph-control-items');

        this.icon = d3.select(this.options.icon);
        this.fixIcon();
        this.glyphArea.node().appendChild(this.icon.node());
    }

    fixIcon() {
        this.icon.attr("viewBox", "-80, -80, 160, 160");
        this.icon.select(".glyph-title").attr("visibility", "hidden");
        this.icon.select(".glyph-title").attr("font-size", "14")
        this.icon.select(".glyph-bar-texts").attr("visibility", "");
        this.icon.select(".glyph-bar-outlines").attr("visibility", "");
        this.icon.select(".glyph-arrow-outlines").attr("visibility", "");
        this.icon.select(".glyph-count").attr("visibility", "hidden");
        this.icon.select(".glyph-hitbox").attr("visibility", "hidden");
        this.icon.select(".glyph-background").style("opacity", 0);

        this.icon.select(".glyph-border").selectAll("path")
            .attr("stroke-width", this.options.glyph.outlineWidth);

        this.icon.select(".glyph-arrows").selectAll("polygon")
            .attr("stroke-width", this.options.glyph.outlineWidth);

        this.icon.select(".glyph-arrows").selectAll("path")
            .attr("stroke-width", this.options.glyph.arrowWidth);
    }

    upClick() {
        const prevSibling = this.wrapper.node().previousElementSibling;

        if (prevSibling != null) {
            this.container.node().insertBefore(this.wrapper.node(), prevSibling)
        }
        if (this.options.onDownClick) {
            this.options.onDownClick();
        }
    }
    
    downClick() {
        const nextSibling = this.wrapper.node().nextElementSibling;

        if (nextSibling != null) {
            nextSibling.insertAdjacentElement('afterend', this.wrapper.node());
        }
        if (this.options.onUpClick) {
            this.options.onUpClick();
        }
    }

    removeClick() {
        this.remove();
        if (this.options.onRemoveClick) {
            this.options.onRemoveClick();
        }
    }
}