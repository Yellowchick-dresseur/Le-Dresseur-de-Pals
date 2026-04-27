/* =====================================================
   PALWORLD GVAS SAVE PARSER v2 — JavaScript natif
   Extrait : CharacterID, passives, niveau, rang, sexe, alpha, stats
   Format : .sav = [header UE4] + [zlib] → GVAS

   Structure Pal dans GVAS :
   CharacterSaveParameterMap (MapProperty)
     └── chaque entry contient :
          - CharacterID (NameProperty)  → identifiant interne
          - PassiveSkillList (ArrayProperty<NameProperty>) → passives
          - Level (IntProperty) → niveau du Pal
          - Rank (IntProperty) → étoiles condenseur (0-4)
          - IsRarePal (BoolProperty) → est-ce un Alpha ?
          - Gender (EnumProperty) → Male/Female
          - NickName (StrProperty) → surnom donné
===================================================== */

/* ── Table CharacterID interne → nom officiel ── */
const CHAR_ID_MAP = {
  'Sheepball':'Lamball','NaughtyKid':'Cattiva','Chicken':'Chikipi',
  'Carbunclo':'Lifmunk','Kitsunebi':'Foxparks','Platypus':'Fuack',
  'RaijinDaughter':'Sparkit','Monkey':'Tanzee','Rooby':'Rooby',
  'Penguin':'Pengullet','PenguinPal':'Penking','Hedgehog':'Jolthog',
  'Hedgehog_Ice':'Jolthog Cryst','PlantSlime':'Gumoss','PlantSlime_Flower':'Gumoss Fleur',
  'CuteFox':'Vixy','OwlBird':'Hoocrates','ElephantWater':'Teafant',
  'PandaDark':'Depresso','Cremia':'Cremis','Phantom':'Daedream',
  'Boar':'Rushoar','NightOwl':'Nox','CuteMole':'Fuddler',
  'Squid':'Killamari','Squid_Dark':'Killamari Primo',
  'CatDark':'Mau','CatDark_Ice':'Mau Cryst',
  'FlyingManta':'Celaray','FlyingManta_Electric':'Celaray Lux',
  'GarmWolf':'Direhowl','ColorfulBird':'Tocotoco','FlowerRabbit':'Flopie',
  'Cow':'Mozzarina','PoisonSpike':'Bristla',
  'SharkKid':'Gobfin','SharkKid_Fire':'Gobfin Ignis',
  'MantaRay':'Hangyu','MantaRay_Ice':'Hangyu Cryst',
  'GiantPanda':'Mossanda','GiantPanda_Electric':'Mossanda Lux',
  'SweetsSheep':'Woolipop','BerryGoat':'Caprity','BerryGoat_Dark':'Caprity Noct',
  'Alpaca':'Melpaca','Deer':'Eikthyrdeer','Deer_Ground':'Eikthyrdeer Terra',
  'Eagle':'Nitewing','GreenRabbit':'Ribbuny',
  'Baphomet':'Incineram','Baphomet_Dark':'Incineram Noct',
  'GreenButterfly':'Cinnamoth','FlameBuffalo':'Arsox',
  'Mudfish':'Dumud','Mudfish_Gold':'Dumud Gild',
  'DarkCrow':'Cawgnito','LizardMan':'Leezpunk','LizardMan_Fire':'Leezpunk Ignis',
  'WolfMoon':'Loupmoon','WolfMoon_Ice':'Loupmoon Cryst',
  'SkyDeer':'Galeclaw','SkyDeer_Electric':'Galeclaw Lux',
  'RobinHood':'Robinquill','RobinHood_Ground':'Robinquill Terra',
  'Gorilla':'Gorirat','Gorilla_Ground':'Gorirat Terra',
  'BeeBee':'Beegarde','QueenBee':'Elizabee','BlackTiger':'Grintale',
  'SmallSnowBear':'Swee','SnowBear':'Sweepa',
  'IceDragonman':'Chillet','IceDragonman_Fire':'Chillet Ignis',
  'ElecUnicorn':'Univolt','NightFox':'Foxcicle',
  'FireKirin':'Pyrin','FireKirin_Dark':'Pyrin Noct',
  'Reindeer':'Reindrix','ElecDog':'Rayhound',
  'AmaterasuWolf':'Kitsun','AmaterasuWolf_Dark':'Kitsun Noct',
  'FairyElec':'Dazzi','FairyElec_Dark':'Dazzi Noct',
  'LunarBeast':'Lunaris',
  'FlowerDinosaur':'Dinossom','FlowerDinosaur_Electric':'Dinossom Lux',
  'SeaSerpent':'Surfent','SeaSerpent_Ground':'Surfent Terra',
  'GhostBeast':'Maraith','DrillTortoise':'Digtoise',
  'CatBat':'Tombat','PinkLizard':'Lovander','FireSpirit':'Flambelle',
  'BirdDragon':'Vanwyrm','BirdDragon_Ice':'Vanwyrm Cryst',
  'SamuraiRedPanda':'Bushi','SamuraiRedPanda_Dark':'Bushi Noct',
  'ElecBird':'Beakon','FlameHawk':'Ragnahawk',
  'CatMage':'Katress','CatMage_Fire':'Katress Ignis',
  'FoxMage':'Wixen','FoxMage_Dark':'Wixen Noct',
  'GrassRabbitMan':'Verdash','VioletFairy':'Vaelet','WhiteMoth':'Sibelyx',
  'FairyDragon':'Elphidran','FairyDragon_Water':'Elphidran Aqua',
  'Kelp':'Kelpsea','Kelp_Fire':'Kelpsea Ignis',
  'BlueDragon':'Azurobe','BlueDragon_Ice':'Azurobe Cryst',
  'WhiteTiger':'Cryolinx','Manticore':'Blazehowl','Manticore_Dark':'Blazehowl Noct',
  'LazyDragon':'Relaxaurus','LazyDragon_Electric':'Relaxaurus Lux',
  'SakuraSaurus':'Broncherry','SakuraSaurus_Water':'Broncherry Aqua',
  'FlowerDoll':'Petallia','VolcanicMonster':'Reptyro','VolcanicMonster_Ice':'Reptyro Cryst',
  'KingAlpaca':'Kingpaca','KingAlpaca_Ice':'Kingpaca Cryst',
  'GrassMammoth':'Mammorest','GrassMammoth_Ice':'Mammorest Cryst',
  'YetiPal':'Wumpo','YetiPal_Grass':'Wumpo Botan',
  'LargeAnt':'Warsect','LargeAnt_Ground':'Warsect Terra',
  'FengyunDeeper':'Fenglope','FengyunDeeper_Electric':'Fenglope Lux',
  'CatVampire':'Felbat','WhiteDragon':'Quivern','WhiteDragon_Ground':'Quivern Botan',
  'LavaDragon':'Blazamut','LavaDragon_Ice':'Blazamut Cryst','KingBahamut_Dragon':'Blazamut Ryu',
  'HadesBird':'Helzephyr','HadesBird_Electric':'Helzephyr Lux',
  'BlackMetalDragon':'Astegon','DarkScorpion':'Menasting','DarkScorpion_Ground':'Menasting Terra',
  'Anubis':'Anubis','WaterDragon':'Jormuntide','WaterDragon_Fire':'Jormuntide Ignis',
  'Suzaku':'Suzaku','Suzaku_Water':'Suzaku Aqua','ElecPanda':'Grizzbolt',
  'LilyQueen':'Lyleen','LilyQueen_Dark':'Lyleen Noct',
  'Horus':'Faleris','Horus_Water':'Faleris Aqua',
  'ThunderDragonMan':'Orserk','BlackGriffon':'Shadowbeak',
  'SaintCentaur':'Paladius','BlackCentaur':'Necromus',
  'IceHorse':'Frostallion','IceHorse_Dark':'Frostallion Noct',
  'JetDragon':'Jetragon','NightLady':'Bellanoir','NightLady_Dark':'Bellanoir Libero',
  // Feybreak
  'NightBlueHorse':'Nitemary','StarRay':'Starryon','WhiteShieldDragon':'Silvegis',
  'PandaFire':'Smokie','BlueEelDragon':'Azurmane','SnowTigerBeastman':'Bastigor',
  'BlueberryFairy':'Prunelia','BadCatgirl':'Nyafia','GoldenHorse':'Gildane',
  'SlimePal':'Gloopie','CrabPal':'Ghangler','JellyPal':'Jellroy','JellyPal2':'Jelliette',
  'FishPal':'Finsider','FishPal_Fire':'Finsider Ignis',
  'IceBirdSmall':'Frostplume','LionFish':'Celesdir','IceBirdBig':'Icelyn',
  'MushPal':'Shroomer','MushPal_Dark':'Shroomer Noct',
  'MonkeyPal':'Kikit','SealPal':'Lullu','CatPal':'Mimog',
  'CrocPal':'Croajiro','CrocPal_Dark':'Croajiro Noct',
  'DogPal':'Dogen','EmuPal':'Dazemu','MoonQueen':'Selyne',
  'WingGolem':'Knocklem','SamuraiPal':'Yakumo','ScorpionPal':'Prixter',
  'Tarantula':'Tarantriss','OmascuPal':'Omascul','SplatterPal':'Splatterina',
  'HerbPal':'Herbil','HerbPal2':'Munchill',
  'TentacleTurtle':'Turtacle','TentacleTurtle_Ground':'Turtacle Terra',
  'PolarBearPal':'Polapup','StarlightPal':'Sootseer',
  'IceNarwhal':'Whalaska','IceNarwhal_Fire':'Whalaska Ignis',
  'Plesiosaur':'Braloha','PoseidonOrca':'Neptilius',
  'DarkMechaDragon':'Xenolord','WhiteAlienDragon':'Xenogard','XenoDragonSoldier':'Xenovader',
  'Platypus_Fire':'Fuack Ignis','PenguinPal_Electric':'Penking Lux',
  'Penguin_Electric':'Pengullet Lux',
};

