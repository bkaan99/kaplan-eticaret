import Link from "next/link";

interface LegalAgreementsSectionProps {
  legalLinks: { slug: string; title: string; href: string }[];
  error?: string;
}

export function LegalAgreementsSection({
  legalLinks,
  error,
}: LegalAgreementsSectionProps) {
  const preInfo = legalLinks.find((l) => l.slug === "on-bilgilendirme-formu");
  const salesContract = legalLinks.find(
    (l) => l.slug === "mesafeli-satis-sozlesmesi",
  );

  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="acceptTerms" required className="mt-1" />
        <span>
          {preInfo ? (
            <Link href={preInfo.href} target="_blank" className="underline">
              Ön bilgilendirme formunu
            </Link>
          ) : (
            "Ön bilgilendirme formunu"
          )}{" "}
          ve{" "}
          {salesContract ? (
            <Link
              href={salesContract.href}
              target="_blank"
              className="underline"
            >
              mesafeli satış sözleşmesini
            </Link>
          ) : (
            "mesafeli satış sözleşmesini"
          )}{" "}
          okudum, onaylıyorum.
        </span>
      </label>
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
