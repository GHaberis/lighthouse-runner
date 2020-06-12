const nums = [1, 2, 3];

let index = 0;

/**
 * An iterator is an object that exposes a next() function
 * which returns an object { value, done }. 
 * The value property is the next value in the sequence, 
 * and the done property is a boolean that is true if there 
 * are no more values in the sequence.
 */
const iterator = {
    next: () => {
        if (index >= nums.length) {
            return {
                done: true
            };
        }

        const value = nums[index++];
        
        return {
            value,
            done: false
        };
    }
};

/**
 * By itself, an iterator isn't very useful. 
 * In order to use an iterator with a for/of loop, you need an iterable. 
 * An iterable is an object with a Symbol.iterator function that returns 
 * an iterator.
 */
const iterable = {
    [Symbol.iterator]: () => iterator
};

for (const v of iterable) {
    console.log(v); 
}