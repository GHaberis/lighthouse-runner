const chromeLauncher = require('chrome-launcher');

exports.runTests = async testsToRun => {    
    const executeTestSequence = async (opts) => {
        function* generateTestSequence() {
            for (let i = 0; i <= (testsToRun.length -1); i++) {
                yield testsToRun[i](opts);
            }
        }

        const testResults = [];
        const testSequence = generateTestSequence();

        /**
         * for await takes each item from the testSequence 
         * array and waits for it to resolve
         */
        for await (let testResult of testSequence) {
            testResults.push(testResult);
        }

        return testResults;
    }

    const chrome = await chromeLauncher.launch();

    const opts = {
        port: chrome.port,
        onlyCategories: ['performance']
    };

    const results = await executeTestSequence(opts);

    await chrome.kill();

    return results;
}