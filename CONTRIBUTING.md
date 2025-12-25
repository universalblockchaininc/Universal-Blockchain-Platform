# Contributing to Universal Blockchain Platform

Thank you for your interest in contributing to the Universal Blockchain Platform! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title**: Descriptive summary of the issue
- **Description**: Detailed description of the problem
- **Steps to reproduce**: Step-by-step instructions
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Environment**: OS, Node.js version, network, etc.
- **Screenshots**: If applicable

### Suggesting Enhancements

Enhancement suggestions are welcome! Please include:

- **Clear title**: Descriptive summary of the enhancement
- **Use case**: Why this enhancement would be useful
- **Proposed solution**: How you think it should work
- **Alternatives**: Other solutions you've considered

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes**: Follow our coding standards
4. **Add tests**: Ensure your changes are tested
5. **Commit your changes**: Use clear commit messages
6. **Push to your fork**: `git push origin feature/your-feature-name`
7. **Submit a pull request**: Include a clear description

## Development Setup

### Prerequisites

- Node.js v16 or higher
- npm or yarn
- Git

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Universal-Blockchain-Platform.git
cd Universal-Blockchain-Platform

# Add upstream remote
git remote add upstream https://github.com/universalblockchaininc/Universal-Blockchain-Platform.git

# Install dependencies
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/DEX.test.js

# Run with coverage
npx hardhat coverage
```

### Compiling Contracts

```bash
npm run compile
```

## Coding Standards

### Solidity

- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use Solidity 0.8.19
- Include NatSpec comments for all public functions
- Use OpenZeppelin libraries when possible
- Write comprehensive tests for all contracts

Example:

```solidity
/**
 * @dev Transfer tokens to recipient
 * @param recipient Address to receive tokens
 * @param amount Amount of tokens to transfer
 * @return success Whether transfer was successful
 */
function transfer(address recipient, uint256 amount) public returns (bool success) {
    // Implementation
}
```

### JavaScript/Node.js

- Use ES6+ features
- Follow consistent indentation (2 spaces)
- Use meaningful variable names
- Include JSDoc comments for functions
- Handle errors appropriately

Example:

```javascript
/**
 * Swap tokens on the DEX
 * @param {string} tokenFrom - Source token address
 * @param {string} tokenTo - Destination token address
 * @param {BigNumber} amountIn - Amount to swap
 * @returns {Promise<Object>} Transaction result
 */
async function swapTokens(tokenFrom, tokenTo, amountIn) {
  // Implementation
}
```

### Git Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Keep first line under 72 characters
- Reference issues and pull requests

Examples:
```
Add multi-signature wallet functionality

Implement DEX liquidity pools
- Add pool creation function
- Add liquidity management
- Update tests

Fix: Resolve overflow in swap calculation (#123)
```

## Testing Guidelines

### Unit Tests

- Test all public functions
- Test edge cases and error conditions
- Use descriptive test names
- Maintain high code coverage (>80%)

```javascript
describe("DEX", function() {
  describe("Token Swaps", function() {
    it("Should swap tokens successfully", async function() {
      // Test implementation
    });

    it("Should fail with insufficient liquidity", async function() {
      // Test implementation
    });
  });
});
```

### Integration Tests

- Test interactions between contracts
- Test complete user workflows
- Use realistic test data

## Documentation

### Code Documentation

- Document all public APIs
- Include usage examples
- Explain complex logic
- Keep documentation up to date

### README Updates

Update README.md when adding:
- New features
- API changes
- Configuration options
- Dependencies

## Review Process

### What We Look For

- **Functionality**: Does it work as intended?
- **Tests**: Are there adequate tests?
- **Documentation**: Is it properly documented?
- **Code quality**: Is it clean and maintainable?
- **Security**: Are there security implications?

### Review Timeline

- Initial review: Within 3-5 days
- Follow-up reviews: Within 2-3 days
- Approval requires 2 maintainer reviews

## Community

### Getting Help

- **GitHub Issues**: For bugs and features
- **Discussions**: For questions and ideas
- **Discord**: Real-time chat (coming soon)
- **Email**: support@universalblockchain.io

### Stay Updated

- Watch the repository for updates
- Follow us on Twitter: @UniversalBlockchain
- Subscribe to our newsletter

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project website

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

If you have questions about contributing, please:
- Open a GitHub Discussion
- Email: support@universalblockchain.io
- Check our FAQ (coming soon)

Thank you for contributing to Universal Blockchain Platform! 🚀