/* ── Table des passives (noms internes → info) ── */
const PASSIVE_INFO = {
  // Tier S
  'Legend':            {tier:'S', fr:'Légende',          effect:'ATK+20% DEF+20% Vitesse+20%'},
  'Musclehead':        {tier:'S', fr:'Seigneur Âmes',     effect:'ATK+20%'},
  'Brave':             {tier:'S', fr:'Courageux',         effect:'ATK+20%'},
  'Ferocious':         {tier:'S', fr:'Féroce',            effect:'ATK+20%'},
  'NORMALATTACK_KILLRATE_UP_2': {tier:'S', fr:'Tueur+',  effect:'Bonus kills monstres'},
  'Hooligan':          {tier:'S', fr:'Voyou',             effect:'DEF+20%'},
  'CrafterMinimum':    {tier:'S', fr:'Artisan Sérieux',   effect:'Vitesse artisanat+50%'},
  'WorkSlave':         {tier:'S', fr:'Âme de Travailleur',effect:'Vitesse travail+50%'},
  'Serious':           {tier:'S', fr:'Consciencieux',     effect:'Vitesse travail+20%'},
  // Tier A
  'Lucky':             {tier:'A', fr:'Veinard',           effect:'Drops qualité×2 parfois'},
  'ElementBoost_Normal_2_PAL': {tier:'A', fr:'Destructeur', effect:'DEF ennemis-10%'},
  'Masochist':         {tier:'A', fr:'Masochiste',        effect:'ATK+15% mais DEF-10%'},
  'Coward':            {tier:'A', fr:'Lâche',             effect:'ATK+10%'},
  'Daredevil':         {tier:'A', fr:'Téméraire',         effect:'ATK+10% DEF-10%'},
  'AttackMoves':       {tier:'A', fr:'Attaque rapide',    effect:'Vitesse ATK+10%'},
  // Tier B
  'Swift':             {tier:'B', fr:'Agile',             effect:'Vitesse travail+10%'},
  'Durable':           {tier:'B', fr:'Robuste',           effect:'HP+10%'},
  'Conceited':         {tier:'B', fr:'Fier',              effect:'DEF+10%'},
  'Vanguard':          {tier:'B', fr:'Avant-garde',       effect:'ATK+10% en équipe'},
  'Motivational':      {tier:'B', fr:'Motivateur',        effect:'Vitesse+10% alliés'},
  'Conservation':      {tier:'B', fr:'Conservation',      effect:'Résistance+10%'},
  // Tier C (négatifs)
  'Lazy':              {tier:'C', fr:'Paresseux',         effect:'Vitesse travail-30%'},
  'Pacifist':          {tier:'C', fr:'Pacifiste',         effect:'ATK-10%'},
  'Optimistic':        {tier:'C', fr:'Naïf',              effect:'Stat aléatoire+5% -5%'},
  'Pessimistic':       {tier:'C', fr:'Pessimiste',        effect:'Vitesse travail-10%'},
  'Glutton':           {tier:'C', fr:'Glouton',           effect:'Nourriture consommée×2'},
  'Unstable':          {tier:'C', fr:'Instable',          effect:'Stats incohérentes'},
};

