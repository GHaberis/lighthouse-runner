const lighthouse = require('lighthouse');

exports.test = async (testUrl, opts) => {    
    const results = await lighthouse(testUrl, opts);

    return {
        js: results.lhr,
        json: results.report
    };
}