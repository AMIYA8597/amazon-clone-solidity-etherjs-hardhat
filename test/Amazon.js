const { expect } = require("chai")
const { ethers } = require('hardhat')

const tokens = (n) => { 
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

// Global constants for listing an item...
const ID = 1
const NAME = "Shoes"
const CATEGORY = "Clothing"
const IMAGE = "https://www.google.com/imgres?imgurl=https%3A%2F%2Fimages-cdn.ubuy.co.in%2F654495be38bdef40355ef3d6-adidas-men-39-s-low-top-sneaker-core.jpg&tbnid=mg5vFAK6kGxmzM&vet=12ahUKEwia2p2D3e6DAxXWS2wGHcf_Bn4QMygKegQIARBr..i&imgrefurl=https%3A%2F%2Fwww.ubuy.co.in%2Fproduct%2F3W90QTWVA-adidas-men-s-superstar-gymnastics-shoe-core-black-ftwr-white-core-black-11&docid=fOFPWCmtwXnabM&w=1500&h=1039&q=adidas&ved=2ahUKEwia2p2D3e6DAxXWS2wGHcf_Bn4QMygKegQIARBr"
const COST = tokens(1)
const RATING = 4
const STOCK = 5

describe("Amazon", () => {
  let amazon
  let deployer, buyer
  

  beforeEach(async () => {
    // Setup accounts
    [deployer, buyer] = await ethers.getSigners()

    // Deploy contract
    const Amazon = await ethers.getContractFactory("Amazon")
    amazon = await Amazon.deploy()
  })

  describe("Deployment", () => {
    it("Sets the ownerOfContract", async () => {
      expect(await amazon.ownerOfContract()).to.equal(deployer.address)
    })
  })

  describe("Listing", () => {
    let transaction

    beforeEach(async () => {
      // List a item
      transaction = await amazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()
    })

    it("Returns item attributes", async () => {
      const item = await amazon.items(ID)

      expect(item.id).to.equal(ID)
      expect(item.name).to.equal(NAME)
      expect(item.category).to.equal(CATEGORY)
      expect(item.image).to.equal(IMAGE)
      expect(item.cost).to.equal(COST)
      expect(item.rating).to.equal(RATING)
      expect(item.stock).to.equal(STOCK)
    })

    it("Emits List event", () => {
      expect(transaction).to.emit(amazon, "List")
    })
  })

  describe("Buying", () => {
    let transaction

    beforeEach(async () => {
      // List a item
      transaction = await amazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      // Buy a item
      transaction = await amazon.connect(buyer).buy(ID, { value: COST })
      await transaction.wait()
    })


    it("Updates buyer's order count", async () => {
      const result = await amazon.orderCount(buyer.address)
      expect(result).to.equal(1)
    })

    it("Adds the order", async () => {
      const order = await amazon.orders(buyer.address, 1)

      expect(order.time).to.be.greaterThan(0)
      expect(order.item.name).to.equal(NAME)
    })

    it("Updates the contract balance", async () => {
      const result = await ethers.provider.getBalance(amazon.address)
      expect(result).to.equal(COST)
    })

    it("Emits Buy event", () => {
      expect(transaction).to.emit(amazon, "Buy")
    })
  })

  describe("Withdrawing", () => {
    let balanceBefore

    beforeEach(async () => {
      // List a item
      let transaction = await amazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      // Buy a item
      transaction = await amazon.connect(buyer).buy(ID, { value: COST })
      await transaction.wait()

      // Get Deployer balance before
      balanceBefore = await ethers.provider.getBalance(deployer.address)

      // Withdraw
      transaction = await amazon.connect(deployer).withdraw()
      await transaction.wait()
    })

    it('Updates the ownerOfContract balance', async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address)
      expect(balanceAfter).to.be.greaterThan(balanceBefore)
    })

    it('Updates the contract balance', async () => {
      const result = await ethers.provider.getBalance(amazon.address)
      expect(result).to.equal(0)
    })
  })
})
