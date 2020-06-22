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

const getMedian = arr => {
    const mid = Math.floor(arr.length / 2);
    const nums = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

const getMedianRunResults = runResults => Object.keys(runResults).reduce((acc, key) => {
    return {
        [key]: getMedian(runResults[key]),
        ...acc
    };
}, {});

const auditMetrics = [
    'speed-index',
    'total-blocking-time',
    'interactive',
    // web vitals
    'max-potential-fid',
    'largest-contentful-paint',
    // 'cumulative-layout-shift'
];

const medianResultsPath = `results/median-results.json`;

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

// MEDIAN RESULTS
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

const saveTestResults = async (siteId, testResults) => {
    const runId = new Date().getTime();
    const medianResults = fs.existsSync(medianResultsPath) ? JSON.parse(fs.readFileSync(medianResultsPath)) : {};
    const runResults =  auditMetrics.reduce((acc, metric) => {
        return {
            ...acc,
            [metric]: []
        }
    }, {});
    const runResultsDir = `${siteId}/${runId}`;

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

            runResults[auditMetric].push(numericValue);
        });

        await fs.writeFile(
            `results/${runResultsDir}/${testId}.json`,
            json,
            err => {
                if (err) throw err;
            }
        );
    }

    if (medianResults[siteId]) {
        medianResults[siteId][runId] = getMedianRunResults(runResults);
    } else {
        medianResults[siteId] = {
            [runId]: getMedianRunResults(runResults)
        }
    }

    return fs.writeFile(
        medianResultsPath,
        JSON.stringify(medianResults, null, 4),
        err => {
            if (err) throw err;
        }
    );
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