import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");


async function main() {

    //the addresses: for the contract we are intercting with, and the tokens required
    /*function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);*/

    const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const USDC_DAI_PAIR = "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5";

    //impersonated persons address
    const TOKEN_HOLDER = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621";

    await helpers.impersonateAccount(TOKEN_HOLDER);
    //this makes the impersonated address a signer
    const impersonatedSigner = await ethers.getSigner(TOKEN_HOLDER);

    const amountADesired = ethers.parseUnits("100", 6);  // 100 USDC (6 decimals for each token
    const amountBDesired = ethers.parseUnits("100", 18); // 100 DAI 
    const amountAMin = ethers.parseUnits("50", 6);      // 50 USDC minimum
    const amountBMin = ethers.parseUnits("50", 18);     // 50 DAI minimum

    // Get contract instances
    const USDC_Contract = await ethers.getContractAt("IERC20", USDC, impersonatedSigner);
    const DAI_Contract = await ethers.getContractAt("IERC20", DAI, impersonatedSigner);
    const ROUTER = await ethers.getContractAt("IUniswapV2Router", ROUTER_ADDRESS, impersonatedSigner);

    //liqudity provider ; LP
    const LP_Contract = await ethers.getContractAt("IERC20",USDC_DAI_PAIR, impersonatedSigner )

    // Approve router to spend tokens
    await USDC_Contract.approve(ROUTER, amountADesired);
    await DAI_Contract.approve(ROUTER, amountBDesired);

    // Get initial token balances
    const UsdcBalance = await USDC_Contract.balanceOf(impersonatedSigner.address);
    const DaiBalance = await DAI_Contract.balanceOf(impersonatedSigner.address);

    const LpBalBefore = await LP_Contract.balanceOf(impersonatedSigner.address);
    const deadline = Math.floor(Date.now() / 1000) + (60 * 10); // 10 minutes from now

    console.log("usdc balance before swap", Number(UsdcBalance));
    console.log("dai balance before swap", Number(DaiBalance));
    console.log("lp bal before adding liq", Number(LpBalBefore));

    // Add liquidity to the USDC-DAI pool, TO BE ABLE TO REMOVE LIQUIDITY YOU HAVE TO ADD LIQUIDITY
    const tx = await ROUTER.addLiquidity(
        USDC,
        DAI,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        impersonatedSigner.getAddress(),
        deadline
    );

    await tx.wait();

    // Get token balances after adding liquidity
    const usdcBalAfter = await USDC_Contract.balanceOf(impersonatedSigner.address);
    const daiBalAfter = await DAI_Contract.balanceOf(impersonatedSigner.address);
    const LpBalAfter = await LP_Contract.balanceOf(impersonatedSigner.address)
    console.log("=========================================================");

    console.log("usdc balance after swap", Number(usdcBalAfter));
    console.log("dai balance after swap", Number(daiBalAfter));
    console.log("LP Token Bal before adding liquidity", Number(LpBalAfter) )
    console.log("=========================================================");

    // Calculate and log the amount of tokens used for liquidity
    console.log("usdc used for liquidity", Number(UsdcBalance) - Number(usdcBalAfter));
    console.log("dai used for liquidity", Number(DaiBalance) - Number(daiBalAfter));

    await LP_Contract.approve(ROUTER, LpBalAfter);

    const removeLiquidity = await ROUTER.removeLiquidity(
        USDC,
        DAI,
        LpBalAfter,
        0,
        0,
        impersonatedSigner.address,
        deadline
    )
    await removeLiquidity.wait();

    const LPBalAfterRemoval = await LP_Contract.balanceOf(impersonatedSigner.address);
    console.log(LPBalAfterRemoval);

    const finalUSDCBal = await USDC_Contract.balanceOf(impersonatedSigner.address)
    const finalDIABal = await DAI_Contract.balanceOf(impersonatedSigner.address)


    console.log("USDC balance after liquidity", Number(finalUSDCBal));

    console.log("DAI balance after liquidity", Number(finalDIABal));

}

// Run the main function and handle any errors
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});