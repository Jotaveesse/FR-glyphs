import { removeColumnId, extractColumnId } from "../common.js";
import { Control } from "./control.js"

export class RuleDisplayControl extends Control {
    constructor(selector, options) {
        super(selector, options);
        this.wrapper.classed('rule-display-control', true);
    }

    createControl() {
        if (this.currIndex == undefined) {
            this.groupCount = Object.keys(this.options.ruleGroup).length;
            this.currIndex = 0;
            this.currGroup = Object.keys(this.options.ruleGroup)[this.currIndex];
            this.currRule = this.options.ruleGroup[this.currGroup];
        }

        this.container = this.wrapper
            .append("div")
            .attr("class", "rule-display-container");

        const ruleClasses = this.container.append("div")
            .attr("class", "rule-classes");

        const antecedentArea = ruleClasses.append("div")
            .attr("class", "rule-antecedent-area");

        this.currRule.antecedents.forEach(text => {
            const columnId = extractColumnId(text);
            const column = this.options.columnNames[columnId];
            const areaClass = text.length > 18 ? "rule-antecedent text-slide" : "rule-antecedent";

            const consequentDiv = antecedentArea.append("div")
                .attr("class", areaClass)
                .on("mouseover", function () {
                    d3.select(this).select("span").text(column)
                        .style("font-weight", 900);
                })
                .on("mouseout", function () {
                    d3.select(this).select("span").text(removeColumnId(text))
                        .style("font-weight", "");
                });

            consequentDiv.append("span")
                .text(removeColumnId(text));
        });

        ruleClasses.append("div")
            .attr("class", "rule-middle")
            .append("div")
            .attr("class", "rule-arrow")
            .text("->");

        const consequentArea = ruleClasses.append("div")
            .attr("class", "rule-consequent-area");

        this.currRule.consequents.forEach(text => {
            const columnId = extractColumnId(text);
            const column = this.options.columnNames[columnId];
            const areaClass = text.length > 18 ? "rule-consequent text-slide" : "rule-consequent";

            const consequentDiv = consequentArea.append("div")
                .attr("class", areaClass)
                .on("mouseover", function () {
                    d3.select(this).select("span").text(column)
                        .style("font-weight", 900);
                })
                .on("mouseout", function () {
                    d3.select(this).select("span").text(removeColumnId(text))
                        .style("font-weight", "");
                });

            consequentDiv.append("span")
                .text(removeColumnId(text));
        });

        const valueArea = this.container.append("div")
            .attr("class", "rule-value-area");

        this.ruleValues = {
            "Suporte Antecedente": this.currRule.antecedentSupport,
            "Suporte Consequente": this.currRule.consequentSupport,
            "Contagem": this.currRule.count,
            "Suporte": this.currRule.support,
            "Confiança": this.currRule.confidence,
            "Lift": this.currRule.lift,
            "Interesse": this.currRule.interestingness,
        }

        Object.entries(this.ruleValues).forEach(([label, value]) => {
            const ruleValue = valueArea.append("div")
                .attr("class", "rule-value");

            ruleValue.append("span")
                .attr("class", "rule-value-label").text(label);
            ruleValue.append("span")
                .attr("class", "rule-value-value").text(Number.isInteger(value) ? value : value.toFixed(3));
        });

        const infoArea = this.container.append("div")
            .attr("class", "rule-info-area");

        infoArea.append("div")
            .attr("class", "rule-group-changer")
            .style("visibility", this.currIndex > 0 ? "visible" : "hidden")
            .append("button")
            .attr("class", "rule-group-prev")
            .text("<")
            .on('click', (e) => {
                e.stopPropagation();
                this.currIndex = Math.max(this.currIndex - 1, 0);
                this.currGroup = Object.keys(this.options.ruleGroup)[this.currIndex];
                this.currRule = this.options.ruleGroup[this.currGroup];
                this.updateDisplay();
            });

        infoArea.append("div")
            .attr("class", "rule-info")
            .append("span")
            .text(this.currGroup);

        infoArea.append("div")
            .attr("class", "rule-group-changer")
            .style("visibility", this.currIndex < this.groupCount - 1 ? "visible" : "hidden")
            .append("button")
            .attr("class", "rule-group-next")
            .text(">")
            .on('click', (e) => {
                e.stopPropagation();
                this.currIndex = Math.min(this.currIndex + 1, this.groupCount - 1);
                this.currGroup = Object.keys(this.options.ruleGroup)[this.currIndex];
                this.currRule = this.options.ruleGroup[this.currGroup];
                this.updateDisplay();
            });


        this.container.on('click', () => {
            this.update();
        });
    }

    updateDisplay() {
        this.container.remove();
        this.createControl();
    }

    update() {
        if (this.options.onChange) {
            this.options.onChange(this.currRule);
        }
    }
}