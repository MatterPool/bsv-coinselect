var utils = require('./utils')
// add inputs until we reach or surpass the target value (or deplete)
// worst-case: O(n)
module.exports = function accumulative (utxos, outputs, feeRate, changeScript) {
  if (!isFinite(utils.numberOrNaN(feeRate))) return {}
  var bytesAccum = utils.transactionBytes([], outputs)

  // Always add required utxos
  const addedRequiredUtxosStatus = utils.addRequiredInputs(utxos)
  var inAccum = addedRequiredUtxosStatus.inAccum // Add the value from required utxos
  bytesAccum += addedRequiredUtxosStatus.bytesAccum // Add the total bytes from required utxos
  var requiredInputs = addedRequiredUtxosStatus.requiredInputs // Non-required utxo's remaining (if any)
  var inputs = requiredInputs
  var outAccum = utils.sumOrNaN(outputs)

  // Perform a test to see if transaction can be finalized
  var fee = Math.round(Math.ceil(feeRate * bytesAccum))
  if (inAccum >= outAccum + fee) {
    return utils.finalize(inputs, outputs, feeRate, changeScript)
  }

  for (var i = 0; i < addedRequiredUtxosStatus.nonRequiredInputs.length; ++i) {
    var utxo = utxos[i]
    var utxoBytes = utils.inputBytes(utxo)
    var utxoFee = feeRate * utxoBytes
    var utxoValue = utils.uintOrNaN(utxo.value)

    // skip detrimental input
    if (utxoFee > utxo.value) {
      if (i === utxos.length - 1) {
        var innerFee = Math.round(Math.ceil(feeRate * (bytesAccum + utxoBytes)))
        return { fee: innerFee }
      }
      continue
    }

    bytesAccum += utxoBytes
    inAccum += utxoValue
    inputs.push(utxo)

    var cumulativeFee = Math.round(Math.ceil(feeRate * bytesAccum))
    // go again?
    if (inAccum < outAccum + cumulativeFee) continue

    return utils.finalize(inputs, outputs, feeRate, changeScript)
  }
  var feeEnd = Math.round(Math.ceil(feeRate * bytesAccum))
  return { fee: feeEnd }
}
