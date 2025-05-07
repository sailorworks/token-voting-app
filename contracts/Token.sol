// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract VotingToken is ERC20 {
    address public deployer;
    mapping(address => bool) public hasClaimed;

    constructor(uint256 initialSupply) ERC20("VotingToken", "VOTE") {
        deployer = msg.sender;
        _mint(msg.sender, initialSupply);
    }

    // Add a public faucet function
    function claimTokens() public {
        require(!hasClaimed[msg.sender], "Already claimed tokens");
        uint256 amount = 100 * 10**decimals(); // 100 tokens
        require(balanceOf(deployer) >= amount, "Insufficient balance in faucet");

        hasClaimed[msg.sender] = true;
        _transfer(deployer, msg.sender, amount);
    }
}
