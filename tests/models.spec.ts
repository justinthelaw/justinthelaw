import { expect, test } from "@playwright/test";
import {
  getDeviceSpecificDtype,
  getDtypeFallbackOrder,
} from "../src/config/models";

test.describe("Model dtype policy", () => {
  test("uses monolithic ONNX dtypes for automatic browser loading", () => {
    expect(getDeviceSpecificDtype(390)).toBe("int8");
    expect(getDeviceSpecificDtype(1280)).toBe("int8");
    expect(getDtypeFallbackOrder("int8")).toEqual(["int8", "uint8"]);
  });

  test("does not automatically retry q4 after a q4 preference", () => {
    expect(getDtypeFallbackOrder("q4")).toEqual(["int8", "uint8"]);
  });
});
