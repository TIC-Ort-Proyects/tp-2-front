import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FaviconImg } from "./favicon-img";

describe("FaviconImg", () => {
  it("builds the Google favicon URL from the given hostname", () => {
    const { container } = render(<FaviconImg hostname="github.com" />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.src).toBe("https://www.google.com/s2/favicons?domain=github.com&sz=64");
  });

  it("hides itself on load error instead of showing a broken image icon", () => {
    const { container } = render(<FaviconImg hostname="does-not-exist.invalid" />);
    const img = container.querySelector("img") as HTMLImageElement;
    img.dispatchEvent(new Event("error"));
    expect(img.style.display).toBe("none");
  });
});
