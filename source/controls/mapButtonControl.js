import { Control } from "./control.js"

L.Control.Button = L.Control.extend({
    initialize: function (options) {
        L.Control.prototype.initialize.call(this, options);
        this.options = options;
    },

    onAdd: function (map) {
        const div = L.DomUtil.create('div', 'leaflet-control map-button');

        div.innerHTML = `
            <button>${this.options.text}
            </button>
        `;

        //impede que o clique se propague para outros elementos
        L.DomEvent.disableClickPropagation(div);

        this.button = div.querySelector("button");

        L.DomEvent.on(this.button, 'click', this.update.bind(this));

        return div;
    },

    onRemove: function (map) {
    },


    update: function () {
        this.options.onChange();
    },
});