import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginForm } from "./login-form";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSignIn = vi.fn();
const mockGet = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => ({ get: mockGet }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithPassword: mockSignIn },
  }),
}));

beforeEach(() => {
  mockPush.mockReset();
  mockRefresh.mockReset();
  mockSignIn.mockReset();
  mockGet.mockReset();
});

describe("LoginForm", () => {
  it("로그인 성공 + redirectTo 있음 → 해당 경로로 이동", async () => {
    mockGet.mockReturnValue("/dashboard");
    mockSignIn.mockResolvedValue({ error: null });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /로그인/ }));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/dashboard")
    );
  });

  it("로그인 성공 + redirectTo 없음 → /home 으로 이동", async () => {
    mockGet.mockReturnValue(null);
    mockSignIn.mockResolvedValue({ error: null });

    render(<LoginForm />);
    fireEvent.submit(screen.getByRole("button", { name: /로그인/ }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/home"));
  });

  it("로그인 실패 → 에러 메시지 표시, push 미호출", async () => {
    mockGet.mockReturnValue(null);
    mockSignIn.mockResolvedValue({ error: { message: "Invalid credentials" } });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "bad@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "wrong" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /로그인/ }));

    await waitFor(() =>
      expect(
        screen.getByText("이메일 또는 비밀번호가 올바르지 않습니다.")
      ).toBeInTheDocument()
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("외부 URL redirectTo → /home 으로 폴백 (open redirect 방어)", async () => {
    mockGet.mockReturnValue("https://evil.com");
    mockSignIn.mockResolvedValue({ error: null });

    render(<LoginForm />);
    fireEvent.submit(screen.getByRole("button", { name: /로그인/ }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/home"));
  });

  it("protocol-relative redirectTo → /home 으로 폴백 (open redirect 방어)", async () => {
    mockGet.mockReturnValue("//evil.com");
    mockSignIn.mockResolvedValue({ error: null });

    render(<LoginForm />);
    fireEvent.submit(screen.getByRole("button", { name: /로그인/ }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/home"));
  });
});
