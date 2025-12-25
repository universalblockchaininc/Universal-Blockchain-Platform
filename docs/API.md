# API Documentation

## Table of Contents
1. [DEX API](#dex-api)
2. [Tokenization API](#tokenization-api)
3. [Payment Gateway API](#payment-gateway-api)
4. [Wallet API](#wallet-api)

---

## DEX API

### Create Pool

Create a new liquidity pool for a token pair.

```javascript
await dexService.createPool(tokenA, tokenB);
```

**Parameters:**
- `tokenA` (address): First token address
- `tokenB` (address): Second token address

**Returns:**
```javascript
{
  success: true,
  poolId: "0x...",
  transactionHash: "0x..."
}
```

### Add Liquidity

Add liquidity to an existing pool.

```javascript
await dexService.addLiquidity(tokenA, tokenB, amountA, amountB);
```

**Parameters:**
- `tokenA` (address): First token address
- `tokenB` (address): Second token address
- `amountA` (BigNumber): Amount of token A
- `amountB` (BigNumber): Amount of token B

**Returns:**
```javascript
{
  success: true,
  transactionHash: "0x..."
}
```

### Swap Tokens

Execute a token swap.

```javascript
await dexService.swap(tokenFrom, tokenTo, amountIn, minAmountOut);
```

**Parameters:**
- `tokenFrom` (address): Input token address
- `tokenTo` (address): Output token address
- `amountIn` (BigNumber): Input amount
- `minAmountOut` (BigNumber): Minimum output amount (slippage protection)

**Returns:**
```javascript
{
  success: true,
  expectedOutput: "1000000000000000000",
  transactionHash: "0x..."
}
```

### Get Quote

Get a price quote for a swap.

```javascript
await dexService.getQuote(tokenFrom, tokenTo, amountIn);
```

**Parameters:**
- `tokenFrom` (address): Input token address
- `tokenTo` (address): Output token address
- `amountIn` (BigNumber): Input amount

**Returns:**
```javascript
{
  success: true,
  amountIn: "1000000000000000000",
  amountOut: "950000000000000000",
  priceImpact: "5.00%"
}
```

---

## Tokenization API

### Tokenize Asset (NFT)

Create an NFT for a real-world asset.

```javascript
await tokenizationService.tokenizeAsNFT({
  owner: "0x...",
  assetType: "Real Estate",
  description: "Property description",
  location: "City, State",
  valuation: 500000,
  ipfsHash: "Qm..."
});
```

**Parameters:**
- `owner` (address): Asset owner address
- `assetType` (string): Type of asset
- `description` (string): Asset description
- `location` (string): Asset location
- `valuation` (number): Asset valuation in base currency
- `ipfsHash` (string): IPFS hash for additional documents

**Returns:**
```javascript
{
  success: true,
  tokenId: "1",
  transactionHash: "0x...",
  contractAddress: "0x..."
}
```

### Verify Asset

Verify an NFT asset's authenticity.

```javascript
await tokenizationService.verifyNFTAsset(tokenId);
```

**Parameters:**
- `tokenId` (number): Token ID to verify

**Returns:**
```javascript
{
  success: true,
  tokenId: "1",
  transactionHash: "0x..."
}
```

### Create Fungible Token

Create a fungible or semi-fungible token.

```javascript
await tokenizationService.createFungibleToken({
  name: "Gold Token",
  assetType: "Commodity",
  totalSupply: 1000000,
  pricePerUnit: 100,
  isFungible: true,
  ipfsHash: "Qm..."
});
```

**Parameters:**
- `name` (string): Token name
- `assetType` (string): Type of asset
- `totalSupply` (number): Total supply
- `pricePerUnit` (number): Price per unit
- `isFungible` (boolean): Whether fully fungible
- `ipfsHash` (string): IPFS hash for metadata

**Returns:**
```javascript
{
  success: true,
  tokenId: "1",
  transactionHash: "0x...",
  contractAddress: "0x..."
}
```

### Get NFT Metadata

Retrieve metadata for an NFT asset.

```javascript
await tokenizationService.getNFTMetadata(tokenId);
```

**Parameters:**
- `tokenId` (number): Token ID

**Returns:**
```javascript
{
  success: true,
  metadata: {
    assetType: "Real Estate",
    description: "Property description",
    location: "City, State",
    valuation: "500000",
    creationDate: "2025-12-25T17:00:00.000Z",
    isVerified: true,
    ipfsHash: "Qm..."
  }
}
```

---

## Payment Gateway API

### Fiat to Crypto

Initiate a fiat to crypto conversion.

```javascript
await paymentService.initiateFiatToCrypto({
  userId: "user123",
  userAddress: "0x...",
  token: "0x...",
  fiatAmount: 1000,
  fiatCurrency: "USD",
  paymentMethod: "stripe"
});
```

**Parameters:**
- `userId` (string): User identifier
- `userAddress` (address): User's wallet address
- `token` (address): Crypto token address
- `fiatAmount` (number): Fiat amount
- `fiatCurrency` (string): Currency code (USD, EUR, GBP)
- `paymentMethod` (string): Payment method (stripe, paypal)

**Returns:**
```javascript
{
  success: true,
  transactionId: "1",
  cryptoAmount: "1000000000000000000",
  fiatAmount: 1000,
  externalTxId: "stripe_1234567890",
  transactionHash: "0x..."
}
```

### Crypto to Fiat

Initiate a crypto to fiat conversion.

```javascript
await paymentService.initiateCryptoToFiat({
  token: "0x...",
  cryptoAmount: ethers.utils.parseEther("100"),
  fiatCurrency: "USD",
  withdrawalMethod: "bank_account"
});
```

**Parameters:**
- `token` (address): Crypto token address
- `cryptoAmount` (BigNumber): Crypto amount
- `fiatCurrency` (string): Currency code
- `withdrawalMethod` (string): Withdrawal method

**Returns:**
```javascript
{
  success: true,
  transactionId: "2",
  cryptoAmount: "100000000000000000000",
  fiatAmount: 10000,
  withdrawalId: "withdrawal_1234567890",
  transactionHash: "0x..."
}
```

### Get Conversion Quote

Get a quote for fiat to crypto conversion.

```javascript
await paymentService.getConversionQuote(1000, "USD", tokenAddress);
```

**Parameters:**
- `fiatAmount` (number): Fiat amount
- `fiatCurrency` (string): Currency code
- `token` (address): Crypto token address

**Returns:**
```javascript
{
  success: true,
  cryptoAmount: "1000000000000000000",
  totalFees: "15000000000000000",
  fiatAmount: 1000
}
```

### Get Transaction Status

Check the status of a payment gateway transaction.

```javascript
await paymentService.getTransactionStatus(transactionId);
```

**Parameters:**
- `transactionId` (number): Transaction ID

**Returns:**
```javascript
{
  success: true,
  transaction: {
    user: "0x...",
    type: "fiat_to_crypto",
    token: "0x...",
    amount: "1000000000000000000",
    fiatAmount: "1000.00",
    fiatCurrency: "USD",
    externalTxId: "stripe_1234567890",
    timestamp: "2025-12-25T17:00:00.000Z",
    status: "Completed"
  }
}
```

---

## Wallet API

### Create Wallet

Create a new multi-signature wallet.

```javascript
await walletService.createWallet(
  ["0xOwner1...", "0xOwner2...", "0xOwner3..."],
  2
);
```

**Parameters:**
- `owners` (address[]): Array of owner addresses
- `requiredConfirmations` (number): Number of required confirmations

**Returns:**
```javascript
{
  success: true,
  walletId: "1",
  owners: ["0x...", "0x...", "0x..."],
  requiredConfirmations: 2,
  transactionHash: "0x..."
}
```

### Deposit ETH

Deposit ETH to a wallet.

```javascript
await walletService.depositETH(walletId, 1.5);
```

**Parameters:**
- `walletId` (number): Wallet ID
- `amount` (number): Amount in ETH

**Returns:**
```javascript
{
  success: true,
  walletId: "1",
  amount: 1.5,
  transactionHash: "0x..."
}
```

### Submit Transaction

Submit a transaction for confirmation.

```javascript
await walletService.submitTransaction(
  walletId,
  recipientAddress,
  ethers.utils.parseEther("1.0"),
  ethers.constants.AddressZero,
  "0x"
);
```

**Parameters:**
- `walletId` (number): Wallet ID
- `to` (address): Recipient address
- `value` (BigNumber): Amount
- `token` (address): Token address (AddressZero for ETH)
- `data` (bytes): Transaction data

**Returns:**
```javascript
{
  success: true,
  walletId: "1",
  txIndex: "0",
  transactionHash: "0x..."
}
```

### Confirm Transaction

Confirm a pending transaction.

```javascript
await walletService.confirmTransaction(walletId, txIndex);
```

**Parameters:**
- `walletId` (number): Wallet ID
- `txIndex` (number): Transaction index

**Returns:**
```javascript
{
  success: true,
  walletId: "1",
  txIndex: "0",
  transactionHash: "0x..."
}
```

### Get Wallet Balance

Get the ETH balance of a wallet.

```javascript
await walletService.getBalance(walletId);
```

**Parameters:**
- `walletId` (number): Wallet ID

**Returns:**
```javascript
{
  success: true,
  walletId: "1",
  balance: "10.5",
  balanceWei: "10500000000000000000"
}
```

### Get User Wallets

Get all wallets for a user.

```javascript
await walletService.getUserWallets(userAddress);
```

**Parameters:**
- `userAddress` (address): User address

**Returns:**
```javascript
{
  success: true,
  userAddress: "0x...",
  wallets: [
    {
      walletId: "1",
      owners: ["0x...", "0x..."],
      requiredConfirmations: "2",
      isActive: true,
      createdAt: "2025-12-25T17:00:00.000Z"
    }
  ]
}
```

---

## Error Handling

All API methods return a consistent error format:

```javascript
{
  success: false,
  error: "Error message description"
}
```

Common error scenarios:
- Invalid addresses
- Insufficient balance
- Unauthorized access
- Network errors
- Transaction reverted

## Events

All smart contracts emit events for important actions. Listen to these events for real-time updates:

### DEX Events
- `PoolCreated`
- `LiquidityAdded`
- `LiquidityRemoved`
- `TokenSwapped`
- `OrderCreated`

### Tokenization Events
- `AssetTokenized`
- `AssetVerified`
- `TokenCreated`
- `TokenMinted`

### Payment Gateway Events
- `TransactionCreated`
- `TransactionStatusUpdated`
- `PaymentProcessorAdded`

### Wallet Events
- `WalletCreated`
- `DepositReceived`
- `TransactionSubmitted`
- `TransactionConfirmed`
- `TransactionExecuted`

Example event listener:

```javascript
contract.on("TokenSwapped", (trader, tokenFrom, tokenTo, amountFrom, amountTo) => {
  console.log(`Swap: ${amountFrom} ${tokenFrom} -> ${amountTo} ${tokenTo}`);
});
```
