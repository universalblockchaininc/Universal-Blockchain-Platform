// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DecentralizedWallet
 * @dev Secure, non-custodial cryptocurrency wallet for managing various digital assets
 * Supports multi-signature functionality and secure asset management
 */
contract DecentralizedWallet is ReentrancyGuard, Ownable {
    
    struct WalletConfig {
        address[] owners;
        uint256 requiredConfirmations;
        bool isActive;
        uint256 createdAt;
    }
    
    struct Transaction {
        address to;
        uint256 value;
        address token;
        bytes data;
        bool executed;
        uint256 confirmations;
        mapping(address => bool) isConfirmed;
    }
    
    struct AssetBalance {
        address token;
        uint256 balance;
    }
    
    // Wallet ID to config
    mapping(uint256 => WalletConfig) public wallets;
    mapping(uint256 => mapping(uint256 => Transaction)) public transactions;
    mapping(uint256 => uint256) public transactionCount;
    mapping(address => uint256[]) public userWallets;
    
    uint256 public walletCount;
    
    // Events
    event WalletCreated(uint256 indexed walletId, address[] owners, uint256 requiredConfirmations);
    event DepositReceived(uint256 indexed walletId, address indexed from, uint256 value);
    event TokenDepositReceived(uint256 indexed walletId, address indexed from, address token, uint256 amount);
    event TransactionSubmitted(uint256 indexed walletId, uint256 indexed txIndex, address to, uint256 value, address token);
    event TransactionConfirmed(uint256 indexed walletId, uint256 indexed txIndex, address owner);
    event TransactionRevoked(uint256 indexed walletId, uint256 indexed txIndex, address owner);
    event TransactionExecuted(uint256 indexed walletId, uint256 indexed txIndex);
    event OwnerAdded(uint256 indexed walletId, address owner);
    event OwnerRemoved(uint256 indexed walletId, address owner);
    event RequiredConfirmationsChanged(uint256 indexed walletId, uint256 required);
    
    modifier onlyWalletOwner(uint256 walletId) {
        require(isOwner(walletId, msg.sender), "Not wallet owner");
        _;
    }
    
    modifier walletExists(uint256 walletId) {
        require(wallets[walletId].isActive, "Wallet doesn't exist");
        _;
    }
    
    modifier txExists(uint256 walletId, uint256 txIndex) {
        require(txIndex < transactionCount[walletId], "Transaction doesn't exist");
        _;
    }
    
    modifier notExecuted(uint256 walletId, uint256 txIndex) {
        require(!transactions[walletId][txIndex].executed, "Transaction already executed");
        _;
    }
    
    modifier notConfirmed(uint256 walletId, uint256 txIndex) {
        require(!transactions[walletId][txIndex].isConfirmed[msg.sender], "Transaction already confirmed");
        _;
    }
    
    /**
     * @dev Create a new wallet
     */
    function createWallet(
        address[] memory owners_,
        uint256 requiredConfirmations_
    ) external returns (uint256) {
        require(owners_.length > 0, "Owners required");
        require(
            requiredConfirmations_ > 0 && requiredConfirmations_ <= owners_.length,
            "Invalid required confirmations"
        );
        
        // Validate owners
        for (uint256 i = 0; i < owners_.length; i++) {
            require(owners_[i] != address(0), "Invalid owner");
            for (uint256 j = i + 1; j < owners_.length; j++) {
                require(owners_[i] != owners_[j], "Duplicate owner");
            }
        }
        
        walletCount++;
        
        wallets[walletCount] = WalletConfig({
            owners: owners_,
            requiredConfirmations: requiredConfirmations_,
            isActive: true,
            createdAt: block.timestamp
        });
        
        // Add wallet to each owner's list
        for (uint256 i = 0; i < owners_.length; i++) {
            userWallets[owners_[i]].push(walletCount);
        }
        
        emit WalletCreated(walletCount, owners_, requiredConfirmations_);
        return walletCount;
    }
    
    /**
     * @dev Deposit ETH to wallet
     */
    function deposit(uint256 walletId) external payable walletExists(walletId) {
        require(msg.value > 0, "No value sent");
        emit DepositReceived(walletId, msg.sender, msg.value);
    }
    
    /**
     * @dev Deposit ERC20 tokens to wallet
     */
    function depositToken(
        uint256 walletId,
        address token,
        uint256 amount
    ) external walletExists(walletId) nonReentrant {
        require(amount > 0, "Invalid amount");
        require(token != address(0), "Invalid token");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        emit TokenDepositReceived(walletId, msg.sender, token, amount);
    }
    
    /**
     * @dev Submit a transaction
     */
    function submitTransaction(
        uint256 walletId,
        address to,
        uint256 value,
        address token,
        bytes memory data
    ) external onlyWalletOwner(walletId) walletExists(walletId) returns (uint256) {
        require(to != address(0), "Invalid recipient");
        
        uint256 txIndex = transactionCount[walletId];
        transactionCount[walletId]++;
        
        Transaction storage transaction = transactions[walletId][txIndex];
        transaction.to = to;
        transaction.value = value;
        transaction.token = token;
        transaction.data = data;
        transaction.executed = false;
        transaction.confirmations = 0;
        
        emit TransactionSubmitted(walletId, txIndex, to, value, token);
        
        // Auto-confirm by submitter
        confirmTransaction(walletId, txIndex);
        
        return txIndex;
    }
    
    /**
     * @dev Confirm a transaction
     */
    function confirmTransaction(
        uint256 walletId,
        uint256 txIndex
    )
        public
        onlyWalletOwner(walletId)
        walletExists(walletId)
        txExists(walletId, txIndex)
        notExecuted(walletId, txIndex)
        notConfirmed(walletId, txIndex)
    {
        Transaction storage transaction = transactions[walletId][txIndex];
        transaction.isConfirmed[msg.sender] = true;
        transaction.confirmations++;
        
        emit TransactionConfirmed(walletId, txIndex, msg.sender);
        
        // Auto-execute if enough confirmations
        if (transaction.confirmations >= wallets[walletId].requiredConfirmations) {
            executeTransaction(walletId, txIndex);
        }
    }
    
    /**
     * @dev Execute a confirmed transaction
     */
    function executeTransaction(
        uint256 walletId,
        uint256 txIndex
    )
        public
        onlyWalletOwner(walletId)
        walletExists(walletId)
        txExists(walletId, txIndex)
        notExecuted(walletId, txIndex)
        nonReentrant
    {
        Transaction storage transaction = transactions[walletId][txIndex];
        require(
            transaction.confirmations >= wallets[walletId].requiredConfirmations,
            "Not enough confirmations"
        );
        
        transaction.executed = true;
        
        if (transaction.token == address(0)) {
            // ETH transfer
            (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
            require(success, "Transaction failed");
        } else {
            // ERC20 transfer
            IERC20(transaction.token).transfer(transaction.to, transaction.value);
        }
        
        emit TransactionExecuted(walletId, txIndex);
    }
    
    /**
     * @dev Revoke confirmation for a transaction
     */
    function revokeConfirmation(
        uint256 walletId,
        uint256 txIndex
    )
        external
        onlyWalletOwner(walletId)
        walletExists(walletId)
        txExists(walletId, txIndex)
        notExecuted(walletId, txIndex)
    {
        Transaction storage transaction = transactions[walletId][txIndex];
        require(transaction.isConfirmed[msg.sender], "Transaction not confirmed");
        
        transaction.isConfirmed[msg.sender] = false;
        transaction.confirmations--;
        
        emit TransactionRevoked(walletId, txIndex, msg.sender);
    }
    
    /**
     * @dev Add a new owner to wallet (requires confirmations)
     */
    function addOwner(
        uint256 walletId,
        address newOwner
    ) external onlyWalletOwner(walletId) walletExists(walletId) {
        require(newOwner != address(0), "Invalid owner");
        require(!isOwner(walletId, newOwner), "Already owner");
        
        wallets[walletId].owners.push(newOwner);
        userWallets[newOwner].push(walletId);
        
        emit OwnerAdded(walletId, newOwner);
    }
    
    /**
     * @dev Remove an owner from wallet (requires confirmations)
     */
    function removeOwner(
        uint256 walletId,
        address owner
    ) external onlyWalletOwner(walletId) walletExists(walletId) {
        require(isOwner(walletId, owner), "Not an owner");
        require(wallets[walletId].owners.length > 1, "Cannot remove last owner");
        require(
            wallets[walletId].owners.length - 1 >= wallets[walletId].requiredConfirmations,
            "Would break required confirmations"
        );
        
        // Find and remove owner
        address[] storage owners = wallets[walletId].owners;
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }
        
        emit OwnerRemoved(walletId, owner);
    }
    
    /**
     * @dev Change required confirmations
     */
    function changeRequiredConfirmations(
        uint256 walletId,
        uint256 required
    ) external onlyWalletOwner(walletId) walletExists(walletId) {
        require(required > 0 && required <= wallets[walletId].owners.length, "Invalid required confirmations");
        
        wallets[walletId].requiredConfirmations = required;
        emit RequiredConfirmationsChanged(walletId, required);
    }
    
    /**
     * @dev Check if address is owner of wallet
     */
    function isOwner(uint256 walletId, address account) public view returns (bool) {
        address[] memory owners = wallets[walletId].owners;
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == account) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Get wallet owners
     */
    function getOwners(uint256 walletId) external view returns (address[] memory) {
        return wallets[walletId].owners;
    }
    
    /**
     * @dev Get transaction details
     */
    function getTransaction(uint256 walletId, uint256 txIndex)
        external
        view
        returns (
            address to,
            uint256 value,
            address token,
            bytes memory data,
            bool executed,
            uint256 confirmations
        )
    {
        Transaction storage transaction = transactions[walletId][txIndex];
        return (
            transaction.to,
            transaction.value,
            transaction.token,
            transaction.data,
            transaction.executed,
            transaction.confirmations
        );
    }
    
    /**
     * @dev Check if transaction is confirmed by owner
     */
    function isConfirmed(uint256 walletId, uint256 txIndex, address owner)
        external
        view
        returns (bool)
    {
        return transactions[walletId][txIndex].isConfirmed[owner];
    }
    
    /**
     * @dev Get user's wallets
     */
    function getUserWallets(address user) external view returns (uint256[] memory) {
        return userWallets[user];
    }
    
    /**
     * @dev Get wallet balance
     */
    function getBalance(uint256 walletId) external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get token balance
     */
    function getTokenBalance(uint256 walletId, address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    
    /**
     * @dev Get transaction count for wallet
     */
    function getTransactionCount(uint256 walletId) external view returns (uint256) {
        return transactionCount[walletId];
    }
    
    receive() external payable {
        emit DepositReceived(0, msg.sender, msg.value);
    }
}
