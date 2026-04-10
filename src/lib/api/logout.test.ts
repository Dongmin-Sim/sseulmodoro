import { describe, it, expect, vi, beforeEach } from "vitest";
import { logout } from "./logout";

describe("logout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return success response when logout succeeds", async () => {
    // Arrange
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }),
    );

    // Act
    const result = await logout();

    // Assert
    expect(result).toEqual({ success: true });
    expect(fetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
  });

  it("should throw when server returns non-ok response", async () => {
    // Arrange
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    // Act & Assert
    await expect(logout()).rejects.toThrow("Failed to logout");
  });

  it("should throw when fetch itself rejects (network error)", async () => {
    // Arrange
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    // Act & Assert
    await expect(logout()).rejects.toThrow("Network error");
  });
});
