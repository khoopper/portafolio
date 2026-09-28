import { describe, expect, it } from "vitest";
import { parseRecommendationInput } from "./input";

const valid = { role: "Directora", company: "Clínica San Rafael", body: "Un sistema excelente que nos ahorró horas cada semana." };

describe("parseRecommendationInput", () => {
  it("acepta y limpia espacios, saltos, caracteres invisibles", () => {
    const result = parseRecommendationInput({
      role: "  Directora \n general ",
      company: valid.company,
      body: "Hola​ mundo\n\n\n\nsegunda línea con suficiente texto para pasar",
    });
    expect(result).toEqual({
      ok: true,
      value: { role: "Directora general", company: valid.company, body: "Hola mundo\n\nsegunda línea con suficiente texto para pasar" },
    });
  });

  it("marca cada campo fuera de límites", () => {
    const result = parseRecommendationInput({ role: "a", company: "", body: "corto" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["body", "company", "role"]);
  });

  it("respeta el máximo de 800 contando caracteres, no bytes", () => {
    expect(parseRecommendationInput({ ...valid, body: "é".repeat(800) }).ok).toBe(true);
    expect(parseRecommendationInput({ ...valid, body: "x".repeat(801) }).ok).toBe(false);
  });

  it("ignora valores que no son texto", () => {
    expect(parseRecommendationInput({ role: 42, company: null, body: {} }).ok).toBe(false);
  });
});
