import fs from 'node:fs';
const variants=JSON.parse(fs.readFileSync('src/content/classes/art-variants.json'));
fs.writeFileSync('src/content/classes/art-runtime.json',JSON.stringify(variants.map(({id,classId,variantName,variantType,imagePath,width,height,verificationStatus,usageStatus})=>({id,classId,variantName,variantType,imagePath,width,height,verificationStatus,usageStatus})))+'\n');
