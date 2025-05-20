# Fameish

Fameish is an experience built on Lens, where users can become the most-followed account for a day.

## How it works

Users sign up for a chance to become the most-followed account for a day. The contract randomly selects a winner from the list of participants.

#### Fully Automated

Fameish automatically follows the winner on Lens each day, and then un-follows before a new winner is chosen.

#### Provably Fair

The contract uses Chainlink VRF (eventually) to ensure that the selection is fair and random.

## Deployments

| Chain ID | Contract          | Address                                    |
|----------|-------------------|--------------------------------------------|
| 232      | Fameish.sol       | 0x7c29F4fB7415A28842B477C11C033E6d0493E4ac |
| 232      | FameishRandom.sol | 0x8827054498a0B36259A51e675Feb13C1fCa9f591 |
| 37111    | Fameish.sol       | 0x6E99f25069e0203F666B9D7b4D449cB7F7a3D2f3 |
| 37111    | FameishRandom.sol | 0x96a66659ca64Fc146Ee0f804cd582AAdA1c93e35 |

## Tech

Fameish is built with Next.js, React.js, Hardhat, and Supabase

## License

This project is licensed under the GNU GPL License unless otherwise noted - see the [LICENSE](LICENSE) file for details.