// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IERC20 {
   function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract Forwarder is Ownable, ReentrancyGuard {
   // Current recipient address; only one allowed at a time.
   address payable public recipient;

   // Event emitted when the recipient is updated.
   event RecipientUpdated(address indexed oldRecipient, address indexed newRecipient);

   // Events for tracking transfers with a concept description.
   event EthTransferred(address indexed sender, address indexed recipient, uint256 amount, string concept);
   event TokensForwarded(address indexed sender, address indexed token, address indexed recipient, uint256 amount, string concept);

   // Whitelist mapping for allowed tokens.
   mapping(address => bool) public allowedTokens;
   // Array to keep track of all whitelisted tokens.
   address[] public allowedTokensList;

   /**
    * @notice Constructor sets the initial recipient.
    * @param initialRecipient The initial recipient address.
    */
   constructor(address payable initialRecipient) Ownable(_msgSender()) {
       require(initialRecipient != address(0), "Invalid recipient");
       recipient = initialRecipient;
   }
  
   /**
    * @notice Updates the recipient address.
    * @param newRecipient The new recipient address.
    * Requirements:
    * - Can only be called by the contract owner.
    * - The new recipient address must be valid.
    * - This function replaces any previously set recipient.
    */
   function setRecipient(address payable newRecipient) external onlyOwner {
       require(newRecipient != address(0), "Invalid recipient");
       address oldRecipient = recipient;
       recipient = newRecipient;
       emit RecipientUpdated(oldRecipient, newRecipient);
   }

   /**
    * @notice Adds a new token to the whitelist.
    * @param token The address of the token contract to whitelist.
    * Requirements:
    * - Can only be called by the contract owner.
    */
   function addAllowedToken(address token) external onlyOwner {
       require(token != address(0), "Invalid token address");
       require(!allowedTokens[token], "Token already allowed");
       allowedTokens[token] = true;
       allowedTokensList.push(token);
   }

   /**
    * @notice Removes a token from the whitelist.
    * @param token The address of the token contract to remove.
    * Requirements:
    * - Can only be called by the contract owner.
    */
   function removeAllowedToken(address token) external onlyOwner {
       require(allowedTokens[token], "Token not in whitelist");
       allowedTokens[token] = false;
       // Remove from array (order not preserved)
       for (uint i = 0; i < allowedTokensList.length; i++) {
           if (allowedTokensList[i] == token) {
               allowedTokensList[i] = allowedTokensList[allowedTokensList.length - 1];
               allowedTokensList.pop();
               break;
           }
       }
   }

   /**
    * @notice Transfers ETH from the sender to the current recipient.
    * @param _amount The amount of ETH to forward (in wei).
    * @param concept A short description of the payment purpose.
    *
    * Requirements:
    * - The sender must send at least _amount in msg.value.
    * - If extra ETH is sent, it is refunded to the sender.
    */
   function transferEth(uint256 _amount, string calldata concept)
       external
       payable
       nonReentrant
   {
       require(msg.value >= _amount, "Not enough ETH sent");
       // Forward exactly _amount to the recipient.
       recipient.transfer(_amount);
       // Refund any extra ETH back to the sender.
       uint256 refund = msg.value - _amount;
       if (refund > 0) {
           payable(msg.sender).transfer(refund);
       }
       emit EthTransferred(msg.sender, recipient, _amount, concept);
   }

   /**
    * @notice Forwards ERC-20 tokens from the sender to the current recipient.
    * @param tokenAddress The address of the ERC-20 token contract.
    * @param amount The amount of tokens to transfer.
    * @param concept A short description of the payment purpose.
    *
    * Requirements:
    * - The token must be whitelisted.
    * - The sender must have approved this contract to spend at least `amount` tokens.
    */
   function forwardTokens(address tokenAddress, uint256 amount, string calldata concept)
       external
       nonReentrant
   {
       require(allowedTokens[tokenAddress], "Only whitelisted tokens are allowed");
       IERC20 token = IERC20(tokenAddress);
       require(token.transferFrom(msg.sender, recipient, amount), "Token transfer failed");
       emit TokensForwarded(msg.sender, tokenAddress, recipient, amount, concept);
   }
}