/* ── Buffer Reader ── */
class BinaryReader {
  constructor(buffer) {
    this.buf = buffer instanceof ArrayBuffer
      ? new DataView(buffer)
      : new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    this.pos = 0;
  }
  get remaining() { return this.buf.byteLength - this.pos; }
  get eof()       { return this.pos >= this.buf.byteLength; }
  u8()   { const v=this.buf.getUint8(this.pos);   this.pos+=1; return v; }
  u16()  { const v=this.buf.getUint16(this.pos,true);this.pos+=2; return v; }
  u32()  { const v=this.buf.getUint32(this.pos,true);this.pos+=4; return v; }
  i32()  { const v=this.buf.getInt32(this.pos,true); this.pos+=4; return v; }
  i64()  { const lo=this.u32(),hi=this.u32(); return lo+hi*4294967296; }
  f32()  { const v=this.buf.getFloat32(this.pos,true);this.pos+=4; return v; }
  f64()  { const v=this.buf.getFloat64(this.pos,true);this.pos+=8; return v; }
  bytes(n){ const v=new Uint8Array(this.buf.buffer,this.buf.byteOffset+this.pos,n);this.pos+=n;return v;}
  skip(n) { this.pos+=n; }
  peek32(){ return this.buf.getInt32(this.pos,true); }
  fstring() {
    const len=this.i32();
    if(len===0) return '';
    if(len>0){ const b=this.bytes(len); return new TextDecoder('utf-8').decode(b.slice(0,len-1)); }
    const chars=-len;
    const b=this.bytes(chars*2);
    return new TextDecoder('utf-16le').decode(b.slice(0,(chars-1)*2));
  }
  guid(){ return this.bytes(16); }
}

