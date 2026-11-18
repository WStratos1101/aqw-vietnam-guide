import { useJourneyMotion } from "./journey-motion";
import "./journey-showcase.css";

/** Scoped replacement for the Home "Hành trình" section only. */
export function JourneyShowcase() {
  useJourneyMotion();
  const externalHeading = false;
  const chapters = [
    {
      id: "origin",

      title: "Khởi đầu của câu chuyện",
      description:
        "Khi đôi mắt rực lửa xé tan màn đêm, Lore biết rằng thời đại yên bình đã chấm dứt. Từ Battleon, một anh hùng vô danh bước vào hành trình mà mỗi lựa chọn đều có thể đổi thay vận mệnh thế giới.",
      image: "/images/journey/chapter-1-drakath.webp",
      alt: "Drakath với đôi mắt đỏ rực giữa bóng tối Chaos",
      href: "/cot-truyen",
    },
    {
      id: "forging",

      title: "Rèn nên số phận",
      description:
        "Giữa pháp trận cổ xưa, một lưỡi kiếm thức tỉnh — nhưng sức mạnh chưa từng thuộc về kẻ chỉ biết chờ đợi. Hãy vượt qua thử thách, săn tìm báu vật thất lạc và tự tay rèn nên huyền thoại mang tên mình.",
      image: "/images/journey/chapter-2-lae-original.png",
      alt: "Hai chiến binh trong cutscene Lae dưới bầu trời sao",
      href: "/farm",
    },
    {
      id: "alliances",

      title: "Những người bạn, đồng minh và kẻ thù",
      description:
        "Trên con đường chinh phục Lore, một lời thề có thể là tấm khiên, cũng có thể là lưỡi dao sau lưng. Hãy sát cánh cùng những người xứng đáng và đối diện những thế lực đang chờ trong bóng tối.",
      image: "/images/journey/chapter-3-darkon.webp",
      alt: "Darkon trên ngai giữa không gian đỏ rực, đối diện bóng đen kẻ thù",
      href: "/ultra-boss",
    },
  ];

  return (
    <section className={`aqw-jny${externalHeading ? " aqw-jny--embedded" : ""}`} aria-label="Hành trình qua Lore">
      <div className="aqw-jny__wrap">
        {!externalHeading && (
          <header className="aqw-jny__header">
            <h2 className="aqw-jny__headline">Hành trình</h2>
            <p className="aqw-jny__tagline">Từ tiếng gọi của Chaos đến những cuộc chiến định đoạt Lore.</p>
          </header>
        )}
        <div className="aqw-jny__chapters">
          {chapters.map((chapter) => (
            <a key={chapter.id} className={`aqw-jny__card aqw-jny__card--${chapter.id}`} href={chapter.href} aria-label={`${chapter.title} — mở chuyên mục`}>
              <div className="aqw-jny__art" aria-hidden="true">
                <img src={chapter.image} alt="" loading="lazy" />
              </div>
              <div className="aqw-jny__copy">
                
                <h3 className="aqw-jny__title">{chapter.title}</h3>
                <p className="aqw-jny__description">{chapter.description}</p>
              </div>
              <span className="aqw-jny__arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export { JourneyShowcase as LoreShowcase };
export default JourneyShowcase;
