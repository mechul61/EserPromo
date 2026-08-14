/** Referans şerit: sol ikon + iki satır kalın lacivert metin */

function IconPen() {
  return (
    <svg viewBox="0 0 40 40" className="size-10 shrink-0" fill="none" aria-hidden>
      <circle cx="20" cy="20" r="18" fill="#E8F0FF" />
      <path
        d="M12.2 28.8 26.6 9.4a2.4 2.4 0 0 1 3.5-.15l.7.7a2.4 2.4 0 0 1-.15 3.5L16.2 32.9l-5.2 1.2 1.2-5.3Z"
        stroke="#2B3A67"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="m25.2 11.2 3.9 3.9" stroke="#2B3A67" strokeWidth="2.2" />
      <path
        d="M13.1 26.8 15.8 29.4"
        stroke="#2B3A67"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPercent() {
  return (
    <svg viewBox="0 0 40 40" className="size-10 shrink-0" aria-hidden>
      <circle cx="20" cy="20" r="18" fill="#FFF3D6" />
      <text
        x="20"
        y="26.5"
        textAnchor="middle"
        fontSize="20"
        fontWeight="800"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="#E39A14"
      >
        %
      </text>
    </svg>
  );
}

function IconTruck() {
  return (
    <svg viewBox="0 0 40 40" className="size-10 shrink-0" fill="none" aria-hidden>
      <circle cx="20" cy="20" r="18" fill="#E4F3FF" />
      <path
        d="M7.5 13.2h13.2v11.2H7.5z"
        fill="#F3F9FF"
        stroke="#3B8FD4"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M20.7 17h5.2L29.5 21v3.4h-8.8V17Z"
        fill="#3B8FD4"
        stroke="#3B8FD4"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12.2" cy="26.2" r="2.15" fill="#fff" stroke="#3B8FD4" strokeWidth="1.7" />
      <circle cx="24.8" cy="26.2" r="2.15" fill="#fff" stroke="#3B8FD4" strokeWidth="1.7" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 40 40" className="size-10 shrink-0" fill="none" aria-hidden>
      <circle cx="20" cy="20" r="18" fill="#EAF7EE" />
      <path
        d="M20 8.8 28.4 12v6.2c0 5.4-3.5 9.6-8.4 10.9C15.1 27.8 11.6 23.6 11.6 18.2V12L20 8.8Z"
        fill="#F4FBF6"
        stroke="#2FAA5A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m15.6 19.4 3.1 3.1 5.8-6"
        stroke="#2FAA5A"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSmile() {
  return (
    <svg viewBox="0 0 40 40" className="size-10 shrink-0" fill="none" aria-hidden>
      <circle cx="20" cy="20" r="18" fill="#FFF1D4" />
      <circle cx="20" cy="20" r="11.2" stroke="#E39A14" strokeWidth="2" fill="#FFF8E8" />
      <circle cx="16.2" cy="17.6" r="1.45" fill="#E39A14" />
      <circle cx="23.8" cy="17.6" r="1.45" fill="#E39A14" />
      <path
        d="M14.8 22.6c1.4 2 3.1 2.9 5.2 2.9s3.8-.9 5.2-2.9"
        stroke="#E39A14"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const features = [
  { title: "Ücretsiz Logolu", subtitle: "Tasarım Desteği", Icon: IconPen },
  { title: "Toplu Alımlarda", subtitle: "Avantajlı Fiyatlar", Icon: IconPercent },
  { title: "Türkiye Geneli", subtitle: "Hızlı Teslimat", Icon: IconTruck },
  { title: "Güvenli", subtitle: "Alışveriş", Icon: IconShield },
  { title: "%100", subtitle: "Müşteri Memnuniyeti", Icon: IconSmile },
];

export function FeatureStrip() {
  return (
    <section className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
      {features.map(({ title, subtitle, Icon }) => (
        <div
          key={title + subtitle}
          className="flex h-[70px] items-center gap-3 rounded-[10px] bg-white px-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.08)]"
        >
          <Icon />
          <div className="min-w-0 text-[13px] leading-[1.2] font-bold text-[#1a2744]">
            <p>{title}</p>
            <p>{subtitle}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
