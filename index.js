var accumulative = require('./accumulative')
var blackjack = require('./blackjack')
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

  // attempt to use the blackjack strategy first (no change output)
  var base = blackjack(utxos, outputs, feeRate, changeScript)
  if (base.inputs) return base

  // else, try the accumulative strategy
  return accumulative(utxos, outputs, feeRate, changeScript)
}
