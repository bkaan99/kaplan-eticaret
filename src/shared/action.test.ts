import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/shared/errors";
import { runStorefrontAction } from "./action";
import * as errorReporter from "@/shared/error-reporter";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("runStorefrontAction", () => {
  it("başarılı işlemde ok: true ve data döner, revalidate çağırır", async () => {
    const { revalidatePath } = await import("next/cache");

    const result = await runStorefrontAction(
      async () => {
        return { count: 5 };
      },
      { revalidate: ["/sepet"] },
    );

    expect(result).toEqual({ ok: true, data: { count: 5 } });
    expect(revalidatePath).toHaveBeenCalledWith("/sepet");
  });

  it("AppError fırlatıldığında hatanın mesajını döner ve reportError çağırmaz", async () => {
    const reportSpy = vi.spyOn(errorReporter, "reportError");

    const result = await runStorefrontAction(async () => {
      throw new ValidationError("Sepetiniz boş");
    });

    expect(result).toEqual({ ok: false, error: "Sepetiniz boş" });
    expect(reportSpy).not.toHaveBeenCalled();
    reportSpy.mockRestore();
  });

  it("beklenmeyen hata fırlatıldığında reportError çağırır ve varsayılan mesajı döner", async () => {
    const reportSpy = vi
      .spyOn(errorReporter, "reportError")
      .mockImplementation(() => {});

    const unexpected = new Error("Database network timeout");
    const result = await runStorefrontAction(
      async () => {
        throw unexpected;
      },
      {
        actionName: "testAction",
        context: { orderId: "123" },
        fallbackErrorMessage: "Özel hata mesajı",
      },
    );

    expect(result).toEqual({ ok: false, error: "Özel hata mesajı" });
    expect(reportSpy).toHaveBeenCalledWith(unexpected, {
      action: "testAction",
      orderId: "123",
    });
    reportSpy.mockRestore();
  });

  it("Next.js redirect hatasını yutmaz, yeniden fırlatır", async () => {
    const redirectError = {
      digest: "NEXT_REDIRECT;replace;/siparis/123;307;",
    };

    await expect(
      runStorefrontAction(async () => {
        throw redirectError;
      }),
    ).rejects.toEqual(redirectError);
  });
});
