import {Control} from "./control.js"

export class MultiBoxControl extends Control {
    constructor(element, options = {}) {
        super(element, options);
        let defaults = {
            placeholder: 'Select item(s)',
            max: null,
            search: true,
            selectAll: true,
            listAll: true,
            closeListOnItemSelect: false,
            name: '',
            width: '',
            height: '',
            dropdownWidth: '',
            dropdownHeight: '',
            data: [],
            onChange: function () { },
            onSelect: function () { },
            onUnselect: function () { }
        };
        this.options = Object.assign(defaults, options);

        this.wrapper.classed('multibox-control', true);

    }

    createControl() {
        this.selectElement = this.wrapper.node();
        for (const prop in this.selectElement.dataset) {
            if (this.options[prop] !== undefined) {
                this.options[prop] = this.selectElement.dataset[prop];
            }
        }
        this.name = this.selectElement.getAttribute('name') ? this.selectElement.getAttribute('name') : 'multi-select-' + Math.floor(Math.random() * 1000000);

        if (!this.options.data.length) {
            let options = this.selectElement.querySelectorAll('option');
            for (let i = 0; i < options.length; i++) {
                this.options.data.push({
                    value: options[i].value,
                    text: options[i].innerHTML,
                    selected: options[i].selected,
                    html: options[i].getAttribute('data-html')
                });
            }
        }

        this.element = this._template();
        this.selectElement.append(this.element);
        this._updateSelected();
        this._eventHandlers();
    }

    addDefaultOptions() {
        this.addOptions(this.options.data);
    }

    removeAllOptions() {
        const options = this.element.querySelectorAll(".multi-select-option");
        options.forEach(option => {
            option.remove();
        });
    }

    addOptions(optionsData) {
        this.options.data = optionsData;
        this.updateOptions(optionsData);
        this._eventHandlers();
        this._updateSelected();
    }

    updateOptions(data) {
        // Update the options by binding data to existing elements
        const options = this.optionsContainer.selectAll('.multi-select-option')
            .data(data, d => d.value);  // Using 'd.value' as the unique key to track each option

        // ENTER: Add new options
        options.enter()
            .append('div')
            .attr('class', d => `multi-select-option${this.selectedValues.includes(d.value) ? ' multi-select-selected' : ''}`)
            .attr('data-value', d => d.value)
            .each(function (d) {
                // Append the first span
                d3.select(this).append('span')
                    .attr('class', 'multi-select-option-radio');

                // Append the second span
                d3.select(this).append('span')
                    .attr('class', 'multi-select-option-text')
                    .text(d.html ? d.html : d.text);
            });

        // UPDATE: Update existing options if needed
        options
            .attr('class', d => `multi-select-option${this.selectedValues.includes(d.value) ? ' multi-select-selected' : ''}`)
            .attr('data-value', d => d.value)
            .select('.multi-select-option-text')
            .text(d => d.html ? d.html : d.text);

        // EXIT: Remove options that are no longer in the data
        options.exit().remove();

        // Handle "Select all" logic dynamically
        const selectAllOption = this.optionsContainer.selectAll('.multi-select-all')
            .data(this.options.selectAll === true || this.options.selectAll === 'true' ? [true] : []); // Ensure it's conditional

        d3.select(this.element) // Select the parent element
            .selectAll('.multi-select-header-option') // Select all elements with the class `.multi-select-header-option`
            .remove();

        selectAllOption.exit().remove();
    }

