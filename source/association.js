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
    const itemsets = [];
    const items = new Set();

    transactions.forEach(transaction => {
        transaction.forEach(item => items.add(item));
    });

    items.forEach(item => {
        itemsets.push([item]);
    });

    return itemsets;
}

function filterFrequentItemsets(itemsets, transactionSets, minSupport) {
    const itemsetCounts = new Map();
    const totalTransactions = transactionSets.length;

    // Create a Set for each transaction for fast lookup

    transactionSets.forEach(transactionSet => {
        itemsets.forEach(itemset => {
            if (itemset.every(item => transactionSet.has(item))) {
                const key = itemset.join(',');
                itemsetCounts.set(key, (itemsetCounts.get(key) || 0) + 1);
            }
        });
    });

    const frequentItemsets = [];
    for (const [key, count] of itemsetCounts) {
        if (count / totalTransactions >= minSupport) {
            frequentItemsets.push(key.split(','));
        }
    }

    return frequentItemsets;
}

function generateNextItemsets(frequentItemsets) {
    const nextItemsets = [];
    const len = frequentItemsets.length;

    for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
            const first = frequentItemsets[i];
            const second = frequentItemsets[j];

            // Check if the first k-1 items are the same
            if (first.slice(0, -1).toString() === second.slice(0, -1).toString()) {
                nextItemsets.push([...first, second[second.length - 1]]);
            }
        }
    }

    return nextItemsets;
}

function generateAssociationRules(frequentItemsets, transactionSets, minConfidence, minLift) {
    const supports = {}; // Store supports for all itemsets

    // Precompute support for all frequent itemsets
    frequentItemsets.forEach(itemset => {
        supports[itemset.join(',')] = calculateSupport(itemset, transactionSets);
    });

    let rules = [];

    frequentItemsets.forEach(itemset => {
        if (itemset.length > 1) {
            let subsets = getSubsets(itemset);

            subsets.forEach(subset => {
                let remaining = itemset.filter(item => !subset.includes(item));
                if (remaining.length > 0) {
                    let confidence = calculateConfidence(subset, remaining, transactionSets, supports);
                    if (confidence >= minConfidence) {
                        let lift = calculateLift(subset, remaining, transactionSets, supports);
                        let antecedentSupport = supports[subset.join(',')];
                        let consequentSupport = supports[remaining.join(',')];

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
        if (itemset.every(item => transaction.has(item))) {
            supportCount++;
        }
    });

    return supportCount / transactions.length;
}

function calculateConfidence(antecedents, consequents, transactions, supports) {
    const antecedentSupport = supports[antecedents.join(',')];
    let bothSupport = 0;

    transactions.forEach(transaction => {
        if (antecedents.every(item => transaction.has(item)) && 
            consequents.every(item => transaction.has(item))) {
            bothSupport++;
        }
    });

    return bothSupport / transactions.length / antecedentSupport;
}

function calculateLift(antecedents, consequents, transactions, supports) {
    const antecedentSupport = supports[antecedents.join(',')];
    const consequentSupport = supports[consequents.join(',')];
    let bothSupport = 0;

    transactions.forEach(transaction => {
        if (antecedents.every(item => transaction.has(item)) && 
            consequents.every(item => transaction.has(item))) {
            bothSupport++;
        }
    });

    let supportA = antecedentSupport;
    let supportB = consequentSupport;
    let supportAB = bothSupport / transactions.length;

    return supportAB / (supportA * supportB);
}

function getSubsets(array) {
    const subsets = [];
    const len = array.length;

    for (let i = 1; i < (1 << len); i++) {
        const subset = [];
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