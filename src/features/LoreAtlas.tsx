import { ArrowUpRight, Compass } from "lucide-react";
import { loreRegions, loreRegionHref, type LoreRegion } from "../content/lore-regions";
import "../styles/lore-atlas.css";

export function LoreAtlas() {
  return (
    <section className="chapter lore-atlas" id="ban-do-lore" aria-labelledby="lore-atlas-title">
      <div className="section-heading lore-atlas-heading">
        <h2 id="lore-atlas-title">Thế giới sau<br />chân trời.</h2>
        <p>Vượt qua những cánh rừng cổ, những vương quốc chìm trong bóng tối và những vùng đất chưa từng đặt chân tới. Mỗi miền đất của Lore đều mang một câu chuyện đang chờ được kể.</p>
      </div>
      <div className="lore-map-frame">
        <div className="lore-map-top"><Compass size={20} aria-hidden="true" /> <span>ATLAS OF LORE</span><small>Chọn một vùng đất để mở biên niên sử</small></div>
        <div className="lore-map-stage">
          <svg className="lore-map-art" viewBox="0 0 1000 640" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <radialGradient id="lore-sea"><stop stopColor="#233b42"/><stop offset="1" stopColor="#101b24"/></radialGradient>
              <linearGradient id="lore-land" x2=".8" y2="1"><stop stopColor="#ab986b"/><stop offset=".53" stopColor="#82794d"/><stop offset="1" stopColor="#b18b57"/></linearGradient>
              <pattern id="lore-grid" width="52" height="52" patternUnits="userSpaceOnUse"><path d="M52 0H0V52" fill="none" stroke="#bcb29a" strokeOpacity=".13"/></pattern>
              <pattern id="lore-wave" width="44" height="29" patternUnits="userSpaceOnUse"><path d="M7 19q7 -6 14 0t14 0" fill="none" stroke="#abc1b5" strokeOpacity=".18"/></pattern>
              <g id="lore-mountain"><path d="M-23 17 0-22 23 17Z" fill="#b5a98a" stroke="#4d443c" strokeWidth="2"/><path d="M0-22 5 3 -7 -1 -10 9 -23 17Z" fill="#544e49"/><path d="M-7-10 0-22 9-6 1-9 -4-3Z" fill="#ded4bd"/></g>
              <g id="lore-tree"><path d="M0-19 -11-2 -6-2 -14 10H14L6-2H11Z" fill="#2c5849" stroke="#26372d" strokeWidth="1.5"/><path d="M0 10v7" stroke="#4d392b" strokeWidth="3"/></g>
              <g id="lore-tower"><path d="M-13 17V-8H-8v-7h6v7h4v-7h6v7h5v25Z" stroke="#392e32" strokeWidth="2" fill="#68516b"/><path d="M-3 17V7q3-6 6 0v10" fill="#342632"/></g>
              <g id="lore-ruin"><path d="M-17 12V-9h9v21m16 0V-9h9v21M-21-9H21M-20 15H20" stroke="#69503c" strokeWidth="4" fill="none"/></g>
            </defs>
            <rect width="1000" height="640" fill="url(#lore-sea)"/>
            <rect width="1000" height="640" fill="url(#lore-grid)"/>
            <rect width="1000" height="640" fill="url(#lore-wave)"/>
            <path d="M75 165 112 116 162 113 199 63 267 83 302 53 360 91 409 64 459 86 522 58 575 97 637 69 685 100 731 84 764 116 813 125 816 172 859 203 844 256 880 290 835 326 861 366 827 411 790 418 763 473 696 482 675 536 611 561 567 529 515 549 471 515 421 551 355 532 288 563 239 537 200 580 141 550 125 501 76 479 97 430 62 381 101 344 71 294 104 250 78 216Z" fill="none" stroke="#d7bc7f" strokeWidth="13" strokeOpacity=".19" strokeLinejoin="round"/>
            <path d="M75 165 112 116 162 113 199 63 267 83 302 53 360 91 409 64 459 86 522 58 575 97 637 69 685 100 731 84 764 116 813 125 816 172 859 203 844 256 880 290 835 326 861 366 827 411 790 418 763 473 696 482 675 536 611 561 567 529 515 549 471 515 421 551 355 532 288 563 239 537 200 580 141 550 125 501 76 479 97 430 62 381 101 344 71 294 104 250 78 216Z" fill="url(#lore-land)" stroke="#d2b57d" strokeWidth="3" strokeLinejoin="round"/>
            <path d="M858 443 895 435 913 462 936 483 925 512 951 537 912 572 873 558 857 526 833 506Z" fill="#91875c" stroke="#d2b57d" strokeWidth="3"/>
            <path d="M181 94Q251 115 309 145T391 189L365 252 238 252 115 216Z" fill="#736f62" opacity=".76"/>
            <path d="M347 112Q416 75 491 119L550 163 492 223 402 225 351 201Z" fill="#48644c" opacity=".83"/>
            <path d="M666 99 756 116 819 172 834 242 746 264 658 207Z" fill="#5e4b64" opacity=".87"/>
            <path d="M108 407Q210 393 270 448L281 533 201 577 137 545 115 502Z" fill="#c49d58" opacity=".86"/>
            <path d="M489 403Q577 367 644 422L693 476 654 537 611 557 550 527 516 548Z" fill="#474a46" opacity=".87"/>
            <path d="M237 319Q323 289 405 345L463 416 381 473 288 440 215 381Z" fill="#65764a" opacity=".65"/>
            <path d="M412 170Q451 216 432 266T490 305Q534 342 491 400T516 481" fill="none" stroke="#426779" strokeWidth="12" opacity=".75"/>
            <path d="M412 170Q451 216 432 266T490 305Q534 342 491 400T516 481" fill="none" stroke="#9db4af" strokeWidth="3" opacity=".7"/>
            <g opacity=".85">
              {[[145,132],[182,103],[232,131],[272,105],[310,143],[181,169],[247,174],[315,182],[652,140],[681,111],[783,337],[808,359],[734,385]].map(([x,y])=><use key={x+"-"+y} href="#lore-mountain" x={x} y={y}/>)}
              {[[365,131],[402,106],[456,113],[479,152],[382,192],[504,182],[286,349],[330,374],[402,352],[412,435],[355,420],[562,443],[602,432],[652,455],[596,515],[703,180],[780,193],[873,470],[911,534]].map(([x,y])=><use key={x+"-"+y} href="#lore-tree" x={x} y={y}/>)}
              {[[272,251],[493,267],[710,254],[764,119],[587,458],[815,342]].map(([x,y])=><use key={x+"-"+y} href="#lore-tower" x={x} y={y}/>)}
              <use href="#lore-ruin" x="150" y="476"/><use href="#lore-ruin" x="206" y="536"/><use href="#lore-ruin" x="898" y="486"/>
            </g>
            <g fill="none" stroke="#ecd49d" strokeWidth="2.1" strokeDasharray="4 7" opacity=".8">
              <path d="M490 301 380 390 240 410 160 512M490 301 280 282 340 211 200 141M340 211 430 115M490 301 570 205 760 134M490 301 720 288 820 378M490 301 610 486M820 378Q862 419 880 499"/>
            </g>
            <g transform="translate(925 90)" stroke="#d5bd89" fill="none" opacity=".8"><circle r="39"/><circle r="28"/><path d="M0-48 8-8 48 0 8 8 0 48-8 8-48 0-8-8Z"/><path d="M0-48 8-8 0 0Z" fill="#d5bd89"/><text textAnchor="middle" y="-54" stroke="none" fill="#e6d8af" fontSize="13">N</text></g>
            <path d="M16 16H984V624H16Z" fill="none" stroke="#d5bd89" strokeOpacity=".4"/>
            <text x="47" y="602" fill="#c4b28b" fontSize="14" letterSpacing="4">THE WORLD OF LORE</text>
          </svg>
          {loreRegions.map((region, index) => (
            <a key={region.slug} className="lore-pin" href={loreRegionHref(region)}
              style={{left: region.x+"%", top: region.y+"%"}}
              data-lore-pin={region.slug} aria-label={"Khám phá "+region.name} title={region.description}>
              <span className="lore-pin-dot">{index+1}</span>
              <span className="lore-pin-name">{region.name}</span>
            </a>
          ))}
        </div>
        <div className="lore-map-caption">Bản đồ hành trình minh họa · không theo tỷ lệ địa lý</div>
      </div>
      <div className="lore-region-grid" aria-label="Các vùng đất của Lore">
        {loreRegions.map((region,index) => (
          <a className="lore-region-card" key={region.slug} href={loreRegionHref(region)} data-lore-region={region.slug}>
            <span className="lore-region-number">{String(index+1).padStart(2,"0")}</span>
            <span><strong>{region.name}</strong><small>{region.description}</small></span>
            <ArrowUpRight size={19} aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  );
}

export function LoreRegionPage({region}:{region:LoreRegion}) {
  return <main id="main" className="lore-region-page" data-lore-region-page={region.slug}>
    <a href="/#ban-do-lore" className="plain-link">← Trở về bản đồ Lore</a>
    <span className="lore-region-kicker">BIÊN NIÊN SỬ LORE</span>
    <h1>{region.name}</h1>
    <p className="lore-region-intro">{region.description}</p>
    <div className="lore-region-pending">
      <Compass size={30} aria-hidden="true" />
      <h2>Một chương chưa được mở.</h2>
      <p>Biên niên sử vùng đất này đang được biên soạn. Hãy quay lại khi những trang tiếp theo được hé mở.</p>
      <a className="button" href="/#ban-do-lore">Tiếp tục khám phá <ArrowUpRight size={20} /></a>
    </div>
  </main>;
}
