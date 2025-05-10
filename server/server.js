const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
require('dotenv').config();

// Create HTTP server with CORS
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running');
});

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  // Allow all origins in development
  verifyClient: (info, callback) => {
    callback(true);
  }
});

// Store connected clients and their subscriptions
const clients = new Map();

// Initialize Solana connection
const connection = new Connection(
  process.env.SOLANA_RPC_URL || clusterApiUrl('mainnet-beta'),
  'confirmed'
);

// Add rate limiting
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 1000, // 1 second
  requests: new Map()
};

function checkRateLimit() {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.windowMs;
  
  // Clean up old requests
  for (const [timestamp] of RATE_LIMIT.requests) {
    if (timestamp < windowStart) {
      RATE_LIMIT.requests.delete(timestamp);
    }
  }
  
  // Count requests in current window
  const requestCount = Array.from(RATE_LIMIT.requests.values())
    .filter(timestamp => timestamp > windowStart)
    .length;
  
  if (requestCount >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  RATE_LIMIT.requests.set(now, now);
  return true;
}

// Function to parse transaction and extract trade information
async function parseTransaction(signature, traderAddress) {
  try {
    // Check rate limit
    if (!checkRateLimit()) {
      console.log('Rate limit exceeded, waiting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return parseTransaction(signature, traderAddress);
    }

    console.log(`Parsing transaction ${signature} for trader ${traderAddress}`);
    
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });

    if (!tx || !tx.transaction || !tx.transaction.message) {
      console.log('Invalid transaction data:', signature);
      return null;
    }

    // Get all account keys involved in the transaction
    const accountKeys = tx.transaction.message.accountKeys || [];
    const traderPubkey = new PublicKey(traderAddress);

    // Log all account keys for debugging
    console.log('Transaction account keys:', accountKeys.map(key => key.toString()));

    // Check if the trader is involved in any way
    const isTraderInvolved = accountKeys.some(key => {
      try {
        return key && key.equals(traderPubkey);
      } catch (error) {
        console.error('Error comparing public keys:', error);
        return false;
      }
    });

    if (!isTraderInvolved) {
      // Check if the trader is involved in token transfers
      const preTokenBalances = tx.meta?.preTokenBalances || [];
      const postTokenBalances = tx.meta?.postTokenBalances || [];

      const isTokenInvolved = preTokenBalances.some(balance => 
        balance.owner && new PublicKey(balance.owner).equals(traderPubkey)
      ) || postTokenBalances.some(balance => 
        balance.owner && new PublicKey(balance.owner).equals(traderPubkey)
      );

      if (!isTokenInvolved) {
        console.log('Trader not involved in transaction:', signature);
        return null;
      }
    }

    // Get pre and post token balances
    const preTokenBalances = tx.meta?.preTokenBalances || [];
    const postTokenBalances = tx.meta?.postTokenBalances || [];
    const preBalances = tx.meta?.preBalances || [];
    const postBalances = tx.meta?.postBalances || [];

    // Find the trader's account index
    const traderIndex = accountKeys.findIndex(key => {
      try {
        return key && key.equals(traderPubkey);
      } catch (error) {
        return false;
      }
    });

    // Calculate SOL balance change
    const solBalanceChange = traderIndex !== -1 ? 
      (postBalances[traderIndex] - preBalances[traderIndex]) / 1e9 : 0;

    // Get token transfers for the trader
    const traderTokenTransfers = postTokenBalances
      .filter(balance => {
        try {
          return balance.owner && new PublicKey(balance.owner).equals(traderPubkey);
        } catch (error) {
          return false;
        }
      })
      .map(balance => ({
        mint: balance.mint,
        owner: balance.owner,
        amount: balance.uiTokenAmount?.uiAmount || 0
      }));

    // Also check pre-token balances for sells
    const preTraderTokenTransfers = preTokenBalances
      .filter(balance => {
        try {
          return balance.owner && new PublicKey(balance.owner).equals(traderPubkey);
        } catch (error) {
          return false;
        }
      })
      .map(balance => ({
        mint: balance.mint,
        owner: balance.owner,
        amount: balance.uiTokenAmount?.uiAmount || 0
      }));

    console.log('Transaction analysis:', {
      signature,
      traderAddress,
      solBalanceChange,
      tokenTransfers: traderTokenTransfers,
      preTokenTransfers: preTraderTokenTransfers,
      isTraderInvolved
    });

    // If no token transfers but SOL balance changed, it's a SOL trade
    if (traderTokenTransfers.length === 0 && solBalanceChange !== 0) {
      const trade = {
        id: signature,
        timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
        type: solBalanceChange > 0 ? 'buy' : 'sell',
        token: 'SOL',
        amount: Math.abs(solBalanceChange),
        price: calculatePrice(tx, [{ amount: Math.abs(solBalanceChange) }]),
        status: 'completed',
        profit: null,
        walletAddress: traderAddress
      };
      console.log('Detected SOL trade:', trade);
      return trade;
    }

    // If there are token transfers, process them
    if (traderTokenTransfers.length > 0 || preTraderTokenTransfers.length > 0) {
      const tradeType = determineTradeType(traderTokenTransfers, preTraderTokenTransfers, traderAddress);
      const tokenMint = traderTokenTransfers[0]?.mint || preTraderTokenTransfers[0]?.mint;
      const tokenAmount = Math.abs(
        (traderTokenTransfers[0]?.amount || 0) - (preTraderTokenTransfers[0]?.amount || 0)
      );

      if (tokenMint && tokenAmount > 0) {
        const trade = {
          id: signature,
          timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
          type: tradeType,
          token: tokenMint,
          amount: tokenAmount,
          price: calculatePrice(tx, traderTokenTransfers),
          status: 'completed',
          profit: null,
          walletAddress: traderAddress
        };
        console.log('Detected token trade:', trade);
        return trade;
      }
    }

    console.log('No relevant transfers found in transaction:', signature);
    return null;
  } catch (error) {
    console.error('Error parsing transaction:', error);
    return null;
  }
}

