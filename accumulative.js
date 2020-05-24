var utils = require('./utils')
// add inputs until we reach or surpass the target value (or deplete)
// worst-case: O(n)
module.exports = function accumulative (utxos, outputs, feeRate, changeScript) {
  if (!isFinite(utils.numberOrNaN(feeRate))) return {}
  var bytesAccum = utils.transactionBytes([], outputs)

  var inAccum = 0
  var inputs = []
  var outAccum = utils.sumOrNaN(outputs)

  for (var i = 0; i < utxos.length; ++i) {
    var utxo = utxos[i]
    var utxoBytes = utils.inputBytes(utxo)
    var utxoFee = feeRate * utxoBytes
    var utxoValue = utils.uintOrNaN(utxo.value)

    // skip detrimental input
    if (utxoFee > utxo.value) {
      if (i === utxos.length - 1){
        var fee = Math.round(Math.ceil(feeRate * (bytesAccum + utxoBytes)));
        return { fee: fee }
      }
      continue
    }

    bytesAccum += utxoBytes
    inAccum += utxoValue
    inputs.push(utxo)

    var fee = Math.round(Math.ceil(feeRate * bytesAccum));

    // go again?
    if (inAccum < outAccum + fee) continue

    return utils.finalize(inputs, outputs, feeRate, changeScript)
  }
  var fee = Math.round(Math.ceil(feeRate * bytesAccum));
  return { fee: fee }
}
