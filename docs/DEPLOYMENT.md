# Deployment Guide

This guide walks you through deploying the Universal Blockchain Platform to various networks.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Configuration](#configuration)
3. [Local Deployment](#local-deployment)
4. [Testnet Deployment](#testnet-deployment)
5. [Mainnet Deployment](#mainnet-deployment)
6. [Post-Deployment](#post-deployment)
7. [Verification](#verification)

---

## Prerequisites

### Required Tools
- Node.js v16 or higher
- npm or yarn
- Git

### Required Accounts
- Ethereum wallet with private key
- RPC provider account (Infura, Alchemy, etc.)
- Etherscan API key (for contract verification)
- Sufficient ETH for gas fees

### Estimated Gas Costs
- **Testnet**: ~0.1-0.5 test ETH
- **Mainnet**: ~0.5-2 ETH (varies with gas price)

---

## Configuration

### 1. Clone and Install

```bash
git clone https://github.com/universalblockchaininc/Universal-Blockchain-Platform.git
cd Universal-Blockchain-Platform
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# RPC URLs
GOERLI_RPC_URL=https://goerli.infura.io/v3/YOUR_PROJECT_ID
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID

# Etherscan API key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**⚠️ Security Warning:** Never commit your `.env` file or share your private key!

### 3. Compile Contracts

```bash
npm run compile
```

This will:
- Compile all Solidity contracts
- Generate ABIs in `artifacts/`
- Create TypeScript types in `typechain-types/`

---

## Local Deployment

Deploy to a local Hardhat network for development and testing.

### 1. Start Local Node

In terminal 1:
```bash
npx hardhat node
```

This starts a local Ethereum node at `http://127.0.0.1:8545/` with 20 funded accounts.

### 2. Deploy Contracts

In terminal 2:
```bash
npm run deploy
```

### 3. Test Deployment

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test tests/dex.test.js
```

### Local Network Details
- **Network ID**: 1337
- **RPC URL**: http://127.0.0.1:8545
- **Pre-funded accounts**: 20 accounts with 10000 ETH each
- **Blockchain Explorer**: None (use logs)

---

## Testnet Deployment

Deploy to Goerli testnet for public testing.

### 1. Get Test ETH

Get Goerli ETH from faucets:
- https://goerlifaucet.com/
- https://faucet.paradigm.xyz/
- https://faucet.quicknode.com/

You'll need approximately 0.1-0.5 test ETH.

### 2. Verify Configuration

Ensure your `.env` has:
- Valid `PRIVATE_KEY`
- Valid `GOERLI_RPC_URL`
- Valid `ETHERSCAN_API_KEY`

### 3. Deploy to Goerli

```bash
npm run deploy:testnet
```

This will:
1. Deploy all contracts to Goerli
2. Save addresses to `deployments/goerli.json`
3. Wait for confirmations
4. Verify contracts on Etherscan (if API key provided)

### 4. Verify Deployment

Check deployment file:
```bash
cat deployments/goerli.json
```

Expected output:
```json
{
  "network": "goerli",
  "timestamp": "2025-12-25T17:00:00.000Z",
  "contracts": {
    "DEX": "0x...",
    "NFTAsset": "0x...",
    "FungibleAsset": "0x...",
    "PaymentGateway": "0x...",
    "DecentralizedWallet": "0x..."
  }
}
```

### 5. Test on Testnet

```bash
# Test DEX functionality
npx hardhat run scripts/test-dex.js --network goerli

# Test wallet functionality
npx hardhat run scripts/test-wallet.js --network goerli
```

### Goerli Network Details
- **Network ID**: 5
- **Block Time**: ~15 seconds
- **Blockchain Explorer**: https://goerli.etherscan.io
- **Faucets**: Multiple available

---

## Mainnet Deployment

Deploy to Ethereum mainnet for production.

### ⚠️ Pre-Deployment Checklist

- [ ] Contracts thoroughly tested on testnet
- [ ] Security audit completed
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Sufficient ETH for deployment (~1-2 ETH)
- [ ] Multi-sig wallet prepared for ownership
- [ ] Emergency procedures documented
- [ ] Team ready for monitoring

### 1. Final Testing

Run comprehensive tests:
```bash
npm test
npx hardhat coverage
```

### 2. Deploy to Mainnet

```bash
npm run deploy:mainnet
```

**⚠️ This will use real ETH!**

### 3. Transfer Ownership

After deployment, transfer contract ownership to a multi-sig wallet:

```javascript
// scripts/transfer-ownership.js
const multiSigAddress = "0xYourMultiSigAddress";

// Transfer each contract
await dex.transferOwnership(multiSigAddress);
await nftAsset.transferOwnership(multiSigAddress);
await fungibleAsset.transferOwnership(multiSigAddress);
await paymentGateway.transferOwnership(multiSigAddress);
await wallet.transferOwnership(multiSigAddress);
```

Run:
```bash
npx hardhat run scripts/transfer-ownership.js --network mainnet
```

### 4. Verify on Etherscan

If automatic verification fails:

```bash
npx hardhat verify --network mainnet CONTRACT_ADDRESS
```

---

## Post-Deployment

### 1. Configure Contracts

#### DEX Configuration
```javascript
// Set trading fee
await dex.setTradingFee(30); // 0.3%
```

#### Tokenization Configuration
```javascript
// Add verifiers
await nftAsset.addVerifier("0xVerifierAddress");

// Add minters
await fungibleAsset.addMinter("0xMinterAddress");
```

#### Payment Gateway Configuration
```javascript
// Add payment processors
await paymentGateway.addPaymentProcessor(
  "0xProcessorAddress",
  "Stripe",
  100 // 1% fee
);

// Set supported tokens
await paymentGateway.setSupportedToken("0xUSDCAddress", true);
await paymentGateway.setSupportedToken("0xUSDTAddress", true);
```

### 2. Set Up Monitoring

Monitor contract events:
```javascript
// Monitor DEX swaps
dex.on("TokenSwapped", (trader, tokenFrom, tokenTo, amountFrom, amountTo) => {
  console.log(`Swap: ${trader} swapped ${amountFrom} for ${amountTo}`);
});

// Monitor wallet transactions
wallet.on("TransactionExecuted", (walletId, txIndex) => {
  console.log(`Transaction executed: ${walletId}-${txIndex}`);
});
```

### 3. Update Frontend

Update frontend configuration with deployed addresses:

```javascript
// config/contracts.js
export const CONTRACTS = {
  DEX: "0x...",
  NFTAsset: "0x...",
  FungibleAsset: "0x...",
  PaymentGateway: "0x...",
  DecentralizedWallet: "0x..."
};
```

### 4. Documentation

Update documentation with:
- Deployed contract addresses
- Network-specific details
- User guides
- API endpoints

---

## Verification

### Manual Verification on Etherscan

1. Go to Etherscan (etherscan.io or goerli.etherscan.io)
2. Navigate to your contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Select:
   - Compiler: v0.8.19
   - License: MIT
   - Optimization: Yes (200 runs)
6. Paste flattened source code
7. Submit

### Automated Verification

If automatic verification during deployment fails:

```bash
npx hardhat verify --network goerli CONTRACT_ADDRESS
```

For contracts with constructor arguments:

```bash
npx hardhat verify --network goerli CONTRACT_ADDRESS "arg1" "arg2"
```

---

## Troubleshooting

### Gas Price Too High

Adjust gas price in `hardhat.config.js`:

```javascript
networks: {
  goerli: {
    gasPrice: 20000000000 // 20 gwei
  }
}
```

### Insufficient Funds

Ensure your wallet has enough ETH:
```bash
npx hardhat run scripts/check-balance.js --network goerli
```

### RPC Errors

If RPC calls fail:
1. Check RPC URL is correct
2. Verify API key is valid
3. Try alternative RPC provider
4. Check rate limits

### Contract Size Too Large

If contract exceeds size limit:
1. Enable optimizer in `hardhat.config.js`
2. Increase optimizer runs
3. Split into multiple contracts
4. Remove unnecessary code

---

## Maintenance

### Upgrade Contracts

For upgradeable contracts (if implemented):

```bash
npx hardhat run scripts/upgrade.js --network mainnet
```

### Pause Contracts

In case of emergency:

```javascript
await paymentGateway.pause();
await nftAsset.pause();
```

### Update Parameters

```javascript
// Update DEX fee
await dex.setTradingFee(25); // 0.25%

// Update exchange rates
await paymentGateway.updateExchangeRate("USD", ethers.utils.parseEther("1"));
```

---

## Security Best Practices

1. **Never share private keys**
2. **Use hardware wallets for mainnet**
3. **Transfer ownership to multi-sig**
4. **Test thoroughly on testnet first**
5. **Monitor contracts 24/7**
6. **Have emergency procedures ready**
7. **Keep dependencies updated**
8. **Conduct regular security audits**

---

## Support

For deployment issues:
- Check documentation: [docs/README.md](README.md)
- Review logs: `logs/deployment.log`
- Open GitHub issue
- Contact: support@universalblockchain.io

---

## Next Steps

After successful deployment:

1. ✅ Configure contract parameters
2. ✅ Transfer ownership to multi-sig
3. ✅ Set up monitoring
4. ✅ Update frontend
5. ✅ Test all functionality
6. ✅ Announce to community
7. ✅ Monitor for issues
