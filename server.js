const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
//ForPrice
const axios = require('axios');
const BSCSCAN_API_KEY = 'CMTCZH4G1T9KKJNB9WF9U9XU71TDY2EXVR';
const TOKEN_ADDRESS2 = '0x22f0A4eC481DBC370D0093dc7D35c49786947646';
const Web3 = require('web3');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

//Message

io.of("/default").on("connection", (socket) => {
  console.log("Default chat - connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`Default chat - ${socket.id} joined room ${roomId}`);
  });

  socket.on("sendMessage", (data) => {
    const roomId = data.chatGroupId;
    io.of("/default").to(roomId).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("Default chat - disconnected:", socket.id);
  });
});

io.of("/agent").on("connection", (socket) => {
  console.log("Agent chat - connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`Agent chat - ${socket.id} joined room ${roomId}`);
  });

  socket.on("sendMessage", (data) => {
    const roomId = data.chatGroupId;
    io.of("/agent").to(roomId).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("Agent chat - disconnected:", socket.id);
  });
});

//PriceTokens
app.get('/getGlobalAllSwappedAllDataBothPools', async (req, res) => {
  const contractAddress1 = '0x11353b85DBf896da69FC045D3c6014874Dfc2Aaa'; // First pool address
  const contractAddress2 = '0x9dc046ddf406155e50ee96c6200af60fa0f7180b'; // Second pool address
  const contractAddress3 = '0xd0e1d163c271f6f976ba23f67f3e371c9ad20f9c'; // Third pool address
  const apiUrl = 'https://api.bscscan.com/api';
  const endpoint = '?module=account&action=tokentx';
  const web3 = new Web3();

  try {

    // Fetch transactions for the second pool
    const response2 = await axios.get(apiUrl + endpoint, {
      params: {
        address: contractAddress2,
        apikey: BSCSCAN_API_KEY,
        sort: 'desc',
        page: 1,
        offset: 0
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const response3 = await axios.get(apiUrl + endpoint, {
      params: {
        address: contractAddress3,
        apikey: BSCSCAN_API_KEY,
        sort: 'desc',
        page: 1,
        offset: 0
      }
    });

    //const response4 = await axios.get('https://api-node-1-postapi.vercel.app/fetchTransactions');

    // Check if both requests were successful
    if (response2.data.status === '1' && response3.data.status === '1') {
      const transactions2 = response2.data.result;
      const transactions3 = response3.data.result;
      //const transactions4 = response4.data;
      //console.log(transactions4);
      //console.log(transactions2);

      //console.log(transactions2);
      // Combine transactions from both pools
      const allTransactions = [ ...transactions2];

      // Combine transactions with the same hash

      const uniqueTransactionsfor3 = {};
      transactions3.forEach((tx) => {
        if (!uniqueTransactionsfor3[tx.hash]) {
          uniqueTransactionsfor3[tx.hash] = tx;
          //console.log('tx1', tx)
        } else {
          let fromOrToAddress;
          // Rename fields for the second transaction within the same hash
          const secondTx = uniqueTransactionsfor3[tx.hash];
          secondTx.from2 = tx.from;
          secondTx.to2 = tx.to;
          secondTx.value2 = tx.value;
          secondTx.token2 = tx.tokenName;
          secondTx.isUniSwap = 'Yes'
          secondTx.uniSwapRouter = 'Uniswap V2'
          secondTx.fromOrtoAddress = '';

          //console.log('tx2', tx)
          // Add other fields you want to handle similarly
          // secondTx.fieldName2 = tx.fieldName;
        }
      });

      const uniqueTransactionsfor2 = {};
      transactions2.forEach((tx) => {
        if (!uniqueTransactionsfor2[tx.hash]) {
          uniqueTransactionsfor2[tx.hash] = tx;
        } else {
          // Rename fields for the second transaction within the same hash
          const secondTx = uniqueTransactionsfor2[tx.hash];
          secondTx.from2 = tx.from;
          secondTx.to2 = tx.to;
          secondTx.value2 = tx.value;
          secondTx.token2 = tx.tokenName;
          secondTx.pancakeV3Router = 'PancakeSwap V3: BSC-USD-F3 3'
          //secondTx.signatureHashOfMeta = tx.value;
          //console.log(secondTx);
          secondTx.signatureHashOfMeta = '';
          //console.log(matchingTx4.signatureHash)
          secondTx.fromOrtoAddress = '';
          secondTx.routerAddress = '';
          // Add other fields you want to handle similarly
          // secondTx.fieldName2 = tx.fieldName;
        }
      });

      const uniqueTransactions = {};

      const allCombinedTransaction = { ...uniqueTransactionsfor2, ...uniqueTransactionsfor3 };
      const combinedTransactions = Object.values(allCombinedTransaction);
      combinedTransactions.sort((a, b) => new Date(b.timeStamp * 1000) - new Date(a.timeStamp * 1000));

      let FinalFromAddress;
      let FinalToAddress;
      let FinalQuantity;
      let FinalUSDTValue;
      let Quantity;
      let usdtvalue;
      const formattedTransactions = combinedTransactions.map(tx => {
        if (tx && tx.hash && tx.value && tx.value2 && tx.timeStamp && tx.tokenName && tx.tokenSymbol) {

          if (tx.token2 === 'Financial Freedom Fighter') {
            if (tx.fromOrtoAddress) {
              FinalFromAddress = tx.fromOrtoAddress
            } else {
              FinalFromAddress = tx.from2
            }
            if (tx.uniSwapRouter) {
              FinalToAddress = tx.uniSwapRouter
            }else if(tx.routerAddress && tx.routerAddress === '0x1b81D678ffb9C0263b24A97847620C99d213eB14'){
              FinalToAddress = 'PancakeSwap V3: BSC-USD-F3 3'
            } else if (tx.signatureHashOfMeta && tx.signatureHashOfMeta === '128acb08' && tx.routerAddress === '0xf081470f5c6fbccf48cc4e5b82dd926409dcdd67') {
              console.log(tx.routerAddress);
              FinalToAddress = 'Metamask: Swap Router'
            } else if (tx.pancakeV3Router) {
              FinalToAddress = tx.pancakeV3Router
            } else {
              FinalToAddress = 'PancakeSwap V2: BSC-USD-F3 3'
            }
            Quantity = web3.utils.fromWei(tx.value2.toString(), 'ether');
            usdtvalue = web3.utils.fromWei(tx.value.toString(), 'ether');
            //FinalQuantity = Quantity
            //FinalUSDTValue = usdtvalue
          } else {
            Quantity = web3.utils.fromWei(tx.value.toString(), 'ether');
            usdtvalue = web3.utils.fromWei(tx.value2.toString(), 'ether');
            if (tx.uniSwapRouter) {
              FinalFromAddress = tx.uniSwapRouter;
            }else if(tx.routerAddress && tx.routerAddress === '0x1b81D678ffb9C0263b24A97847620C99d213eB14'){
              FinalToAddress = 'PancakeSwap V3: BSC-USD-F3 3'
            } else if (tx.signatureHashOfMeta && tx.signatureHashOfMeta === '128acb08' && tx.routerAddress === '0xf081470f5c6fbccf48cc4e5b82dd926409dcdd67') {
              FinalFromAddress = 'Metamask: Swap Router'
            } else if (tx.pancakeV3Router) {
              FinalFromAddress = tx.pancakeV3Router
            } else {
              FinalFromAddress = 'PancakeSwap V2: BSC-USD-F3 3'
            }
            if (tx.fromOrtoAddress) {
              if (tx.isUniSwap) {
                FinalToAddress = tx.fromOrtoAddress
                //console.log('yes');
              } else {
                FinalToAddress = tx.fromOrtoAddress
              }
            } else {
              if (tx.isUniSwap) {
                FinalToAddress = tx.from2
                //console.log('yes');
              } else {
                FinalToAddress = tx.to
              }
            }
          }
          // txFrom: tx.from,
          // txFrom2: tx.from2,
          // txTo:tx.to,
          // txTo2:tx.to2,
          if (tx.tokenName === 'Financial Freedom Fighter') {
            FinalToAddress = tx.to2;
          } else {
            FinalFromAddress = tx.to2;
          };
          return {
            txnHash: tx.hash,
            date: new Date(parseInt(tx.timeStamp) * 1000).toUTCString(),
            from: FinalFromAddress || '',
            to: FinalToAddress || '',
            usdtvalue: usdtvalue || '',
            tokenName: tx.tokenName,
            tokenName2: tx.token2,
            tokenSymbol: tx.tokenSymbol,
            f3LivePrice: (parseFloat(usdtvalue) / parseFloat(Quantity)).toFixed(12),
            quantity: Quantity || '',
          };
        }
        return null; // Return null if essential properties are missing
      }).filter(Boolean); // Filter out null values

      const responseObj = {
        transactions: formattedTransactions,
      };

      res.json(responseObj);
    } else {
      res.status(500).json({ error: 'Failed to fetch token transfers' });
    }
  } catch (error) {
    console.error('Error fetching token transfers:', error);
    res.status(500).json({ error: 'Failed to fetch token transfers' });
  }
});

app.get('/getGlobalAllSwappedAllDataBothPoolsF3HE', async (req, res) => {
  const contractAddress1 = '0x11353b85DBf896da69FC045D3c6014874Dfc2Aaa'; // First pool address
  const contractAddress2 = '0x9dc046ddf406155e50ee96c6200af60fa0f7180b'; // Second pool address
  const contractAddress3 = '0xd0e1d163c271f6f976ba23f67f3e371c9ad20f9c'; // Third pool address
  const contractAddressF3HE = '0x0e7f37fdb7fdb33cabe8e1d8fa4e837350be1eb8';

  const apiUrl = 'https://api.bscscan.com/api';
  const endpoint = '?module=account&action=tokentx';
  const web3 = new Web3();

  try {

    // Fetch transactions for the second pool
    const response2 = await axios.get(apiUrl + endpoint, {
      params: {
        address: contractAddressF3HE,
        apikey: BSCSCAN_API_KEY,
        sort: 'desc',
        page: 1,
        offset: 0
      }
    });


    //const response4 = await axios.get('https://api-node-1-postapi.vercel.app/fetchTransactions');

    // Check if both requests were successful
    if (response2.data.status === '1') {
      const transactions2 = response2.data.result;
      //const transactions3 = response3.data.result;
      //const transactions4 = response4.data;
      //console.log(transactions4);
      //console.log(transactions2);

      //console.log(transactions2);
      // Combine transactions from both pools
      const allTransactions = [ ...transactions2];

      // Combine transactions with the same hash

      const uniqueTransactionsfor3 = {};
      // transactions3.forEach((tx) => {
      //   if (!uniqueTransactionsfor3[tx.hash]) {
      //     uniqueTransactionsfor3[tx.hash] = tx;
      //     //console.log('tx1', tx)
      //   } else {
      //     let fromOrToAddress;
      //     // Rename fields for the second transaction within the same hash
      //     const secondTx = uniqueTransactionsfor3[tx.hash];
      //     secondTx.from2 = tx.from;
      //     secondTx.to2 = tx.to;
      //     secondTx.value2 = tx.value;
      //     secondTx.token2 = tx.tokenName;
      //     secondTx.isUniSwap = 'Yes'
      //     secondTx.uniSwapRouter = 'Uniswap V2'
      //     secondTx.fromOrtoAddress = '';

      //     //console.log('tx2', tx)
      //     // Add other fields you want to handle similarly
      //     // secondTx.fieldName2 = tx.fieldName;
      //   }
      // });

      const uniqueTransactionsfor2 = {};
      transactions2.forEach((tx) => {
        if (!uniqueTransactionsfor2[tx.hash]) {
          uniqueTransactionsfor2[tx.hash] = tx;
        } else {
          // Rename fields for the second transaction within the same hash
          const secondTx = uniqueTransactionsfor2[tx.hash];
          secondTx.from2 = tx.from;
          secondTx.to2 = tx.to;
          secondTx.value2 = tx.value;
          secondTx.token2 = tx.tokenName;
          secondTx.pancakeV3Router = 'PancakeSwap V3: BSC-USD-F3 3'
          //secondTx.signatureHashOfMeta = tx.value;
          //console.log(secondTx);
          secondTx.signatureHashOfMeta = '';
          //console.log(matchingTx4.signatureHash)
          secondTx.fromOrtoAddress = '';
          secondTx.routerAddress = '';
          // Add other fields you want to handle similarly
          // secondTx.fieldName2 = tx.fieldName;
        }
      });

      const uniqueTransactions = {};

      const allCombinedTransaction = { ...uniqueTransactionsfor2, ...uniqueTransactionsfor3 };
      const combinedTransactions = Object.values(allCombinedTransaction);
      combinedTransactions.sort((a, b) => new Date(b.timeStamp * 1000) - new Date(a.timeStamp * 1000));

      let FinalFromAddress;
      let FinalToAddress;
      let FinalQuantity;
      let FinalUSDTValue;
      let Quantity;
      let usdtvalue;
      const formattedTransactions = combinedTransactions.map(tx => {
        if (tx && tx.hash && tx.value && tx.value2 && tx.timeStamp && tx.tokenName && tx.tokenSymbol) {

          if (tx.token2 === 'F3-HE') {
            if (tx.fromOrtoAddress) {
              FinalFromAddress = tx.fromOrtoAddress
            } else {
              FinalFromAddress = tx.from2
            }
            if (tx.uniSwapRouter) {
              FinalToAddress = tx.uniSwapRouter
            }else if(tx.routerAddress && tx.routerAddress === '0x1b81D678ffb9C0263b24A97847620C99d213eB14'){
              FinalToAddress = 'PancakeSwap V3: BSC-USD-F3 3'
            } else if (tx.signatureHashOfMeta && tx.signatureHashOfMeta === '128acb08' && tx.routerAddress === '0xf081470f5c6fbccf48cc4e5b82dd926409dcdd67') {
              console.log(tx.routerAddress);
              FinalToAddress = 'Metamask: Swap Router'
            } else if (tx.pancakeV3Router) {
              FinalToAddress = tx.pancakeV3Router
            } else {
              FinalToAddress = 'PancakeSwap V2: BSC-USD-F3 3'
            }
            Quantity = web3.utils.fromWei(tx.value2.toString(), 'ether');
            usdtvalue = web3.utils.fromWei(tx.value.toString(), 'ether');
            //FinalQuantity = Quantity
            //FinalUSDTValue = usdtvalue
          } else {
            Quantity = web3.utils.fromWei(tx.value.toString(), 'ether');
            usdtvalue = web3.utils.fromWei(tx.value2.toString(), 'ether');
            if (tx.uniSwapRouter) {
              FinalFromAddress = tx.uniSwapRouter;
            }else if(tx.routerAddress && tx.routerAddress === '0x1b81D678ffb9C0263b24A97847620C99d213eB14'){
              FinalToAddress = 'PancakeSwap V3: BSC-USD-F3 3'
            } else if (tx.signatureHashOfMeta && tx.signatureHashOfMeta === '128acb08' && tx.routerAddress === '0xf081470f5c6fbccf48cc4e5b82dd926409dcdd67') {
              FinalFromAddress = 'Metamask: Swap Router'
            } else if (tx.pancakeV3Router) {
              FinalFromAddress = tx.pancakeV3Router
            } else {
              FinalFromAddress = 'PancakeSwap V2: BSC-USD-F3 3'
            }
            if (tx.fromOrtoAddress) {
              if (tx.isUniSwap) {
                FinalToAddress = tx.fromOrtoAddress
                //console.log('yes');
              } else {
                FinalToAddress = tx.fromOrtoAddress
              }
            } else {
              if (tx.isUniSwap) {
                FinalToAddress = tx.from2
                //console.log('yes');
              } else {
                FinalToAddress = tx.to
              }
            }
          }
          // txFrom: tx.from,
          // txFrom2: tx.from2,
          // txTo:tx.to,
          // txTo2:tx.to2,
          if (tx.tokenName === 'Financial Freedom Fighter') {
            FinalToAddress = tx.to2;
          } else {
            FinalFromAddress = tx.to2;
          };
          if (tx.methodId === "0xac9650d8" || tx.functionName === "multicall(bytes[] data)" || tx.methodId === "0xe8e33700") {
            return null;
          }
          return {
            txnHash: tx.hash,
            methodName: tx.functionName,
            methodId: tx.methodId,
            date: new Date(parseInt(tx.timeStamp) * 1000).toUTCString(),
            from: FinalFromAddress || '',
            to: FinalToAddress || '',
            usdtvalue: usdtvalue || '',
            tokenName: tx.tokenName,
            tokenName2: tx.token2,
            tokenSymbol: tx.tokenSymbol,
            f3LivePrice: (parseFloat(usdtvalue) / parseFloat(Quantity)).toFixed(12),
            quantity: Quantity || '',
          };
        }
        return null; // Return null if essential properties are missing
      }).filter(Boolean); // Filter out null values

      const responseObj = {
        transactions: formattedTransactions,
      };

      res.json(responseObj);
    } else {
      res.status(500).json({ error: 'Failed to fetch token transfers' });
    }
  } catch (error) {
    console.error('Error fetching token transfers:', error);
    res.status(500).json({ error: 'Failed to fetch token transfers' });
  }
});

app.get('/getMySwappedAllDataV3PoolSMWTest', async (req, res) => {
  const contractAddress = '0x11353b85DBf896da69FC045D3c6014874Dfc2Aaa';
  const contractAddress2 = '0x9dc046ddf406155e50ee96c6200af60fa0f7180b';
  const contractAddress3 = '0xd0e1d163c271f6f976ba23f67f3e371c9ad20f9c';
  const contractAddressF3HE = '0x0e7f37fdb7fdb33cabe8e1d8fa4e837350be1eb8';
  const apiUrl = 'https://api.bscscan.com/api';
  const endpoint = '?module=account&action=tokentx';
  const endpoint2 = '?module=account&action=txlist';
  var userAddress = req.query.userAddress;
  const tokenSymbol = req.query.tokenSymbol;
  const finalContractAddress = tokenSymbol === 'F3HE' ? contractAddressF3HE : contractAddress2
  const web3 = new Web3();
  const BSCSCAN_API_KEY = '3WK22B41CG3Y67YFQ6RKJIH778Z9P2Y36J';
  try {
    const response2 = await axios.get(apiUrl + endpoint, {
      params: {
        address: finalContractAddress,
        apikey: BSCSCAN_API_KEY,
        sort: 'desc',
        page: 1,
        offset: 0
      }
    });

    const response3 = await axios.get(apiUrl + endpoint2, {
      params: {
        address: userAddress,
        apikey: BSCSCAN_API_KEY,
        sort: 'desc',
        page: 1,
        offset: 0
      }
    });

    if (response2.data.status === '1' && response3.data.status === '1') {
      const userTransactionspool2 = response2.data.result;
      const transactions4 = response3.data.result;

      const userTransactionspool2Transaction = userTransactionspool2;


      const uniqueTransactionsfor2 = {};
      userTransactionspool2Transaction.forEach((tx) => {
        const matchingTx4 = transactions4.find(tx4 => tx4.hash === tx.hash);
        if (matchingTx4) {
          if (!uniqueTransactionsfor2[tx.hash]) {
            uniqueTransactionsfor2[tx.hash] = tx;
          } else {
            const secondTx = uniqueTransactionsfor2[tx.hash];
            secondTx.from2 = tx.from;
            secondTx.to2 = tx.to;
            secondTx.value2 = tx.value;
            secondTx.token2 = tx.tokenName;
            secondTx.pancakeV3Router = 'PancakeSwap V3: BSC-USD-F3 3'
            secondTx.signatureHashOfMeta = matchingTx4.methodId;
            secondTx.routerAddress = matchingTx4.contractAddress;
          }
          //secondTx.fromOrtoAddress = matchingTx4.txFromAddress;
          //console.log(matchingTx4.txFromAddress);
        }
      });

      const uniqueTransactions = {};

      const allCombinedTransaction = { ...uniqueTransactionsfor2};
      // Convert object back to an array
      const combinedTransactions = Object.values(allCombinedTransaction);
      combinedTransactions.sort((a, b) => new Date(b.timeStamp * 1000) - new Date(a.timeStamp * 1000));

      let FinalFromAddress;
      let FinalToAddress;
      const formattedTransactions = combinedTransactions.map(tx => {
        if (tx && tx.hash && tx.value && tx.value2 && tx.timeStamp && tx.tokenName && tx.tokenSymbol) {
          const finalTokenName = tokenSymbol === 'F3HE' ? 'F3 High End' : 'Financial Freedom Fighter';
          const finalRouterAddress = tokenSymbol === 'F3HE' ? '0x15d00a43695fe4afffb53ed245f075c3bc0f96b4' : '0x1b81D678ffb9C0263b24A97847620C99d213eB14';
          const finalTokenAddress = tokenSymbol === 'F3HE' ? '0x22f0A4eC481DBC370D0093dc7D35c49786947646' : '0xf081470f5c6fbccf48cc4e5b82dd926409dcdd67'
          if (tx.token2 === finalTokenName) {
            FinalFromAddress = userAddress;
            if (tx.uniSwapRouter) {
              FinalToAddress = tx.uniSwapRouter
            }else if(tx.routerAddress && tx.routerAddress === finalRouterAddress){
              FinalToAddress = 'PancakeSwap V3: BSC-USD-F3 3'
            } else if (tx.signatureHashOfMeta && tx.signatureHashOfMeta === '128acb08' && tx.routerAddress === finalTokenAddress) {
              FinalToAddress = 'Metamask: Swap Router'
            } else if (tx.pancakeV3Router) {
              FinalToAddress = tx.pancakeV3Router
            } else {
              FinalToAddress = 'PancakeSwap V2: BSC-USD-F3 3'
            }
            Quantity = web3.utils.fromWei(tx.value2.toString(), 'ether');
            usdtvalue = web3.utils.fromWei(tx.value.toString(), 'ether');
            //FinalQuantity = Quantity
            //FinalUSDTValue = usdtvalue
          } else {
            Quantity = web3.utils.fromWei(tx.value.toString(), 'ether');
            usdtvalue = web3.utils.fromWei(tx.value2.toString(), 'ether');
            if (tx.uniSwapRouter) {
              FinalFromAddress = tx.uniSwapRouter;
            }else if(tx.routerAddress && tx.routerAddress === finalRouterAddress){
              FinalToAddress = 'PancakeSwap V3: BSC-USD-F3 3'
            } else if (tx.signatureHashOfMeta && tx.signatureHashOfMeta === '128acb08' && tx.routerAddress === finalTokenAddress) {
              FinalFromAddress = 'Metamask: Swap Router'
            } else if (tx.pancakeV3Router) {
              FinalFromAddress = tx.pancakeV3Router
            } else {
              FinalFromAddress = 'PancakeSwap V2: BSC-USD-F3 3'
            }
            if (tx.isUniSwap) {
              FinalToAddress = userAddress
              //console.log('yes');
            } else {
              FinalToAddress = userAddress
            }
          }
          const f3LivePrice =
            !isNaN(parseFloat(usdtvalue)) && !isNaN(parseFloat(Quantity)) && parseFloat(Quantity) !== 0
              ? (parseFloat(usdtvalue) / parseFloat(Quantity)).toFixed(12)
              : '0.000000000000';
          const swapType = tx.tokenName === 'Binance-Peg BSC-USD' ? 'In' : 'Out'
          return {
            txnHash: tx.hash,
            date: new Date(parseInt(tx.timeStamp) * 1000).toUTCString(),
            from: FinalFromAddress || '',
            to: FinalToAddress || '',
            usdtvalue: usdtvalue || '',
            tokenName: tx.tokenName,
            tokenName2: tx.token2,
            tokenSymbol: tx.tokenSymbol,
            f3LivePrice: f3LivePrice,
            quantity: Quantity || '',
            swapType
          };
        }
        return null; // Return null if essential properties are missing
      }).filter(Boolean); // Filter out null values

      const responseObj = {
        transactions: formattedTransactions,
      };

      res.status(200).json(responseObj);
    } else {
      res.status(500).json({ error: 'Failed to fetch token transfers' });
    }
  } catch (error) {
    console.error('Error fetching token transfers:', error);
    if (error.response) {
    console.error('Axios Error Response:', error.response.data);
    res.status(500).json({
      message: 'Axios API Error',
      data: error.response.data,
      status: error.response.status,
      headers: error.response.headers
    });
  } else if (error.request) {
    console.error('Axios No Response:', error.request);
    res.status(500).json({
      message: 'No response received from API',
      request: error.request
    });
  } else {
    console.error('General Error:', error.message);
    res.status(500).json({
      message: 'Unexpected Error',
      error: error.message,
      stack: error.stack
    });
  }
  }
});

app.get('/getMySwappedAllDataBuyAndSell', async (req, res) => {
  const contractAddress = '0x11353b85DBf896da69FC045D3c6014874Dfc2Aaa';
  const contractAddress2 = '0x9dc046ddf406155e50ee96c6200af60fa0f7180b';
  const contractAddress3 = '0xd0e1d163c271f6f976ba23f67f3e371c9ad20f9c';
  const contractAddressF3HE = '0x0e7f37fdb7fdb33cabe8e1d8fa4e837350be1eb8';
  const apiUrl = 'https://api.bscscan.com/api';
  const endpoint = '?module=account&action=tokentx';
  const endpoint2 = '?module=account&action=txlist';
  var userAddress = req.query.userAddress;
  const tokenSymbol = req.query.tokenSymbol;
  const finalContractAddress = tokenSymbol === 'F3HE' ? contractAddressF3HE : contractAddress2
  const web3 = new Web3();
  const BSCSCAN_API_KEY = 'WZ9JKR4TAZXA2XZVCZPDJ6DM8GNVS3QPA5';
  try {
    const response2 = await axios.get(apiUrl + endpoint, {
      params: {
        address: finalContractAddress,
        apikey: BSCSCAN_API_KEY,
        sort: 'desc',
        page: 1,
        offset: 0
      }
    });

    const response3 = await axios.get(apiUrl + endpoint2, {
      params: {
        address: userAddress,
        apikey: BSCSCAN_API_KEY,
        sort: 'desc',
        page: 1,
        offset: 0
      }
    });

    if (response2.data.status === '1' && response3.data.status === '1') {
      const userTransactionspool2 = response2.data.result;
      const transactions4 = response3.data.result;

      const userTransactionspool2Transaction = userTransactionspool2;


      const uniqueTransactionsfor2 = {};
      userTransactionspool2Transaction.forEach((tx) => {
        const matchingTx4 = transactions4.find(tx4 => tx4.hash === tx.hash);
        if (matchingTx4) {
          if (!uniqueTransactionsfor2[tx.hash]) {
            uniqueTransactionsfor2[tx.hash] = tx;
          } else {
            const secondTx = uniqueTransactionsfor2[tx.hash];
            secondTx.from2 = tx.from;
            secondTx.to2 = tx.to;
            secondTx.value2 = tx.value;
            secondTx.token2 = tx.tokenName;
            secondTx.pancakeV3Router = 'PancakeSwap V3: BSC-USD-F3 3'
            secondTx.signatureHashOfMeta = matchingTx4.methodId;
            secondTx.routerAddress = matchingTx4.contractAddress;
          }
          //secondTx.fromOrtoAddress = matchingTx4.txFromAddress;
          //console.log(matchingTx4.txFromAddress);
        }
      });

      const uniqueTransactions = {};

      const allCombinedTransaction = { ...uniqueTransactionsfor2};
      // Convert object back to an array
      const combinedTransactions = Object.values(allCombinedTransaction);
      combinedTransactions.sort((a, b) => new Date(b.timeStamp * 1000) - new Date(a.timeStamp * 1000));

      let totalBuy = 0.0;
      let totalBuyUSD = 0.0;
      let totalSell = 0.0;
      let totalSellUSD = 0.0;
      let FinalFromAddress;
      let FinalToAddress;
      const formattedTransactions = combinedTransactions.map(tx => {
        if (tx && tx.hash && tx.value && tx.value2 && tx.timeStamp && tx.tokenName && tx.tokenSymbol) {
          const finalTokenName = tokenSymbol === 'F3HE' ? 'F3 High End' : 'Financial Freedom Fighter';
          const finalRouterAddress = tokenSymbol === 'F3HE' ? '0x15d00a43695fe4afffb53ed245f075c3bc0f96b4' : '0x1b81D678ffb9C0263b24A97847620C99d213eB14';
          const finalTokenAddress = tokenSymbol === 'F3HE' ? '0x22f0A4eC481DBC370D0093dc7D35c49786947646' : '0xf081470f5c6fbccf48cc4e5b82dd926409dcdd67'
          if (tx.token2 === finalTokenName) {
            FinalFromAddress = userAddress;
            if (tx.uniSwapRouter) {
              FinalToAddress = tx.uniSwapRouter
            }else if(tx.routerAddress && tx.routerAddress === finalRouterAddress){
              FinalToAddress = 'PancakeSwap V3: BSC-USD-F3 3'
            } else if (tx.signatureHashOfMeta && tx.signatureHashOfMeta === '128acb08' && tx.routerAddress === finalTokenAddress) {
              FinalToAddress = 'Metamask: Swap Router'
            } else if (tx.pancakeV3Router) {
              FinalToAddress = tx.pancakeV3Router
            } else {
              FinalToAddress = 'PancakeSwap V2: BSC-USD-F3 3'
            }
            Quantity = web3.utils.fromWei(tx.value2.toString(), 'ether');
            usdtvalue = web3.utils.fromWei(tx.value.toString(), 'ether');
            //FinalQuantity = Quantity
            //FinalUSDTValue = usdtvalue
          } else {
            Quantity = web3.utils.fromWei(tx.value.toString(), 'ether');
            usdtvalue = web3.utils.fromWei(tx.value2.toString(), 'ether');
            if (tx.uniSwapRouter) {
              FinalFromAddress = tx.uniSwapRouter;
            }else if(tx.routerAddress && tx.routerAddress === finalRouterAddress){
              FinalToAddress = 'PancakeSwap V3: BSC-USD-F3 3'
            } else if (tx.signatureHashOfMeta && tx.signatureHashOfMeta === '128acb08' && tx.routerAddress === finalTokenAddress) {
              FinalFromAddress = 'Metamask: Swap Router'
            } else if (tx.pancakeV3Router) {
              FinalFromAddress = tx.pancakeV3Router
            } else {
              FinalFromAddress = 'PancakeSwap V2: BSC-USD-F3 3'
            }
            if (tx.isUniSwap) {
              FinalToAddress = userAddress
              //console.log('yes');
            } else {
              FinalToAddress = userAddress
            }
          }
          const f3LivePrice =
            !isNaN(parseFloat(usdtvalue)) && !isNaN(parseFloat(Quantity)) && parseFloat(Quantity) !== 0
              ? (parseFloat(usdtvalue) / parseFloat(Quantity)).toFixed(12)
              : '0.000000000000';
          const swapType = tx.tokenName === 'Binance-Peg BSC-USD' ? 'In' : 'Out'
          const valueUSDT = parseFloat(usdtvalue) || 0.0;
          const valueQuantity = parseFloat(Quantity) || 0.0;
          if(swapType === 'In'){
            totalBuyUSD += valueUSDT || 0.0
            totalBuy += valueQuantity || 0.0
          }else{
            totalSellUSD += valueUSDT || 0.0
            totalSell += valueQuantity || 0.0
          }
          return {
            txnHash: tx.hash,
            date: new Date(parseInt(tx.timeStamp) * 1000).toUTCString(),
            from: FinalFromAddress || '',
            to: FinalToAddress || '',
            usdtvalue: usdtvalue || '',
            tokenName: tx.tokenName,
            tokenName2: tx.token2,
            tokenSymbol: tx.tokenSymbol,
            f3LivePrice: f3LivePrice,
            quantity: Quantity || '',
            swapType
          };
        }
        return null; // Return null if essential properties are missing
      }).filter(Boolean); // Filter out null values

      const responseObj = {
        transactions: formattedTransactions,
        totalBuy : totalBuy.toFixed(2),
        totalSell : totalSell.toFixed(2),
        totalBuyUSD: totalBuyUSD.toFixed(2),
        totalSellUSD: totalSellUSD.toFixed(2),
      };

      res.status(200).json(responseObj);
    } else {
      res.status(500).json({ error: 'Error fetching token transfers of crypto data buy and sell:',tokenSymbol });
    }
  } catch (error) {
    console.error('Error fetching token transfers of crypto data buy and sell:',tokenSymbol, error);
    if (error.response) {
    console.error('Axios Error Response:', error.response.data);
    res.status(500).json({
      message: 'Axios API Error',
      data: error.response.data,
      status: error.response.status,
      headers: error.response.headers
    });
  } else if (error.request) {
    console.error('Axios No Response:', error.request);
    res.status(500).json({
      message: 'No response received from API',
      request: error.request
    });
  } else {
    console.error('General Error:', error.message);
    res.status(500).json({
      message: 'Unexpected Error',
      error: error.message,
      stack: error.stack
    });
  }
  }
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
