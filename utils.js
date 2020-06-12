// baseline estimates, used to improve performance
var TX_EMPTY_SIZE = (4 + 1 + 1 + 4) * 2;  // Added buffer of 400 just in case
var TX_INPUT_BASE = (32 + 4 + 1 + 4) * 2; // Multiple by 2 to correctly account for bytes
var TX_INPUT_PUBKEYHASH = (107) * 2;
var TX_OUTPUT_BASE = (8 + 1) * 2;
var TX_OUTPUT_PUBKEYHASH = (25) * 2
var TX_DUST_THRESHOLD = 546;
function inputBytes (input) {
  return TX_INPUT_BASE + (input.script ? input.script.length : TX_INPUT_PUBKEYHASH)
}

function outputBytes (output) {
  return TX_OUTPUT_BASE + (output.script ? output.script.length / 2 : TX_OUTPUT_PUBKEYHASH)
}

function dustThreshold (output, feeRate) {
  /* ... classify the output for input estimate  */
  return TX_DUST_THRESHOLD;
}

function transactionBytes (inputs, outputs) {
  return TX_EMPTY_SIZE +
    inputs.reduce(function (a, x) { return a + inputBytes(x) }, 0) +
    outputs.reduce(function (a, x) { return a + outputBytes(x) }, 0)
}

function uintOrNaN (v) {
  if (typeof v !== 'number') return NaN
  if (!isFinite(v)) return NaN
  if (Math.floor(v) !== v) return NaN
  if (v < 0) return NaN
  return v
}

function numberOrNaN(v) {
  if (typeof v !== 'number') return NaN
  return v;
}

function sumForgiving (range) {
  return range.reduce(function (a, x) { return a + (isFinite(x.value) ? x.value : 0) }, 0)
}

function sumOrNaN (range) {
  return range.reduce(function (a, x) { return a + uintOrNaN(x.value) }, 0)
}

var BLANK_OUTPUT = outputBytes({})

function addRequiredInputs(inputs) {
  let requiredInputs = [];
  let nonRequiredInputs = [];
  let bytesAccum = 0;
  let inAccum = 0;
  for (const input of inputs) {
    if (input.required) {
      requiredInputs.push(input);
      var utxoBytes = inputBytes(input)
      var utxoValue = uintOrNaN(input.value)
      bytesAccum += utxoBytes
      inAccum += utxoValue
    } else {
      nonRequiredInputs.push(input);
    }
  }

  return {
    bytesAccum: bytesAccum,
    requiredInputs: requiredInputs,
    inAccum: inAccum,
    nonRequiredInputs: nonRequiredInputs,
  }
}

function finalize (inputs, outputs, feeRate, changeScript) {
  var bytesAccum = transactionBytes(inputs, outputs)
  var feeAfterExtraOutput = feeRate * (bytesAccum + BLANK_OUTPUT)
  var remainderAfterExtraOutput = sumOrNaN(inputs) - (sumOrNaN(outputs) + feeAfterExtraOutput)

  // is it worth a change output?
  if (remainderAfterExtraOutput > dustThreshold({}, feeRate)) {

    if (changeScript || changeScript === null) {
      outputs = outputs.concat({
        value: Math.round(remainderAfterExtraOutput) - 1,
        script: changeScript ? changeScript : undefined,
      })
    }
  }

  var fee = sumOrNaN(inputs) - sumOrNaN(outputs)
  fee = Math.round(Math.ceil(fee));
  if (!isFinite(fee)) {
    var fee = Math.round(Math.ceil(feeRate * bytesAccum));
    return { fee: fee }
  }
  return {
    inputs: inputs,
    outputs: outputs,
    fee: fee
  }
}

module.exports = {
  dustThreshold: dustThreshold,
  finalize: finalize,
  addRequiredInputs: addRequiredInputs,
  inputBytes: inputBytes,
  outputBytes: outputBytes,
  sumOrNaN: sumOrNaN,
  sumForgiving: sumForgiving,
  transactionBytes: transactionBytes,
  uintOrNaN: uintOrNaN,
  numberOrNaN: numberOrNaN
}
