// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PaymentGateway
 * @dev Integration for seamless fiat-to-crypto and crypto-to-fiat conversions
 * Works with regulated third-party payment processors
 */
contract PaymentGateway is ReentrancyGuard, Ownable, Pausable {
    
    struct Transaction {
        address user;
        string transactionType;  // "fiat_to_crypto" or "crypto_to_fiat"
        address token;
        uint256 amount;
        uint256 fiatAmount;
        string fiatCurrency;     // e.g., "USD", "EUR", "GBP"
        string externalTxId;     // External payment processor transaction ID
        uint256 timestamp;
        TransactionStatus status;
    }
    
    enum TransactionStatus {
        Pending,
        Processing,
        Completed,
        Failed,
        Refunded
    }
    
    struct PaymentProcessor {
        string name;
        address processorAddress;
        bool isActive;
        uint256 feePercentage;   // Fee in basis points (100 = 1%)
    }
    
    // Mappings
    mapping(uint256 => Transaction) public transactions;
    mapping(address => PaymentProcessor) public paymentProcessors;
    mapping(address => bool) public supportedTokens;
    mapping(string => uint256) public exchangeRates; // Currency to rate mapping (scaled by 1e18)
    
    uint256 public transactionCount;
    address[] public processorAddresses;
    
    // Platform fee (in basis points, 100 = 1%)
    uint256 public platformFee = 50; // 0.5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    // Events
    event TransactionCreated(
        uint256 indexed transactionId,
        address indexed user,
        string transactionType,
        uint256 amount,
        uint256 fiatAmount,
        string fiatCurrency
    );
    event TransactionStatusUpdated(uint256 indexed transactionId, TransactionStatus status);
    event PaymentProcessorAdded(address indexed processor, string name);
    event PaymentProcessorRemoved(address indexed processor);
    event TokenSupportUpdated(address indexed token, bool isSupported);
    event ExchangeRateUpdated(string currency, uint256 rate);
    event FeeUpdated(uint256 newFee);
    event FundsWithdrawn(address token, address to, uint256 amount);
    
    constructor() {
        // Initialize with common exchange rates (these should be updated by oracles)
        exchangeRates["USD"] = 1 * 1e18;  // 1 USD = 1 USD (base)
        exchangeRates["EUR"] = 1.1 * 1e18; // Example rate
        exchangeRates["GBP"] = 1.25 * 1e18; // Example rate
    }
    
    modifier onlyProcessor() {
        require(paymentProcessors[msg.sender].isActive, "Not authorized processor");
        _;
    }
    
    /**
     * @dev Add a payment processor
     */
    function addPaymentProcessor(
        address processorAddress,
        string memory name,
        uint256 feePercentage
    ) external onlyOwner {
        require(processorAddress != address(0), "Invalid address");
        require(!paymentProcessors[processorAddress].isActive, "Processor exists");
        require(feePercentage <= 500, "Fee too high"); // Max 5%
        
        paymentProcessors[processorAddress] = PaymentProcessor({
            name: name,
            processorAddress: processorAddress,
            isActive: true,
            feePercentage: feePercentage
        });
        
        processorAddresses.push(processorAddress);
        emit PaymentProcessorAdded(processorAddress, name);
    }
    
    /**
     * @dev Remove a payment processor
     */
    function removePaymentProcessor(address processorAddress) external onlyOwner {
        require(paymentProcessors[processorAddress].isActive, "Processor doesn't exist");
        paymentProcessors[processorAddress].isActive = false;
        emit PaymentProcessorRemoved(processorAddress);
    }
    
    /**
     * @dev Update token support
     */
    function setSupportedToken(address token, bool isSupported) external onlyOwner {
        supportedTokens[token] = isSupported;
        emit TokenSupportUpdated(token, isSupported);
    }
    
    /**
     * @dev Update exchange rate (should be called by oracle or owner)
     */
    function updateExchangeRate(string memory currency, uint256 rate) external onlyOwner {
        require(rate > 0, "Invalid rate");
        exchangeRates[currency] = rate;
        emit ExchangeRateUpdated(currency, rate);
    }
    
    /**
     * @dev Create fiat to crypto transaction
     */
    function createFiatToCryptoTransaction(
        address user,
        address token,
        uint256 cryptoAmount,
        uint256 fiatAmount,
        string memory fiatCurrency,
        string memory externalTxId
    ) external onlyProcessor whenNotPaused returns (uint256) {
        require(supportedTokens[token], "Token not supported");
        require(cryptoAmount > 0 && fiatAmount > 0, "Invalid amounts");
        
        transactionCount++;
        
        transactions[transactionCount] = Transaction({
            user: user,
            transactionType: "fiat_to_crypto",
            token: token,
            amount: cryptoAmount,
            fiatAmount: fiatAmount,
            fiatCurrency: fiatCurrency,
            externalTxId: externalTxId,
            timestamp: block.timestamp,
            status: TransactionStatus.Pending
        });
        
        emit TransactionCreated(
            transactionCount,
            user,
            "fiat_to_crypto",
            cryptoAmount,
            fiatAmount,
            fiatCurrency
        );
        
        return transactionCount;
    }
    
    /**
     * @dev Create crypto to fiat transaction
     */
    function createCryptoToFiatTransaction(
        address token,
        uint256 cryptoAmount,
        uint256 fiatAmount,
        string memory fiatCurrency,
        string memory externalTxId
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(supportedTokens[token], "Token not supported");
        require(cryptoAmount > 0 && fiatAmount > 0, "Invalid amounts");
        
        // Transfer crypto from user to contract
        IERC20(token).transferFrom(msg.sender, address(this), cryptoAmount);
        
        transactionCount++;
        
        transactions[transactionCount] = Transaction({
            user: msg.sender,
            transactionType: "crypto_to_fiat",
            token: token,
            amount: cryptoAmount,
            fiatAmount: fiatAmount,
            fiatCurrency: fiatCurrency,
            externalTxId: externalTxId,
            timestamp: block.timestamp,
            status: TransactionStatus.Pending
        });
        
        emit TransactionCreated(
            transactionCount,
            msg.sender,
            "crypto_to_fiat",
            cryptoAmount,
            fiatAmount,
            fiatCurrency
        );
        
        return transactionCount;
    }
    
    /**
     * @dev Complete fiat to crypto transaction (processor sends crypto to user)
     */
    function completeFiatToCrypto(
        uint256 transactionId
    ) external onlyProcessor nonReentrant {
        Transaction storage txn = transactions[transactionId];
        require(txn.status == TransactionStatus.Pending || txn.status == TransactionStatus.Processing, "Invalid status");
        require(keccak256(bytes(txn.transactionType)) == keccak256(bytes("fiat_to_crypto")), "Invalid type");
        
        // Calculate fees
        PaymentProcessor memory processor = paymentProcessors[msg.sender];
        uint256 processorFee = (txn.amount * processor.feePercentage) / FEE_DENOMINATOR;
        uint256 platformFeeAmount = (txn.amount * platformFee) / FEE_DENOMINATOR;
        uint256 amountToUser = txn.amount - processorFee - platformFeeAmount;
        
        // Transfer crypto to user
        IERC20(txn.token).transfer(txn.user, amountToUser);
        
        // Update status
        txn.status = TransactionStatus.Completed;
        emit TransactionStatusUpdated(transactionId, TransactionStatus.Completed);
    }
    
    /**
     * @dev Complete crypto to fiat transaction (after fiat is sent to user)
     */
    function completeCryptoToFiat(
        uint256 transactionId
    ) external onlyProcessor nonReentrant {
        Transaction storage txn = transactions[transactionId];
        require(txn.status == TransactionStatus.Pending || txn.status == TransactionStatus.Processing, "Invalid status");
        require(keccak256(bytes(txn.transactionType)) == keccak256(bytes("crypto_to_fiat")), "Invalid type");
        
        // Calculate fees
        PaymentProcessor memory processor = paymentProcessors[msg.sender];
        uint256 processorFee = (txn.amount * processor.feePercentage) / FEE_DENOMINATOR;
        uint256 platformFeeAmount = (txn.amount * platformFee) / FEE_DENOMINATOR;
        uint256 amountToProcessor = txn.amount - platformFeeAmount;
        
        // Transfer crypto to processor (they handle fiat conversion)
        IERC20(txn.token).transfer(msg.sender, amountToProcessor);
        
        // Update status
        txn.status = TransactionStatus.Completed;
        emit TransactionStatusUpdated(transactionId, TransactionStatus.Completed);
    }
    
    /**
     * @dev Update transaction status
     */
    function updateTransactionStatus(
        uint256 transactionId,
        TransactionStatus status
    ) external onlyProcessor {
        Transaction storage txn = transactions[transactionId];
        require(txn.timestamp > 0, "Transaction doesn't exist");
        
        txn.status = status;
        emit TransactionStatusUpdated(transactionId, status);
    }
    
    /**
     * @dev Refund a transaction
     */
    function refundTransaction(uint256 transactionId) external onlyProcessor nonReentrant {
        Transaction storage txn = transactions[transactionId];
        require(txn.status != TransactionStatus.Completed && txn.status != TransactionStatus.Refunded, "Cannot refund");
        
        if (keccak256(bytes(txn.transactionType)) == keccak256(bytes("crypto_to_fiat"))) {
            // Refund crypto to user
            IERC20(txn.token).transfer(txn.user, txn.amount);
        }
        
        txn.status = TransactionStatus.Refunded;
        emit TransactionStatusUpdated(transactionId, TransactionStatus.Refunded);
    }
    
    /**
     * @dev Get conversion quote
     */
    function getConversionQuote(
        uint256 fiatAmount,
        string memory fiatCurrency,
        address token
    ) external view returns (uint256 cryptoAmount, uint256 totalFees) {
        require(supportedTokens[token], "Token not supported");
        require(exchangeRates[fiatCurrency] > 0, "Currency not supported");
        
        // Simplified calculation (in production, use Chainlink or other oracles)
        cryptoAmount = (fiatAmount * 1e18) / exchangeRates[fiatCurrency];
        
        // Calculate total fees
        totalFees = (cryptoAmount * (platformFee + 100)) / FEE_DENOMINATOR; // Assuming avg processor fee of 1%
        cryptoAmount = cryptoAmount - totalFees;
    }
    
    /**
     * @dev Update platform fee
     */
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 200, "Fee too high"); // Max 2%
        platformFee = newFee;
        emit FeeUpdated(newFee);
    }
    
    /**
     * @dev Withdraw accumulated fees
     */
    function withdrawFees(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        IERC20(token).transfer(to, amount);
        emit FundsWithdrawn(token, to, amount);
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get transaction details
     */
    function getTransaction(uint256 transactionId) external view returns (Transaction memory) {
        return transactions[transactionId];
    }
    
    /**
     * @dev Get all processor addresses
     */
    function getProcessorAddresses() external view returns (address[] memory) {
        return processorAddresses;
    }
}