    _template() {
        let element = d3.select(document.createElement('div'));
        let template = element.append('div');

        // Set up the main container and style
        template.attr('class', `multi-select ${this.name}`)
            .style('width', this.width ? this.width : null)
            .style('height', this.height ? this.height : null)
            .attr('id', this.selectElement.id || null);

        // Add hidden inputs for selected values
        this.selectedValues.forEach(value => {
            template.append('input')
                .attr('type', 'hidden')
                .attr('name', `${this.name}[]`)
                .attr('value', value);
        });

        // Add the header
        const header = template.append('div')
            .attr('class', 'multi-select-header')
            .style('width', this.width ? this.width : null)
            .style('height', this.height ? this.height : null);

        header.append('span')
            .attr('class', 'multi-select-header-max')
            .text(this.options.max ? `${this.selectedValues.length}/${this.options.max}` : '');

        header.append('span')
            .attr('class', 'multi-select-header-placeholder')
            .text(this.placeholder);

        // Add options container
        this.optionsContainer = template.append('div')
            .attr('class', 'multi-select-options')
            .style('width', this.options.dropdownWidth ? this.options.dropdownWidth : null)
            .style('height', this.options.dropdownHeight ? this.options.dropdownHeight : null);

        // Add search input if applicable
        if (this.options.search === true || this.options.search === 'true') {
            this.optionsContainer.append('input')
                .attr('type', 'text')
                .attr('class', 'multi-select-search')
                .attr('placeholder', 'Search...');
        }

        this.updateOptions(this.data)

        return element.node();
    }

    _eventHandlers() {
        let headerElement = this.element.querySelector('.multi-select-header');
        this.element.querySelectorAll('.multi-select-option').forEach(option => {
            option.onclick = () => {
                let selected = true;
                if (!option.classList.contains('multi-select-selected')) {
                    if (this.options.max && this.selectedValues.length >= this.options.max) {
                        return;
                    }
                    option.classList.add('multi-select-selected');
                    if (this.options.listAll === true || this.options.listAll === 'true') {
                        if (this.element.querySelector('.multi-select-header-option')) {
                            let opt = Array.from(this.element.querySelectorAll('.multi-select-header-option')).pop();
                            opt.insertAdjacentHTML('afterend', `<span class="multi-select-header-option" data-value="${option.dataset.value}">${option.querySelector('.multi-select-option-text').innerHTML}</span>`);
                        } else {
                            headerElement.insertAdjacentHTML('afterbegin', `<span class="multi-select-header-option" data-value="${option.dataset.value}">${option.querySelector('.multi-select-option-text').innerHTML}</span>`);
                        }
                    }
                    this.element.querySelector('.multi-select').insertAdjacentHTML('afterbegin', `<input type="hidden" name="${this.name}[]" value="${option.dataset.value}">`);
                    this.data.filter(data => data.value == option.dataset.value)[0].selected = true;
                } else {
                    option.classList.remove('multi-select-selected');
                    this.element.querySelectorAll('.multi-select-header-option').forEach(headerOption => headerOption.dataset.value == option.dataset.value ? headerOption.remove() : '');
                    this.element.querySelector(`input[value="${option.dataset.value}"]`).remove();
                    this.data.filter(data => data.value == option.dataset.value)[0].selected = false;
                    selected = false;
                }
                if (this.options.listAll === false || this.options.listAll === 'false') {
                    if (this.element.querySelector('.multi-select-header-option')) {
                        this.element.querySelector('.multi-select-header-option').remove();
                    }
                    headerElement.insertAdjacentHTML('afterbegin', `<span class="multi-select-header-option">${this.selectedValues.length} selected</span>`);
                }
                if (!this.element.querySelector('.multi-select-header-option')) {
                    headerElement.insertAdjacentHTML('afterbegin', `<span class="multi-select-header-placeholder">${this.placeholder}</span>`);
                } else if (this.element.querySelector('.multi-select-header-placeholder')) {
                    this.element.querySelector('.multi-select-header-placeholder').remove();
                }
                if (this.options.max) {
                    this.element.querySelector('.multi-select-header-max').innerHTML = this.selectedValues.length + '/' + this.options.max;
                }
                if (this.options.search === true || this.options.search === 'true') {
                    this.element.querySelector('.multi-select-search').value = '';
                }
                this.element.querySelectorAll('.multi-select-option').forEach(option => option.style.display = 'flex');
                if (this.options.closeListOnItemSelect === true || this.options.closeListOnItemSelect === 'true') {
                    headerElement.classList.remove('multi-select-header-active');
                }
                this.options.onChange(option.dataset.value, option.querySelector('.multi-select-option-text').innerHTML, option);
                if (selected) {
                    this.options.onSelect(option.dataset.value, option.querySelector('.multi-select-option-text').innerHTML, option);
                } else {
                    this.options.onUnselect(option.dataset.value, option.querySelector('.multi-select-option-text').innerHTML, option);
                }
            };
        });
        headerElement.onclick = () => headerElement.classList.toggle('multi-select-header-active');
        if (this.options.search === true || this.options.search === 'true') {
            let search = this.element.querySelector('.multi-select-search');
            search.oninput = () => {
                this.element.querySelectorAll('.multi-select-option').forEach(option => {
                    option.style.display = option.querySelector('.multi-select-option-text').innerHTML.toLowerCase().indexOf(search.value.toLowerCase()) > -1 ? 'flex' : 'none';
                });
            };
        }
        if (this.options.selectAll === true || this.options.selectAll === 'true') {
            let selectAllButton = this.element.querySelector('.multi-select-all');
            selectAllButton.onclick = () => {
                let allSelected = selectAllButton.classList.contains('multi-select-selected');
                this.element.querySelectorAll('.multi-select-option').forEach(option => {
                    let dataItem = this.data.find(data => data.value == option.dataset.value);
                    if (dataItem && ((allSelected && dataItem.selected) || (!allSelected && !dataItem.selected))) {
                        option.click();
                    }
                });
                selectAllButton.classList.toggle('multi-select-selected');
            };
        }
        if (this.selectElement.id && document.querySelector('label[for="' + this.selectElement.id + '"]')) {
            document.querySelector('label[for="' + this.selectElement.id + '"]').onclick = () => {
                headerElement.classList.toggle('multi-select-header-active');
            };
        }
        document.addEventListener('click', event => {
            if (!event.target.closest('.' + this.name) && !event.target.closest('label[for="' + this.selectElement.id + '"]')) {
                headerElement.classList.remove('multi-select-header-active');
            }
        });
    }

