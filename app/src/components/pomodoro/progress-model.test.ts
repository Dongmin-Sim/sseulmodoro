import { describe, it, expect } from "vitest";
import { getProgressSteps } from "./progress-model";

describe("getProgressSteps", () => {
  it("should mark first pomodoro active and rest upcoming when focusing at 0/4", () => {
    // Arrange / Act
    const steps = getProgressSteps("focusing", 0, 4);

    // Assert
    expect(steps).toHaveLength(8); // 4 pomodoro + 3 short + 1 long
    expect(steps[0]).toEqual({ type: "pomodoro", state: "active" });
    expect(steps.slice(1).every((s) => s.state === "upcoming")).toBe(true);
  });

  it("should mark completed pomodoro+break and next pomodoro active when focusing at 1/4", () => {
    // Arrange / Act
    const steps = getProgressSteps("focusing", 1, 4);

    // Assert
    expect(steps[0]).toEqual({ type: "pomodoro", state: "completed" });
    expect(steps[1]).toEqual({ type: "shortBreak", state: "completed" });
    expect(steps[2]).toEqual({ type: "pomodoro", state: "active" });
  });

  it("should NOT mark next pomodoro active during break (only the break is active) at breaking 1/4", () => {
    // Arrange / Act
    const steps = getProgressSteps("breaking", 1, 4);

    // Assert
    expect(steps[0]).toEqual({ type: "pomodoro", state: "completed" });
    expect(steps[1]).toEqual({ type: "shortBreak", state: "active" });
    expect(steps[2]).toEqual({ type: "pomodoro", state: "upcoming" }); // 미리 강조되지 않음
  });

  it("should mark all pomodoros/short breaks completed and long break active at breaking 4/4", () => {
    // Arrange / Act
    const steps = getProgressSteps("breaking", 4, 4);

    // Assert
    const last = steps[steps.length - 1];
    expect(last).toEqual({ type: "longBreak", state: "active" });
    expect(
      steps.slice(0, -1).every((s) => s.state === "completed"),
    ).toBe(true);
  });

  it("should not mark any step active in non-timer phases", () => {
    // Arrange / Act
    const steps = getProgressSteps("pomodoro_done", 1, 4);

    // Assert
    expect(steps.some((s) => s.state === "active")).toBe(false);
  });

  it("should keep the about-to-take short break upcoming (not completed) at pomodoro_done 3/4", () => {
    // Arrange / Act
    const steps = getProgressSteps("pomodoro_done", 3, 4);

    // Assert
    expect(steps[4]).toEqual({ type: "pomodoro", state: "completed" }); // 방금 완료한 포모도로
    expect(steps[5]).toEqual({ type: "shortBreak", state: "upcoming" }); // 곧 할 휴식 — 완료 아님
  });

  it("should keep the long break upcoming (not completed) at pomodoro_done 4/4", () => {
    // Arrange / Act
    const steps = getProgressSteps("pomodoro_done", 4, 4);

    // Assert
    const last = steps[steps.length - 1];
    expect(last).toEqual({ type: "longBreak", state: "upcoming" });
  });

  it("should build sequence as pomodoro/break alternating ending with longBreak", () => {
    // Arrange / Act
    const types = getProgressSteps("idle", 0, 3).map((s) => s.type);

    // Assert
    expect(types).toEqual([
      "pomodoro",
      "shortBreak",
      "pomodoro",
      "shortBreak",
      "pomodoro",
      "longBreak",
    ]);
  });
});
