# bsv-coinselect
> An unspent transaction output (UTXO) selection module for Bitcoin SV.
> https://matterpool.io
> Originally forked from https://github.com/bitcoinjs/coinselect

## Problem and Overview

Working with Unspent transaction outputs (UTXO) the developer must choose which "coins" to use for creating transactions.
For instance, the developer may want to *use the minimal number of UTXOs to pay all outputs at a given fee rate*.

This library makes it easy to select UTXO's according different policies.

This is a client-side library only and can be used in any Javascript project. If you need to fetch UTXO's or broadcast BSV transactions then use the Filepay library at http://github.com/mattercloud/filepay which makes use of `bsv-coinselect`

**NOTE:** Force a UTXO to be selected by specifying `required: true`

```javascript

const utxos = [
  {
    "address": "1CgPDEav5fdzry3V7tGADY4rHqG8oi4kfv",
    "txid": "a939afcb78a06239f02eefbfaabc6e0a78dfe3cd64f9676932cc1195796fa42f",
    "vout": 1,
    "value": 1000,
    "height": 617496,
    "confirmations": 18639,
    "scriptPubKey": "76a914801c259a527abd83a977fd90a06b22d215fcad4988ac",
    "script": "76a914801c259a527abd83a977fd90a06b22d215fcad4988ac",
    "outputIndex": 1,
    "required": true // Optional. If set, then forces use of this utxo
  },
  {
    "address": "1CgPDEav5fdzry3V7tGADY4rHqG8oi4kfv",
    "txid": "716e6b12d111984818d8c5e6d68446a52746d480d397d077cad598d55f059a65",
    "vout": 1,
    "value": 5000,
    "height": 616468,
    "confirmations": 19667,
    "scriptPubKey": "76a914801c259a527abd83a977fd90a06b22d215fcad4988ac",
    "script": "76a914801c259a527abd83a977fd90a06b22d215fcad4988ac",
    "outputIndex": 1
  },
  {
    "address": "1CgPDEav5fdzry3V7tGADY4rHqG8oi4kfv",
    "txid": "98e0987b5b5783ae083814f448f1dda52c18c881beda649c36576d0c81ee31f9",
    "vout": 1,
    "value": 10004,
    "height": 610466,
    "confirmations": 25669,
    "scriptPubKey": "76a914801c259a527abd83a977fd90a06b22d215fcad4988ac",
    "script": "76a914801c259a527abd83a977fd90a06b22d215fcad4988ac",
    "outputIndex": 1
  }
];

const outputs = [
  {
    script: '76a914801c259a527abd83a977fd90a06b22d215fcad4988ac',
    value: 1000,
  },
  {
    script: '76a914801c259a527abd83a977fd90a06b22d215fcad4988ac',
    value: 546,
  },
  {
    script: '76a914801c259a527abd83a977fd90a06b22d215fcad4988ac',
    value: 1000,
  },
  {
    script: '76a914801c259a527abd83a977fd90a06b22d215fcad4988ac',
    value: 10000,
  },
];
const changeScript = null; // Optional, set to arbitrary p2ph or script. Ex: '76a914801c259a527abd83a977fd90a06b22d215fcad4988ac'
const { inputs, outputs, fee } = coinSelect(utxos, outputs, 0.5, null);
// https://whatsonchain.com/tx/81576866d8c796540cfdb3f75d67d469e683fe506a0676eb2e9f9ee1876b7e1d
```

Sample response:

```javascript
{
  fee: 232,
  inputs: [
    {
      "address": "1CgPDEav5fdzry3V7tGADY4rHqG8oi4kfv",
      "txid": "98e0987b5b5783ae083814f448f1dda52c18c881beda649c36576d0c81ee31f9",
      "vout": 1,
      "value": 10004,
      "height": 610466,
      "confirmations": 25669,
      "scriptPubKey": "76a914801c259a527abd83a977fd90a06b22d215fcad4988ac",
      "script": "76a914801c259a527abd83a977fd90a06b22d215fcad4988ac",
      "outputIndex": 1
    },
    {
      "address": "1CgPDEav5fdzry3V7tGADY4rHqG8oi4kfv",
      "txid": "716e6b12d111984818d8c5e6d68446a52746d480d397d077cad598d55f059a65",
      "vout": 1,
      "value": 5000,
      "height": 616468,
      "confirmations": 19667,
      "scriptPubKey": "76a914801c259a527abd83a977fd90a06b22d215fcad4988ac",
      "script": "76a914801c259a527abd83a977fd90a06b22d215fcad4988ac",
      "outputIndex": 1
    },
  ],
  "outputs": [
    {
      script: '76a914801c259a527abd83a977fd90a06b22d215fcad4988ac',
      value: 1000,
    },
    {
      script: '76a914801c259a527abd83a977fd90a06b22d215fcad4988ac',
      value: 546,
    },
    {
      script: '76a914801c259a527abd83a977fd90a06b22d215fcad4988ac',
      value: 1000,
    },
    {
      script: '76a914801c259a527abd83a977fd90a06b22d215fcad4988ac',
      value: 10000,
    },
    {
      // This is the change script. Set to 'null', 'undefined', or valid script
      // or use bsv.Transaction.changeAddress() and setting this to undefined
      script: null,
      "value": 2226
    }
  ]
};

```

## Algorithms
Module | Algorithm | Re-orders UTXOs?
-|-|-
`require('coinselect')` | Accumulative - accumulates inputs until the target value (+fees) is reached, skipping
`require('coinselect/accumulative')` | Accumulative - accumulates inputs until the target value (+fees) is reached, skipping detrimental inputs | -

**Note:** Each algorithm will add a change output if the `input - output - fee` value difference is over a dust threshold.
This is calculated independently by `utils.finalize`, irrespective of the algorithm chosen, for the purposes of safety.

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
