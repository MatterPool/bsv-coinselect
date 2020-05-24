# bsv-coinselect

[![NPM](http://img.shields.io/npm/v/coinselect.svg)](https://www.npmjs.org/package/bsv-coinselect)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

An unspent transaction output (UTXO) selection module for Bitcoin SV.

**WARNING:** Value units are in `satoshi`s, **not** Bitcoin.

## Algorithms
Module | Algorithm | Re-orders UTXOs?
-|-|-
`require('coinselect')` | Blackjack, with Accumulative fallback | By Descending Value
`require('coinselect/accumulative')` | Accumulative - accumulates inputs until the target value (+fees) is reached, skipping detrimental inputs | -
`require('coinselect/blackjack')` | Blackjack - accumulates inputs until the target value (+fees) is matched, does not accumulate inputs that go over the target value (within a threshold) | -
`require('coinselect/break')` | Break - breaks the input values into equal denominations of `output` (as provided) | -
`require('coinselect/split')` | Split - splits the input values evenly between all `outputs`, any provided `output` with `.value` remains unchanged | -


**Note:** Each algorithm will add a change output if the `input - output - fee` value difference is over a dust threshold.
This is calculated independently by `utils.finalize`, irrespective of the algorithm chosen, for the purposes of safety.

**Pro-tip:** if you want to send-all inputs to an output address, `coinselect/split` with a partial output (`.address` defined, no `.value`) can be used to send-all, while leaving an appropriate amount for the `fee`.

## Example

``` javascript
let coinSelect = require('coinselect')
let feeRate = 55 // satoshis per byte
let utxos = [
  ...,
  {
    txid: '...',
    vout: 0,
    ...,
    value: 10000,
  }
]
let targets = [
  ...,
  {
    address: '1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm',
    value: 5000
  },
  {
    script: '....',
    value: 5000
  }
]

// ...
let changeScript = null; // Generates a value, but leaves 'script' null.
// Set changeScript to be the output script if you want it populated automatically
let { inputs, outputs, fee } = coinSelect(utxos, targets, feeRate, changeScript, options)

// the accumulated fee is always returned for analysis
// Make sure to  set changeScript = undefined OR null OR a change script.
console.log(fee)

// .inputs and .outputs will be undefined if no solution was found
if (!inputs || !outputs) return

// Create a transaction with the selected inputs
let tx = new bitcoin.Transaction().from(inputs);
// Attach each output
outputs.forEach(output => {
    const script = (new bitcoin.Script(output.script)).toString();
    tx.addOutput(new bitcoin.Transaction.Output({ script: script, satoshis: output.value }));
})
tx.change('address here');
// Go on to tx.sign()... etc
```


## License [MIT](LICENSE)
