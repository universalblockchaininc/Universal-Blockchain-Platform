const ethers = require('ethers');
const axios = require('axios');

/**
 * Payment Gateway Service
 * Handles fiat-to-crypto and crypto-to-fiat conversions
 */
class PaymentGatewayService {
  constructor(contractAddress, provider, signer, config = {}) {
    this.contractAddress = contractAddress;
    this.provider = provider;
    this.signer = signer;
    this.contract = new ethers.Contract(contractAddress, [], signer);
    
    // Payment processor configurations
    this.processors = config.processors || {};
  }

  /**
   * Initialize fiat to crypto conversion
   */
  async initiateFiatToCrypto(conversionData) {
    try {
      const {
        userId,
        userAddress,
        token,
        fiatAmount,
        fiatCurrency,
        paymentMethod // 'stripe', 'paypal', etc.
      } = conversionData;

      // Step 1: Get conversion quote
      const quote = await this.getConversionQuote(fiatAmount, fiatCurrency, token);
      
      if (!quote.success) {
        return { success: false, error: 'Failed to get quote' };
      }

      // Step 2: Process fiat payment with external processor
      const paymentResult = await this.processFiatPayment(
        fiatAmount,
        fiatCurrency,
        paymentMethod,
        userId
      );

      if (!paymentResult.success) {
        return { success: false, error: 'Payment processing failed' };
      }

      // Step 3: Create blockchain transaction record
      const tx = await this.contract.createFiatToCryptoTransaction(
        userAddress,
        token,
        quote.cryptoAmount,
        ethers.utils.parseUnits(fiatAmount.toString(), 6), // Assuming 6 decimals for fiat
        fiatCurrency,
        paymentResult.externalTxId
      );

      const receipt = await tx.wait();

      return {
        success: true,
        transactionId: receipt.events.find(e => e.event === 'TransactionCreated').args.transactionId.toString(),
        cryptoAmount: quote.cryptoAmount,
        fiatAmount: fiatAmount,
        externalTxId: paymentResult.externalTxId,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error initiating fiat to crypto:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process fiat payment with external processor
   */
  async processFiatPayment(amount, currency, method, userId) {
    try {
      // This is a placeholder - integrate with actual payment processors
      // Examples: Stripe, PayPal, Square, etc.
      
      if (method === 'stripe') {
        return await this.processStripePayment(amount, currency, userId);
      } else if (method === 'paypal') {
        return await this.processPayPalPayment(amount, currency, userId);
      }
      
      return { success: false, error: 'Unsupported payment method' };
    } catch (error) {
      console.error('Error processing fiat payment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment(amount, currency, userId) {
    // Placeholder for Stripe integration
    // In production, use Stripe SDK
    return {
      success: true,
      externalTxId: 'stripe_' + Date.now(),
      processor: 'stripe'
    };
  }

  /**
   * Process PayPal payment
   */
  async processPayPalPayment(amount, currency, userId) {
    // Placeholder for PayPal integration
    // In production, use PayPal SDK
    return {
      success: true,
      externalTxId: 'paypal_' + Date.now(),
      processor: 'paypal'
    };
  }

  /**
   * Complete fiat to crypto transaction (called by processor)
   */
  async completeFiatToCrypto(transactionId) {
    try {
      const tx = await this.contract.completeFiatToCrypto(transactionId);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionId: transactionId.toString(),
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error completing fiat to crypto:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize crypto to fiat conversion
   */
  async initiateCryptoToFiat(conversionData) {
    try {
      const {
        token,
        cryptoAmount,
        fiatCurrency,
        withdrawalMethod // bank account, paypal, etc.
      } = conversionData;

      // Step 1: Get conversion quote
      const quote = await this.getCryptoToFiatQuote(cryptoAmount, token, fiatCurrency);
      
      if (!quote.success) {
        return { success: false, error: 'Failed to get quote' };
      }

      // Step 2: Create blockchain transaction (locks crypto)
      const externalTxId = 'pending_' + Date.now();
      const tx = await this.contract.createCryptoToFiatTransaction(
        token,
        cryptoAmount,
        ethers.utils.parseUnits(quote.fiatAmount.toString(), 6),
        fiatCurrency,
        externalTxId
      );

      const receipt = await tx.wait();
      const transactionId = receipt.events.find(e => e.event === 'TransactionCreated').args.transactionId;

      // Step 3: Initiate fiat withdrawal (to be processed by external service)
      const withdrawalResult = await this.initiateFiatWithdrawal(
        quote.fiatAmount,
        fiatCurrency,
        withdrawalMethod,
        transactionId.toString()
      );

      return {
        success: true,
        transactionId: transactionId.toString(),
        cryptoAmount: cryptoAmount.toString(),
        fiatAmount: quote.fiatAmount,
        withdrawalId: withdrawalResult.withdrawalId,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error initiating crypto to fiat:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initiate fiat withdrawal
   */
  async initiateFiatWithdrawal(amount, currency, method, transactionId) {
    // Placeholder for withdrawal processing
    // In production, integrate with payment processors' withdrawal APIs
    return {
      success: true,
      withdrawalId: 'withdrawal_' + Date.now()
    };
  }

  /**
   * Get conversion quote for fiat to crypto
   */
  async getConversionQuote(fiatAmount, fiatCurrency, token) {
    try {
      const result = await this.contract.getConversionQuote(
        ethers.utils.parseUnits(fiatAmount.toString(), 6),
        fiatCurrency,
        token
      );

      return {
        success: true,
        cryptoAmount: result.cryptoAmount.toString(),
        totalFees: result.totalFees.toString(),
        fiatAmount: fiatAmount
      };
    } catch (error) {
      console.error('Error getting conversion quote:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get crypto to fiat quote
   */
  async getCryptoToFiatQuote(cryptoAmount, token, fiatCurrency) {
    try {
      // In production, use real-time price feeds (e.g., Chainlink, CoinGecko)
      const exchangeRate = await this.contract.exchangeRates(fiatCurrency);
      const fiatAmount = (cryptoAmount * exchangeRate) / ethers.constants.WeiPerEther;

      return {
        success: true,
        cryptoAmount: cryptoAmount.toString(),
        fiatAmount: fiatAmount,
        exchangeRate: ethers.utils.formatEther(exchangeRate)
      };
    } catch (error) {
      console.error('Error getting crypto to fiat quote:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId) {
    try {
      const transaction = await this.contract.getTransaction(transactionId);

      return {
        success: true,
        transaction: {
          user: transaction.user,
          type: transaction.transactionType,
          token: transaction.token,
          amount: transaction.amount.toString(),
          fiatAmount: ethers.utils.formatUnits(transaction.fiatAmount, 6),
          fiatCurrency: transaction.fiatCurrency,
          externalTxId: transaction.externalTxId,
          timestamp: new Date(transaction.timestamp.toNumber() * 1000).toISOString(),
          status: this.getStatusString(transaction.status)
        }
      };
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get status string from enum
   */
  getStatusString(statusEnum) {
    const statuses = ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded'];
    return statuses[statusEnum] || 'Unknown';
  }

  /**
   * Update exchange rates (should be called by oracle)
   */
  async updateExchangeRate(currency, rate) {
    try {
      const tx = await this.contract.updateExchangeRate(
        currency,
        ethers.utils.parseEther(rate.toString())
      );
      const receipt = await tx.wait();

      return {
        success: true,
        currency: currency,
        rate: rate,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = PaymentGatewayService;
