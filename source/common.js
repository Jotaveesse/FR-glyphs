export async function readCsv(file) {
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

export function getSimilarity(str1, str2) {
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

export function findMostSimilar(target, array) {
    let maxSimilarity = 0;
    let mostSimilar = null;

    array.forEach(item => {
        const similarity = getSimilarity(target.toLowerCase(), item.toLowerCase());
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            mostSimilar = item;
        }
    });

    return mostSimilar;
}

export function isSubset(arr1, arr2) {
    return arr1.every(item => arr2.includes(item));
}

export function arraysHaveSameItems(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    return sorted1.every((item, index) => item === sorted2[index]);
}

export function getUniqueItems(data, columns = []) {
    const uniqueSets = {};

    data.forEach(row => {
        if (columns == []) {
            for (const key in row) {
                if (row[key] == undefined || row[key] == "")
                    return;

                const cell = row[key];

                if (uniqueSets[key] == undefined)
                    uniqueSets[key] = new Set();

                uniqueSets[key].add(cell);
            }
        }
        else {
            for (const key of columns) {
                if (row[key] == undefined || row[key] == "")
                    return;

                const cell = row[key];

                if (uniqueSets[key] == undefined)
                    uniqueSets[key] = new Set();

                uniqueSets[key].add(cell);
            }
        }
    });
    return uniqueSets;
}

export function storeObject(key, obj) {
    if (typeof obj === "object") {
        const serializedObject = JSON.stringify(obj, (key, value) => {
            if (value instanceof Set) {
                return { __type: "Set", values: Array.from(value) }; // Mark it as a Set
            }
            return value;
        });
        localStorage.setItem(key, serializedObject);
    } else {
        console.error("Não é um objeto");
    }
}

export function retrieveObject(key) {
    const serializedData = localStorage.getItem(key);
    if (serializedData) {
        return JSON.parse(serializedData, (key, value) => {
            if (value && value.__type === "Set") {
                return new Set(value.values); // Convert back to a Set
            }
            return value;
        });
    }
    return null;
}