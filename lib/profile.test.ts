import { describe, it, expect, vi, afterEach } from "vitest";
import { generateProfileSlug, sanitizeSlug, getHostname } from "./profile";

describe("generateProfileSlug", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lowercases the name and replaces non-alphanumeric runs with a single dash", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.123456);
    const slug = generateProfileSlug("Eitan Feldman");
    expect(slug).toMatch(/^eitan-feldman-[a-z0-9]{4}$/);
  });

  it("strips leading/trailing dashes produced by punctuation at the edges", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.123456);
    const slug = generateProfileSlug("  ¡Hola!  ");
    expect(slug.startsWith("-")).toBe(false);
    expect(slug).toMatch(/^hola-[a-z0-9]{4}$/);
  });

  it("appends a random 4-character suffix so two equal names don't collide", () => {
    const first = generateProfileSlug("Ana Lopez");
    const second = generateProfileSlug("Ana Lopez");
    expect(first).not.toBe(second);
  });
});

describe("sanitizeSlug", () => {
  it("lowercases and strips characters outside [a-z0-9-]", () => {
    expect(sanitizeSlug("Mi Perfil_Público!")).toBe("miperfilpblico");
  });

  it("keeps dashes already present", () => {
    expect(sanitizeSlug("mi-perfil-123")).toBe("mi-perfil-123");
  });

  it("returns an empty string for input with no valid characters", () => {
    expect(sanitizeSlug("¡¡¡!!!")).toBe("");
  });
});

describe("getHostname", () => {
  it("extracts the hostname from a valid URL", () => {
    // Intentionally wrong expectation, to demonstrate the CI pipeline blocking on a failing test.
    expect(getHostname("https://www.github.com/foo/bar")).toBe("github.com");
  });

  it("returns an empty string for a malformed URL instead of throwing", () => {
    expect(getHostname("not-a-url")).toBe("");
  });

  it("returns an empty string for an empty input", () => {
    expect(getHostname("")).toBe("");
  });
});
