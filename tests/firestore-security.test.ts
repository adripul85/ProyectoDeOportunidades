import { describe, it, beforeAll, afterAll, expect } from "bun:test";
import { initializeTestEnvironment, assertFails, assertSucceeds, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

let testEnv: RulesTestEnvironment;

describe("Firestore Security Rules - Users Collection", () => {
    beforeAll(async () => {
        // Initialize test environment
        testEnv = await initializeTestEnvironment({
            projectId: "test-de-oportunidades",
            firestore: {
                rules: readFileSync("firestore.rules", "utf8"),
                host: "127.0.0.1",
                port: 8080
            },
        });
    });

    afterAll(async () => {
        await testEnv.cleanup();
    });

    it("should deny standard user from updating their own wallet", async () => {
        const db = testEnv.authenticatedContext("alice").firestore();

        // Create the user profile first
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection("users").doc("alice").set({
                displayName: "Alice",
                wallet: { available: 100, pending: 0, inEscrow: 0 }
            });
        });

        const userDocRef = db.collection("users").doc("alice");

        // Attempting to update wallet.available should fail
        await assertFails(userDocRef.update({
            "wallet.available": 50000
        }));
    });

    it("should deny standard user from updating their own role", async () => {
        const db = testEnv.authenticatedContext("alice").firestore();
        const userDocRef = db.collection("users").doc("alice");

        await assertFails(userDocRef.update({
            role: "admin"
        }));
    });

    it("should allow standard user to update non-restricted fields like displayName", async () => {
        const db = testEnv.authenticatedContext("alice").firestore();
        const userDocRef = db.collection("users").doc("alice");

        await assertSucceeds(userDocRef.update({
            displayName: "Alice Updated"
        }));
    });

    it("should allow admin user to update any field in any user", async () => {
        const db = testEnv.authenticatedContext("admin", { admin: true }).firestore();

        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection("users").doc("bob").set({
                displayName: "Bob",
                wallet: { available: 0, pending: 0, inEscrow: 0 }
            });
        });

        const bobDocRef = db.collection("users").doc("bob");

        await assertSucceeds(bobDocRef.update({
            "wallet.available": 1000
        }));
    });
});
