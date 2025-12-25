/**
 * Represents a transaction in the blockchain
 */
class Transaction {
  constructor(fromAddress, toAddress, amount, type = 'transfer', metadata = {}) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.type = type; // transfer, employment, social, enterprise
    this.metadata = metadata;
    this.timestamp = Date.now();
  }

  /**
   * Validate the transaction
   */
  isValid() {
    // Genesis transactions from null are valid
    if (this.fromAddress === null) return true;
    
    if (!this.fromAddress || !this.toAddress) {
      return false;
    }

    if (this.amount <= 0) {
      return false;
    }

    return true;
  }

  /**
   * Get a string representation of the transaction
   */
  toString() {
    return `Transaction: ${this.fromAddress} -> ${this.toAddress} (${this.amount}) [${this.type}]`;
  }
}

module.exports = Transaction;