/* ── Décompression zlib ── */
async function decompressZlib(compressed) {
  for (const format of ['deflate','deflate-raw']) {
    try {
      const ds=new DecompressionStream(format);
      const writer=ds.writable.getWriter();
      const reader=ds.readable.getReader();
      writer.write(compressed); writer.close();
      const chunks=[]; let total=0;
      while(true){ const {done,value}=await reader.read(); if(done)break; chunks.push(value); total+=value.length; }
      const out=new Uint8Array(total); let off=0;
      for(const c of chunks){ out.set(c,off); off+=c.length; }
      return out;
    } catch {}
  }
  throw new Error('Décompression échouée');
}

/* ── Parser principal ── */
async function parsePalworldSav(rawBuffer) {
  const raw=new Uint8Array(rawBuffer);
  const r=new BinaryReader(raw);
  if(r.peek32()===0x53415647) return parseGVAS(raw); // GVAS direct
  // Chercher header zlib
  let zlibStart=-1;
  for(let i=0;i<Math.min(64,raw.length-2);i++){
    if(raw[i]===0x78&&(raw[i+1]===0x9C||raw[i+1]===0xDA||raw[i+1]===0x01||raw[i+1]===0x5E)){
      zlibStart=i; break;
    }
  }
  if(zlibStart<0) throw new Error('Format de sauvegarde non reconnu');
  const decompressed=await decompressZlib(raw.slice(zlibStart));
  return parseGVAS(decompressed);
}

