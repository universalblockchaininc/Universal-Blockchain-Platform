const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DEX", function () {
  let dex;
  let tokenA;
  let tokenB;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const Token = await ethers.getContractFactory("MockERC20");
    tokenA = await Token.deploy("Token A", "TKA", ethers.utils.parseEther("1000000"));
    tokenB = await Token.deploy("Token B", "TKB", ethers.utils.parseEther("1000000"));

    // Deploy DEX
    const DEX = await ethers.getContractFactory("DEX");
    dex = await DEX.deploy();

    // Transfer tokens to users
    await tokenA.transfer(user1.address, ethers.utils.parseEther("10000"));
    await tokenB.transfer(user1.address, ethers.utils.parseEther("10000"));
    await tokenA.transfer(user2.address, ethers.utils.parseEther("10000"));
    await tokenB.transfer(user2.address, ethers.utils.parseEther("10000"));

    // Approve DEX to spend tokens
    await tokenA.connect(user1).approve(dex.address, ethers.constants.MaxUint256);
    await tokenB.connect(user1).approve(dex.address, ethers.constants.MaxUint256);
    await tokenA.connect(user2).approve(dex.address, ethers.constants.MaxUint256);
    await tokenB.connect(user2).approve(dex.address, ethers.constants.MaxUint256);
  });

  describe("Pool Creation", function () {
    it("Should create a new pool", async function () {
      const tx = await dex.createPool(tokenA.address, tokenB.address);
      const receipt = await tx.wait();

      const event = receipt.events.find(e => e.event === "PoolCreated");
      expect(event).to.not.be.undefined;
    });

    it("Should fail to create duplicate pool", async function () {
      await dex.createPool(tokenA.address, tokenB.address);
      await expect(
        dex.createPool(tokenA.address, tokenB.address)
      ).to.be.revertedWith("Pool exists");
    });

    it("Should fail with identical tokens", async function () {
      await expect(
        dex.createPool(tokenA.address, tokenA.address)
      ).to.be.revertedWith("Identical tokens");
    });
  });

  describe("Liquidity Management", function () {
    beforeEach(async function () {
      await dex.createPool(tokenA.address, tokenB.address);
    });

    it("Should add liquidity", async function () {
      const amountA = ethers.utils.parseEther("100");
      const amountB = ethers.utils.parseEther("100");

      await expect(
        dex.connect(user1).addLiquidity(tokenA.address, tokenB.address, amountA, amountB)
      ).to.emit(dex, "LiquidityAdded");
    });

    it("Should remove liquidity", async function () {
      const amountA = ethers.utils.parseEther("100");
      const amountB = ethers.utils.parseEther("100");

      await dex.connect(user1).addLiquidity(tokenA.address, tokenB.address, amountA, amountB);

      const poolId = await dex.getPoolId(tokenA.address, tokenB.address);
      const liquidity = await dex.getUserLiquidity(poolId, user1.address);

      await expect(
        dex.connect(user1).removeLiquidity(tokenA.address, tokenB.address, liquidity)
      ).to.emit(dex, "LiquidityRemoved");
    });
  });

  describe("Token Swaps", function () {
    beforeEach(async function () {
      await dex.createPool(tokenA.address, tokenB.address);
      
      // Add liquidity
      const amountA = ethers.utils.parseEther("1000");
      const amountB = ethers.utils.parseEther("1000");
      await dex.connect(user1).addLiquidity(tokenA.address, tokenB.address, amountA, amountB);
    });

    it("Should swap tokens", async function () {
      const amountIn = ethers.utils.parseEther("10");
      const minAmountOut = ethers.utils.parseEther("9");

      await expect(
        dex.connect(user2).swap(tokenA.address, tokenB.address, amountIn, minAmountOut)
      ).to.emit(dex, "TokenSwapped");
    });

    it("Should get accurate quote", async function () {
      const amountIn = ethers.utils.parseEther("10");
      const quote = await dex.getQuote(tokenA.address, tokenB.address, amountIn);
      
      expect(quote).to.be.gt(0);
      expect(quote).to.be.lt(amountIn); // Account for fees
    });

    it("Should fail with insufficient liquidity", async function () {
      const amountIn = ethers.utils.parseEther("10000");
      const minAmountOut = ethers.utils.parseEther("9000");

      await expect(
        dex.connect(user2).swap(tokenA.address, tokenB.address, amountIn, minAmountOut)
      ).to.be.revertedWith("Insufficient liquidity");
    });
  });

  describe("Order Book", function () {
    it("Should create an order", async function () {
      const amountFrom = ethers.utils.parseEther("10");
      const amountTo = ethers.utils.parseEther("11");

      await expect(
        dex.connect(user1).createOrder(tokenA.address, tokenB.address, amountFrom, amountTo)
      ).to.emit(dex, "OrderCreated");
    });

    it("Should cancel an order", async function () {
      const amountFrom = ethers.utils.parseEther("10");
      const amountTo = ethers.utils.parseEther("11");

      const tx = await dex.connect(user1).createOrder(tokenA.address, tokenB.address, amountFrom, amountTo);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "OrderCreated");
      const orderId = event.args.orderId;

      await expect(
        dex.connect(user1).cancelOrder(orderId)
      ).to.emit(dex, "OrderCancelled");
    });
  });

  describe("Fee Management", function () {
    it("Should allow owner to update trading fee", async function () {
      await expect(
        dex.setTradingFee(50)
      ).to.emit(dex, "FeeUpdated");
    });

    it("Should prevent non-owner from updating fee", async function () {
      await expect(
        dex.connect(user1).setTradingFee(50)
      ).to.be.reverted;
    });

    it("Should prevent excessive fee", async function () {
      await expect(
        dex.setTradingFee(200)
      ).to.be.revertedWith("Fee too high");
    });
  });
});
