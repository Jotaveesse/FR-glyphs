const RADIANS = 180 / Math.PI;
var map;

function loadMap() {
    map = L.map('map').setView([-15.793889, -47.882778], 4); // brasilia

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
        ext: 'png'
    }).addTo(map);

    L.control.scale().addTo(map);

    
    const menuButton = new L.Control.Button({
        position: 'topleft',
        text:'≡',
        onChange: function () {
            toggleMenu()
        }
    });

    menuButton.addTo(map);

    //coloca todos os glifos no tamanho normal,
    //para evitar que eles continuem grandes mesmo quando o mouse não está em cima
    map.on('zoomend', function () {
        const zoomLevel = map.getZoom();

        for (const groupKey in  glyphGroups) {
            const group = glyphGroups[groupKey];
            for (const glyphKey in group.glyphs) {
                const glyph = group.glyphs[glyphKey];
    
                glyph.hoverEnd();
            }
    
            group.clusterMarkers.forEach(function (marker) {
                const glyph = marker.glyph;
    
                glyph.hoverEnd();
    
            });
        }
    });
};

function projectPoint(map, lat, lon) {
    return map.latLngToLayerPoint(new L.LatLng(lat, lon));
}

async function readCsv(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            const csvData = e.target.result;  // Get the CSV data from the file
            Papa.parse(csvData, {
                header: true,
                complete: function (results) {
                    const dataObj = results.data;  // Get the first 1000 rows of data

                    resolve(dataObj);  // Resolve the Promise with the parsed data
                },
                error: function (error) {
                    reject(error);  // Reject the Promise if parsing fails
                }
            });
        };

        reader.onerror = function (error) {
            reject(error);  // Reject the Promise if file reading fails
        };

        reader.readAsText(file);
    });
}


function getSimilarity(str1, str2) {
    const bigrams = (str) => {
        const result = [];
        for (let i = 0; i < str.length - 1; i++) {
            result.push(str.slice(i, i + 2));
        }
        return result;
    };

    const bigrams1 = bigrams(str1);
    const bigrams2 = bigrams(str2);

    const intersection = bigrams1.filter(bigram => bigrams2.includes(bigram));
    return (2 * intersection.length) / (bigrams1.length + bigrams2.length);
}

function findMostSimilar(target, array) {
    let maxSimilarity = 0;
    let mostSimilar = null;

    array.forEach(item => {
        const similarity = getSimilarity(target, item);
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            mostSimilar = item;
        }
    });

    return mostSimilar;
}
