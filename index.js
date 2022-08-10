const Web3 = require('web3');
const BigNumber = require('bignumber.js');
require('dotenv').config();

// connect Testnet Provider
const Web3js = new Web3(
  new Web3.providers.HttpProvider(process.env.BSC_TESTNET_HTTP)
);

const privateKey = process.env.PRIVATE_KEY; //Your Private key environment variable
let NQTokenAddress = process.env.NQ_TOKEN_ADDRESS; // Demo Token contract address
let toAddress = process.env.TO_WALLET_ADDRESS; // where to send it
let fromAddress = process.env.FROM_WALLET_ADDRESS; // your wallet
let NQContractABI = require('./NQ_TOKENabi.json');
let NQContract = new Web3js.eth.Contract(NQContractABI, NQTokenAddress, {
  from: fromAddress,
});

// Amount of NQ Token to send
let amount = Web3js.utils.toHex(Web3js.utils.toWei('10')); //10 NQ Token

// get data for NQ Token transfer
let data = NQContract.methods.transfer(toAddress, amount).encodeABI();

// SVC_BUSD contract address
const SVC_BUSDpoolAddress = process.env.SVC_BUSD_POOL_ADDRESS;

// SVC_BUSD contract abi
const SVC_BUSDpoolABI = require('./SVC_BUSDabi.json');

let SVC_BUSDcontract = new Web3js.eth.Contract(
  SVC_BUSDpoolABI,
  SVC_BUSDpoolAddress
);

// WBNB_BUSD contract address
const WBNB_BUSDpoolAddress = process.env.WBNB_BUSD_POOL_ADDRESS;

// WBNB_BUSD contract abi
const WBNB_BUSDpoolABI = require('./WBNB_BUSDabi.json');

let WBNB_BUSDcontract = new Web3js.eth.Contract(
  WBNB_BUSDpoolABI,
  WBNB_BUSDpoolAddress
);

// estimate gas cost
async function calculateGasTotal() {
  const gasUsed = await Web3js.eth.estimateGas({
    from: fromAddress,
    to: NQTokenAddress,
    data: data,
  });
  const gasPrice = await Web3js.eth.getGasPrice();
  console.log('gas used: ' + gasUsed);

  console.log(
    'gas price: ' + Web3js.utils.fromWei(String(gasPrice), 'gwei') + ' gwei'
  );

  // gas used * gas price
  const totalPrice = Web3js.utils.fromWei(String(gasPrice * gasUsed), 'ether');
  console.log('total price: ' + totalPrice + ' BNB');
}

// Get ratio BUSD/SVC from SVC_BUSD pool
async function getRatioFromSVC_BUSDPool() {
  // get total amount of BUSD and SVC in SVC_BUSD pool
  const totalAmount = await SVC_BUSDcontract.methods.getReserves().call();
  const BUSDAmount = BigNumber(totalAmount[0]);
  const SVCAmount = BigNumber(totalAmount[1]);
  console.log(totalAmount[0], totalAmount[1]);

  // return BUSD/SVC ratio
  return BUSDAmount.div(SVCAmount);
}

// Get ratio BUSD/WBNB from WBNB_BUSD pool
async function getRatioFromWBNB_BUSDPool() {
  // get total amount of BUSD and WBNB in WBNB_BUSD pool
  const totalAmount = await WBNB_BUSDcontract.methods.getReserves().call();
  const BUSDAmount = BigNumber(totalAmount[0]);
  const WBNBAmount = BigNumber(totalAmount[1]);
  console.log(totalAmount[0], totalAmount[1]);

  // return BUSD/WBNB ratio
  return BUSDAmount.div(WBNBAmount);
}

// Get ratio WBNB/SVC
async function getSVC_WBNBRatio() {
  // BUSD/SVC ratio
  const ratio1 = await getRatioFromSVC_BUSDPool();
  // BUSD/WBNB ratio
  const ratio2 = await getRatioFromWBNB_BUSDPool();
  // WBNB/SVC ratio
  const SVC_WBNB_ratio = ratio1.div(ratio2);

  // remove leading and trailing zeros from WBNB/SVC ratio
  console.log(SVC_WBNB_ratio.toFixed(50).replace(/^0+/, '').replace(/0+$/, ''));
}

// send NQ Token to wallet
function sendErcToken() {
  let txObj = {
    gas: Web3js.utils.toHex(100000),
    to: NQTokenAddress,
    value: '0x00',
    data: data,
    from: fromAddress,
  };
  Web3js.eth.accounts.signTransaction(txObj, privateKey, (err, signedTx) => {
    if (err) {
      return callback(err);
    } else {
      return Web3js.eth.sendSignedTransaction(
        signedTx.rawTransaction,
        (err, res) => {
          if (err) {
            console.log(err);
          } else {
            console.log(res);
          }
        }
      );
    }
  });
}
//sendErcToken();
(async () => {
  await calculateGasTotal();
  await getSVC_WBNBRatio();
})();
