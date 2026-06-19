import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MapPage from "./page";

describe("MapPage", () => {
  it("renders the app name", () => {
    render(<MapPage />);
    expect(screen.getByText("UniWay")).toBeInTheDocument();
  });
});
