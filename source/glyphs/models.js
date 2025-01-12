
const provincesPopulation = {
    Drenthe: 502051,
    Flevoland: 444701,
    Friesland: 659551,
    Gelderland: 2133708,
    Groningen: 596075,
    Limburg: 1128367,
    "North-Brabant": 2626210,
    "North-Holland": 2952622,
    Overijssel: 1184333,
    "South-Holland": 3804906,
    Utrecht: 1387643,
    Zeeland: 391124
};

const citiesPopulation = {
    "RECIFE": 1587707,
    "JABOATAO DOS GUARARAPES": 683285,
    "PETROLINA": 414083,
    "CARUARU": 402290,
    "OLINDA": 365402,
    "PAULISTA": 362960,
    "CABO DE SANTO AGOSTINHO": 216969,
    "CAMARAGIBE": 155771,
    "GARANHUNS": 151064,
    "VITORIA DE SANTO ANTAO": 143799,
    "IGARASSU": 122312,
    "SAO LOURENCO DA MATA": 117759,
    "IPOJUCA": 105638,
    "SANTA CRUZ DO CAPIBARIBE": 104277,
    "ABREU E LIMA": 103945,
    "SERRA TALHADA": 98143,
    "GRAVATA": 91887,
    "ARARIPINA": 90104,
    "GOIANA": 85160,
    "BELO JARDIM": 83647,
    "CARPINA": 83205,
    "ARCOVERDE": 82003,
    "OURICURI": 68329,
    "SURUBIM": 67515,
    "SALGUEIRO": 65635,
    "PESQUEIRA": 65408,
    "BEZERROS": 64809,
    "ESCADA": 62252,
    "PAUDALHO": 59638,
    "LIMOEIRO": 59125,
    "MORENO": 57647,
    "PALMARES": 56615,
    "BUIQUE": 54425,
    "SAO BENTO DO UNA": 51264,
    "BREJO DA MADRE DE DEUS": 51107,
    "TIMBAUBA": 47575,
    "BOM CONSELHO": 46192,
    "AGUAS BELAS": 43713,
    "TORITAMA": 43636,
    "SANTA MARIA DA BOA VISTA": 42682,
    "AFOGADOS DA INGAZEIRA": 42407,
    "BARREIROS": 42056,
    "LAJEDO": 41786,
    "CUSTODIA": 39403,
    "BOM JARDIM": 39278,
    "SIRINHAEM": 39233,
    "BONITO": 39163,
    "SAO CAITANO": 39117,
    "ALIANCA": 37372,
    "SAO JOSE DO BELMONTE": 36752,
    "ITAMBE": 36626,
    "BODOCO": 36129,
    "PETROLANDIA": 35991,
    "SERTANIA": 34269,
    "RIBEIRAO": 34255,
    "ITAIBA": 33691,
    "EXU": 33436,
    "CATENDE": 33279,
    "SAO JOSE DO EGITO": 32491,
    "NAZARE DA MATA": 32153,
    "TRINDADE": 32086,
    "CABROBO": 31746,
    "FLORESTA": 31627,
    "IPUBI": 30603,
    "CAETES": 30441,
    "GLORIA DO GOITA": 30370,
    "PASSIRA": 29719,
    "ITAPISSUMA": 29463,
    "TABIRA": 29093,
    "JOAO ALFREDO": 28903,
    "IBIMIRIM": 28760,
    "INAJA": 27488,
    "VICENCIA": 27297,
    "AGUA PRETA": 27221,
    "TUPANATINGA": 27009,
    "POMBOS": 26847,
    "MANARI": 26773,
    "ILHA DE ITAMARACA": 25529,
    "TAQUARITINGA DO NORTE": 25497,
    "CONDADO": 25383,
    "CANHOTINHO": 25090,
    "LAGOA GRANDE": 24952,
    "TACARATU": 24803,
    "SAO JOAO": 24772,
    "MACAPARANA": 24624,
    "AGRESTINA": 24615,
    "TAMANDARE": 24534,
    "CUPIRA": 24301,
    "PEDRA": 23605,
    "PANELAS": 23449,
    "VERTENTES": 22955,
    "OROBO": 22438,
    "FEIRA NOVA": 22169,
    "RIACHO DAS ALMAS": 21411,
    "CHA GRANDE": 21224,
    "ALTINHO": 21185,
    "FLORES": 20835,
    "CACHOEIRINHA": 20612,
    "RIO FORMOSO": 20460,
    "SAO JOAQUIM DO MONTE": 20440,
    "ARACOIABA": 19936,
    "LAGOA DE ITAENGA": 19915,
    "CARNAIBA": 19513,
    "SAO JOSE DA COROA GRANDE": 19468,
    "AFRANIO": 19349,
    "PARNAMIRIM": 19028,
    "SANHARO": 18933,
    "CAPOEIRAS": 18890,
    "SERRITA": 18759,
    "BELEM DO SAO FRANCISCO": 18713,
    "LAGOA DO CARRO": 18708,
    "AMARAJI": 18471,
    "CAMOCIM DE SAO FELIX": 17991,
    "QUIPAPA": 17974,
    "GAMELEIRA": 17973,
    "DORMENTES": 17749,
    "CORRENTES": 17660,
    "VENTUROSA": 17609,
    "IATI": 17605,
    "SAO VICENTE FERRER": 17176,
    "ITAQUITINGA": 17109,
    "JATAUBA": 16323,
    "CUMARU": 16252,
    "JUPI": 15943,
    "FERREIROS": 15794,
    "TRIUNFO": 15142,
    "MIRANDIBA": 14599,
    "SANTA MARIA DO CAMBUCA": 14533,
    "JATOBA": 14463,
    "TRACUNHAEM": 17393,
    "LAGOA DOS GATOS": 14386,
    "ALAGOINHA": 14335,
    "PRIMAVERA": 14351,
    "SANTA CRUZ": 14320,
    "TACAIMBO": 14277,
    "ITAPETIM": 14232,
    "SALOA": 14173,
    "OROCO": 14100,
    "FREI MIGUELINHO": 14070,
    "JUREMA": 14027,
    "JOAQUIM NABUCO": 13503,
    "CASINHAS": 13489,
    "SAO BENEDITO DO SUL": 13479,
    "CHA DE ALEGRIA": 13431,
    "BUENOS AIRES": 13254,
    "PARANATAMA": 12712,
    "CARNAUBEIRA DA PENHA": 12682,
    "BARRA DE GUABIRABA": 12616,
    "SANTA FILOMENA": 12402,
    "LAGOA DO OURO": 12364,
    "BETANIA": 11981,
    "JUCATI": 11975,
    "SANTA CRUZ DA BAIXA VERDE": 11933,
    "XEXEU": 11791,
    "MACHADOS": 11471,
    "CALCADO": 11445,
    "IGUARACY": 11366,
    "SAIRE": 11218,
    "MOREILANDIA": 10849,
    "CEDRO": 10845,
    "BELEM DE MARIA": 10829,
    "POCAO": 10805,
    "ANGELIM": 10580,
    "SANTA TEREZINHA": 10513,
    "CORTES": 10512,
    "JAQUEIRA": 10483,
    "VERDEJANTE": 9474,
    "MARAIAL": 9432,
    "BREJAO": 9399,
    "TERRA NOVA": 9221,
    "TUPARETAMA": 8252,
    "BREJINHO": 8010,
    "CAMUTANGA": 7972,
    "VERTENTE DO LERIO": 7782,
    "IBIRAJUBA": 7344,
    "GRANITO": 7206,
    "PALMEIRINA": 7151,
    "TEREZINHA": 6857,
    "QUIXABA": 6755,
    "SALGADINHO": 5620,
    "SOLIDAO": 5403,
    "CALUMBI": 5367,
    "INGAZEIRA": 4959,
    "ITACURUBA": 4490,
    "FERNANDO DE NORONHA": 3316
}

export function getPopulModel(data) {
    var averages = {};
    var totalPop = 0;
    var model = {};
    //calcula as somas de cada categoria
    for (const key in data) {
        totalPop += citiesPopulation[key];
        for (const key2 in data[key]) {
            var attrLength = data[key][key2].length
            if (averages[key2] == undefined)
                averages[key2] = Array(attrLength).fill(0);

            for (let i = 0; i < attrLength; i++) {
                averages[key2][i] += data[key][key2][i];
            }
        }
    }

    //divide as somas pela população de cada provincia
    for (const key in data) {
        model[key] = {};
        for (const key2 in data[key]) {
            model[key][key2] = [];
            for (let i = 0; i < attrLength; i++) {
                model[key][key2].push(averages[key2][i] * citiesPopulation[key] / totalPop);
            }
        }
    }

    return model;
}

export function getAverageModel(data) {
    var averages = {};
    
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