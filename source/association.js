
// FP-Tree Node Class
class FPNode {
    constructor(item, parent = null) {
        this.item = item;
        this.count = 1;
        this.parent = parent;
        this.children = {};
        this.link = null;
    }

    increment() {
        this.count += 1;
    }
}

// FP-Growth Algorithm Class
class FPGrowth {
    constructor(minSupport) {
        this.minSupport = minSupport;
        this.transCount = 1;
        this.frequentPatterns = [];
    }

    // Construct FP-Tree
    buildFPTree(transactions) {
        const headerTable = this.buildHeaderTable(transactions);
        const root = new FPNode(null); // Root of the FP-Tree

        transactions.forEach(transaction => {
            const filteredTransaction = transaction
                .filter(item => headerTable[item]) // Filter non-frequent items
                .sort((a, b) => headerTable[b].count - headerTable[a].count); // Sort items by frequency

            this.insertTransaction(root, filteredTransaction, headerTable);
        });

        return { root, headerTable };
    }

    // Build the header table
    buildHeaderTable(transactions) {
        const frequencyMap = {};

        // Count item frequencies
        transactions.forEach(transaction => {
            transaction.forEach(item => {
                if (item == "") return;
                if (!frequencyMap[item]) {
                    frequencyMap[item] = 0;
                }
                frequencyMap[item]++;
            });
        });

        // Remove items that do not meet the minimum support
        const headerTable = {};
        Object.keys(frequencyMap).forEach((item, i) => {
            if (frequencyMap[item] / this.transCount > this.minSupport) {
                headerTable[item] = { count: frequencyMap[item], index: i, head: null };
            }
        });

        return headerTable;
    }

    // Insert a transaction into the FP-Tree
    insertTransaction(root, transaction, headerTable) {
        if (transaction.length === 0) return;

        const firstItem = transaction[0];
        let childNode;

        if (!root.children[firstItem]) {
            childNode = new FPNode(firstItem, root);
            root.children[firstItem] = childNode;

            // Link the child node in the header table
            if (!headerTable[firstItem].head) {
                headerTable[firstItem].head = childNode;
            } else {
                let current = headerTable[firstItem].head;
                while (current.link) {
                    current = current.link;
                }
                current.link = childNode;
            }
        } else {
            childNode = root.children[firstItem];
            childNode.increment();
        }

        const remainingTransaction = transaction.slice(1);
        this.insertTransaction(childNode, remainingTransaction, headerTable);
    }

    // Mine the FP-Tree for frequent patterns
    mineTree(headerTable, suffix) {

        const items = Object.keys(headerTable).sort(
            (a, b) => headerTable[a].count - headerTable[b].count
        );

        items.forEach(item => {
            if (item == "") return;
            const newPattern = [item, ...suffix];
            this.frequentPatterns.push(newPattern);

            const conditionalPatternBase = this.findConditionalPatternBase(
                headerTable[item].head
            );


            const { root, headerTable: newHeaderTable } = this.buildFPTree(
                conditionalPatternBase
            );

            if (Object.keys(newHeaderTable).length > 0) {
                this.mineTree(newHeaderTable, newPattern);
            }
        });
    }

    // Find conditional pattern base
    findConditionalPatternBase(node) {
        const patterns = [];

        while (node) {
            const path = [];
            let parent = node.parent;
            while (parent && parent.item !== null) {
                path.push(parent.item);
                parent = parent.parent;
            }

            for (let i = 0; i < node.count; i++) {
                if (path.length > 0) patterns.push(path);
            }

            node = node.link;
        }

        return patterns;
    }

    // Run the FP-Growth algorithm
    run(transactions) {
        this.transCount = transactions.length;
        const sets = [];
        for (let index = 0; index < transactions.length; index++) {
            const element = transactions[index];
            sets[index] = [...element];
        }
        const { root, headerTable } = this.buildFPTree(sets);
        this.mineTree(headerTable, []);
        const patterns = this.frequentPatterns;
        // console.log(headerTable)
        // console.log(patterns)
        return { patterns: patterns, root: root, header: headerTable };
    }
}


function getItemsetCount(itemset, header) {
    // Start by finding the minimum support of the first item in the itemset
    let supportCount = 0;
    for (let index = 0; index < itemset.length; index++) {

        let firstItem = itemset[itemset.length - index - 1];
        let currentNode = header[firstItem].head;

        // Traverse the linked list for the first item to find all occurrences in the FP-tree
        while (currentNode !== null && currentNode !== undefined) {
            // Check if the current path in the tree matches the itemset
            if (isPathContainsItemset(currentNode, itemset)) {
                // If it does, add the count of this node to the support count
                supportCount += currentNode.count;
            }
            // Move to the next node in the linked list of this item
            currentNode = currentNode.link;
        }
    };

    return supportCount;
}


// Helper function to check if a path from a node contains the itemset in order
function isPathContainsItemset(node, itemset) {
    let itemsToFind = new Set(itemset);
    let currentNode = node;

    // Traverse up the tree from the node and check each item against the itemset
    while (currentNode !== null && currentNode !== undefined && itemsToFind.size > 0) {
        if (itemsToFind.has(currentNode.item)) {
            itemsToFind.delete(currentNode.item);
        }
        currentNode = currentNode.parent; // Move up the tree
    }

    // If itemsToFind is empty, it means we've found all items in the itemset along the path
    return itemsToFind.size === 0;
}

function generateAssociationRules(frequentItemsets, header, transactionLength, minConfidence = 0, minLift = 0) {
    const rules = [];
    const supportCache = {};

    frequentItemsets.forEach(itemset => {
        if (itemset.length > 1) {

            //checa se o valor ja esta na cache
            if (!supportCache[itemset])
                supportCache[itemset] = getItemsetCount(itemset, header) / transactionLength;

            const itemsetSupport = supportCache[itemset];

            const { subsets: antecedents, remainings: consequents } = getSubsets(itemset);

            antecedents.forEach((ante, i) => {
                const cons = consequents[i];

                if (!supportCache[ante])
                    supportCache[ante] = getItemsetCount(ante, header) / transactionLength;

                const antecedentSupport = supportCache[ante];

                const confidence = itemsetSupport / antecedentSupport;

                if (confidence >= minConfidence) {
                    if (!supportCache[cons])
                        supportCache[cons] = getItemsetCount(cons, header) / transactionLength;

                    const consequentSupport = supportCache[cons];

                    const lift = confidence / consequentSupport;

                    if (lift >= minLift) {

                        rules.push({
                            antecedents: ante,
                            consequents: cons,
                            confidence: confidence,
                            lift: lift,
                            antecedentSupport: antecedentSupport,
                            consequentSupport: consequentSupport
                        });

                    }

                }
            });
        }
    });

    return rules;
}

// gera todos os subconjuntos de um conjunto de itens
function getSubsets(array) {
    let subsets = [];
    let remainings = [];
    let len = array.length;

    for (let i = 1; i < (1 << len); i++) {
        let subset = [];
        let remaining = [];
        for (let j = 0; j < len; j++) {
            if (i & (1 << j)) {
                subset.push(array[j]);
            }
            else {
                remaining.push(array[j]);
            }
        }
        subsets.push(subset);
        remainings.push(remaining);
    }

    return { subsets: subsets, remainings: remainings };
}