/* ── Parser GVAS ── */
function parseGVAS(data) {
  const r=new BinaryReader(data);
  const result={palObjects:[], playerName:'', level:0, unlockedRecipes:new Set()};
  if(r.u32()!==0x53415647) throw new Error('Magic GVAS invalide');
  r.i32(); r.i32(); r.i32(); // versions
  r.skip(2+2+2+4); r.fstring(); // engine version
  const cvCount=r.i32();
  for(let i=0;i<cvCount&&i<500;i++){ r.guid(); r.i32(); }
  r.fstring(); // save game class
  parseProperties(r, result, 0);
  return result;
}

function safeStr(r) {
  try {
    if(r.remaining<4) return null;
    const len=r.peek32();
    if(Math.abs(len)>2048) return null;
    return r.fstring();
  } catch { return null; }
}

/* ── Objet courant en cours de construction ── */
let _currentPalObj = null;

function parseProperties(r, result, depth) {
  if(depth>25) return;
  let count=0;
  while(!r.eof&&count<100000) {
    count++;
    const propName=safeStr(r);
    if(!propName||propName==='None') break;
    const propType=safeStr(r);
    if(!propType) break;
    const propSize=r.i64();
    const propIdx=r.i32();

    switch(propType) {
      case 'NameProperty': {
        r.u8();
        const val=r.fstring();
        // CharacterID → identifier le Pal
        if(propName==='CharacterID'&&_currentPalObj) {
          const clean=val.replace(/^EPalCharacterID::/,'').replace(/^BP_|_C$/g,'');
          const official=CHAR_ID_MAP[clean]||CHAR_ID_MAP[val]||clean;
          _currentPalObj.charId=official;
        }
        // PassiveSkillList items (lus via ArrayProperty)
        break;
      }
      case 'StrProperty': {
        r.u8();
        const s=r.fstring();
        if(propName==='NickName'&&_currentPalObj) _currentPalObj.nickname=s;
        if(propName==='PlayerName') result.playerName=s;
        break;
      }
      case 'IntProperty': {
        r.u8();
        const v=r.i32();
        if(propName==='Level') {
          if(_currentPalObj) _currentPalObj.level=v;
          else if(v>result.level&&v<200) result.level=v;
        }
        if(propName==='Rank'&&_currentPalObj)       _currentPalObj.rank=v;
        if(propName==='Rank_HP'&&_currentPalObj)    _currentPalObj.rankHp=v;
        if(propName==='Rank_Attack'&&_currentPalObj) _currentPalObj.rankAtk=v;
        if(propName==='Rank_Defence'&&_currentPalObj) _currentPalObj.rankDef=v;
        if(propName==='Rank_CraftSpeed'&&_currentPalObj) _currentPalObj.rankWork=v;
        break;
      }
      case 'BoolProperty': {
        const bv=r.u8();
        r.u8();
        if(propName==='IsRarePal'&&_currentPalObj) _currentPalObj.isAlpha=bv===1;
        if(propName==='bAcquired') result.recipeAcquired = bv===1;
        break;
      }
      case 'Int64Property': { r.u8(); r.i64(); break; }
      case 'FloatProperty':  { r.u8(); r.f32(); break; }
      case 'DoubleProperty': { r.u8(); r.f64(); break; }
      case 'ObjectProperty': { r.u8(); r.fstring(); r.fstring(); break; }
      case 'SoftObjectProperty': { r.u8(); r.fstring(); r.fstring(); break; }
      case 'EnumProperty': {
        const enumTypeName=safeStr(r)||'';
        r.u8();
        const enumVal=r.fstring();
        if(propName==='Gender'&&_currentPalObj) {
          _currentPalObj.gender=enumVal.includes('Female')?'F':'M';
        }
        break;
      }
      case 'TextProperty': {
        r.u8(); r.i32();
        const ht=r.u8();
        if(ht===255){ r.i32(); r.fstring(); }
        else { r.fstring(); r.fstring(); r.fstring(); }
        break;
      }
      case 'StructProperty': {
        const structType=safeStr(r)||'';
        r.guid(); r.u8();
        parseStructValue(r, structType, result, depth+1);
        break;
      }
      case 'ArrayProperty': {
        const innerType=safeStr(r)||'';
        r.u8();
        const cnt=r.i32();
        parseArrayProp(r, innerType, cnt, propName, result, depth+1);
        break;
      }
      case 'MapProperty': {
        const kt=safeStr(r)||'', vt=safeStr(r)||'';
        r.u8(); r.i32();
        const mc=r.i32();
        parseMapProp(r, kt, vt, mc, propName, result, depth+1);
        break;
      }
      case 'SetProperty': {
        safeStr(r); r.u8(); r.i32();
        skipNBytes(r, propSize-8); break;
      }
      default:
        r.u8(); skipNBytes(r, propSize-1); break;
    }
  }
}

