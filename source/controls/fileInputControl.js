import { Control } from "./control.js"

export class FileInputControl extends Control {
    constructor(selector, options) {
        super(selector, options);
        this.value = options.rangeInit || null;
        this.wrapper.classed('file-control', true);
    }

    createControl() {
        const container = this.wrapper;

        this.inputWrapper = container.append('div')
            .attr('class', 'file-input-control')
            .attr('id', this.options.id || null);

        const inputContainer = this.inputWrapper
            .append('div')
            .attr('class', 'file-input-container');

        this.fileInput = inputContainer
            .append('input')
            .attr('type', 'file')
            .attr('id', `${this.options.id}-file-input`)
            .attr('accept', this.options.type);

        this.fileInput
            .on('change', (event) => this.update(event));
    }

    update(event) {
        const file = event.target.files[0];
        if (file) {
            if (!file.name.endsWith(this.options.type)) {
                alert('Por favor escolha um arquivo ' + this.options.type);
                this.fileInput.node().value = null;
                return;
            }
            this.value = file;

            if (this.options.onChange) {
                this.options.onChange(file);
            }
        }
    }
}