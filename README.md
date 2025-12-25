# Universal Blockchain Platform

A comprehensive blockchain platform that integrates diverse functionalities across finance, employment, social interaction, information dissemination, and enterprise management, all leveraging the transparency and immutability of blockchain technology.

## 🌟 Features

- **Blockchain Core**: Full-featured blockchain implementation with proof-of-work consensus
- **Transaction System**: Support for multiple transaction types (transfer, employment, social, enterprise)
- **REST API**: Complete server API for blockchain operations
- **Web UI**: Modern, responsive dashboard for interacting with the blockchain
- **Block Explorer**: View and explore all blocks and transactions
- **Mining**: Mine pending transactions and earn rewards
- **Balance Tracking**: Check balance for any address

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

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

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## 📁 Project Structure

```
Universal-Blockchain-Platform/
├── blockchain/          # Blockchain core implementation
│   ├── Block.js        # Block data structure
│   ├── Blockchain.js   # Blockchain logic and validation
│   └── Transaction.js  # Transaction handling
├── server/             # Server and API
│   └── index.js        # Express server with REST API
├── public/             # Frontend UI
│   ├── index.html      # Main HTML page
│   ├── styles.css      # Styling
│   └── app.js          # Frontend JavaScript
├── package.json        # Project dependencies
└── README.md          # Documentation
```

## 🔌 API Endpoints

### Blockchain Operations

- `GET /api/blockchain` - Get the entire blockchain
- `GET /api/blockchain/stats` - Get blockchain statistics
- `GET /api/blockchain/validate` - Validate blockchain integrity
- `GET /api/block/:index` - Get a specific block by index

### Transactions

- `POST /api/transaction` - Create a new transaction
- `GET /api/transactions/pending` - Get pending transactions
- `GET /api/transactions/:address` - Get transactions for an address

### Mining

- `POST /api/mine` - Mine pending transactions

### Balance

- `GET /api/balance/:address` - Get balance of an address

### Health Check

- `GET /api/health` - Server health check

## 💻 Usage Examples

### Creating a Transaction

```javascript
POST /api/transaction
Content-Type: application/json

{
  "fromAddress": "alice",
  "toAddress": "bob",
  "amount": 50,
  "type": "transfer"
}
```

### Mining a Block

```javascript
POST /api/mine
Content-Type: application/json

{
  "minerAddress": "miner1"
}
```

### Checking Balance

```javascript
GET /api/balance/alice
```

## 🎨 UI Features

- **Dashboard**: View blockchain statistics at a glance
- **Transaction Creator**: Easy-to-use form for creating transactions
- **Mining Interface**: Mine blocks with a single click
- **Balance Checker**: Quickly check any address balance
- **Block Explorer**: Browse all blocks with detailed information
- **Real-time Updates**: Auto-refresh statistics every 10 seconds

## 🔐 Transaction Types

The platform supports multiple transaction types:

- **Transfer**: Standard token transfers between addresses
- **Employment**: Employment-related transactions
- **Social**: Social interaction transactions
- **Enterprise**: Enterprise management transactions

## 🛠️ Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon for auto-reloading during development.

### Testing

```bash
npm test
```

## 🌐 Server Management

The server runs on port 3000 by default. You can change this by setting the PORT environment variable:

```bash
PORT=8080 npm start
```

## 📊 Blockchain Configuration

Default blockchain settings:

- **Difficulty**: 2 (proof-of-work)
- **Mining Reward**: 100 tokens
- **Hash Algorithm**: SHA-256

## 🔒 Security Features

- Transaction validation
- Blockchain integrity verification
- Proof-of-work consensus mechanism
- Immutable block linking

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- GitHub: https://github.com/universalblockchaininc/Universal-Blockchain-Platform
- Documentation: Coming soon

## 📞 Support

For issues and questions, please use the GitHub issue tracker.

---

Built with ❤️ by Universal Blockchain Inc