// Function to determine trade type (buy/sell)
function determineTradeType(postTransfers, preTransfers, traderAddress) {
  try {
    const traderPubkey = new PublicKey(traderAddress);
    
    // Calculate net token change
    const postAmount = postTransfers.reduce((sum, t) => sum + (t.amount || 0), 0);
    const preAmount = preTransfers.reduce((sum, t) => sum + (t.amount || 0), 0);
    const netChange = postAmount - preAmount;

    return netChange > 0 ? 'buy' : 'sell';
  } catch (error) {
    console.error('Error determining trade type:', error);
    return 'unknown';
  }
}

// Function to calculate trade price
function calculatePrice(tx, tokenTransfers) {
  try {
    // Get SOL amount from transaction
    const solAmount = Math.abs(tx.meta?.postBalances[0] - tx.meta?.preBalances[0]) / 1e9;
    const tokenAmount = Math.abs(tokenTransfers[0]?.amount || 1);
    
    // Calculate price in SOL per token
    return tokenAmount > 0 ? solAmount / tokenAmount : 0;
  } catch (error) {
    console.error('Error calculating price:', error);
    return 0;
  }
}

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('New client connected from:', req.socket.remoteAddress);
  
  const clientId = Math.random().toString(36).substring(7);
  clients.set(clientId, {
    ws,
    subscriptions: new Set(),
    subscriptionIds: new Map()
  });

  // Send immediate connection confirmation
  try {
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      timestamp: Date.now()
    }));
    console.log('Sent connection confirmation to client:', clientId);
  } catch (error) {
    console.error('Error sending connection confirmation:', error);
  }

  // Handle messages from clients
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message from client:', clientId, data);

      if (data.type === 'subscribe' && data.traderAddress) {
        const client = clients.get(clientId);
        if (client) {
          try {
            // Validate trader address
            const traderPubkey = new PublicKey(data.traderAddress);
            
            // Subscribe to Solana account notifications
            const subscriptionId = connection.onAccountChange(
              traderPubkey,
              async (accountInfo) => {
                try {
                  // Get recent transactions for the account
                  const signatures = await connection.getSignaturesForAddress(
                    traderPubkey,
                    { limit: 5 }
                  );

                  console.log(`Found ${signatures.length} recent transactions for ${data.traderAddress}`);

                  // Process each transaction
                  for (const sig of signatures) {
                    const trade = await parseTransaction(sig.signature, data.traderAddress);
                    if (trade) {
                      // Add wallet address to trade data
                      const tradeData = {
                        ...trade,
                        walletAddress: data.traderAddress
                      };
                      console.log('Sending trade to client:', tradeData);
                      ws.send(JSON.stringify({
                        type: 'trade',
                        data: tradeData
                      }));
                    }
                  }
                } catch (error) {
                  console.error('Error processing account change:', error);
                  ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Error processing transactions: ' + error.message
                  }));
                }
              },
              'confirmed'
            );

            // Also subscribe to program notifications for the trader's address
            const programSubscriptionId = connection.onProgramAccountChange(
              TOKEN_PROGRAM_ID,
              async (accountInfo) => {
                try {
                  // Check if the account is owned by the trader
                  if (accountInfo.accountInfo.owner.toString() === data.traderAddress) {
                    // Get recent transactions
                    const signatures = await connection.getSignaturesForAddress(
                      traderPubkey,
                      { limit: 5 }
                    );

                    for (const sig of signatures) {
                      const trade = await parseTransaction(sig.signature, data.traderAddress);
                      if (trade) {
                        // Add wallet address to trade data
                        const tradeData = {
                          ...trade,
                          walletAddress: data.traderAddress
                        };
                        console.log('Sending program trade to client:', tradeData);
                        ws.send(JSON.stringify({
                          type: 'trade',
                          data: tradeData
                        }));
                      }
                    }
                  }
                } catch (error) {
                  console.error('Error processing program account change:', error);
                  ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Error processing program changes: ' + error.message
                  }));
                }
              },
              'confirmed'
            );

            client.subscriptions.add(data.traderAddress);
            client.subscriptionIds.set(data.traderAddress, subscriptionId);
            client.subscriptionIds.set(`${data.traderAddress}-program`, programSubscriptionId);
            
            console.log(`Client ${clientId} subscribed to trader ${data.traderAddress}`);
            
            // Send subscription confirmation
            ws.send(JSON.stringify({
              type: 'subscribed',
              traderAddress: data.traderAddress,
              clientId,
              timestamp: Date.now()
            }));
          } catch (error) {
            console.error('Error setting up subscriptions:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Error setting up subscriptions: ' + error.message
            }));
          }
        }
      } else {
        // Handle unknown message types
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type: ' + (data.type || 'undefined')
        }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error processing message: ' + error.message
      }));
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log(`Client ${clientId} disconnected`);
    const client = clients.get(clientId);
    if (client) {
      // Unsubscribe from all Solana notifications
      client.subscriptionIds.forEach((subscriptionId, key) => {
        try {
          connection.removeAccountChangeListener(subscriptionId);
          console.log(`Removed subscription ${key} for client ${clientId}`);
        } catch (error) {
          console.error(`Error removing subscription ${key}:`, error);
        }
      });
    }
    clients.delete(clientId);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
    try {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'WebSocket error occurred: ' + error.message
      }));
    } catch (sendError) {
      console.error('Error sending error message:', sendError);
    }
  });

  // Send ping every 30 seconds to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 30000);

  ws.on('close', () => {
    clearInterval(pingInterval);
  });
});

// Start server
const PORT = process.env.WS_PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server is running on port ${PORT}`);
  console.log('Server is listening on all interfaces');
}); 