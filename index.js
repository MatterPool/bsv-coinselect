var accumulative = require('./accumulative')
var utils = require('./utils')

// order by descending value, minus the inputs approximate fee
function utxoScore (x, feeRate) {
  return x.value - (feeRate * utils.inputBytes(x))
}

/**
 * Select coins from given utxos and fulfilling the outputs.
 * feeRate is bytes per satoshi (ex: 0.5)
 * changeScript is optional script to use to pay back if there are coins left over. Convert addreses to p2pkh first
 */
module.exports = function coinSelect (utxos, outputs, feeRate, changeScript) {
  utxos = utxos.concat().sort(function (a, b) {
    return utxoScore(b, feeRate) - utxoScore(a, feeRate)
  })

  // else, try the accumulative strategy
  return accumulative(utxos, outputs, feeRate, changeScript)
}
