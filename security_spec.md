# Security Specification - Hospital Dashboard

## Data Invariants
1. A Patient Record must be associated with an authenticated user (radiographer).
2. Film Stock records track inventory and must be updated with server timestamps.
3. Radiographer records define access levels and can only be managed by admins.

## The Dirty Dozen (Threat Model)
1. **Identity Spoofing**: Attempt to create a patient record with someone else's `userId`.
2. **Resource Poisoning**: Attempt to create a record with a massive document ID (ID injection).
3. **Ghost Field Injection**: Attempt to add `isVerified: true` to a radiographer record during update.
4. **PII Scraping**: Attempt to list all radiographers as an unauthenticated user.
5. **State Manipulation**: Attempt to change the `role` of a radiographer record as a non-admin.
6. **Orphaned Writes**: Attempt to delete a radiographer record as a regular radiographer.
7. **Timestamp Fraud**: Attempt to set a custom `createdAt` time in the past/future.
8. **Bulk Deletion**: Attempt to delete patient records not owned by the user.
9. **Inventory Tampering**: Attempt to update film stock without being logged in.
10. **Schema Bypass**: Attempt to create a patient record without a name.
11. **Admin Escalation**: Attempt to spoof the admin email `ebsoftopd@gmail.com` without verification.
12. **Denial of Wallet**: Attempt to perform deeply nested lookups or recursive operations (not applicable here, but we use flat structures).

## Test Runner (firestore.rules.test.ts)
```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "hospital-dashboard-test",
    firestore: {
      rules: await fs.readFile("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

test("Unauthorized user cannot read records", async () => {
  const unauthedDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(unauthedDb, "patientRecords/123")));
});

test("Radiographer can create own record with valid schema", async () => {
  const authedDb = testEnv.authenticatedContext("user123").firestore();
  await assertSucceeds(setDoc(doc(authedDb, "patientRecords/rec1"), {
    name: "John Doe",
    date: "2024-01-01",
    userId: "user123",
    createdAt: serverTimestamp(),
    // ... other fields
  }));
});

test("Radiographer cannot spoof userId", async () => {
  const authedDb = testEnv.authenticatedContext("user123").firestore();
  await assertFails(setDoc(doc(authedDb, "patientRecords/rec1"), {
    name: "John Doe",
    userId: "attacker",
    createdAt: serverTimestamp(),
  }));
});
```
