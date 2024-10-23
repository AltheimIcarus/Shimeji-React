// UTILITY FUNCTIONS

// generate random integer between given range
export const randomMinMax = (min, max) => {
    return Math.floor( Math.random() * (max - min + 1) ) + min
}

// generate a new time out for shimeji action
export const generateTimeOutDuration = (min, max) => {
    return randomMinMax(min, max);
}

// generate a random shimeji action id
export const generateActionID = (id=0, min, max) => {
    let result = randomMinMax(min, max);
    while (result === id) {
        result = randomMinMax(min, max);
    }
    return result;
}

// generate move direction
export const generateMoveDirection = (previousDirection=null, positive, negative) => {
    if (!previousDirection) return (Math.random()>0.5)? negative : positive;
    // 0.8 probability of returning previous direction
    const probabilities = [previousDirection, previousDirection, previousDirection, previousDirection, (-1)*previousDirection];
    return probabilities[ Math.floor(Math.random() * probabilities.length) ];
}

// util function to mimic sleep()
export const sleep = async (timeMs) => {
    await new Promise(r => setTimeout(r, timeMs));
}

/**
 * function to determine if shimeji should fall from sky
 * @param {number} x    x coordinate of Shimeji
 * @param {number} y    y coordinate of Shimeji
 * @param {number} maxX    viewport maximum width (right) excluding scrollbar
 * @param {number} maxY    viewport maximum height (ground) excluding scrollbar
 * @param {number} width    width of Shimeji
 * @param {number} height    height of Shimeji
 */
export const shouldFall = (x, y, maxX, maxY, width, height) => {
    // not on left or right wall
    if ( (x > 0) && (x + width < maxX) ) {
        // not on ground
        return (y > 0) && (y + height < maxY);
    }
    return false;
}

/**
 * function to calculate the width of window's scrollbar
 * @returns {number} Window's scrollbar width in pixel
 */
export const getScrollbarWidth = () => {
    // Add temporary box to wrapper
    let scrollbox = document.createElement('div');

    // Make box scrollable
    scrollbox.style.overflow = 'scroll';

    // Append box to document
    document.body.appendChild(scrollbox);

    // Measure inner width of box
    let scrollBarWidth = scrollbox.offsetWidth - scrollbox.clientWidth;

    // Remove box
    document.body.removeChild(scrollbox);

    return (document.body.scrollHeight > document.body.clientHeight)? scrollBarWidth : 0;
}

export const roundTo = (number, decimalPlace) => {
    if (!Number.isSafeInteger(decimalPlace) || decimalPlace < 0) return null;
    if (decimalPlace === 0) return Math.round(number);
    return Math.round( (number * Number.EPSILON) * decimalPlace ) / decimalPlace;
}

/**
 * quadratic and kinematic equation to calculate parabolic trajectory
 * @param {number} x    x coordinate
 * @param {number} y    y coordinate
 * @param {number} power    initial push force
 * @param {number} angle    projection angle
 * @param {number} positivity   1 = to right, -1 = to left
 */
export const parabolicTrajectory = (x, y, power=25, angle=45, positivity=1) => {
    // angle = angle >= MIN_EXPLODE_ANGLE && angle <= MAX_EXPLODE_ANGLE? angle : (angle + MIN_EXPLODE_ANGLE) % MAX_EXPLODE_ANGLE;
    // power = power >= MIN_EXPLODE_POWER && power <= MAX_EXPLODE_POWER? power : (power + MIN_EXPLODE_POWER) % MAX_EXPLODE_POWER;
    positivity = positivity === 1? 1 : -1;

    let trajectories = [];
    const rad = angle * Math.PI / 180.0; // theta
    const GRAVITY = -9.81; // g acceleration
    let initialVelocity = {x: positivity * Math.sin(rad) * power, y: Math.cos(rad) * power}; // x: |V| cos theta, y: |V| cos theta

    const kinematicEquation = (acceleration, velocity, position, time) => {
        return 0.5 * acceleration * time * time + velocity * time + position;
    }

    // console.log(x, ': ', y);
    let newX = x * 1.0;
    let newY = y * 1.0;

    let time = 0.25;
    do {
        newX = roundTo(kinematicEquation(0, initialVelocity.x, x, time), 10);
        newY = y - ( roundTo(kinematicEquation(GRAVITY, initialVelocity.y, y, time), 10) - y );
        time += 0.25;
        trajectories.push({x: newX, y: newY});
    } while (newY < y);
    trajectories[trajectories.length-1].y = y;
    // console.log(trajectories[trajectories.length-1]);
    return trajectories;
}

export const bound = (origin, stretch, increment, maxVal, minVal=0) => {
    if (origin < minVal) {
        return minVal;
    }
    if (origin + stretch + increment > maxVal) {
        return maxVal - stretch;
    }
    return origin + increment;
};
export const onBound = (origin, stretch, maxBound, minBound=0) => {
    return origin === minBound || origin + stretch === maxBound;
}
export const onSkyBound = (y, skyBound=0) => {
    return y === skyBound;
}
export const onGroundBound = (bottom, groundBound) => {
    return bottom === groundBound;
}
export const debounce = (fn, ms) => {
    let timer = null;
    return (...args) => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
            fn(...args);
        }, ms);
    };
}

/**
 * Utility function to calculate distance rounded to zero decimal place
 * @param {number} x0   x coordinate of origin point
 * @param {number} x1   x coordinate of destination point
 * @param {number} y0   y coordinate of origin point
 * @param {number} y1   y coordinate of destination point
 */
export const distanceRounded = (x0, x1, y0, y1) => {
    let x = x0;
    let y = y0;
    x = Math.abs(x - x1);
    y = Math.abs(y - y1);
    x = x * x;
    y = y * y;
    return Math.floor( Math.sqrt(x + y) );
};

