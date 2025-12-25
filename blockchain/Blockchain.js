const Block = require('./Block');
const Transaction = require('./Transaction');

/**
 * Universal Blockchain implementation
 */
class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  /**
   * Create the genesis block (first block in the chain)
   */
  createGenesisBlock() {
    return new Block(0, Date.now(), {
      type: 'genesis',
      message: 'Universal Blockchain Platform - Genesis Block'
    }, '0');
  }

  /**
   * Get the latest block in the chain
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Mine pending transactions and create a new block
   * @param {string} miningRewardAddress - Address to receive mining reward
   */
  minePendingTransactions(miningRewardAddress) {
    // Create mining reward transaction
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward, 'mining_reward');
    this.pendingTransactions.push(rewardTx);

    // Create a new block with pending transactions
    const block = new Block(
      this.chain.length,
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );

    block.mineBlock(this.difficulty);
    
    console.log('Block successfully mined!');
    this.chain.push(block);

    // Reset pending transactions
    this.pendingTransactions = [];
  }

  /**
   * Add a transaction to pending transactions
   * @param {Transaction} transaction - The transaction to add
   */
  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transaction must include from and to address');
    }

    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to chain');
    }

    this.pendingTransactions.push(transaction);
  }

  /**
   * Get the balance of an address
   * @param {string} address - The address to check
   */
  getBalanceOfAddress(address) {
    let balance = 0;

    for (const block of this.chain) {
      if (!block.data || !Array.isArray(block.data)) continue;

      for (const trans of block.data) {
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }

        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    return balance;
  }

  /**
   * Get all transactions for a specific address
   * @param {string} address - The address to get transactions for
   */
  getTransactionsForAddress(address) {
    const transactions = [];

    for (const block of this.chain) {
      if (!block.data || !Array.isArray(block.data)) continue;

      for (const trans of block.data) {
        if (trans.fromAddress === address || trans.toAddress === address) {
          transactions.push({
            ...trans,
            blockIndex: block.index,
            blockHash: block.hash
          });
        }
      }
    }

    return transactions;
  }

  /**
   * Verify the integrity of the blockchain
   */
  isChainValid() {
    // Check genesis block has correct structure
    if (this.chain[0].index !== 0 || this.chain[0].previousHash !== '0') {
      return false;
    }

    // Verify each block in the chain
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Verify hash
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      // Verify link to previous block
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      // Verify proof of work
      const target = Array(this.difficulty + 1).join('0');
      if (currentBlock.hash.substring(0, this.difficulty) !== target) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get blockchain statistics
   */
  getStats() {
    let totalTransactions = 0;
    let totalBlocks = this.chain.length;

    for (const block of this.chain) {
      if (Array.isArray(block.data)) {
        totalTransactions += block.data.length;
      }
    }

    return {
      totalBlocks,
      totalTransactions,
      difficulty: this.difficulty,
      pendingTransactions: this.pendingTransactions.length,
      isValid: this.isChainValid()
    };
  }
}

module.exports = Blockchain;
