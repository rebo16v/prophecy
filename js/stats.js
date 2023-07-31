const pmean = arr => {
  const sum = arr.reduce((a, b) => a + b, 0);
  return (sum / arr.length);
};

const pstdev = arr => {
  const n = arr.length;
  const mean = arr.reduce((a, b) => a + b) / n;
  return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
};

const pmedian2 = arr => {
  const mid = Math.floor(arr.length / 2),
    nums = [...arr].sort((a, b) => a - b);
  return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

const pmedian = arr => {
  const midpoint = Math.floor(arr.length / 2);
  const median = arr.length % 2 === 1 ?
    arr[midpoint] : 
    (arr[midpoint - 1] + arr[midpoint]) / 2; 
  return median;
}

const pmode = arr => {
  let object = {}
  for (let i = 0; i < arr.length; i++) {
    if (object[arr[i]]) {
      object[arr[i]] += 1;
    } else {
      object[arr[i]] = 1;
    }
  }
  let biggestValue = -1;
  let biggestValuesKey = -1;
  Object.keys(object).forEach(key => {
    let value = object[key]
    if (value > biggestValue) {
      biggestValue = value
      biggestValuesKey = key
    }
  });
  return biggestValuesKey;
};