    _updateSelected() {
        if (this.options.listAll === true || this.options.listAll === 'true') {
            this.element.querySelectorAll('.multi-select-option').forEach(option => {
                if (option.classList.contains('multi-select-selected')) {
                    this.element.querySelector('.multi-select-header').insertAdjacentHTML('afterbegin', `<span class="multi-select-header-option" data-value="${option.dataset.value}">${option.querySelector('.multi-select-option-text').innerHTML}</span>`);
                }
            });
        } else {
            if (this.selectedValues.length > 0) {
                this.element.querySelector('.multi-select-header').insertAdjacentHTML('afterbegin', `<span class="multi-select-header-option">${this.selectedValues.length} selected</span>`);
            }
        }
        if (this.element.querySelector('.multi-select-header-option')) {
            this.element.querySelector('.multi-select-header-placeholder').remove();
        }
    }

    get selectedValues() {
        return this.data.filter(data => data.selected).map(data => data.value);
    }

    get selectedItems() {
        return this.data.filter(data => data.selected);
    }

    set data(value) {
        this.options.data = value;
    }

    get data() {
        return this.options.data;
    }

    set selectElement(value) {
        this.options.selectElement = value;
    }

    get selectElement() {
        return this.options.selectElement;
    }

    set element(value) {
        this.options.element = value;
    }

    get element() {
        return this.options.element;
    }

    set placeholder(value) {
        this.options.placeholder = value;
    }

    get placeholder() {
        return this.options.placeholder;
    }

    set name(value) {
        this.options.name = value;
    }

    get name() {
        return this.options.name;
    }

    set width(value) {
        this.options.width = value;
    }

    get width() {
        return this.options.width;
    }

    set height(value) {
        this.options.height = value;
    }

    get height() {
        return this.options.height;
    }

}
document.querySelectorAll('[data-multi-select]').forEach(select => new MultiBoxControl(select));