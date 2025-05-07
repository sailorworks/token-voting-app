// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract Voting is ReentrancyGuard {
    address public tokenAddress;
    IERC20 public votingToken;
    uint256 public constant VOTE_FEE = 1 * 10**18; // 1 VOTE token as voting fee
    address public feeCollector;

    struct Proposal {
        string name;
        uint256 votesFor;
        uint256 votesAgainst;
    }

    Proposal[] public proposals;
    mapping(address => mapping(uint256 => uint256)) public votes;
    uint256 public totalVotesFor;
    uint256 public totalVotesAgainst;

    // Events
    event ProposalAdded(uint256 proposalIndex, string name);
    event Voted(address voter, uint256 proposalIndex, bool support, uint256 amount);
    event VoteProcessed(address voter, uint256 proposalIndex, bool support, uint256 amount);
    event FeeCollected(address from, uint256 amount);

    uint256 public startTime;
    uint256 public endTime;

    constructor(address _tokenAddress, string[] memory proposalNames) {
        require(_tokenAddress != address(0), "Token address cannot be zero");
        tokenAddress = _tokenAddress;
        votingToken = IERC20(_tokenAddress);
        feeCollector = msg.sender;

        startTime = block.timestamp;
        endTime = block.timestamp + 1 weeks;

        for (uint i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({
                name: proposalNames[i],
                votesFor: 0,
                votesAgainst: 0
            }));
            emit ProposalAdded(i, proposalNames[i]);
        }
    }

    function vote(uint256 proposalIndex, bool support) public nonReentrant {
        // Check basic requirements
        require(votes[msg.sender][proposalIndex] == 0, "You have already voted on this proposal.");
        require(proposalIndex < proposals.length, "Invalid proposal index.");
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Voting period is not active.");

        // Check if user has enough tokens for voting fee
        uint256 voterBalance = votingToken.balanceOf(msg.sender);
        require(voterBalance >= VOTE_FEE, "Insufficient token balance for voting fee");

        // Collect voting fee using transferFrom (requires approval)
        bool success = votingToken.transferFrom(msg.sender, feeCollector, VOTE_FEE);
        require(success, "Fee transfer failed. Make sure you approved the contract.");

        emit FeeCollected(msg.sender, VOTE_FEE);

        // Record the vote with power of 1 (one person, one vote)
        uint256 votingPower = 1*10**18;
        votes[msg.sender][proposalIndex] = votingPower;

        if (support) {
            proposals[proposalIndex].votesFor += votingPower;
            totalVotesFor += votingPower;
        } else {
            proposals[proposalIndex].votesAgainst += votingPower;
            totalVotesAgainst += votingPower;
        }

        emit VoteProcessed(msg.sender, proposalIndex, support, votingPower);
        emit Voted(msg.sender, proposalIndex, support, votingPower);
    }

    function getProposal(uint256 proposalIndex) public view returns (string memory, uint256, uint256) {
        require(proposalIndex < proposals.length, "Invalid proposal index.");
        return (
            proposals[proposalIndex].name,
            proposals[proposalIndex].votesFor,
            proposals[proposalIndex].votesAgainst
        );
    }

    function getProposalsCount() public view returns (uint256) {
        return proposals.length;
    }

    function getTotalVotes() public view returns (uint256, uint256) {
        uint256 proposalsVotedFor = 0;
        uint256 proposalsVotedAgainst = 0;

        for (uint256 i = 0; i < proposals.length; i++) {
            if (proposals[i].votesFor > 0) {
                proposalsVotedFor += 1 * 10**18;
            }
            if (proposals[i].votesAgainst > 0) {
                proposalsVotedAgainst += 1 * 10**18;
            }
        }

        return (proposalsVotedFor, proposalsVotedAgainst);
    }

    function isVotingActive() public view returns (bool) {
        return block.timestamp >= startTime && block.timestamp <= endTime;
    }

    function hasUserVoted(address user) public view returns (bool) {
        for(uint256 i = 0; i < proposals.length; i++){
            if(votes[user][i] > 0) {
              return true;
            }
        }
        return false;
    }

    // Add getter for vote fee
    function getVoteFee() public pure returns (uint256) {
        return VOTE_FEE;
    }
}
