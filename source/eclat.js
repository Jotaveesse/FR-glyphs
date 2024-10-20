function eclat(transactions, minSupport) {
    const verticalDb = createVerticalFormat(transactions);
    const frequentItemsets = [];

    // Start recursive mining
    eclatRecursive([], verticalDb, minSupport, frequentItemsets);

    return frequentItemsets;
}

function eclatRecursive(prefix, verticalDb, minSupport, frequentItemsets) {
    for (const [item, tids] of Object.entries(verticalDb)) {
        const support = tids.length;
        if (support >= minSupport) {
            const newPrefix = [...prefix, item];
            frequentItemsets.push({ itemset: newPrefix, support });

            // Intersect tids to find larger itemsets
            const newVerticalDb = intersectTransactions(verticalDb, tids, item);
            eclatRecursive(newPrefix, newVerticalDb, minSupport, frequentItemsets);
        }
    }
}

// Function to create the vertical database
function createVerticalFormat(transactions) {
    const verticalDb = {};
    transactions.forEach((transaction, tid) => {
        transaction.forEach(item => {
            if (!verticalDb[item]) verticalDb[item] = [];
            verticalDb[item].push(tid);
        });
    });
    return verticalDb;
}

// Intersect transaction ID lists
function intersectTransactions(verticalDb, tids, currentItem) {
    const newVerticalDb = {};
    for (const [item, itemTids] of Object.entries(verticalDb)) {
        if (item !== currentItem) {
            const intersection = itemTids.filter(tid => tids.includes(tid));
            if (intersection.length > 0) {
                newVerticalDb[item] = intersection;
            }
        }
    }
    return newVerticalDb;
}
