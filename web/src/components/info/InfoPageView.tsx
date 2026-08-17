import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { ShopChrome } from "@/components/layout/ShopChrome";
import type { InfoPageContent } from "@/data/info-pages";

export function InfoPageView({ page }: { page: InfoPageContent }) {
  return (
    <ShopChrome>
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[12px] text-[#8b919a]">
        <Link href="/" className="inline-flex items-center hover:text-navy" aria-label="Ana Sayfa">
          <Home className="size-3.5" />
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/" className="hover:text-navy">
          Ana Sayfa
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-[#555]">{page.title}</span>
      </nav>

      <article className="mx-auto max-w-3xl rounded-md border border-line bg-white p-6 sm:p-8">
        <h1 className="text-[24px] font-extrabold tracking-wide text-navy uppercase">{page.title}</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[#555]">{page.intro}</p>
        <div className="mt-8 space-y-8">
          {page.sections.map((section) => (
            <section key={section.heading ?? section.paragraphs?.[0]}>
              {section.heading ? (
                <h2 className="text-[16px] font-extrabold text-navy">{section.heading}</h2>
              ) : null}
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-2 text-[14px] leading-relaxed text-[#444]">
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-[#444]">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </ShopChrome>
  );
}
