function formatTimedelta(milliseconds) {
  let date = new Date(0);
  date.setSeconds(milliseconds / 1000);
  let str = date.toISOString().substr(11, 8);
  return str;
}


function time() {
    const [seconds, nanos] = process.hrtime();
    return seconds * 1000 + nanos / 1000000;
}


function isArray(array) {
  return Array.isArray(array);
}
function isObject(object) {
  return Object.prototype.toString.call(object) === '[object Object]';
}




function toCamelCase(string) {
  return string.replace(/([-_]\w)/g, g => g[1].toUpperCase());
}

function keysToCamelCase(object) {
  if(isObject(object)) {
    let newObj = {};
    for(let [key, value] of Object.entries(object)) {
      newObj[toCamelCase(key)] = keysToCamelCase(value);
    }
    return newObj;

  } else if(isArray(object)) {
    return object.map(item => {
      return keysToCamelCase(item);
    });
  }

  return object;
}



module.exports = {
  formatTimedelta,
  time,
  isArray,
  isObject,
  toCamelCase,
  keysToCamelCase,
}
