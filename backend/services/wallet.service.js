const ethers = require('ethers');

/**
 * Wallet Service
 * Manages decentralized, non-custodial cryptocurrency wallets
 */
class WalletService {
  constructor(contractAddress, provider, signer) {
    this.contractAddress = contractAddress;
    this.provider = provider;
    this.signer = signer;
    this.contract = new ethers.Contract(contractAddress, [], signer);
  }

  /**
   * Create a new multi-signature wallet
   */
  async createWallet(owners, requiredConfirmations) {
    try {
      const tx = await this.contract.createWallet(owners, requiredConfirmations);
      const receipt = await tx.wait();

      const walletCreatedEvent = receipt.events.find(e => e.event === 'WalletCreated');
      const walletId = walletCreatedEvent.args.walletId;

      return {
        success: true,
        walletId: walletId.toString(),
        owners: owners,
        requiredConfirmations: requiredConfirmations,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error creating wallet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get wallet configuration
   */
  async getWalletConfig(walletId) {
    try {
      const wallet = await this.contract.wallets(walletId);
      const owners = await this.contract.getOwners(walletId);

      return {
        success: true,
        walletId: walletId.toString(),
        owners: owners,
        requiredConfirmations: wallet.requiredConfirmations.toString(),
        isActive: wallet.isActive,
        createdAt: new Date(wallet.createdAt.toNumber() * 1000).toISOString()
      };
    } catch (error) {
      console.error('Error getting wallet config:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deposit ETH to wallet
   */
  async depositETH(walletId, amount) {
    try {
      const tx = await this.contract.deposit(walletId, {
        value: ethers.utils.parseEther(amount.toString())
      });
      const receipt = await tx.wait();

      return {
        success: true,
        walletId: walletId.toString(),
        amount: amount,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error depositing ETH:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deposit ERC20 tokens to wallet
   */
  async depositToken(walletId, token, amount) {
    try {
      const tx = await this.contract.depositToken(walletId, token, amount);
      const receipt = await tx.wait();

      return {
        success: true,
        walletId: walletId.toString(),
        token: token,
        amount: amount.toString(),
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error depositing token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit a transaction (requires confirmations)
   */
  async submitTransaction(walletId, to, value, token, data = '0x') {
    try {
      const tx = await this.contract.submitTransaction(
        walletId,
        to,
        value,
        token,
        data
      );
      const receipt = await tx.wait();

      const txSubmittedEvent = receipt.events.find(e => e.event === 'TransactionSubmitted');
      const txIndex = txSubmittedEvent.args.txIndex;

      return {
        success: true,
        walletId: walletId.toString(),
        txIndex: txIndex.toString(),
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error submitting transaction:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Confirm a pending transaction
   */
  async confirmTransaction(walletId, txIndex) {
    try {
      const tx = await this.contract.confirmTransaction(walletId, txIndex);
      const receipt = await tx.wait();

      return {
        success: true,
        walletId: walletId.toString(),
        txIndex: txIndex.toString(),
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error confirming transaction:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute a confirmed transaction
   */
  async executeTransaction(walletId, txIndex) {
    try {
      const tx = await this.contract.executeTransaction(walletId, txIndex);
      const receipt = await tx.wait();

      return {
        success: true,
        walletId: walletId.toString(),
        txIndex: txIndex.toString(),
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error executing transaction:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Revoke transaction confirmation
   */
  async revokeConfirmation(walletId, txIndex) {
    try {
      const tx = await this.contract.revokeConfirmation(walletId, txIndex);
      const receipt = await tx.wait();

      return {
        success: true,
        walletId: walletId.toString(),
        txIndex: txIndex.toString(),
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error revoking confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(walletId, txIndex) {
    try {
      const transaction = await this.contract.getTransaction(walletId, txIndex);

      return {
        success: true,
        transaction: {
          to: transaction.to,
          value: transaction.value.toString(),
          token: transaction.token,
          data: transaction.data,
          executed: transaction.executed,
          confirmations: transaction.confirmations.toString()
        }
      };
    } catch (error) {
      console.error('Error getting transaction:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get wallet balance (ETH)
   */
  async getBalance(walletId) {
    try {
      const balance = await this.contract.getBalance(walletId);

      return {
        success: true,
        walletId: walletId.toString(),
        balance: ethers.utils.formatEther(balance),
        balanceWei: balance.toString()
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get token balance
   */
  async getTokenBalance(walletId, token) {
    try {
      const balance = await this.contract.getTokenBalance(walletId, token);

      return {
        success: true,
        walletId: walletId.toString(),
        token: token,
        balance: balance.toString()
      };
    } catch (error) {
      console.error('Error getting token balance:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all wallets for a user
   */
  async getUserWallets(userAddress) {
    try {
      const walletIds = await this.contract.getUserWallets(userAddress);

      const wallets = [];
      for (const walletId of walletIds) {
        const config = await this.getWalletConfig(walletId.toString());
        if (config.success) {
          wallets.push(config);
        }
      }

      return {
        success: true,
        userAddress: userAddress,
        wallets: wallets
      };
    } catch (error) {
      console.error('Error getting user wallets:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pending transactions for a wallet
   */
  async getPendingTransactions(walletId) {
    try {
      const txCount = await this.contract.getTransactionCount(walletId);
      const pendingTxs = [];

      for (let i = 0; i < txCount; i++) {
        const tx = await this.getTransaction(walletId, i);
        if (tx.success && !tx.transaction.executed) {
          pendingTxs.push({
            txIndex: i,
            ...tx.transaction
          });
        }
      }

      return {
        success: true,
        walletId: walletId.toString(),
        pendingTransactions: pendingTxs
      };
    } catch (error) {
      console.error('Error getting pending transactions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add a new owner to wallet
   */
  async addOwner(walletId, newOwner) {
    try {
      const tx = await this.contract.addOwner(walletId, newOwner);
      const receipt = await tx.wait();

      return {
        success: true,
        walletId: walletId.toString(),
        newOwner: newOwner,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error adding owner:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove an owner from wallet
   */
  async removeOwner(walletId, owner) {
    try {
      const tx = await this.contract.removeOwner(walletId, owner);
      const receipt = await tx.wait();

      return {
        success: true,
        walletId: walletId.toString(),
        removedOwner: owner,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error removing owner:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Change required confirmations
   */
  async changeRequiredConfirmations(walletId, required) {
    try {
      const tx = await this.contract.changeRequiredConfirmations(walletId, required);
      const receipt = await tx.wait();

      return {
        success: true,
        walletId: walletId.toString(),
        requiredConfirmations: required,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error changing required confirmations:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = WalletService;
