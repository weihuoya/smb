
var operations = [];

exports.stackTrace = function() {
  var err = new Error();
  Error.captureStackTrace(err);
  var lines = err.stack.split("\n");
  lines.shift();
  return lines;
};

exports.add = function(sample) {
  if(operations.length > 1000) operations.shift();
  operations.push(sample);
};

exports.get = function() {
  return operations;
}