/**
 * JS Number = `MSB <- 1bit (Sign, 63) + 11bits (Exponent, 52-62) + 52bits (fraction/Mantissa, 0-51) <- LSB`
 * 
 * Eg.
 * ```
 * 85.125
 * = 1010101.001
 * = 1.010101001 x 2^6
 * sign = 0
 * exponent = 6 + 1023 = 1029 = 100 0000 0101
 * normalized mantissa = 0 1010 1001
 * Number = 0 10000000101 0101010010000000000000000000000000000000000000000000
 * = 01000000 01010101 01001000 00000000 00000000 00000000 00000000 00000000
 * = [  Float64     Uint8
 *      00000000    0
 *      00000000    0
 *      00000000    0
 *      00000000    0
 *      00000000    0
 *      01001000    72
 *      01010101    85
 *      01000000    64
 * ]
 * ```
 * @param {Number} val  JS Number value to be dismembered into IEEE754 integer representation
 * @returns {{sign: Number, biased_exponent: Number, exponent: Number, mantissa: Number}}   returns integer representation of each component of an IEEE754 number without decimal point.
*/
// export const float_64 = (val) => {
//     let asDouble = new Float64Array(1); // 8bytes per element = 64bits, create a new Float64Array of length = 1 to hold a 64bits float (similar to Number)
//     let asBytes = new Uint8Array(asDouble.buffer); // since asDouble only has 1 element of 8bytes (64bits), it can be represented as 8 * 1bytes (or 8 * 8bits) unsigned integer

//     asDouble[0] = val; // cast targetted val into double

//     // the bit in each byte of asBytes follow the exact bit order in the double casted val,
//     // but the bytes in asBytes is arranged from LSB = asBytes[0] to MSB = asBytes[7]
//     // hence:
//     // asBytes[7] = MSB <- sign (1bit) + 56-62 part of exponent (7bits) <- LSB
//     // asBytes[6] = MSB <- 52-55 part of exponent (4bits) + 48-51 part of mantissa (4bits) <- LSB
//     // right shifted the last bytes to get the first bit (sign) [x??? ????]
//     const sign = asBytes[7] >> 7;
    
//     // let P = (asBytes[7] & 0x7f) clears the sign bit from last byte as 0x7f = 0111 1111 and x OR 0 = 0,
//     // let Q = (P << 4) discard the MSB (left) 4bits and pushes the LSB to the left ???? 0000
//     // let R = (asBytes[6] >> 4) clears the last 4bits of mantissa = 0000 !!!!
//     // Q | R = ???? !!!! in flipped order = unbiased exponent part
//     // as exponent can be positive and negative, a bias is added to the stored exponent
//     const exponent = (asBytes[6] >> 4) | ((asBytes[7] & 0x7f) << 4);

//     // Notice that changing the asBytes is directly affecting the memory block pointed by asDouble as well
//     // Since mantissa has 52bits
//     // if we want to extract raw mantissa
//     // we would need to assume that the mantissa is a positive IEEE754 number = 0.(mantissa in binary) * 2^52
//     // = 0(positive) 100 0011 0011(1023+52) mantissa
//     // = [0100 0011](0x43) [0011 ....](0x3.) ...
//     // but mantissa is always implicitly leaded by a 1.0,
//     // so we have to deduct a 2^52 from the BigInt number result to get the actual integer representation (2n ** 52n)
//     // we use BigInt here to prevent buffer overflow
//     // hence:
//     asBytes[7] = 0x43; // 7:[0100 0000](64) => 7:[0100 0011](67)
//     asBytes[6] &= 0x0f; // clear 4bits from MSB (left), 6:[0101 0101](85) => 6:[0000 0101](5)
//     asBytes[6] |= 0x30; // set 4bits from MSB to 0x30, 6:[0000 0101](5) => 6:[0011 0101](53)

//     return {
//         sign: sign,
//         biased_exponent: exponent,
//         exponent: exponent - 1023, // - 0x3ff
//         mantissa: Number(BigInt(asDouble[0]) - 2n ** 52n) // OR: Number(asDouble) - (2 **52)
//     };
// };

/**
 * function to compare equality of two float numbers by breaking it down to mantissa, exponent, and sign
 * to compare the Unit in Last Place (ULP) difference of the integer representation of mantissa of the two number
 * 
 * @param {number} left    first float number to compare
 * @param {number} right    second float number to compare
 * @param {number} maxUlpDiff    maximum tolerance for unit of difference allowed 
 * @return {boolean}    true if equal, else false
 */
// const almostEqual = (left, right, maxUlpDiff=2) => {
//     let {s1, _1, e1, m1} = float_64(left);
//     let {s2, _2, e2, m2} = float_64(right);

//     if (s1 !== s2) {
//         if (left === right) return true; // 0 === -0 special case
//         return false; // different sign
//     }

//     let ulpDiff = Math.abs(m1 - m2);
//     if (e1 === e2 && ulpDiff <= maxUlpDiff) return true; // within permitted error tolerance
//     return false;
// }

/**
 * faa
 * @param {number} left    first float number to compare
 * @param {number} right    second float number to compare
 * @param {number} maxRelDiff    maximum tolerance for difference between two float numbers, default to Math.EPSILON
 * @return {boolean}    true if equal, else false
 */
// const relativeEqual = (left, right, maxRelDiff=Math.EPSILON) => {
//     let isAlmostEqual = almostEqual(left, right);
//     if (isAlmostEqual) return true;

//     let LHS = Math.abs(left);
//     let RHS = Math.abs(right);
//     const maxVal = RHS > LHS? RHS : LHS;

//     if (Math.abs(left - right) <= maxVal * maxRelDiff)
//         return true;

//     return false;
// }