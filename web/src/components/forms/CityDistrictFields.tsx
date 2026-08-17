import { CITIES, districtsOf } from "@/data/turkey-locations";

export function CityDistrictFields({
  city,
  district,
  onCity,
  onDistrict,
  inputClass,
  cityClassName,
  districtClassName,
}: {
  city: string;
  district: string;
  onCity: (value: string) => void;
  onDistrict: (value: string) => void;
  inputClass: string;
  cityClassName?: string;
  districtClassName?: string;
}) {
  const districts = districtsOf(city);
  const options = district && !districts.includes(district) ? [district, ...districts] : districts;

  return (
    <>
      <label className={cityClassName ?? "block min-w-0 text-[12px] font-bold text-[#555]"}>
        Şehir
        <select
          value={city}
          onChange={(e) => {
            onCity(e.target.value);
            onDistrict("");
          }}
          className={inputClass}
        >
          {(city && !CITIES.includes(city) ? [city, ...CITIES] : CITIES).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className={districtClassName ?? "block min-w-0 text-[12px] font-bold text-[#555]"}>
        İlçe
        <select
          value={district}
          onChange={(e) => onDistrict(e.target.value)}
          className={inputClass}
        >
          <option value="">İlçe seçin</option>
          {options.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
