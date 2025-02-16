export class Association {
    constructor() {
        this.patterns = [];
        this.rules = [];
    }

    generatePatterns(transactions, minSupport = 0) {
        throw new Error("Classe deve ter o metodo generatePatterns");
    }

    mergePatterns(otherTree) {
        throw new Error("Classe deve ter o metodo mergePatterns");
    }

    generateRules(minConfidence = 0, minLift = 0) {
        throw new Error("Classe deve ter o metodo generateRules");
    }
}

export class FPGrowth extends Association {
    constructor() {
        super();
        this.tree = new FPTree();
        this.transactionCount = 1;
    }

    generatePatterns(transactions, minSupport = 0) {
        this.transactionCount = transactions.length;
        this.tree.build(transactions, minSupport * this.transactionCount);
        this.patterns = this.tree.minePatterns();

        return this.patterns;
    }

    updatePatterns() {
        this.patterns = this.tree.minePatterns();
    }

    mergePatterns(otherFPGrowth, updatePatterns = true) {
        const newGrowth = new FPGrowth(null);
        var newTree = this.tree.merge(otherFPGrowth.tree);

        newGrowth.tree = newTree;
        newGrowth.transactionCount = this.transactionCount + otherFPGrowth.transactionCount;

        if (updatePatterns)
            newGrowth.patterns = newTree.minePatterns();

        return newGrowth;
    }

    generateRules(minConfidence = 0, minLift = 0) {
        this.rules = [];
        const supportCache = {};

        this.patterns.forEach(itemset => {
            if (itemset.length > 1) {

                const itemsetKey = itemset.join();

                //checa se o valor ja esta na cache
                if (!supportCache[itemsetKey])
                    supportCache[itemsetKey] = this.tree.getItemsetCount(itemset) ;

                const itemsetSupport = supportCache[itemsetKey]/ this.transactionCount;

                const { subsets: antecedents, remainings: consequents } = FPGrowth.getSubsets(itemset);

                antecedents.forEach((ante, i) => {
                    const anteKey = ante.join();

                    const cons = consequents[i];

                    if (!supportCache[anteKey])
                        supportCache[anteKey] = this.tree.getItemsetCount(ante) ;

                    const antecedentSupport = supportCache[anteKey]/ this.transactionCount;

                    const confidence = itemsetSupport / antecedentSupport;


                    if (confidence >= minConfidence) {
                        const consKey = cons.join();

                        if (!supportCache[consKey])
                            supportCache[consKey] = this.tree.getItemsetCount(cons);

                        const consequentSupport = supportCache[consKey]/ this.transactionCount;

                        const lift = confidence / consequentSupport;

                        if (lift >= minLift) {
                            const interestingness = FPGrowth.getInterestingness(
                                antecedentSupport, consequentSupport, itemsetSupport, confidence, lift,
                                ante.length, cons.length
                            );

                            this.rules.push({
                                antecedents: ante,
                                consequents: cons,
                                count: supportCache[itemsetKey],
                                support: itemsetSupport,
                                confidence: confidence,
                                lift: lift,
                                antecedentSupport: antecedentSupport,
                                consequentSupport: consequentSupport,
                                interestingness: interestingness
                            });
                        }
                    }
                });
            }
        });

        return this.rules;
    }

    static getInterestingness(anteSupport, consSupport, support, confidence, lift, anteLength, consLength) {
        const weights = {
            anteSupport: 0.8,
            consSupport: 0.8,
            support: 0.8,
            confidence: 0.8,
            lift: 3,
            anteLength: -0.1,
            consLength: -0.1
        };

        const linearCombination =
            weights.anteSupport * anteSupport +
            weights.consSupport * consSupport +
            weights.support * support +
            weights.confidence * confidence +
            weights.lift * (1 - 1 / lift) +
            weights.anteLength * anteLength +
            weights.consLength * consLength;

        // sigmoid pra deixar entre 0 e 1
        const interestingness = 2 / (1 + Math.exp(-linearCombination)) - 1;

        return interestingness; 
    }


