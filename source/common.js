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
        const similarity = getSimilarity(target, item);
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            mostSimilar = item;
        }
    });

    return mostSimilar;
}
