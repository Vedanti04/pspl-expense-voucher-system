import request from "supertest";
import app from "../server.js";
import { pool } from "../src/config/db.js";

describe("Authentication & RBAC Tests", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("should successfully log in demo employee and return JWT token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "employee@pspl.demo",
        password: "Employee123!"
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("role", "employee");
    expect(res.body.user.email).toBe("employee@pspl.demo");
  });

  it("should reject login with incorrect password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "employee@pspl.demo",
        password: "WrongPassword!"
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it("should reject login when fields are missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "employee@pspl.demo" });

    expect(res.status).toBe(400);
  });

  it("should return user profile on /api/auth/me with valid token", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "director@pspl.demo",
        password: "Director123!"
      });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.role).toBe("director");
  });

  it("should reject /api/auth/me when token is missing", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
