# Universal Blockchain Platform - Examples

This directory contains practical examples demonstrating how to use the Universal Blockchain Platform features.

## Examples

### 1. DEX Trading

**File:** `dex-trading.js`

Demonstrates:
- Creating liquidity pools
- Adding liquidity
- Executing token swaps
- Getting price quotes

### 2. Asset Tokenization

**File:** `asset-tokenization.js`

Demonstrates:
- Tokenizing real-world assets as NFTs
- Creating fungible asset tokens
- Managing asset metadata
- Transferring tokenized assets

### 3. Payment Gateway

**File:** `payment-gateway.js`

Demonstrates:
- Fiat to crypto conversions
- Crypto to fiat conversions
- Getting conversion quotes
- Tracking transaction status

### 4. Multi-Sig Wallet

**File:** `multisig-wallet.js`

Demonstrates:
- Creating multi-signature wallets
- Managing wallet owners
- Submitting transactions
- Confirming and executing transactions

## Running Examples

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Start a local Hardhat node:
```bash
npx hardhat node
```

3. Deploy contracts (in another terminal):
```bash
npm run deploy
```

4. Update contract addresses in examples

### Run an Example

```bash
npx hardhat run examples/dex-trading.js --network localhost
```

## Configuration

Each example includes configuration at the top of the file:

```javascript
const CONTRACT_ADDRESS = "0x..."; // Update with your deployed address
const PROVIDER_URL = "http://127.0.0.1:8545";
const PRIVATE_KEY = "0x..."; // Your test private key
```

## Integration with Frontend

These examples can be adapted for use in web applications:

```javascript
// Web3 Frontend Example
import { ethers } from 'ethers';

// Connect to wallet
const provider = new ethers.providers.Web3Provider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = provider.getSigner();

// Use contract
const dex = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);
await dex.swap(tokenFrom, tokenTo, amountIn, minAmountOut);
```

## Support

For questions about examples:
- Check main documentation: [docs/README.md](../docs/README.md)
- Review API documentation: [docs/API.md](../docs/API.md)
- Open a GitHub issue
