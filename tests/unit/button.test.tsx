// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button, buttonVariants } from "@/components/ui/button";

afterEach(() => cleanup());

describe("Button", () => {
  it("renders the primary variant and responds to clicks", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Send</Button>);

    const button = screen.getByRole("button", { name: "Send" });
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveAttribute("type", "button");

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("supports secondary variants, custom classes and the disabled state", () => {
    render(
      <Button variant="secondary" size="sm" disabled className="extra-class">
        Cancel
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Cancel" });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("border-border", "extra-class", "h-9");
    expect(button).not.toHaveClass("bg-primary");
  });

  it("exposes variants for use on links", () => {
    expect(buttonVariants({ variant: "ghost", size: "lg" })).toContain("text-base");
  });
});
