function apriori(transactions, minSupport) {
    let frequentItemsets = [];
    let itemsets = generateInitialItemsets(transactions);

    while (itemsets.length > 0) {
        let frequent = filterFrequentItemsets(itemsets, transactions, minSupport);
        frequentItemsets = frequentItemsets.concat(frequent);

        itemsets = generateNextItemsets(frequent);
    }

    return frequentItemsets;
}

function generateInitialItemsets(transactions) {
    let itemsets = [];
    let items = new Set();

    transactions.forEach(transaction => {
        transaction.forEach(item => items.add(item));
    });

    items.forEach(item => {
        itemsets.push([item]);
    });

    return itemsets;
}

function filterFrequentItemsets(itemsets, transactions, minSupport) {
    let itemsetCounts = new Map();
    transactions.forEach(transaction => {
        itemsets.forEach(itemset => {
            if (itemset.every(item => transaction.includes(item))) {
                const key = itemset.join(',');
                itemsetCounts.set(key, (itemsetCounts.get(key) || 0) + 1);
            }
        });
    });

    let frequentItemsets = [];
    for (let [key, count] of itemsetCounts) {
        if (count / transactions.length >= minSupport) {
            frequentItemsets.push(key.split(','));
        }
    }

    return frequentItemsets;
}

function generateNextItemsets(frequentItemsets) {
    let nextItemsets = [];
    let len = frequentItemsets.length;

    for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
            let first = frequentItemsets[i];
            let second = frequentItemsets[j];

            //checa se os rimeiros (k-1) itens sao iguais
            if (first.slice(0, -1).toString() === second.slice(0, -1).toString()) {
                nextItemsets.push([...first, second[second.length - 1]]);
            }
        }
    }

    return nextItemsets;
}

function generateAssociationRules(frequentItemsets, transactions, minConfidence, minLift) {
    let rules = [];

    frequentItemsets.forEach(itemset => {
        if (itemset.length > 1) {
            let subsets = getSubsets(itemset);

            subsets.forEach(subset => {
                let remaining = itemset.filter(item => !subset.includes(item));
                if (remaining.length > 0) {
                    let confidence = calculateConfidence(subset, remaining, transactions);
                    if (confidence >= minConfidence) {
                        let lift = calculateLift(subset, remaining, transactions);
                        let antecedentSupport = calculateSupport(subset, transactions);
                        let consequentSupport = calculateSupport(remaining, transactions);
                        if (lift >= minLift) {
                            rules.push({
                                antecedents: subset,
                                consequents: remaining,
                                confidence: confidence,
                                lift: lift,
                                antecedentSupport: antecedentSupport,
                                consequentSupport: consequentSupport
                            });
                        }
                    }
                }
            });
        }
    });

    return rules;
}

function calculateSupport(itemset, transactions) {
    let supportCount = 0;

    transactions.forEach(transaction => {
        if (itemset.every(item => transaction.includes(item))) {
            supportCount++;
        }
    });

    return supportCount / transactions.length;
}

function calculateConfidence(antecedents, consequents, transactions) {
    let antecedentSupport = 0;
    let bothSupport = 0;

    transactions.forEach(transaction => {
        if (antecedents.every(item => transaction.includes(item))) {
            antecedentSupport++;
            if (consequents.every(item => transaction.includes(item))) {
                bothSupport++;
            }
        }
    });

    return bothSupport / antecedentSupport;
}

// calcula o lift de uma regra
function calculateLift(antecedents, consequents, transactions) {
    let antecedentSupport = 0;
    let consequentSupport = 0;
    let bothSupport = 0;

    transactions.forEach(transaction => {
        if (antecedents.every(item => transaction.includes(item))) {
            antecedentSupport++;
        }
        if (consequents.every(item => transaction.includes(item))) {
            consequentSupport++;
        }
        if (antecedents.every(item => transaction.includes(item)) &&
        consequents.every(item => transaction.includes(item))) {
            bothSupport++;
        }
    });

    let totalTransactions = transactions.length;
    let supportA = antecedentSupport / totalTransactions;
    let supportB = consequentSupport / totalTransactions;
    let supportAB = bothSupport / totalTransactions;

    return supportAB / (supportA * supportB);
}

// gera todos os subconjuntos de um conjunto de itens
function getSubsets(array) {
    let subsets = [];
    let len = array.length;

    for (let i = 1; i < (1 << len); i++) {
        let subset = [];
        for (let j = 0; j < len; j++) {
            if (i & (1 << j)) {
                subset.push(array[j]);
            }
        }
        subsets.push(subset);
    }

    return subsets;
}

function getAssociations(transTables, minSupport, minConfidence, minLift) {
    var tablesRules = {};
    var freqItemsets = {};
    for (const tableKey in transTables) {  
        const table = transTables[tableKey];      
        freqItemsets[tableKey] = apriori(table, minSupport);
        tablesRules[tableKey] = generateAssociationRules(freqItemsets[tableKey] , table, minConfidence, minLift);
    }
  
    return [tablesRules, freqItemsets];
}