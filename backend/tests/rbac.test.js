import request from "supertest";
import app from "../server.js";
import { pool } from "../src/config/db.js";

describe("Role-Based Access Control (RBAC) & Filter Tests", () => {
  let emp1Token, emp2Token, dirToken, accToken;
  let emp2VoucherId;

  beforeAll(async () => {
    // Employee 1
    const res1 = await request(app).post("/api/auth/login").send({
      email: "employee@pspl.demo",
      password: "Employee123!"
    });
    emp1Token = res1.body.token;

    // Employee 2
    const res2 = await request(app).post("/api/auth/login").send({
      email: "employee2@pspl.demo",
      password: "Employee123!"
    });
    emp2Token = res2.body.token;

    // Director
    const res3 = await request(app).post("/api/auth/login").send({
      email: "director@pspl.demo",
      password: "Director123!"
    });
    dirToken = res3.body.token;

    // Accounts
    const res4 = await request(app).post("/api/auth/login").send({
      email: "accounts@pspl.demo",
      password: "Accounts123!"
    });
    accToken = res4.body.token;

    // Create a voucher under Employee 2
    const emp2Voucher = await request(app)
      .post("/api/vouchers")
      .set("Authorization", `Bearer ${emp2Token}`)
      .send({
        department: "Marketing",
        expenseTitle: "Employee 2 Confidential Campaign",
        expenseDate: "2026-04-11",
        category: "Marketing",
        amount: 8900
      });

    emp2VoucherId = emp2Voucher.body.voucher.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  it("Rule: Employees can only view vouchers created by themselves (Employee Isolation)", async () => {
    // Employee 1 list vouchers -> should NOT contain Employee 2's voucher
    const emp1List = await request(app)
      .get("/api/vouchers")
      .set("Authorization", `Bearer ${emp1Token}`);

    expect(emp1List.status).toBe(200);
    const hasEmp2Voucher = emp1List.body.vouchers.some(v => v.id === emp2VoucherId);
    expect(hasEmp2Voucher).toBe(false);

    // Employee 1 direct access by ID -> 403 Forbidden
    const directRes = await request(app)
      .get(`/api/vouchers/${emp2VoucherId}`)
      .set("Authorization", `Bearer ${emp1Token}`);

    expect(directRes.status).toBe(403);
    expect(directRes.body.message).toMatch(/own/i);
  });

  it("Rule: Director and Accounts team CAN view all vouchers across organization", async () => {
    // Director view Employee 2 voucher
    const dirRes = await request(app)
      .get(`/api/vouchers/${emp2VoucherId}`)
      .set("Authorization", `Bearer ${dirToken}`);
    expect(dirRes.status).toBe(200);
    expect(dirRes.body.voucher.id).toBe(emp2VoucherId);

    // Accounts view Employee 2 voucher
    const accRes = await request(app)
      .get(`/api/vouchers/${emp2VoucherId}`)
      .set("Authorization", `Bearer ${accToken}`);
    expect(accRes.status).toBe(200);
    expect(accRes.body.voucher.id).toBe(emp2VoucherId);
  });

  it("Rule: Accounts team is strictly view-only (cannot create, edit, approve, or delete)", async () => {
    // Cannot create
    const createRes = await request(app)
      .post("/api/vouchers")
      .set("Authorization", `Bearer ${accToken}`)
      .send({
        department: "Finance",
        expenseTitle: "Illegal Accounts Voucher",
        expenseDate: "2026-04-12",
        category: "Meals",
        amount: 500
      });
    expect(createRes.status).toBe(403);

    // Cannot edit
    const editRes = await request(app)
      .put(`/api/vouchers/${emp2VoucherId}`)
      .set("Authorization", `Bearer ${accToken}`)
      .send({
        department: "Finance",
        expenseTitle: "Illegal Edit",
        expenseDate: "2026-04-12",
        category: "Meals",
        amount: 600
      });
    expect(editRes.status).toBe(403);

    // Cannot approve
    const approveRes = await request(app)
      .post(`/api/vouchers/${emp2VoucherId}/approve`)
      .set("Authorization", `Bearer ${accToken}`)
      .send({});
    expect(approveRes.status).toBe(403);
  });

  it("Rule: Employee cannot approve or reject vouchers", async () => {
    const approveRes = await request(app)
      .post(`/api/vouchers/${emp2VoucherId}/approve`)
      .set("Authorization", `Bearer ${emp1Token}`)
      .send({});
    expect(approveRes.status).toBe(403);

    const rejectRes = await request(app)
      .post(`/api/vouchers/${emp2VoucherId}/reject`)
      .set("Authorization", `Bearer ${emp1Token}`)
      .send({ reason: "Not allowed" });
    expect(rejectRes.status).toBe(403);
  });

  it("Bonus Point: Multi-parameter Search, Filter, and Sorting", async () => {
    // Search keyword
    const searchRes = await request(app)
      .get("/api/vouchers?search=Confidential")
      .set("Authorization", `Bearer ${dirToken}`);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.vouchers.length).toBeGreaterThan(0);
    expect(searchRes.body.vouchers[0].expenseTitle).toContain("Confidential");

    // Filter by department
    const deptRes = await request(app)
      .get("/api/vouchers?department=Marketing")
      .set("Authorization", `Bearer ${dirToken}`);
    expect(deptRes.status).toBe(200);
    expect(deptRes.body.vouchers.every(v => v.department === "Marketing")).toBe(true);

    // Filter by amount range
    const amountRes = await request(app)
      .get("/api/vouchers?minAmount=8000&maxAmount=10000")
      .set("Authorization", `Bearer ${dirToken}`);
    expect(amountRes.status).toBe(200);
    expect(amountRes.body.vouchers.every(v => v.amount >= 8000 && v.amount <= 10000)).toBe(true);
  });
});