const url = require('url');
const fs = require('fs');
const test = require('./test');
const testRunner = require('./testRunner');

const createTestResultsDirectory = dirName => {
    const resultDir = `results/${dirName}`;
    if (!fs.existsSync(resultDir)) {
        fs.mkdirSync(resultDir);
    }
}

const auditMetrics = [
    'speed-index',
    'total-blocking-time',
    'interactive',
    // web vitals
    'max-potential-fid',
    'largest-contentful-paint',
    // 'cumulative-layout-shift'
];

const aggregateResultsPath = `results/results.json`;

// const dateToString = fetchTime => {
//     const dateObj = fetchTime ? new Date(fetchTime) : new Date();
//     const month = dateObj.getMonth();
//     const year = dateObj.getFullYear();
//     const date = dateObj.getDate();
//     const hours = dateObj.getHours();
//     const minutes = dateObj.getMinutes();
//     const seconds = dateObj.getSeconds();

//     return `${year}-${month}-${date}_${hours}_${minutes}_${seconds}`;
// }

// FOLDER DATA STRUCTURE
// {
//     'uk-support': { // SITE ID
//         '6173783': { // RUN ID
//             '7237238': { // TEST ID
//                 'speed-index': 0,
//                 'total-blocking-time': 0,
//                 'interactive': 0,
//                 'max-potential-fid': 0,
//                 'largest-contentful-paint': 0,
//             },
//             '6262626': { // TEST ID
//                 'speed-index': 0,
//                 'total-blocking-time': 0,
//                 'interactive': 0,
//                 'max-potential-fid': 0,
//                 'largest-contentful-paint': 0,
//             },
//         }
//     }
// }

// AVERAGED RESULTS
// {
//     'uk-support': { // SITE ID
//         '6173783': { // RUN ID
//             'speed-index': 0,
//             'total-blocking-time': 0,
//             'interactive': 0,
//             'max-potential-fid': 0,
//             'largest-contentful-paint': 0,
//         },
//         '8173783': { // RUN ID
//             'speed-index': 0,
//             'total-blocking-time': 0,
//             'interactive': 0,
//             'max-potential-fid': 0,
//             'largest-contentful-paint': 0,
//         }
//     }
// }

const saveTestResults = async (dirName, testResults) => {
    // const runId = dateToString();
    // const resultsFilePath = `results/${dirName}/results.json`;
    // const aggregateResults = fs.existsSync(resultsFilePath) ? JSON.parse(fs.readFileSync(resultsFilePath)) : {};

    const runId = new Date().getTime();
    const aggregateResults = fs.existsSync(aggregateResultsPath) ? JSON.parse(fs.readFileSync(aggregateResultsPath)) : {};
    const averageResults =  auditMetrics.reduce((acc, metric) => {
        return {
            ...acc,
            [metric]: []
        }
    }, {});
    const runResultsDir = `${dirName}/${runId}`;

    createTestResultsDirectory(runResultsDir);

    for (const [index, testResult] of testResults.entries()) {
        const {
            js,
            json
        } = testResult;
        const parsedTestResult = JSON.parse(json);
        const testId = new Date(js.fetchTime).getTime();

        auditMetrics.forEach(auditMetric => {
            const {
                numericValue
            } = parsedTestResult.audits[auditMetric];

            averageResults[auditMetric].push(numericValue);
        });

        // if (!aggregateResultsPath[dirName]) {
        //     aggregateResultsPath[dirName] = {};
        // }

        // aggregateResultsPath[dirName][runId] = auditMetrics.reduce((acc, metric) =< {

        // }, {}

        // const parsedTestResult = JSON.parse(json);
        // const fileName = `${dateToString(js.fetchTime)}.json`;

        // auditMetrics.forEach(auditMetric => {
        //     const {
        //         description,
        //         numericUnit,
        //         numericValue
        //     } = parsedTestResult.audits[auditMetric];

        //     if (!aggregateResults[auditMetric]) {
        //         aggregateResults[auditMetric] = {
        //             runs: {
        //                 [runId]: {
        //                     results: [{
        //                         fileName,
        //                         numericValue
        //                     }]
        //                 }
        //             },
        //             numericUnit,
        //             description
        //         }
        //     } else {
        //         if (aggregateResults[auditMetric].runs[runId]) {
        //             aggregateResults[auditMetric].runs[runId].results.push({
        //                 fileName,
        //                 numericValue
        //             });
        //         } else {
        //             aggregateResults[auditMetric].runs[runId] = {
        //                 results: [{
        //                     fileName,
        //                     numericValue
        //                 }]
        //             }
        //         }
        //     }

        //     if (index === (testResults.length - 1)) {
        //         aggregateResults[auditMetric].runs[runId].averageValue = parseInt(aggregateResults[auditMetric].runs[runId].results.reduce((acc, result) => acc + result.numericValue, 0) / testResults.length, 10)
        //     }
        // });

        await fs.writeFile(
            `results/${dirName}/${runResultsDir}.json`,
            json,
            err => {
                if (err) throw err;
            }
        );
    }

    console.log('averageResults', averageResults);

    // return fs.writeFile(
    //     resultsFilePath,
    //     JSON.stringify(aggregateResults, null, 4),
    //     err => {
    //         if (err) throw err;
    //     }
    // );
}

const init = async () => {
    const baseUrl = 'https://support.theguardian.com';
    const routesToTest = [
        'uk/support',
        // 'https://support.theguardian.com/uk/subscribe',
        // 'https://support.theguardian.com/uk/subscribe/weekly',
        // 'https://support.theguardian.com/subscribe/weekly/checkout',
        // 'https://support.theguardian.com/uk/subscribe/digital',
        // 'https://support.theguardian.com/subscribe/digital/checkout',
        // 'https://support.theguardian.com/uk/subscribe/paper',
        // 'https://support.theguardian.com/subscribe/paper/checkout'
    ];
    const runCount = 3;

    for (const route of routesToTest) {
        const urlObj = new URL(`${baseUrl}/${route}`);
        const dirName = route.replace("/", "-");

        createTestResultsDirectory(dirName);

        const testsToRun = Array.from(Array(runCount), (_, index) => (opts) =>
            test.test(urlObj.href, opts)
        );

        const results = await testRunner.runTests(testsToRun);

        await saveTestResults(dirName, results);
    }
}

init().then(() => {
    console.log('Your test results are ready to review');
});