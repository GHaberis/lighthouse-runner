/**
 * The difference between an async iterator and a conventional iterator 
 * is that, instead of returning a plain object { value, done }, \
 * an async iterator returns a promise that fulfills to { value, done }. 
 * Similarly, an async iterable is an object with Symbol.asyncIterator function 
 * that returns an async iterator.
 */
const nums = [1, 2, 3];

let index = 0;

const asyncIterator = {
    next: () => {
        if (index >= nums.length) {
            /**
             * A conventional iterator would return a `{ done: true }`
             * object. An async iterator returns a promise that resolves
             * to `{ done: true }`
             */
            return Promise.resolve({
                done: true
            });
        }

        const value = nums[index++];

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({
                    value,
                    done: false
                });
            }, 1000)
        })
    }
};

const asyncIterable = {
    /**
     * Note that async iterables use `Symbol.asyncIterator`, **not**
     * `Symbol.iterator`.
     */
    [Symbol.asyncIterator]: () => asyncIterator
};

const doSutin = async () => {
    for await (const value of asyncIterable) {
        console.log(value);
    }
}

doSutin();