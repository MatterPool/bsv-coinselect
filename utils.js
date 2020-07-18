// baseline estimates, used to improve performance
var TX_EMPTY_SIZE = (4 + 1 + 1 + 4) * 2 // Added buffer of 400 just in case
var TX_INPUT_BASE = (32 + 4 + 1 + 4) * 2 // Multiple by 2 to correctly account for bytes
var TX_INPUT_PUBKEYHASH = (107) * 2
var TX_OUTPUT_BASE = (8 + 1) * 2
var TX_OUTPUT_PUBKEYHASH = (25) * 2
var TX_DUST_THRESHOLD = 546

/**
 * Take care to check string or Script length
 */
function inputBytes (input) {
  var scriptLen = 0
  if (input.script && input.script.toHex) {
    scriptLen = (input.script.toHex()).length
  } else if (input.script) {
    scriptLen = input.script.length
  } else {
    scriptLen = TX_INPUT_PUBKEYHASH
  }
  return TX_INPUT_BASE + scriptLen
}

/**
 * Take care to check string or Script length
 */
function outputBytes (output) {
  var scriptLen = 0
  if (output.script && output.script.toHex) {
    scriptLen = (output.script.toHex()).length / 2
  } else if (output.script) {
    scriptLen = output.script.length / 2
  } else {
    scriptLen = TX_OUTPUT_PUBKEYHASH
  }
  return TX_OUTPUT_BASE + scriptLen
}

function dustThreshold (output, feeRate) {
  /* ... classify the output for input estimate  */
  return TX_DUST_THRESHOLD
}

function transactionBytes (inputs, outputs) {
  // We have to seperate out the variables or we get a NaN
  // Strange why the function worked before
  const inSum = inputs.reduce(function (a, x) { return a + inputBytes(x) }, 0)
  const outSum = outputs.reduce(function (a, x) { return a + outputBytes(x) }, 0)
  if (isNaN(inSum) || isNaN(outSum)) {
    throw new Error('Input outputs isNaN')
  }
  return TX_EMPTY_SIZE + inSum + outSum
}

function uintOrNaN (v) {
  if (typeof v !== 'number') return NaN
  if (!isFinite(v)) return NaN
  if (Math.floor(v) !== v) return NaN
  if (v < 0) return NaN
  return v
}

function numberOrNaN (v) {
  if (typeof v !== 'number') return NaN
  return v
}

function sumForgiving (range) {
  return range.reduce(function (a, x) { return a + (isFinite(x.value) ? x.value : 0) }, 0)
}

function sumOrNaN (range) {
  return range.reduce(function (a, x) { return a + uintOrNaN(x.value) }, 0)
}

var BLANK_OUTPUT = outputBytes({})

function addRequiredInputs (inputs) {
  const requiredInputs = []
  const nonRequiredInputs = []
  let bytesAccum = 0
  let inAccum = 0
  for (const input of inputs) {
    if (input.required) {
      requiredInputs.push(input)
      var utxoBytes = inputBytes(input)
      var utxoValue = uintOrNaN(input.value)
      bytesAccum += utxoBytes
      inAccum += utxoValue
    } else {
      nonRequiredInputs.push(input)
    }
  }
  return {
    bytesAccum: bytesAccum,
    requiredInputs: requiredInputs,
    inAccum: inAccum,
    nonRequiredInputs: nonRequiredInputs
  }
}

function finalize (inputs, outputs, feeRate, changeScript) {
  var bytesAccum = transactionBytes(inputs, outputs)
  var feeAfterExtraOutput = feeRate * (bytesAccum + BLANK_OUTPUT)
  var remainderAfterExtraOutput = sumOrNaN(inputs) - (sumOrNaN(outputs) + feeAfterExtraOutput)

  // is it worth a change output?
  if (remainderAfterExtraOutput > dustThreshold({}, feeRate)) {
    outputs = outputs.concat({
      value: Math.round(remainderAfterExtraOutput) - 1,
      script: changeScript ?  changeScript : null
    })
  }

  var fee = sumOrNaN(inputs) - sumOrNaN(outputs)
  fee = Math.round(Math.ceil(fee))
  if (!isFinite(fee)) {
    var innerFee = Math.round(Math.ceil(feeRate * bytesAccum))
    return { fee: innerFee }
  }

  // Emergency cap for fee (0.1 BSV) which is enough for 20MB * 0.5 sat/byte
  if (fee > 10000000) {
    throw new Error('Filepay Error: Too large fee')
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
