import assert from "node:assert/strict";
import { runQa, inspectPage } from "./qa-runtime.mjs";
await runQa("farm-refinement", async ({ browser, base, result, dir, expect })=>{
  for(const width of [375,1440])for(const theme of ["light","dark"]){
    const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:"reduce"});
    const errors=[];page.on("pageerror",error=>errors.push(error.message));
    const entry={width,theme,status:"running"};result.cases.push(entry);
    try{
      await page.goto(base+"/farm?item=legion-revenant-class&farm-tab=guide&farm-mode=insignia");
      await expect(page.locator(".fv2-detail")).toBeVisible();
      if(await page.locator("html").getAttribute("data-theme")!==theme)await page.locator(".theme-toggle").click();
      await expect(page.getByRole("region",{name:"Hướng dẫn Farm nguyên liệu",exact:true})).toHaveCount(0);
      const notes=page.getByLabel("Lưu ý khi farm bằng Insignia",{exact:true});
      await expect(notes.locator("table")).toHaveCount(3);await expect(notes).toContainText("5.550");
      const insigniaImage=`${dir}/insignia-${theme}-${width}.png`;
      await page.screenshot({path:insigniaImage,fullPage:true});result.screenshots.push(insigniaImage);
      await page.getByRole("tab",{name:"Nguyên liệu",exact:true}).click();
      await page.getByRole("group",{name:"Chọn nguyên liệu",exact:true}).getByRole("button",{name:"Hooded Legion Cowl",exact:true}).click();
      const material=page.getByRole("region",{name:"Nguyên liệu đang chọn",exact:true});
      await expect(material).toContainText("Undead Legion Shop");await expect(material).toContainText("500.000 Gold");
      await expect(material).toContainText("Dage the Evil");await expect(material).toContainText("/join underworld");
      await expect(page).toHaveURL(/farm-mode=insignia/);await expect(page).toHaveURL(/farm-tab=materials/);
      const destination=page.url();await page.goBack();await expect(page).not.toHaveURL(destination);
      await page.goForward();await expect(page).toHaveURL(destination);await expect(material).toContainText("Hooded Legion Cowl");
      await page.getByRole("button",{name:"Farm thông thường",exact:true}).click();
      await expect(page.getByRole("button",{name:"Farm thông thường",exact:true})).toHaveAttribute("aria-pressed","true");
      await expect(page.getByRole("group",{name:"Chọn nguyên liệu",exact:true})).not.toContainText("Dage the Evil Insignia");
      await page.screenshot({path:`${dir}/materials-${theme}-${width}.png`,fullPage:true});
      await page.goto(base+"/farm?item=legion-revenant-class&farm-tab=materials&farm-material=darkblood-cohort-conquered");
      await expect(material).toContainText("Monster:");
      const text=await material.innerText();assert.equal(text.split("any monster in The Death Pits").length-1,1);assert.equal(text.split("/join deathpits").length-1,1);
      await page.goto(base+"/farm?item=void-highlord-class&farm-tab=guide&farm-mode=standard");
      await expect(page.locator(".fv31-step-content")).toContainText("Void HighLord's Challenge");
      await expect(page.locator(".fv31-step-content")).not.toContainText("ultranulgath");
      await page.goto(base+"/farm?item=void-paladin&farm-tab=sets&farm-set=void-paladin");
      const inventory=page.locator(".fv-set-grid");await expect(inventory.locator(":scope > a")).toHaveCount(8);
      await expect(inventory.locator('[aria-current="page"]')).toContainText("Void Paladin");
      await inventory.locator('a[href*="/farm/item/void-paladin-helm?"]').click();
      await expect(page).toHaveURL(/\/farm\/item\/void-paladin-helm\?/);
      await expect(page).toHaveURL(/farm-tab=guide/);await expect(page).toHaveURL(/category=Helms/);await expect(page).toHaveURL(/group=nation/);
      await expect(page.locator(".fv31-step-content")).toContainText("A Dark Temptation");
      await page.goBack();await expect(page.getByRole("tab",{name:"Set đồ",exact:true})).toHaveAttribute("aria-selected","true");
      await expect(page.locator(".fv-set h3")).toHaveText("Void Paladin");
      await page.goForward();await expect(page.locator('[data-item-id="void-paladin-helm"]')).toBeVisible();
      await page.goBack();
      await expect(page.getByRole("tab",{name:"Set đồ",exact:true})).toHaveAttribute("aria-selected","true");
      await expect(page.locator(".fv-set-grid > a")).toHaveCount(8);
      const imagesContained=await page.locator(".fv-set-grid > a").evaluateAll(cards=>cards.every(card=>{
        const image=card.querySelector(".fv-set-art img"),art=card.querySelector(".fv-set-art"),name=card.querySelector(".fv-set-name");
        return image.getBoundingClientRect().bottom<=art.getBoundingClientRect().bottom+1 && name.getBoundingClientRect().top>=art.getBoundingClientRect().bottom;
      }));assert.equal(imagesContained,true,"Inventory artwork must fit above the item label");
      const setImage=`${dir}/sets-${theme}-${width}.png`;await page.screenshot({path:setImage,fullPage:true});result.screenshots.push(setImage);
      const inspected=await inspectPage(page);
      if(inspected.overflow)entry.overflowElements=await page.evaluate(()=>[...document.querySelectorAll("body *")].filter(element=>element.getBoundingClientRect().right>innerWidth+1).slice(0,15).map(element=>({tag:element.tagName,classes:element.className,right:element.getBoundingClientRect().right})));
      entry.url=page.url();assert.equal(inspected.overflow,false,JSON.stringify(inspected));assert.deepEqual(inspected.brokenImages,[]);
      assert.deepEqual(errors,[]);entry.status="passed";
    }catch(error){entry.status="failed";throw error;}finally{await page.close();}
  }
});
