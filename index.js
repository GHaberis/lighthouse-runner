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
    'max-potential-fid'
];

const dateToString = fetchTime => {
    const dateObj = fetchTime ? new Date(fetchTime) : new Date();
    const month = dateObj.getMonth();
    const year = dateObj.getFullYear();
    const date = dateObj.getDate();
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const seconds = dateObj.getSeconds();

    return `${year}-${month}-${date}_${hours}_${minutes}_${seconds}`;
}

const saveTestResults = async (dirName, testResults) => {
    const aggregateResults = {};

    for (const [index, testResult] of testResults.entries()) {
        const {
            js,
            json
        } = testResult;
        const parsedTestResult = JSON.parse(json);
        const fileName = `${dateToString(js.fetchTime)}.json`;

        auditMetrics.forEach(auditMetric => {
            const {
                description,
                numericUnit,
                numericValue
            } = parsedTestResult.audits[auditMetric];

            if (!aggregateResults[auditMetric]) {
                aggregateResults[auditMetric] = {
                    results: [{
                        fileName,
                        numericValue
                    }],
                    numericUnit,
                    description
                }
            } else {
                aggregateResults[auditMetric].results.push({
                    fileName,
                    numericValue
                });
            }

            if (index === (testResults.length - 1)) {
                aggregateResults[auditMetric].averageValue = parseInt(aggregateResults[auditMetric].results.reduce((acc, result) => acc + result.numericValue, 0) / testResults.length, 10)
            }
        });

        await fs.writeFile(
            `results/${dirName}/${fileName}`,
            json,
            err => {
                if (err) throw err;
            }
        );
    }

    return fs.writeFile(
        `results/${dirName}/${dateToString()}-results.json`,
        JSON.stringify(aggregateResults, null, 4),
        err => {
            if (err) throw err;
        }
    );
}

const init = async () => {
    const testUrls = [
        'https://support.theguardian.com/uk/support',
        'https://support.theguardian.com/uk/subscribe',
        'https://support.theguardian.com/uk/subscribe/weekly',
        'https://support.theguardian.com/subscribe/weekly/checkout',
        'https://support.theguardian.com/uk/subscribe/digital',
        'https://support.theguardian.com/subscribe/digital/checkout',
        'https://support.theguardian.com/uk/subscribe/paper',
        'https://support.theguardian.com/subscribe/paper/checkout'
    ];
    const runCount = 10;

    for (const testUrl of testUrls) {
        const urlObj = new URL(testUrl);
        const dirName = urlObj.pathname.substr(1).replace("/", "-");

        createTestResultsDirectory(dirName);

        const testsToRun = Array.from(Array(runCount), (_, index) => (opts) =>
            test.test(testUrl, opts)
        );

        const results = await testRunner.runTests(testsToRun);

        await saveTestResults(dirName, results);
    }
}

init().then(() => {
    console.log('Your test results are ready to review');
});