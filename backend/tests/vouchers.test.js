import request from "supertest";
import app from "../server.js";
import { pool } from "../src/config/db.js";

describe("Expense Voucher Business Workflow Tests", () => {
  let employeeToken;
  let directorToken;
  let testVoucherId;

  beforeAll(async () => {
    // Log in Employee
    const empLogin = await request(app).post("/api/auth/login").send({
      email: "employee@pspl.demo",
      password: "Employee123!"
    });
    employeeToken = empLogin.body.token;

    // Log in Director
    const dirLogin = await request(app).post("/api/auth/login").send({
      email: "director@pspl.demo",
      password: "Director123!"
    });
    directorToken = dirLogin.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  it("Rule: New voucher must initially be saved as Draft with auto-generated voucher number", async () => {
    const res = await request(app)
      .post("/api/vouchers")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        department: "Engineering",
        expenseTitle: "Test Suite Cloud Server",
        expenseDate: "2026-04-12",
        category: "Software & IT",
        description: "Integration test voucher",
        amount: 2500.50
      });

    expect(res.status).toBe(201);
    expect(res.body.voucher).toHaveProperty("id");
    expect(res.body.voucher.status).toBe("Draft");
    expect(res.body.voucher.voucherNumber).toMatch(/^PSPL-\d{4}-\d{5}$/);
    expect(res.body.voucher.amount).toBe(2500.50);

    testVoucherId = res.body.voucher.id;
  });

  it("Validation Rule: Mandatory fields must be validated (amount, title, department, date)", async () => {
    // Negative amount
    const invalidAmountRes = await request(app)
      .post("/api/vouchers")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        department: "Engineering",
        expenseTitle: "Invalid Amount Test",
        expenseDate: "2026-04-12",
        category: "Travel",
        amount: -500
      });
    expect(invalidAmountRes.status).toBe(400);

    // Missing department
    const missingDeptRes = await request(app)
      .post("/api/vouchers")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        expenseTitle: "Missing Department Test",
        expenseDate: "2026-04-12",
        category: "Travel",
        amount: 1000
      });
    expect(missingDeptRes.status).toBe(400);
  });

  it("Rule: Employee can edit voucher while in Draft status", async () => {
    const res = await request(app)
      .put(`/api/vouchers/${testVoucherId}`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        department: "Engineering",
        expenseTitle: "Updated Cloud Server (Draft)",
        expenseDate: "2026-04-12",
        category: "Software & IT",
        description: "Updated description",
        amount: 3200.00
      });

    expect(res.status).toBe(200);
    expect(res.body.voucher.expenseTitle).toBe("Updated Cloud Server (Draft)");
    expect(res.body.voucher.amount).toBe(3200.00);
  });

  it("Validation Rule: Employee signature is mandatory before submission", async () => {
    // Attempt submit without signature
    const res = await request(app)
      .post(`/api/vouchers/${testVoucherId}/submit`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/signature/i);
  });

  it("Rule: Attaching employee signature and submitting voucher moves it to Pending Approval", async () => {
    // Sample dummy base64 signature
    const sampleSigBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    // Attach signature
    const sigRes = await request(app)
      .post(`/api/vouchers/${testVoucherId}/employee-signature`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ signatureBase64: sampleSigBase64 });

    expect(sigRes.status).toBe(200);
    expect(sigRes.body.voucher.employeeSignature).toBeTruthy();

    // Now submit
    const submitRes = await request(app)
      .post(`/api/vouchers/${testVoucherId}/submit`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({});

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.voucher.status).toBe("Pending Approval");
  });

  it("Rule: Submitted voucher becomes read-only for employee (cannot edit or delete)", async () => {
    // Try to edit submitted voucher
    const editRes = await request(app)
      .put(`/api/vouchers/${testVoucherId}`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        department: "Engineering",
        expenseTitle: "Illegal edit after submit",
        expenseDate: "2026-04-12",
        category: "Travel",
        amount: 9999
      });
    expect(editRes.status).toBe(400);

    // Try to delete submitted voucher
    const delRes = await request(app)
      .delete(`/api/vouchers/${testVoucherId}`)
      .set("Authorization", `Bearer ${employeeToken}`);
    expect(delRes.status).toBe(400);
  });

  it("Validation Rule: Director signature is mandatory before approval", async () => {
    const res = await request(app)
      .post(`/api/vouchers/${testVoucherId}/approve`)
      .set("Authorization", `Bearer ${directorToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/signature/i);
  });

  it("Rule: Director approving with signature marks voucher as Approved and records approval date", async () => {
    const dirSigBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const res = await request(app)
      .post(`/api/vouchers/${testVoucherId}/approve`)
      .set("Authorization", `Bearer ${directorToken}`)
      .send({ signatureBase64: dirSigBase64 });

    expect(res.status).toBe(200);
    expect(res.body.voucher.status).toBe("Approved");
    expect(res.body.voucher.approvalDate).toBeTruthy();
    expect(res.body.voucher.directorSignature).toBeTruthy();
    expect(res.body.voucher.directorName).toBe("Vikram Malhotra");
  });

  it("Rule: Rejecting a voucher requires mandatory rejection reason", async () => {
    // Create another voucher to test rejection flow
    const vRes = await request(app)
      .post("/api/vouchers")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        department: "Engineering",
        expenseTitle: "Voucher for Rejection Test",
        expenseDate: "2026-04-12",
        category: "Meals",
        amount: 850
      });

    const rejectVoucherId = vRes.body.voucher.id;

    // Attach signature and submit
    const sampleSig = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    await request(app)
      .post(`/api/vouchers/${rejectVoucherId}/submit`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ signatureBase64: sampleSig });

    // Director attempts rejection without reason -> should fail
    const noReasonRes = await request(app)
      .post(`/api/vouchers/${rejectVoucherId}/reject`)
      .set("Authorization", `Bearer ${directorToken}`)
      .send({ reason: "   " });

    expect(noReasonRes.status).toBe(400);
    expect(noReasonRes.body.message).toMatch(/reason/i);

    // Director rejects with reason -> should succeed
    const rejectedRes = await request(app)
      .post(`/api/vouchers/${rejectVoucherId}/reject`)
      .set("Authorization", `Bearer ${directorToken}`)
      .send({ reason: "Receipt bill is missing itemized tax breakdown." });

    expect(rejectedRes.status).toBe(200);
    expect(rejectedRes.body.voucher.status).toBe("Rejected");
    expect(rejectedRes.body.voucher.rejectionReason).toBe("Receipt bill is missing itemized tax breakdown.");
  });
});