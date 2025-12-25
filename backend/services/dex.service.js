const ethers = require('ethers');

/**
 * DEX Service - Trading Engine
 * Handles order matching, liquidity management, and trade execution
 */
class DEXService {
  constructor(contractAddress, provider, signer) {
    this.contractAddress = contractAddress;
    this.provider = provider;
    this.signer = signer;
    // In production, load ABI from compiled contracts
    this.contract = new ethers.Contract(contractAddress, [], signer);
  }

  /**
   * Create a new liquidity pool
   */
  async createPool(tokenA, tokenB) {
    try {
      const tx = await this.contract.createPool(tokenA, tokenB);
      const receipt = await tx.wait();
      
      const poolCreatedEvent = receipt.events.find(e => e.event === 'PoolCreated');
      const poolId = poolCreatedEvent.args.poolId;
      
      return {
        success: true,
        poolId: poolId,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error creating pool:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add liquidity to a pool
   */
  async addLiquidity(tokenA, tokenB, amountA, amountB) {
    try {
      const tx = await this.contract.addLiquidity(tokenA, tokenB, amountA, amountB);
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error adding liquidity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute a token swap
   */
  async swap(tokenFrom, tokenTo, amountIn, minAmountOut) {
    try {
      // Get quote first
      const quote = await this.getQuote(tokenFrom, tokenTo, amountIn);
      
      // Execute swap
      const tx = await this.contract.swap(tokenFrom, tokenTo, amountIn, minAmountOut);
      const receipt = await tx.wait();
      
      return {
        success: true,
        expectedOutput: quote.amountOut,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error executing swap:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get price quote for a swap
   */
  async getQuote(tokenFrom, tokenTo, amountIn) {
    try {
      const amountOut = await this.contract.getQuote(tokenFrom, tokenTo, amountIn);
      
      return {
        success: true,
        amountIn: amountIn.toString(),
        amountOut: amountOut.toString(),
        priceImpact: this.calculatePriceImpact(amountIn, amountOut)
      };
    } catch (error) {
      console.error('Error getting quote:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a limit order
   */
  async createOrder(tokenFrom, tokenTo, amountFrom, amountTo) {
    try {
      const tx = await this.contract.createOrder(tokenFrom, tokenTo, amountFrom, amountTo);
      const receipt = await tx.wait();
      
      const orderCreatedEvent = receipt.events.find(e => e.event === 'OrderCreated');
      const orderId = orderCreatedEvent.args.orderId;
      
      return {
        success: true,
        orderId: orderId.toString(),
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pool reserves
   */
  async getPoolReserves(tokenA, tokenB) {
    try {
      const poolId = await this.contract.getPoolId(tokenA, tokenB);
      const reserves = await this.contract.getReserves(poolId);
      
      return {
        success: true,
        poolId: poolId,
        reserveA: reserves.reserveA.toString(),
        reserveB: reserves.reserveB.toString()
      };
    } catch (error) {
      console.error('Error getting reserves:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate price impact
   */
  calculatePriceImpact(amountIn, amountOut) {
    // Simplified price impact calculation
    // In production, use more sophisticated calculations
    const impact = (amountIn - amountOut) / amountIn * 100;
    return impact.toFixed(2) + '%';
  }

  /**
   * Get trading history
   */
  async getTradingHistory(userAddress, limit = 100) {
    try {
      const filter = this.contract.filters.TokenSwapped(userAddress);
      const events = await this.contract.queryFilter(filter, -limit);
      
      return {
        success: true,
        trades: events.map(event => ({
          tokenFrom: event.args.tokenFrom,
          tokenTo: event.args.tokenTo,
          amountFrom: event.args.amountFrom.toString(),
          amountTo: event.args.amountTo.toString(),
          timestamp: event.blockNumber
        }))
      };
    } catch (error) {
      console.error('Error getting trading history:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = DEXService;
