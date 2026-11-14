import { useState } from "react";
// Mapping verified against https://aqwwiki.wikidot.com/key (2026-11-14).
// The Wiki explicitly uses the same Gun/Bow type icon for both subtypes.
const files: Record<string, string> = {
  Inventory: "Inventory.png",
  Weapons: "Sword_Table.png",
  Armors: "Armor_Table.png",
  Helms: "Helmet_table.png",
  "Capes / Back Items": "Cloak_Table.png",
  Pets: "Pet_Table.png",
  Classes: "class_table.png",
  Sword: "Sword_Table.png",
  Axe: "Axe_Table.png",
  Dagger: "Dagger_Table.png",
  Bow: "Gun_Table.png",
  Gun: "Gun_Table.png",
  Mace: "Mace_Table.png",
  Polearm: "Polearm_Table.png",
  Staff: "Staff_Table.png",
};
export function FarmTypeIcon({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const file = files[name];
  return file && !failed ? (
    <>
      <img
        className="fv2-type-icon"
        src={"/images/aqw/farm-types/" + file}
        alt=""
        aria-hidden="true"
        width={28}
        height={28}
        onError={() => setFailed(true)}
      />
      <span className="fv2-sr-only">{name}</span>
    </>
  ) : (
    <span title="Chưa có icon xác minh">{name}</span>
  );
}
