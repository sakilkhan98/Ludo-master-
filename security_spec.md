# Security Specification for Ludo Master Online

## 1. Data Invariants
- **Identity Integrity**: A user can only write to their own profile under `/users/{userId}` where `userId == request.auth.uid`.
- **Room Ownership Protection**: Only the host or active players of a room can read/write to the room document `/rooms/{roomId}`.
- **Turn Validation & Anti-Cheat**: Players can only roll the dice or move tokens when it is their turn (`request.auth.uid == resource.data.turnPlayerId`).
- **Terminal State Locking**: Once a game is marked as `finished`, no more modifications are allowed.
- **System-only / Match Protection**: Matches can only be registered if they contain real player IDs, and once registered they are read-only.

## 2. The "Dirty Dozen" Malicious Payloads
1. **Profile Hijack**: Authenticated user `A` tries to write to user `B`'s profile `/users/B`.
2. **Infinite Elo Points**: User `A` tries to set their `ranking` to `99999` directly in their profile creation or update.
3. **Ghost Fields**: User `A` tries to inject a field `isAdmin: true` into their profile.
4. **Room Hijack**: Player `B` (not in room `R`) tries to read the state of room `R`.
5. **Malicious Move**: Player `B` tries to move Player `A`'s tokens when it is Player `A`'s turn.
6. **Double Roll Cheat**: Player `A` tries to update `dice` state to roll again before their move action is registered.
7. **Bypass Turn**: Player `B` tries to modify the `turnPlayerId` to steal the turn.
8. **Replay Finish Block**: A player tries to update a room's board state after `status` is already set to `finished`.
9. **Spamming Chat**: A non-player or player tries to inject massive (> 1KB) text strings into the chat list.
10. **Host Spoofing**: Player `B` tries to update the `hostId` of the room to make themselves host without permissions.
11. **Spoofed Wins Counter**: A user tries to increment their `wins` counter by 10 in a single profile update.
12. **Null-ID Poisoning**: A client attempts to create a room with a 1.5KB junk string as the `roomId`.

## 3. Fortress Firestore Rules Strategy
We will construct rules targeting:
1. Standard global helpers: `isSignedIn()`, `isValidId(id)`, `incoming()`, `existing()`.
2. Schema validation for `/users/{userId}` ensuring they can't self-promote or increase wins/losses arbitrarily without validation (or limit client profile writes to simple fields like name & avatar, keeping score increases secure, or letting players write with limited changes).
3. Room-level rules allowing specific states to change during rolling and moving.
