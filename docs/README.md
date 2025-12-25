# Universal Blockchain Platform

The Universal Blockchain Platform is a comprehensive decentralized ecosystem that provides core financial and asset management functionalities on the blockchain. The platform integrates diverse functionalities across finance, asset management, and digital payments, all leveraging the transparency, security, and immutability of blockchain technology.

## Core Features

### 1. Decentralized Exchange (DEX)
A fully decentralized exchange for trading digital assets directly on the blockchain without intermediaries.

**Key Features:**
- **Automated Market Maker (AMM)**: Liquidity pool-based trading with constant product formula
- **Order Book**: Traditional limit order functionality for advanced traders
- **Liquidity Provision**: Earn fees by providing liquidity to trading pools
- **Multi-token Support**: Trade any ERC-20 compatible token
- **Low Fees**: 0.3% trading fee with transparent fee distribution
- **Slippage Protection**: Minimum output amount guarantees

**Smart Contract:** `contracts/DEX.sol`

### 2. Asset Tokenization
Support for tokenizing real-world assets or creating new digital assets with two token standards.

**Key Features:**
- **NFT Assets (ERC-721)**: Tokenize unique real-world assets like real estate, art, vehicles
- **Fungible Assets (ERC-1155)**: Create fungible or semi-fungible tokens for commodities, securities
- **Asset Verification**: Built-in verification system for asset authenticity
- **Metadata Management**: Store asset details on-chain with IPFS integration
- **Valuation Tracking**: Update and track asset valuations over time
- **Access Control**: Role-based permissions for verifiers and minters

**Smart Contracts:** 
- `contracts/AssetTokenization.sol` (NFTAsset, FungibleAsset)

### 3. Payment Gateway
Seamless fiat-to-crypto and crypto-to-fiat conversions through regulated third-party integrations.

**Key Features:**
- **Fiat On-Ramp**: Convert fiat currency to cryptocurrency
- **Fiat Off-Ramp**: Convert cryptocurrency to fiat currency
- **Multi-Currency Support**: USD, EUR, GBP, and more
- **Payment Processor Integration**: Support for Stripe, PayPal, and other processors
- **Transaction Tracking**: Complete audit trail of all conversions
- **Exchange Rate Management**: Real-time or oracle-based rate updates
- **Fee Management**: Transparent platform and processor fees

**Smart Contract:** `contracts/PaymentGateway.sol`

### 4. Decentralized Wallets
Secure, non-custodial cryptocurrency wallets for managing various digital assets.

**Key Features:**
- **Multi-Signature Support**: Require multiple confirmations for transactions
- **Non-Custodial**: Users maintain full control of their private keys
- **Multi-Asset Management**: Support for ETH and all ERC-20 tokens
- **Transaction Queue**: Submit, confirm, and execute transactions collaboratively
- **Owner Management**: Add or remove wallet owners dynamically
- **Configurable Security**: Adjust required confirmations as needed
- **Transparent Governance**: All actions tracked on-chain

**Smart Contract:** `contracts/DecentralizedWallet.sol`

## Architecture

```
Universal-Blockchain-Platform/
├── contracts/              # Solidity smart contracts
│   ├── DEX.sol            # Decentralized exchange
│   ├── AssetTokenization.sol  # NFT and fungible token contracts
│   ├── PaymentGateway.sol     # Fiat conversion gateway
│   └── DecentralizedWallet.sol # Multi-sig wallet
├── backend/               # Backend services
│   └── services/          # Business logic services
│       ├── dex.service.js
│       ├── tokenization.service.js
│       ├── payment.service.js
│       └── wallet.service.js
├── scripts/               # Deployment and utility scripts
│   └── deploy.js          # Main deployment script
├── tests/                 # Test files
├── docs/                  # Documentation
└── hardhat.config.js      # Hardhat configuration
```

## Technology Stack

