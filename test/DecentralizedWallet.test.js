const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DecentralizedWallet", function () {
  let wallet;
  let token;
  let owner1;
  let owner2;
  let owner3;
  let user;

  beforeEach(async function () {
    [owner1, owner2, owner3, user] = await ethers.getSigners();

    // Deploy wallet contract
    const Wallet = await ethers.getContractFactory("DecentralizedWallet");
    wallet = await Wallet.deploy();

    // Deploy mock ERC20 token
    const Token = await ethers.getContractFactory("MockERC20");
    token = await Token.deploy("Test Token", "TST", ethers.utils.parseEther("1000000"));

    // Transfer tokens to wallet for testing
    await token.transfer(wallet.address, ethers.utils.parseEther("10000"));
  });

  describe("Wallet Creation", function () {
    it("Should create a 2-of-3 multi-sig wallet", async function () {
      const owners = [owner1.address, owner2.address, owner3.address];
      const requiredConfirmations = 2;

      await expect(
        wallet.createWallet(owners, requiredConfirmations)
      ).to.emit(wallet, "WalletCreated");
    });

    it("Should fail with zero owners", async function () {
      await expect(
        wallet.createWallet([], 1)
      ).to.be.revertedWith("Owners required");
    });

    it("Should fail with invalid required confirmations", async function () {
      const owners = [owner1.address, owner2.address];
      
      await expect(
        wallet.createWallet(owners, 0)
      ).to.be.revertedWith("Invalid required confirmations");

      await expect(
        wallet.createWallet(owners, 3)
      ).to.be.revertedWith("Invalid required confirmations");
    });

    it("Should fail with duplicate owners", async function () {
      const owners = [owner1.address, owner1.address, owner2.address];
      
      await expect(
        wallet.createWallet(owners, 2)
      ).to.be.revertedWith("Duplicate owner");
    });
  });

  describe("Deposits", function () {
    let walletId;

    beforeEach(async function () {
      const tx = await wallet.createWallet([owner1.address, owner2.address], 2);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "WalletCreated");
      walletId = event.args.walletId;
    });

    it("Should deposit ETH", async function () {
      const amount = ethers.utils.parseEther("1.0");

      await expect(
        wallet.deposit(walletId, { value: amount })
      ).to.emit(wallet, "DepositReceived");
    });

    it("Should deposit ERC20 tokens", async function () {
      const amount = ethers.utils.parseEther("100");
      
      await token.approve(wallet.address, amount);

      await expect(
        wallet.depositToken(walletId, token.address, amount)
      ).to.emit(wallet, "TokenDepositReceived");
    });
  });

  describe("Multi-Signature Transactions", function () {
    let walletId;

    beforeEach(async function () {
      const tx = await wallet.createWallet([owner1.address, owner2.address, owner3.address], 2);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "WalletCreated");
      walletId = event.args.walletId;

      // Deposit ETH
      await wallet.deposit(walletId, { value: ethers.utils.parseEther("10") });
    });

    it("Should submit and auto-confirm transaction", async function () {
      const amount = ethers.utils.parseEther("1.0");

      const tx = await wallet.connect(owner1).submitTransaction(
        walletId,
        user.address,
        amount,
        ethers.constants.AddressZero,
        "0x"
      );

      const receipt = await tx.wait();
      expect(receipt.events.some(e => e.event === "TransactionSubmitted")).to.be.true;
      expect(receipt.events.some(e => e.event === "TransactionConfirmed")).to.be.true;
    });

    it("Should require multiple confirmations", async function () {
      const amount = ethers.utils.parseEther("1.0");

      // Submit transaction
      const tx = await wallet.connect(owner1).submitTransaction(
        walletId,
        user.address,
        amount,
        ethers.constants.AddressZero,
        "0x"
      );
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "TransactionSubmitted");
      const txIndex = event.args.txIndex;

      // Check transaction is not executed yet (needs 2 confirmations)
      const transaction = await wallet.getTransaction(walletId, txIndex);
      expect(transaction.executed).to.be.false;

      // Second owner confirms
      await wallet.connect(owner2).confirmTransaction(walletId, txIndex);

      // Now should be executed (auto-execute on enough confirmations)
      const updatedTx = await wallet.getTransaction(walletId, txIndex);
      expect(updatedTx.executed).to.be.true;
    });

    it("Should allow revoking confirmation", async function () {
      const amount = ethers.utils.parseEther("1.0");

      // Submit transaction (auto-confirms for submitter)
      const tx = await wallet.connect(owner1).submitTransaction(
        walletId,
        user.address,
        amount,
        ethers.constants.AddressZero,
        "0x"
      );
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "TransactionSubmitted");
      const txIndex = event.args.txIndex;

      // Revoke confirmation
      await expect(
        wallet.connect(owner1).revokeConfirmation(walletId, txIndex)
      ).to.emit(wallet, "TransactionRevoked");

      const transaction = await wallet.getTransaction(walletId, txIndex);
      expect(transaction.confirmations).to.equal(0);
    });

    it("Should prevent non-owner from confirming", async function () {
      const amount = ethers.utils.parseEther("1.0");

      const tx = await wallet.connect(owner1).submitTransaction(
        walletId,
        user.address,
        amount,
        ethers.constants.AddressZero,
        "0x"
      );
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "TransactionSubmitted");
      const txIndex = event.args.txIndex;

      await expect(
        wallet.connect(user).confirmTransaction(walletId, txIndex)
      ).to.be.revertedWith("Not wallet owner");
    });
  });

  describe("Owner Management", function () {
    let walletId;

    beforeEach(async function () {
      const tx = await wallet.createWallet([owner1.address, owner2.address], 2);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "WalletCreated");
      walletId = event.args.walletId;
    });

    it("Should add a new owner", async function () {
      await expect(
        wallet.connect(owner1).addOwner(walletId, owner3.address)
      ).to.emit(wallet, "OwnerAdded");

      const owners = await wallet.getOwners(walletId);
      expect(owners).to.include(owner3.address);
    });

    it("Should remove an owner", async function () {
      await wallet.connect(owner1).addOwner(walletId, owner3.address);

      await expect(
        wallet.connect(owner1).removeOwner(walletId, owner3.address)
      ).to.emit(wallet, "OwnerRemoved");
    });

    it("Should fail to remove last owner", async function () {
      await wallet.connect(owner1).removeOwner(walletId, owner2.address);

      await expect(
        wallet.connect(owner1).removeOwner(walletId, owner1.address)
      ).to.be.revertedWith("Cannot remove last owner");
    });

    it("Should change required confirmations", async function () {
      await wallet.connect(owner1).addOwner(walletId, owner3.address);

      await expect(
        wallet.connect(owner1).changeRequiredConfirmations(walletId, 3)
      ).to.emit(wallet, "RequiredConfirmationsChanged");
    });
  });

  describe("Balance Queries", function () {
    let walletId;

    beforeEach(async function () {
      const tx = await wallet.createWallet([owner1.address, owner2.address], 2);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "WalletCreated");
      walletId = event.args.walletId;
    });

    it("Should get ETH balance", async function () {
      const amount = ethers.utils.parseEther("5.0");
      await wallet.deposit(walletId, { value: amount });

      const balance = await wallet.getBalance(walletId);
      expect(balance).to.be.gte(amount);
    });

    it("Should get token balance", async function () {
      const amount = ethers.utils.parseEther("100");
      await token.approve(wallet.address, amount);
      await wallet.depositToken(walletId, token.address, amount);

      const balance = await wallet.getTokenBalance(walletId, token.address);
      expect(balance).to.be.gte(amount);
    });

    it("Should get user wallets", async function () {
      const wallets = await wallet.getUserWallets(owner1.address);
      expect(wallets).to.include(walletId);
    });
  });
});
