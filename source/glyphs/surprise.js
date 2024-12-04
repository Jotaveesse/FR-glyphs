export class Surprise {
  constructor() {
    this.models = [];
    this.frequencies = {};
    this.categSums = {};

    this.surprises = [];
    this.beliefs = {};
  }

  static merge(surp1, surp2) {
    const mergedSurprise = new Surprise();
    mergedSurprise.frequencies = Surprise.mergeFrequencies(surp1.frequencies, surp2.frequencies);
    mergedSurprise.models = Surprise.mergeModels(surp1.models, surp2.models);
    mergedSurprise.setCategSums(surp1.categSums);

    return mergedSurprise;
  }

  setCategSums(categSums) {
    this.categSums = categSums;
  }

  setFrequency(data) {
    const regex = /^_\d+$/;

    this.frequencies = {};

    for (let i = 0; i < data.length; i++) {
      const entry = data[i];

      for (const category in entry) {
        const value = entry[category];

        //incrementa a quantidade para esse valor, cria uma array de frequencias
        //caso tenham dados de varios anos
        if (!regex.test(value)) {
          if (!this.frequencies[value])
            this.frequencies[value] = [0];

          this.frequencies[value][0] += 1;
        }
      }
    }
  }

  setModels(models) {
    this.models = models;
  }

  generateSurprise() {
    var dataLength = 0;
    this.surprises = {};

    for (var categ in this.frequencies) {
      this.surprises[categ] = [];
      dataLength = this.frequencies[categ].length;

      for (var i = 0; i < dataLength; i++) {
        this.surprises[categ][i] = 0;
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

    this.beliefs = {};

    var pDMs = {};
    var pMDs = {};
    var total;
    //Bayesian surprise is the KL divergence from prior to posterior
    var kl;
    var diffs = Array(this.models.length).fill(0);
    var sumDiffs = Array(this.models.length).fill(0);

    for (var i = 0; i < dataLength; i++) {

      var keys = Object.keys(this.categSums);

      for (var categ of keys) {
        if (pMs[categ] == undefined) {
          pMs[categ] = Array(this.models.length).fill(1 / this.models.length);
        }
        if (pMDs[categ] == undefined) {
          pMDs[categ] = [];
        }
        if (pDMs[categ] == undefined) {
          pDMs[categ] = [];
        }
        if (this.beliefs[categ] == undefined) {
          this.beliefs[categ] = [structuredClone(pMs[categ])];
        }

        sumDiffs = Array(this.models.length).fill(0);
        diffs = Array(this.models.length).fill(0);

        total = this.categSums[categ][i];

        // total=1;
        //Calculate per state surprise

        //Estimate P(D|M) as 1 - |O - E|
        for (let modelInd = 0; modelInd < this.models.length; modelInd++) {
          var IO = 0;
          var EI = 0;
          if (this.frequencies[categ] != undefined)
            IO = this.frequencies[categ][i] / total;

          if (this.models[modelInd][categ] != undefined)
            EI = this.models[modelInd][categ][i] / total;

          diffs[modelInd] = IO - EI;
          // console.log(total, diffs[modelInd])


          pDMs[categ][modelInd] = 1 - Math.abs(diffs[modelInd]);

          pMDs[categ][modelInd] = pMs[categ][modelInd] * pDMs[categ][modelInd];
        }

        // Surprise is the sum of KL divergance across model space
        // Each model also gets a weighted "vote" on what the sign should be
        kl = 0;
        var voteSum = 0;

        for (var j = 0; j < this.models.length; j++) {
          //usa entropia relativa como calculo da distancia ( divergencia Kullback-Leibler)
          kl += pMDs[categ][j] * (Math.log(pMDs[categ][j] / pMs[categ][j]) / Math.log(2));
          voteSum += diffs[j] * pMs[categ][j];
          sumDiffs[j] += Math.abs(diffs[j]);
        }

        if (this.surprises[categ] == undefined) {
          this.surprises[categ] = [];
        }
        this.surprises[categ][i] = voteSum >= 0 ? Math.abs(kl) : -1 * Math.abs(kl);
      }

      //Now lets globally update our model belief.

      for (var j = 0; j < this.models.length; j++) {
        pDMs[categ][j] = 1 - (0.5 * sumDiffs[j]);
        pMDs[categ][j] = pMs[categ][j] * pDMs[categ][j];
        pMs[categ][j] = pMDs[categ][j];
      }

      //Normalize
      var sum = pMs[categ].reduce(function (a, b) { return a + b; }, 0);

      for (var j = 0; j < pMs[categ].length; j++) {
        pMs[categ][j] /= sum;
      }

      this.beliefs[categ].push(structuredClone(pMs[categ]))

    }
    this.surprises = Surprise.transformObjectToArray(this.surprises);


    return [this.surprises, this.beliefs];
  }

  static transformObjectToArray(data) {
    return Object.entries(data).map(([key, valueArray], index) => ({
      name: key,
      value: valueArray[0],
    }));
  }

  static mergeFrequencies(freq1, freq2) {
    const merged = {};

    for (const key in freq1) {
      if (freq2.hasOwnProperty(key)) {
        merged[key] = [freq1[key][0] + freq2[key][0]];
      } else {
        merged[key] = [...freq1[key]];
      }
    }

    for (const key in freq2) {
      if (!freq1.hasOwnProperty(key)) {
        merged[key] = [...freq2[key]];
      }
    }

    return merged;
  }

  static mergeModels(model1, model2) {
    const merged = [];

    for (let modelInd = 0; modelInd < model1.length; modelInd++) {
      merged[modelInd] = Surprise.mergeFrequencies(model1[modelInd], model2[modelInd]);
    }
    return merged;
  }
}