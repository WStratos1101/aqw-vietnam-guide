/** Wiki-verified quest rewards; this is NOT an assumption that every reward is a separate farm route. */
const items = [
  { name: "ArchMage's Cowl", type: "Helm", quest: "Book of Ice: Glacial Impact", wiki: "https://aqwwiki.wikidot.com/archmage-s-cowl" },
  { name: "ArchMage's Cowl and Locks", type: "Helm", quest: "Book of Ice: Glacial Impact", wiki: "https://aqwwiki.wikidot.com/archmage-s-cowl-and-locks" },
  { name: "ArchMage's Staff", type: "Staff", quest: "Book of Aether: Supernova", wiki: "https://aqwwiki.wikidot.com/archmage-s-staff" },
  { name: "ArchMage's Robes", type: "Armor", quest: "Book of Arcana: Arcane Sigil", wiki: "https://aqwwiki.wikidot.com/archmage-s-robes" },
  { name: "Arcane Sigil", type: "Ground", quest: "Archmage's Ascension", wiki: "https://aqwwiki.wikidot.com/arcane-sigil" },
  { name: "Divine Mantle", type: "Armor", quest: "Lumina Elementi", wiki: "https://aqwwiki.wikidot.com/divine-mantle" },
  { name: "Providence", type: "Staff · +51% All", quest: "Lumina Elementi", wiki: "https://aqwwiki.wikidot.com/providence" },
  { name: "Divine Veil", type: "Helm", quest: "Lumina Elementi", wiki: "https://aqwwiki.wikidot.com/divine-veil" },
  { name: "Divine Veil and Locks", type: "Helm", quest: "Lumina Elementi", wiki: "https://aqwwiki.wikidot.com/divine-veil-and-locks" },
  { name: "Astral Mantle", type: "Armor", quest: "Lumina Elementi", wiki: "https://aqwwiki.wikidot.com/astral-mantle" },
  { name: "Sheathed Providence", type: "Cape", quest: "Lumina Elementi", wiki: "https://aqwwiki.wikidot.com/sheathed-providence" },
  { name: "Prismatic Floating Sigil", type: "Cape", quest: "Lumina Elementi", wiki: "https://aqwwiki.wikidot.com/prismatic-floating-sigil" },
  { name: "Prismatic Sigil", type: "Ground", quest: "Lumina Elementi", wiki: "https://aqwwiki.wikidot.com/prismatic-sigil" },
];

export function ArchmageGear() {
  return (
    <details className="class-section aqw-cp-panel" data-aqw-archmage-rewards>
      <summary className="aqw-cp-summary">Trang bị ArchMage <small>{items.length} phần thưởng quest · mở/thu gọn</small></summary>
      <div className="aqw-cp-body">
        <p>Danh sách vật phẩm có thể nhận thông qua chuỗi quest ArchMage. Không tính vật phẩm trả phí hoặc gói Upgrade Bonus là tuyến farm.</p>
        <div className="aqw-cp-table-scroll"><table className="aqw-cp-gear-table"><thead><tr><th>Trang bị</th><th>Loại</th><th>Quest</th></tr></thead><tbody>
          {items.map((item) => (
            <tr key={item.name}>
              <td><a href={item.wiki} target="_blank" rel="noreferrer noopener">{item.name}</a></td>
              <td>{item.type}</td>
              <td>{item.quest}</td>
            </tr>
          ))}
        </tbody></table></div>
        <p className="aqw-cp-source">Đối chiếu với AQW Wiki (Warlic's Quests và từng trang item). Vật phẩm cần hoàn thành quest, không phải vật phẩm có thể mua tự do.</p>
      </div>
    </details>
  );
}
