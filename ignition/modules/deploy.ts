// ignition/modules/deploy.ts (Remains largely the same, but good practice)
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const initialSupply = BigInt("1000000000000000000000"); // 1000 tokens with 18 decimals
const proposalNames = ["Inclusion of Automated Ticketing System in B.E.S.T. Buses", "Renovation of Sector 8 Tunnels", "Adaptation of Air-Delivery for Government Documents"];

export default buildModule("TokenVoting", (m) => {
  const votingToken = m.contract("VotingToken", [initialSupply]);
  const voting = m.contract("Voting", [votingToken, proposalNames], {
    id: "voting",
  });

  return { votingToken, voting };
});
