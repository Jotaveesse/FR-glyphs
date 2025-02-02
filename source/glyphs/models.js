export function getAverageModel(data) {
    var totalAttrCount = 0;
    const attrCount = {};
    const groupAttrCount = {};
    const model = {};

    for (const groupKey in data) {
        if (groupAttrCount[groupKey] == undefined)
            groupAttrCount[groupKey] = 0;

        for (const attrKey in data[groupKey]) {
            const attrLength = data[groupKey][attrKey].length
            if (attrCount[attrKey] == undefined)
                attrCount[attrKey] = Array(attrLength).fill(0);

            for (let i = 0; i < attrLength; i++) {
                const count = data[groupKey][attrKey][i];;
                groupAttrCount[groupKey] += count
                totalAttrCount += count;
                attrCount[attrKey][i] += count;
            }
        }
    }

    for (const groupKey in data) {
        model[groupKey] = {};

        for (const attrKey in data[groupKey]) {
            const attrLength = data[groupKey][attrKey].length
            model[groupKey][attrKey] = [];
            
            for (let i = 0; i < attrLength; i++) {
                const globalAverage = attrCount[attrKey][i] / totalAttrCount;
                const groupCount = groupAttrCount[groupKey];
                model[groupKey][attrKey].push(globalAverage * groupCount);
            }
        }
    }

    return model;
}

export function getItemsByFrequencyGlobal(data) {
    const frequencyMap = {};

    for (const municipality in data) {
        const rules = data[municipality];

        for (const rule of rules) {
            // conta os antecedentes
            for (const antecedent of rule.antecedents) {
                if (!frequencyMap[antecedent]) {
                    frequencyMap[antecedent] = 0;
                }
                frequencyMap[antecedent]++;
            }

            // conta os consequentes
            for (const consequent of rule.consequents) {
                if (!frequencyMap[consequent]) {
                    frequencyMap[consequent] = 0;
                }
                frequencyMap[consequent]++;
            }
        }
    }

    // converte em uma array e ordena pela valor em ordem decrescente
    const sortedItems = Object.keys(frequencyMap).sort((a, b) => frequencyMap[b] - frequencyMap[a]);

    return sortedItems;
}

export function getItemsByFrequencyGrouped(rules) {
    const frequencyMap = {};

    for (const rule of rules) {
        // conta os antecedentes
        for (const antecedent of rule.antecedents) {
            if (!frequencyMap[antecedent]) {
                frequencyMap[antecedent] = 0;
            }
            frequencyMap[antecedent]++;
        }

        // conta os consequente
        for (const consequent of rule.consequents) {
            if (!frequencyMap[consequent]) {
                frequencyMap[consequent] = 0;
            }
            frequencyMap[consequent]++;
        }

    }

    return Object.keys(frequencyMap).sort((a, b) => frequencyMap[b] - frequencyMap[a]);
}

export function getItemsByInterestingnessGrouped(rules) {
    const interestingClasses = new Set();

    for (const rule of rules) {
        // conta os antecedentes
        for (const antecedent of rule.antecedents) {
            interestingClasses.add(antecedent);
        }

        // conta os consequente
        for (const consequent of rule.consequents) {
            interestingClasses.add(consequent);
        }
    }

    return interestingClasses;
}

export function getItemsBySurpriseGrouped(data) {
    let sortedEntries = data.sort((a, b) => b.value - a.value);

    return sortedEntries.map(entry => entry.name);
}

export function getItemsBySurpriseGlobal(data) {
    let summedValues = {};

    for (let city in data) {
        for (let entry of data[city]) {

            if (summedValues[entry.name]) {
                summedValues[entry.name] += entry.value;
            } else {
                summedValues[entry.name] = entry.value;
            }
        }
    }

    // converte em uma array e ordena pela valor em ordem decrescente
    let sortedNames = Object.keys(summedValues).sort((a, b) => summedValues[b] - summedValues[a]);

    return sortedNames;
}