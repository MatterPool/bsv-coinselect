var utils = require('./utils')

// only add inputs if they don't bust the target value (aka, exact match)
// worst-case: O(n)
module.exports = function blackjack (utxos, outputs, feeRate, changeScript) {
  if (!isFinite(utils.numberOrNaN(feeRate))) return {}

  var bytesAccum = utils.transactionBytes([], outputs)

  // Always add required utxos
  const addedRequiredUtxosStatus = utils.addRequiredInputs(utxos);
  var inAccum = addedRequiredUtxosStatus.inAccum;                 // Add the value from required utxos
  bytesAccum += addedRequiredUtxosStatus.bytesAccum;              // Add the total bytes from required utxos
  var requiredInputs = addedRequiredUtxosStatus.requiredInputs;   // Non-required utxo's remaining (if any)
  var inputs = requiredInputs;
  var outAccum = utils.sumOrNaN(outputs)
  // Perform a test to see if transaction can be finalized
  var fee = Math.round(Math.ceil(feeRate * bytesAccum));
  if (inAccum >= outAccum + fee) {
    return utils.finalize(inputs, outputs, feeRate, changeScript)
  }

  var threshold = utils.dustThreshold({}, feeRate)

  for (var i = 0; i < addedRequiredUtxosStatus.nonRequiredInputs.length; ++i) {
    var input = utxos[i]
    var inputBytes = utils.inputBytes(input)
    // var fee = feeRate * (bytesAccum + inputBytes)
    var fee = Math.round(Math.ceil(feeRate * (bytesAccum + inputBytes)));
    var inputValue = utils.uintOrNaN(input.value)

    // would it waste value?
    if ((inAccum + inputValue) > (outAccum + fee + threshold)) continue

    bytesAccum += inputBytes
    inAccum += inputValue
    inputs.push(input)

    // go again?
    if (inAccum < outAccum + fee) continue

    return utils.finalize(inputs, outputs, feeRate, changeScript)
  }
  var fee = Math.round(Math.ceil(feeRate * bytesAccum));
  return { fee: fee }
}
