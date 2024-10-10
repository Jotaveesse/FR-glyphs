
var inputData = {};


fetch('data.csv')  // Use the relative or absolute path to your CSV file
  .then(response => response.text())  // Read the response as text
  .then(csvData => {

    Papa.parse(csvData, {
      header: true,  // This option automatically converts rows into objects based on the header row
      complete: function (results) {
        //console.log("uhh",  results.data);

        results.data.forEach(row => {
          inputData[row.State] = [];
          Object.keys(row).forEach((key, i) => {
            var cell = row[key];
            inputData[row.State][i] = parseFloat(cell);
          })
          inputData[row.State].pop()
        });

        results.data.forEach(row => {
          inputData[row.State] = { unemployement: [] };
          Object.keys(row).forEach((key, i) => {
            var cell = row[key];
            inputData[row.State].unemployement[i] = parseFloat(cell);
          })
          inputData[row.State].unemployement.pop()
        });

        // console.log(inputData)

        var models = [];
        models.push(getAverageModel(inputData));
        models.push(getYearModel(inputData, 17));
        models.push(getYearModel(inputData, 0));

        var [newSurprise, beliefs] = calcSurpriseNew(inputData, models);
        console.log("New surprise: ", newSurprise)
        console.log("New beliefs: ", beliefs)


        // var areEqual = JSON.stringify(oldSurprise) === JSON.stringify(newSurprise);
        // console.log("Equal: ", areEqual);
      }
    })
  })
  .catch(error => console.error('Error fetching the CSV file:', error));

function getYearModel(data, year) {
  var model = {};

  for (const key in data) {
    model[key] = {};

    for (const key2 in data[key]) {
      model[key][key2] = [];

      for (let i = 0; i < data[key][key2].length; i++) {
        model[key][key2].push(data[key][key2][year]);
      }

    }
  }

  // console.log("model", model)
  return model;
}

function getAverageModel(data) {
  var averages = {};

  var firstKey = Object.keys(data)[0];

  var model = {};

  for (const key in data) {
    for (const key2 in data[key]) {
      var attrLength = data[key][key2].length
      if (averages[key2] == undefined)
        averages[key2] = Array(attrLength).fill(0);

      for (let i = 0; i < attrLength; i++) {
        averages[key2][i] += data[key][key2][i];

      }
    }
  }

  for (const key in data) {
    model[key] = {};
    for (const key2 in data[key]) {
      model[key][key2] = [];
      for (let i = 0; i < attrLength; i++) {
        model[key][key2].push(averages[key2][i] / Object.keys(data).length)
      }
    }
  }

  // console.log("model",model)
  return model;
}

function calcSurpriseNew(data, models) {
  // console.log(data)
  var surpData = {};
  var dataLength = 0;

  for (var prop in data) {
    surpData[prop] = {};

    for (var prop2 in data[prop]) {
      surpData[prop][prop2] = [];
      dataLength = data[prop][prop2].length;

      for (var i = 0; i < dataLength; i++) {
        surpData[prop][prop2][i] = 0;
      }
    }
  }
  // Start with equiprobably P(M)s
  // For each year:
  // Calculate observed-expected
  // Estimate P(D|M)
  // Estimate P(M|D)
  // Surprise is D_KL ( P(M|D) || P(M) )
  // Normalize so sum P(M)s = 1

  //0 = uniform, 1 = boom, 2 = bust

  //Initially, everything is equiprobable.
  var pMs = {};

  var pMHistory = {};

  var pDMs = {};
  var pMDs = {};
  var total;
  //Bayesian surprise is the KL divergence from prior to posterior
  var kl;
  var diffs = Array(models.length).fill(0);
  var sumDiffs = Array(models.length).fill(0);

  for (var i = 0; i < dataLength; i++) {

    var keys = Object.keys(data);

    for (var prop2 in data[keys[0]]) {
      if (pMs[prop2] == undefined) {
        pMs[prop2] = Array(models.length).fill(1 / models.length);
      }
      if (pMDs[prop2] == undefined) {
        pMDs[prop2] = [];
      }
      if (pDMs[prop2] == undefined) {
        pDMs[prop2] = [];
      }
      if (pMHistory[prop2] == undefined) {
        pMHistory[prop2] = [structuredClone(pMs[prop2])];
      }


      sumDiffs = Array(models.length).fill(0);
      diffs = Array(models.length).fill(0);
      total = sumUNew(data, prop2, i);

      //Calculate per state surprise
      for (var prop in data) {

        //Estimate P(D|M) as 1 - |O - E|
        for (let modelInd = 0; modelInd < models.length; modelInd++) {
          var IO = 0;
          var EI = 0;
          if (data[prop][prop2] != undefined)
            IO = data[prop][prop2][i] / total;

          if (models[modelInd][prop][prop2] != undefined)
            EI = models[modelInd][prop][prop2][i];

          diffs[modelInd] = (IO - (EI / total));

          pDMs[prop2][modelInd] = 1 - Math.abs(diffs[modelInd]);

          pMDs[prop2][modelInd] = pMs[prop2][modelInd] * pDMs[prop2][modelInd];
        }


        // Surprise is the sum of KL divergance across model space
        // Each model also gets a weighted "vote" on what the sign should be
        kl = 0;
        var voteSum = 0;

        for (var j = 0; j < models.length; j++) {
          kl += pMDs[prop2][j] * (Math.log(pMDs[prop2][j] / pMs[prop2][j]) / Math.log(2));
          voteSum += diffs[j] * pMs[prop2][j];
          sumDiffs[j] += Math.abs(diffs[j]);
        }

        if(surpData[prop][prop2]==undefined){
          surpData[prop][prop2] = [];
        }
        surpData[prop][prop2][i] = voteSum >= 0 ? Math.abs(kl) : -1 * Math.abs(kl);
      }

      //Now lets globally update our model belief.

      for (var j = 0; j < models.length; j++) {
        pDMs[prop2][j] = 1 - (0.5 * sumDiffs[j]);
        pMDs[prop2][j] = pMs[prop2][j] * pDMs[prop2][j];
        pMs[prop2][j] = pMDs[prop2][j];
      }

      //Normalize
      var sum = pMs[prop2].reduce(function (a, b) { return a + b; }, 0);

      for (var j = 0; j < pMs[prop2].length; j++) {
        pMs[prop2][j] /= sum;
      }

      pMHistory[prop2].push(structuredClone(pMs[prop2]))
    }
  }

  return [surpData, pMHistory];
}



function averageNew(data, index) {
  //Average unemployement for the current year.
  var sum = 0;
  var n = 0;
  for (var prop in data) {
    sum += data[prop][index];
    n++;
  }
  return sum / n;
}

function sumUNew(data, key, index) {
  //Sum unemployement for the current year.
  var sum = 0;
  for (var prop in data) {
    if (data[prop][key] == undefined)
      continue
    sum += data[prop][key][index];
  }
  return sum;
}