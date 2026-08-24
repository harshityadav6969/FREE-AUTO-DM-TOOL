# Security Specification: InstaFlow SaaS

## 1. Data Invariants
- A `User` profile must be created by the authenticated user and use their `uid` as the document ID.
- An `Account` (IG) belongs to a specific `User`.
- `Media`, `Rules`, `Logs`, and `Templates` belong to an `Account` and are isolated per user.
- `ownerId` or parent relational path must match `request.auth.uid`.
- Timestamps must be server-generated.

## 2. The "Dirty Dozen" Payload Test Cases (Expect: PERMISSION_DENIED)

1. **Identity Theft (Profile)**: Attempt to create a user profile with a different `uid` than the authenticated user.
2. **Account Hijacking**: User A attempts to read or write to User B's `accounts` collection.
3. **Shadow Field Injection**: Creating a `Rule` with a hidden `isAdmin: true` field or similar.
4. **Logic Skip**: Updating a `Log` entry after it's been created (Logs should be immutable).
5. **Resource Poisoning**: Use a 1MB string as a `triggerKeyword`.
6. **Relational Break**: Creating a `Rule` for a `Media` ID that doesn't exist in the current account.
7. **Privilege Escalation**: Attempting to set `subscriptionTier: 'ENTERPRISE'` as a free user.
8. **Orphaned Write**: Creating a `Log` entry without a valid parent account or user.
9. **Time Spoofing**: Sending a client-side `createdAt` timestamp instead of `serverTimestamp()`.
10. **Cross-Tenant Leak**: Listing `logs` without filtering by user ID (checking if the rule allows blanket reads).
11. **Malicious ID**: Using `../../system/files` as a document ID for a rule.
12. **Status Bypass**: Directly updating a `media's` `ruleCount` without actually creating a rule.

## 3. Test Runner Concept
The `firestore.rules.test.ts` would verify that `get`, `list`, `create`, `update`, and `delete` operations fail for these payloads when the conditions are not met.
