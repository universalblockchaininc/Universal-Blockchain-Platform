const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const Blockchain = require('../blockchain/Blockchain');
const Transaction = require('../blockchain/Transaction');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize blockchain
const universalBlockchain = new Blockchain();

// Simple rate limiting tracker
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

// Rate limiting middleware
function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const clientData = rateLimitMap.get(ip);
  
  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }
  
  if (clientData.count >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }
  
  clientData.count++;
  next();
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', rateLimit); // Apply rate limiting to API routes
app.use(express.static(path.join(__dirname, '../public')));

// API Routes

/**
 * GET /api/blockchain
 * Get the entire blockchain
 */
app.get('/api/blockchain', (req, res) => {
  res.json({
    success: true,
    chain: universalBlockchain.chain
  });
});

/**
 * GET /api/blockchain/stats
 * Get blockchain statistics
 */
app.get('/api/blockchain/stats', (req, res) => {
  res.json({
    success: true,
    stats: universalBlockchain.getStats()
  });
});

/**
 * GET /api/blockchain/validate
 * Validate the blockchain integrity
 */
app.get('/api/blockchain/validate', (req, res) => {
  const isValid = universalBlockchain.isChainValid();
  res.json({
    success: true,
    isValid,
    message: isValid ? 'Blockchain is valid' : 'Blockchain is compromised'
  });
});

/**
 * GET /api/block/:index
 * Get a specific block by index
 */
app.get('/api/block/:index', (req, res) => {
  const index = parseInt(req.params.index);
  
  if (isNaN(index) || index < 0 || index >= universalBlockchain.chain.length) {
    return res.status(404).json({
      success: false,
      message: 'Block not found'
    });
  }

  res.json({
    success: true,
    block: universalBlockchain.chain[index]
  });
});

/**
 * POST /api/transaction
 * Create a new transaction
 */
app.post('/api/transaction', (req, res) => {
  const { fromAddress, toAddress, amount, type, metadata } = req.body;

  if (!fromAddress || !toAddress || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: fromAddress, toAddress, amount'
    });
  }

  try {
    const transaction = new Transaction(
      fromAddress,
      toAddress,
      parseFloat(amount),
      type || 'transfer',
      metadata || {}
    );

    universalBlockchain.addTransaction(transaction);

    res.json({
      success: true,
      message: 'Transaction added to pending transactions',
      transaction,
      pendingCount: universalBlockchain.pendingTransactions.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/transactions/pending
 * Get all pending transactions
 */
app.get('/api/transactions/pending', (req, res) => {
  res.json({
    success: true,
    pendingTransactions: universalBlockchain.pendingTransactions
  });
});

/**
 * POST /api/mine
 * Mine pending transactions
 */
app.post('/api/mine', (req, res) => {
  const { minerAddress } = req.body;

  if (!minerAddress) {
    return res.status(400).json({
      success: false,
      message: 'Miner address is required'
    });
  }

  if (universalBlockchain.pendingTransactions.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No pending transactions to mine'
    });
  }

  try {
    universalBlockchain.minePendingTransactions(minerAddress);
    
    res.json({
      success: true,
      message: 'Block mined successfully',
      latestBlock: universalBlockchain.getLatestBlock()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/balance/:address
 * Get balance of an address
 */
app.get('/api/balance/:address', (req, res) => {
  const address = req.params.address;
  const balance = universalBlockchain.getBalanceOfAddress(address);

  res.json({
    success: true,
    address,
    balance
  });
});

/**
 * GET /api/transactions/:address
 * Get all transactions for an address
 */
app.get('/api/transactions/:address', (req, res) => {
  const address = req.params.address;
  const transactions = universalBlockchain.getTransactionsForAddress(address);

  res.json({
    success: true,
    address,
    transactions
  });
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Universal Blockchain Platform server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});

module.exports = app;
