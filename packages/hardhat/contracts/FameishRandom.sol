// SPDX‑License‑Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FameishRandom is Ownable {
    uint256 private _nonce;

    /// @notice Returns a pseudo‑random number in [min, max].
    /// @param min The lower bound (inclusive)
    /// @param max The upper bound (inclusive)
    function randomInRange(uint256 min, uint256 max)
    external
    onlyOwner
    returns (uint256)
    {
        require(max > min, "FameishRandom: max must be > min");

        // entropy sources:
        //  • block.prevrandao: the PoS RANDAO mix
        //  • blockhash of previous block
        //  • block.timestamp
        //  • caller & a per‑call nonce
        uint256 entropy = uint256(
            keccak256(
                abi.encodePacked(
                    block.prevrandao,
                    blockhash(block.number - 1),
                    block.timestamp,
                    msg.sender,
                    _nonce
                )
            )
        );

        _nonce += 1;

        // map down into the desired range
        uint256 range = max - min + 1;
        uint256 result = (entropy % range) + min;
        return result;
    }
}