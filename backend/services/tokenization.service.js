const ethers = require('ethers');

/**
 * Tokenization Service
 * Handles asset tokenization and management
 */
class TokenizationService {
  constructor(nftContractAddress, fungibleContractAddress, provider, signer) {
    this.nftContractAddress = nftContractAddress;
    this.fungibleContractAddress = fungibleContractAddress;
    this.provider = provider;
    this.signer = signer;
    // In production, load ABI from compiled contracts
    this.nftContract = new ethers.Contract(nftContractAddress, [], signer);
    this.fungibleContract = new ethers.Contract(fungibleContractAddress, [], signer);
  }

  /**
   * Tokenize a real-world asset as NFT
   */
  async tokenizeAsNFT(assetData) {
    try {
      const {
        owner,
        assetType,
        description,
        location,
        valuation,
        ipfsHash
      } = assetData;

      const tx = await this.nftContract.tokenizeAsset(
        owner,
        assetType,
        description,
        location,
        ethers.utils.parseEther(valuation.toString()),
        ipfsHash
      );
      
      const receipt = await tx.wait();
      const tokenizedEvent = receipt.events.find(e => e.event === 'AssetTokenized');
      const tokenId = tokenizedEvent.args.tokenId;

      return {
        success: true,
        tokenId: tokenId.toString(),
        transactionHash: receipt.transactionHash,
        contractAddress: this.nftContractAddress
      };
    } catch (error) {
      console.error('Error tokenizing asset:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify an NFT asset
   */
  async verifyNFTAsset(tokenId) {
    try {
      const tx = await this.nftContract.verifyAsset(tokenId);
      const receipt = await tx.wait();

      return {
        success: true,
        tokenId: tokenId.toString(),
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error verifying asset:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update NFT asset valuation
   */
  async updateValuation(tokenId, newValuation) {
    try {
      const tx = await this.nftContract.updateValuation(
        tokenId,
        ethers.utils.parseEther(newValuation.toString())
      );
      const receipt = await tx.wait();

      return {
        success: true,
        tokenId: tokenId.toString(),
        newValuation: newValuation,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error updating valuation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get NFT asset metadata
   */
  async getNFTMetadata(tokenId) {
    try {
      const metadata = await this.nftContract.getAssetMetadata(tokenId);

      return {
        success: true,
        metadata: {
          assetType: metadata.assetType,
          description: metadata.description,
          location: metadata.location,
          valuation: ethers.utils.formatEther(metadata.valuation),
          creationDate: new Date(metadata.creationDate.toNumber() * 1000).toISOString(),
          isVerified: metadata.isVerified,
          ipfsHash: metadata.ipfsHash
        }
      };
    } catch (error) {
      console.error('Error getting metadata:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a fungible/semi-fungible token
   */
  async createFungibleToken(tokenData) {
    try {
      const {
        name,
        assetType,
        totalSupply,
        pricePerUnit,
        isFungible,
        ipfsHash
      } = tokenData;

      const tx = await this.fungibleContract.createToken(
        name,
        assetType,
        totalSupply,
        ethers.utils.parseEther(pricePerUnit.toString()),
        isFungible,
        ipfsHash
      );
      
      const receipt = await tx.wait();
      const tokenCreatedEvent = receipt.events.find(e => e.event === 'TokenCreated');
      const tokenId = tokenCreatedEvent.args.tokenId;

      return {
        success: true,
        tokenId: tokenId.toString(),
        transactionHash: receipt.transactionHash,
        contractAddress: this.fungibleContractAddress
      };
    } catch (error) {
      console.error('Error creating token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mint additional fungible tokens
   */
  async mintFungibleTokens(to, tokenId, amount) {
    try {
      const tx = await this.fungibleContract.mint(to, tokenId, amount);
      const receipt = await tx.wait();

      return {
        success: true,
        tokenId: tokenId.toString(),
        amount: amount.toString(),
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error minting tokens:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get fungible token metadata
   */
  async getFungibleTokenMetadata(tokenId) {
    try {
      const metadata = await this.fungibleContract.getTokenMetadata(tokenId);

      return {
        success: true,
        metadata: {
          name: metadata.name,
          assetType: metadata.assetType,
          totalSupply: metadata.totalSupply.toString(),
          pricePerUnit: ethers.utils.formatEther(metadata.pricePerUnit),
          isFungible: metadata.isFungible,
          ipfsHash: metadata.ipfsHash
        }
      };
    } catch (error) {
      console.error('Error getting token metadata:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get token balance
   */
  async getTokenBalance(userAddress, tokenId) {
    try {
      const balance = await this.fungibleContract.balanceOf(userAddress, tokenId);

      return {
        success: true,
        balance: balance.toString()
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Transfer tokens
   */
  async transferTokens(from, to, tokenId, amount) {
    try {
      const tx = await this.fungibleContract.safeTransferFrom(
        from,
        to,
        tokenId,
        amount,
        []
      );
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error transferring tokens:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = TokenizationService;
