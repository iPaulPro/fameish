# Fameish

Become the most-followed account on Lens, for a day.

## How it works

Users sign up for a chance to become the most-followed account for a day. The contract randomly selects a winner from the list of participants.

### Fully Automated

Fameish automatically follows the winner on Lens each day, and then un-follows before a new winner is chosen.

In order to participate, users must add the `Fameish` contract as an Account Manager. This allows the contract to follow and unfollow the winner on their behalf. The manager doesn't have permission to perform token transfers or update the account metadata, ensuring that the user's funds and profile remain secure.

### Provably Fair

The random selection of the winner is done using the FameishRandom contract, which is access-controlled and uses a pseudo-random number generator (PRNG) to ensure fairness. The contract is designed to be transparent and verifiable. Once Chainlink VRF is available on the network, it will be integrated to enhance the randomness of the selection process.

Here's how a winner is selected:

1. The Fameish service generates a list of eligible participants.
2. The list is published as an immutable csv file on Grove.
3. The participants file URI is passed to the FameishRandom contract when selecting a random number. The contract uses the PRNG to select a random index from the list of participants and emits an event with the winner's address, random index, and file URI.
4. The Fameish service listens for the event and updates the winner in the contract.

## Deployments

| Network | Chain ID | Contract          | Address                                    |
|:--------|----------|-------------------|--------------------------------------------|
| Mainnet | 232      | Fameish.sol       | 0x93aD023118992885D25B492418fB06cF21C2E4F5 |
| Mainnet | 232      | FameishRandom.sol | 0x7321293052f53176FA91000ebd4B1deE0687aa8A |
| Testnet | 37111    | Fameish.sol       | 0x383Ea1f6ca0eceb4524947c8a43C45cd14B9e3a9 |
| Testnet | 37111    | FameishRandom.sol | 0xbbe0c49282727Dd5bf9D190bF79EC106596009dF |

## Tech

Fameish is built with Next.js, React.js, Hardhat, Vercel, and Supabase

## License

This project is licensed under the GNU GPL License unless otherwise noted - see the [LICENSE](LICENSE) file for details.