    // gera todos os subconjuntos de um conjunto de itens
    static getSubsets(array) {
        let subsets = [];
        let remainings = [];
        let len = array.length;

        for (let i = 1; i < (1 << len) - 1; i++) {
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
}

class FPTree {
    constructor() {
        this.header = {};
        this.root = new FPNode(null);
        this.sortedKeys = [];
    }

    build(transactions, minFrequency = 0) {
        this.buildHeaderTable(transactions, minFrequency);
        this.buildTree(transactions);
    }

    buildTree(transactions) {
        this.root = new FPNode(null);

        transactions.forEach(transaction => {
            this.insertTransaction(transaction);
        });
    }

    buildHeaderTable(transactions, minFrequency = 0) {
        const frequencyMap = {};

        transactions.forEach(transaction => {
            if (transaction.path) {
                transaction.path.forEach(item => {
                    if (isEmpty(item)) return;
                    if (!frequencyMap[item]) {
                        frequencyMap[item] = 0;
                    }
                    frequencyMap[item] += transaction.count;
                });
            }
            else {
                transaction.forEach(item => {
                    if (isEmpty(item)) return;
                    if (!frequencyMap[item]) {
                        frequencyMap[item] = 0;
                    }
                    frequencyMap[item]++;
                });
            }
        });

        this.header = {};
        Object.keys(frequencyMap).forEach((item, i) => {
            if (frequencyMap[item] >= minFrequency) {
                this.header[item] = new FPHeaderNode(frequencyMap[item], null);
            }
        });

        this.sortedKeys = Object.keys(this.header).sort(
            (a, b) => this.header[a].count - this.header[b].count
        );
    }

    insertTransaction(transaction, amount = 1) {
        if (transaction.length === 0) return;

        const filteredTransaction = transaction
            .filter(item => this.header[item]) //fitlra os items não frequentes
            .sort((a, b) => {
                const countDifference = this.header[b].count - this.header[a].count;

                // ordena alfabeticamente se estiverem empatados
                if (countDifference === 0) {
                    return a.localeCompare(b);
                }

                return countDifference;
            });

        let currentNode = this.root;

        for (let item of filteredTransaction) {
            if (!currentNode.children[item]) {
                let newNode = currentNode.insert(item, amount);

                this.header[item].insert(newNode);
            }
            else {
                currentNode.children[item].increment(amount);
            }

            currentNode = currentNode.children[item];
        }
    }

    merge(otherTree) {
        const thisPath = this.getAllPaths();
        const otherPath = otherTree.getAllPaths();
        const mergedPath = thisPath.concat(otherPath);

        const newTree = new FPTree();

        newTree.buildHeaderTable(mergedPath);

        for (const { path, count } of mergedPath) {
            newTree.insertTransaction(path, count);
        }

        return newTree;
    }

    minePatterns(suffix = []) {
        const frequentPatterns = [];

        const items = this.sortedKeys;

        items.forEach(item => {
            if (isEmpty(item)) return;

            const newPattern = [item, ...suffix];
            frequentPatterns.push(newPattern);

            const conditionalPatternBase = this.header[item].getConditionalPatternBase();

            const condition = new FPTree();
            condition.build(conditionalPatternBase);

            if (Object.keys(condition.header).length > 0) {
                const newPatterns = condition.minePatterns(newPattern);
                frequentPatterns.push(...newPatterns);
            }
        });

        return frequentPatterns;
    }

    getAllPaths() {
        return this.root.getPaths();
    }

    getItemsetCount(itemset) {
        let supportCount = 0;
        //ordena itemset pela frequencia dos items
        itemset = itemset.sort((a, b) => {
            const countDifference = this.header[b].count - this.header[a].count;

            // ordena alfabeticamente se estiverem empatados
            if (countDifference === 0) {
                return a.localeCompare(b);
            }

            return countDifference;
        });

        const lastItem = itemset[itemset.length - 1];

        let currentNode = this.header[lastItem].head;

        while (currentNode !== null && currentNode !== undefined) {
            if (currentNode.isPathContainsItemset(itemset)) {
                supportCount += currentNode.count;
            }
            currentNode = currentNode.link;
        }

        return supportCount;
    }
}

class FPHeaderNode {
    constructor(count, head) {
        this.count = count;
        this.head = head;
    }

    insert(newNode) {
        if (!this.head) {
            this.head = newNode;
        } else {
            let current = this.head;
            while (current.link) {
                current = current.link;
            }
            current.link = newNode;
        }
    }

    getConditionalPatternBase() {
        const patterns = [];
        var node = this.head;

        while (node) {
            const path = [];
            let parent = node.parent;
            while (parent && parent.item !== null) {
                path.push(parent.item);
                parent = parent.parent;
            }

            for (let i = 0; i < node.count; i++) {
                if (path.length > 0)
                    patterns.push(path);
            }

            node = node.link;
        }

        return patterns;
    }
}

class FPNode {
    /**
     * @param {string} item - Nome do item
     * @param {FPNode} parent - Pai do nó
     */
    constructor(item, parent = null) {
        this.item = item;
        this.count = 0;
        this.parent = parent;
        this.children = {};
        this.link = null;
    }
    /**
     * @param {number} amount - Quantidade para incrementar
     */
    increment(amount = 1) {
        this.count += amount;
    }

    insert(item, amount = 1) {
        let newNode = new FPNode(item, this);
        newNode.increment(amount);
        this.children[item] = newNode;

        return newNode;
    }

    getPaths(path = [], pathsWithCounts = []) {
        if (this.item !== null) { //nao adiciona o primeiro nó
            path.push(this.item);
        }

        if (Object.keys(this.children).length === 0) {
            pathsWithCounts.push({ path: [...path], count: this.count });
        } else {
            let childCount = 0;
            for (let child of Object.values(this.children)) {
                child.getPaths(path, pathsWithCounts);
                childCount += child.count;
            }

            if (childCount < this.count) {
                pathsWithCounts.push({ path: [...path], count: this.count - childCount }); // Add a copy of the path with its count
            }
        }

        path.pop();
        return pathsWithCounts;
    }

    isPathContainsItemset(itemsToFind) {
        let currentNode = this;
        var itemsLeft = itemsToFind.length;

        while (currentNode !== null && currentNode !== undefined && itemsLeft > 0) {
            if (itemsToFind[itemsLeft - 1] == currentNode.item) {
                itemsLeft -= 1;
            }
            currentNode = currentNode.parent;
        }

        return itemsLeft === 0;
    }
}

export function isEmpty(string) {
    const regex = /^_\d+$/;

    return regex.test(string);
}