- **Smart Contracts**: Solidity 0.8.19
- **Development Framework**: Hardhat
- **Token Standards**: OpenZeppelin contracts (ERC-20, ERC-721, ERC-1155)
- **Backend**: Node.js with ethers.js
- **Security**: ReentrancyGuard, Access Control, Pausable patterns

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm or yarn
- An Ethereum wallet with private key
- Infura or Alchemy API key (for testnet/mainnet deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/universalblockchaininc/Universal-Blockchain-Platform.git
cd Universal-Blockchain-Platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Compilation

Compile the smart contracts:
```bash
npm run compile
```

### Testing

Run the test suite:
```bash
npm test
```

### Deployment

Deploy to local network:
```bash
npx hardhat node  # In one terminal
npm run deploy    # In another terminal
```

Deploy to testnet:
```bash
npm run deploy:testnet
```

Deploy to mainnet:
```bash
npm run deploy:mainnet
```

Deployment addresses will be saved in the `deployments/` directory.

## Usage Examples

### DEX - Token Swap

```javascript
const DEXService = require('./backend/services/dex.service');

// Initialize service
const dexService = new DEXService(dexAddress, provider, signer);

// Swap tokens
const result = await dexService.swap(
  tokenFromAddress,
  tokenToAddress,
  ethers.utils.parseEther("1"), // 1 token
  ethers.utils.parseEther("0.95") // min 0.95 tokens out
);

console.log('Swap completed:', result.transactionHash);
```

### Asset Tokenization - Create NFT

```javascript
const TokenizationService = require('./backend/services/tokenization.service');

// Initialize service
const tokenService = new TokenizationService(
  nftContractAddress,
  fungibleContractAddress,
  provider,
  signer
);

// Tokenize real estate
const result = await tokenService.tokenizeAsNFT({
  owner: '0x...',
  assetType: 'Real Estate',
  description: '123 Main St, Apartment',
  location: 'New York, NY',
  valuation: 500000, // $500,000
  ipfsHash: 'Qm...'
});

console.log('Asset tokenized with ID:', result.tokenId);
```

### Payment Gateway - Fiat to Crypto

```javascript
const PaymentGatewayService = require('./backend/services/payment.service');

// Initialize service
const paymentService = new PaymentGatewayService(
  paymentGatewayAddress,
  provider,
  signer
);

// Convert fiat to crypto
const result = await paymentService.initiateFiatToCrypto({
  userId: 'user123',
  userAddress: '0x...',
  token: usdcTokenAddress,
  fiatAmount: 1000, // $1000
  fiatCurrency: 'USD',
  paymentMethod: 'stripe'
});

console.log('Conversion initiated:', result.transactionId);
```

### Wallet - Create Multi-Sig Wallet

```javascript
const WalletService = require('./backend/services/wallet.service');

// Initialize service
const walletService = new WalletService(walletAddress, provider, signer);

// Create 2-of-3 multi-sig wallet
const result = await walletService.createWallet(
  ['0xOwner1...', '0xOwner2...', '0xOwner3...'],
  2 // Require 2 confirmations
);

console.log('Wallet created with ID:', result.walletId);

// Submit transaction
const tx = await walletService.submitTransaction(
  result.walletId,
  '0xRecipient...',
  ethers.utils.parseEther("1.0"),
  ethers.constants.AddressZero, // ETH
  '0x'
);

console.log('Transaction submitted:', tx.txIndex);
```

## Security Features

### Smart Contract Security
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Access Control**: Owner and role-based permissions
- **Pausable**: Emergency pause functionality
- **Input Validation**: Comprehensive input checking
- **Safe Math**: Solidity 0.8+ built-in overflow protection

### Best Practices
- Non-custodial design - users control their keys
- Transparent fee structures
- Event emission for all critical actions
- Audit trail for all transactions
- Modular architecture for easier security reviews

## API Documentation

See [docs/API.md](docs/API.md) for detailed API documentation.

## Testing

The platform includes comprehensive test coverage for:
- Smart contract functionality
- Integration tests
- Security tests
- Edge cases

Run tests:
```bash
npm test
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## License

MIT License - see LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact support@universalblockchain.io

## Roadmap

- [ ] Layer 2 scaling integration
- [ ] Cross-chain bridge support
- [ ] Advanced trading features (margin, futures)
- [ ] Mobile wallet applications
- [ ] Governance token and DAO
- [ ] Enhanced analytics dashboard
- [ ] Additional payment processor integrations

## Disclaimer

This software is provided "as is", without warranty of any kind. Use at your own risk. Always conduct thorough testing and security audits before deploying to production.