function skipNBytes(r,n) { if(n>0&&n<=r.remaining) r.skip(n); }

function parseStructValue(r, type, result, depth) {
  switch(type) {
    case 'Guid': r.guid(); break;
    case 'Vector': r.f64();r.f64();r.f64(); break;
    case 'Rotator': r.f64();r.f64();r.f64(); break;
    case 'Quat': r.f64();r.f64();r.f64();r.f64(); break;
    case 'DateTime': case 'Timespan': r.i64(); break;
    default: parseProperties(r, result, depth); break;
  }
}

function parseArrayProp(r, innerType, count, propName, result, depth) {
  if(innerType==='StructProperty') {
    safeStr(r); safeStr(r); r.i64(); r.i32();
    const structType=safeStr(r)||'';
    r.guid(); r.u8();
    for(let i=0;i<count&&i<5000;i++) {
      const sub={palObjects:[], playerName:'', level:0};
      parseProperties(r, sub, depth+1);
      result.palObjects.push(...sub.palObjects);
      if(sub.playerName) result.playerName=sub.playerName;
    }
  } else if(innerType==='NameProperty') {
    const nameArr=[];
    for(let i=0;i<count&&i<500;i++) nameArr.push(r.fstring());
    // PassiveSkillList → passives du Pal courant
    if(propName==='PassiveSkillList'&&_currentPalObj) {
      _currentPalObj.passives=[...(new Set(nameArr.filter(p=>p&&p!=='None')))];
    }
    // RecipeTechNote → recettes débloquées
    if(propName==='UnlockedRecipeTechNoteArray'||propName==='TechRecordArray') {
      if(!result.unlockedRecipes) result.unlockedRecipes=new Set();
      nameArr.filter(n=>n&&n!=='None').forEach(n=>result.unlockedRecipes.add(n));
    }
  } else {
    for(let i=0;i<count&&i<50000;i++) {
      switch(innerType) {
        case 'ByteProperty': r.u8(); break;
        case 'BoolProperty': r.u8(); break;
        case 'IntProperty': r.i32(); break;
        case 'Int64Property': r.i64(); break;
        case 'FloatProperty': r.f32(); break;
        case 'DoubleProperty': r.f64(); break;
        case 'StrProperty': case 'NameProperty': r.fstring(); break;
        case 'ObjectProperty': case 'SoftObjectProperty': r.fstring();r.fstring(); break;
        default: return;
      }
    }
  }
}

