import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RootLayout from "./layout";

describe("RootLayout", () => {
  it("renders children inside the layout", () => {
    render(<RootLayout><div>test child</div></RootLayout>);
    expect(screen.getByText("test child")).toBeInTheDocument();
  });
});