function parseMapProp(r, kt, vt, count, propName, result, depth) {
  const isCharMap  = propName==='CharacterSaveParameterMap'||propName==='PalStorageContainerSaveData';
  const isTechMap  = propName==='TechnologyRecordMap'||propName==='RecipeCustomDataSaveData';
  for(let i=0;i<count&&i<10000;i++) {
    try {
      // Pour CharacterSaveParameterMap, créer un objet Pal pour chaque entrée
      if(isCharMap) {
        const prevPalObj = _currentPalObj;
        _currentPalObj = {charId:null, nickname:'', level:1, rank:0, isAlpha:false, gender:'M', passives:[], rankHp:0, rankAtk:0, rankDef:0, rankWork:0};

        const keyR={palObjects:[], playerName:'', level:0};
        if(kt==='StructProperty') parseProperties(r, keyR, depth+1);
        else skipMapKey(r, kt);

        const valR={palObjects:[], playerName:'', level:0};
        if(vt==='StructProperty') parseProperties(r, valR, depth+1);
        else skipMapKey(r, vt);

        // Sauvegarder le Pal si on a un CharacterID
        if(_currentPalObj.charId) {
          result.palObjects.push({..._currentPalObj});
        }
        result.palObjects.push(...keyR.palObjects, ...valR.palObjects);
        if(valR.playerName) result.playerName=valR.playerName;
        if(valR.level>0) result.level=valR.level;

        _currentPalObj = prevPalObj;
      } else if(isTechMap) {
        // TechnologyRecordMap : key=FName (recipeId), value=struct{bAcquired:bool}
        const recipeId = kt==='NameProperty' ? r.fstring() : (skipMapKey(r,kt),'');
        const valR={palObjects:[], playerName:'', level:0, recipeAcquired:false};
        if(vt==='StructProperty') parseProperties(r, valR, depth+1);
        else skipMapKey(r, vt);
        if(recipeId && recipeId!=='None' && valR.recipeAcquired) {
          if(!result.unlockedRecipes) result.unlockedRecipes=new Set();
          result.unlockedRecipes.add(recipeId);
        }
      } else {
        const keyR={palObjects:[], playerName:'', level:0};
        if(kt==='StructProperty') parseProperties(r, keyR, depth+1);
        else skipMapKey(r, kt);
        const valR={palObjects:[], playerName:'', level:0};
        if(vt==='StructProperty') parseProperties(r, valR, depth+1);
        else skipMapKey(r, vt);
        result.palObjects.push(...keyR.palObjects, ...valR.palObjects);
        if(valR.playerName) result.playerName=valR.playerName;
        if(valR.level>result.level) result.level=valR.level;
      }
    } catch { break; }
  }
}

function skipMapKey(r, type) {
  switch(type) {
    case 'ByteProperty': r.u8(); break;
    case 'BoolProperty': r.u8(); break;
    case 'IntProperty': r.i32(); break;
    case 'Int64Property': r.i64(); break;
    case 'StrProperty': case 'NameProperty': r.fstring(); break;
    case 'ObjectProperty': case 'SoftObjectProperty': r.fstring();r.fstring(); break;
    default: break;
  }
}

/* ═══════════════════════════════════════════════════
   API PUBLIQUE — analyzeSaveFile
   Retourne {
     capturedNames: Set<string>,
     palObjects: Array<{charId,passives,level,rank,isAlpha,gender,nickname,...}>,
     playerName, level, method
   }
═══════════════════════════════════════════════════ */
async function analyzeSaveFile(arrayBuffer) {
  const raw=new Uint8Array(arrayBuffer);
  _currentPalObj=null; // reset

  // Méthode 1 : Parser GVAS complet
  try {
    const parsed=await parsePalworldSav(arrayBuffer);
    if(parsed.palObjects.length>0) {
      const capturedNames=new Set();
      const validPals=parsed.palObjects.filter(p=>p.charId&&p.charId!=='None');
      validPals.forEach(p=>capturedNames.add(p.charId));
      if(capturedNames.size>0) {
        return {
          capturedNames, palObjects:validPals,
          playerName:parsed.playerName, level:parsed.level,
          unlockedRecipes: parsed.unlockedRecipes || new Set(),
          method:'gvas'
        };
      }
    }
  } catch(e) { console.warn('Parser GVAS:', e.message); }

  // Méthode 2 : Scan textuel de secours
  let textToScan='';
  try {
    let zlibStart=-1;
    for(let i=0;i<Math.min(64,raw.length-2);i++){
      if(raw[i]===0x78&&(raw[i+1]===0x9C||raw[i+1]===0xDA||raw[i+1]===0x01||raw[i+1]===0x5E)){
        zlibStart=i; break;
      }
    }
    if(zlibStart>=0){
      const dec=await decompressZlib(raw.slice(zlibStart));
      textToScan=new TextDecoder('utf-8',{fatal:false}).decode(dec);
    }
  } catch {}
  textToScan+=new TextDecoder('utf-8',{fatal:false}).decode(raw);
  textToScan+=new TextDecoder('utf-16le',{fatal:false}).decode(raw);

  const capturedNames=new Set();
  for(const [id,name] of Object.entries(CHAR_ID_MAP)) {
    if(textToScan.includes(id)||textToScan.includes(name)) capturedNames.add(name);
  }

  return {
    capturedNames, palObjects:[],
    playerName:'', level:0,
    method:capturedNames.size>0?'scan':'none'
  };
}
