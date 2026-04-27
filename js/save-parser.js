/* =====================================================
   PALWORLD GVAS SAVE PARSER — JavaScript natif
   Basé sur le reverse engineering de cheahjs/palworld-save-tools
   Format : .sav = [12 bytes header UE4] + [zlib compressed GVAS]
   GVAS magic = 0x47564153 ("GVAS")

   Pipeline :
   1. Lire le header 12 bytes (magic + taille décompressée)
   2. Décompresser le reste via DecompressionStream (zlib)
   3. Parser le GVAS : header + propriétés UE4
   4. Extraire CharacterSaveParameterMap → CharacterID de chaque Pal
   5. Mapper vers notre base de données

   Strings UE4 :
   - int32 > 0  → UTF-8,   length octets (avec \0 final)
   - int32 < 0  → UTF-16LE, |length|*2 octets (avec \0\0 final)
   - int32 == 0 → chaîne vide ""
===================================================== */

/* ── Table CharacterID interne → nom anglais officiel ── */
const CHAR_ID_MAP = {
  // Paldeck 001–050
  'Sheepball':          'Lamball',
  'NaughtyKid':         'Cattiva',
  'Chicken':            'Chikipi',
  'Carbunclo':          'Lifmunk',
  'Kitsunebi':          'Foxparks',
  'Platypus':           'Fuack',
  'RaijinDaughter':     'Sparkit',
  'Monkey':             'Tanzee',
  'Rooby':              'Rooby',
  'Penguin':            'Pengullet',
  'PenguinPal':         'Penking',
  'Hedgehog':           'Jolthog',
  'Hedgehog_Ice':       'Jolthog Cryst',
  'Mushroom':           'Gumoss',
  'CuteFox':            'Vixy',
  'OwlBird':            'Hoocrates',
  'ElephantWater':      'Teafant',
  'PandaDark':          'Depresso',
  'Cremia':             'Cremis',
  'Phantom':            'Daedream',
  'Boar':               'Rushoar',
  'NightOwl':           'Nox',
  'CuteMole':           'Fuddler',
  'Squid':              'Killamari',
  'Squid_Dark':         'Killamari Primo',
  'CatDark':            'Mau',
  'CatDark_Ice':        'Mau Cryst',
  'FlyingManta':        'Celaray',
  'FlyingManta_Electric': 'Celaray Lux',
  'GarmWolf':           'Direhowl',
  'ColorfulBird':       'Tocotoco',
  'FlowerRabbit':       'Flopie',
  'Cow':                'Mozzarina',
  'PoisonSpike':        'Bristla',
  'Shark':              'Gobfin',
  'Shark_Fire':         'Gobfin Ignis',
  'MantaRay':           'Hangyu',
  'MantaRay_Ice':       'Hangyu Cryst',
  'GiantPanda':         'Mossanda',
  'GiantPanda_Electric':'Mossanda Lux',
  'Lainapapa':          'Woolipop',
  'BerryGoat':          'Caprity',
  'BerryGoat_Dark':     'Caprity Noct',
  'Alpaca':             'Melpaca',
  // 037–050
  'Deer':               'Eikthyrdeer',
  'Deer_Ground':        'Eikthyrdeer Terra',
  'Eagle':              'Nitewing',
  'GreenRabbit':        'Ribbuny',
  'Baphomet':           'Incineram',
  'Baphomet_Dark':      'Incineram Noct',
  'GreenButterfly':     'Cinnamoth',
  'FireBuffalo':        'Arsox',
  'Mudfish':            'Dumud',
  'Mudfish_Gold':       'Dumud Gild',
  'DarkCrow':           'Cawgnito',
  'Punk':               'Leezpunk',
  'Punk_Fire':          'Leezpunk Ignis',
  'WolfMoon':           'Loupmoon',
  'WolfMoon_Ice':       'Loupmoon Cryst',
  'SkyDeer':            'Galeclaw',
  'SkyDeer_Electric':   'Galeclaw Lux',
  'RobinHoodBird':      'Robinquill',
  'RobinHoodBird_Ground':'Robinquill Terra',
  'Gorilla':            'Gorirat',
  'Gorilla_Ground':     'Gorirat Terra',
  'BeeBee':             'Beegarde',
  'QueenBee':           'Elizabee',
  'BlackTiger':         'Grintale',
  // 053–080
  'SmallSnowBear':      'Swee',
  'SnowBear':           'Sweepa',
  'IceDragonman':       'Chillet',
  'IceDragonman_Fire':  'Chillet Ignis',
  'ElecUnicorn':        'Univolt',
  'NightFox':           'Foxcicle',
  'FireDeer':           'Pyrin',
  'FireDeer_Dark':      'Pyrin Noct',
  'Reindeer':           'Reindrix',
  'ElecDog':            'Rayhound',
  'AmaterasuWolf':      'Kitsun',
  'AmaterasuWolf_Dark': 'Kitsun Noct',
  'FairyElec':          'Dazzi',
  'LunarBeast':         'Lunaris',
  'FlowerDinosaur':     'Dinossom',
  'FlowerDinosaur_Electric':'Dinossom Lux',
  'SeaSerpent':         'Surfent',
  'SeaSerpent_Ground':  'Surfent Terra',
  'GhostBeast':         'Maraith',
  'DrillTortoise':      'Digtoise',
  'CatBat':             'Tombat',
  'Lizard':             'Lovander',
  'FireSpirit':         'Flambelle',
  'BirdDragon':         'Vanwyrm',
  'BirdDragon_Ice':     'Vanwyrm Cryst',
  'SamuraiRedPanda':    'Bushi',
  'ElecBird':           'Beakon',
  'FlameHawk':          'Ragnahawk',
  'CatMage':            'Katress',
  'CatMage_Fire':       'Katress Ignis',
  // 076–111
  'FoxMage':            'Wixen',
  'FoxMage_Dark':       'Wixen Noct',
  'GrassRabbit':        'Verdash',
  'FlowerFairy':        'Vaelet',
  'SilkMoth':           'Sibelyx',
  'FairyDragon':        'Elphidran',
  'FairyDragon_Water':  'Elphidran Aqua',
  'Kelp':               'Kelpsea',
  'Kelp_Fire':          'Kelpsea Ignis',
  'AzureRobe':          'Azurobe',
  'IceLynx':            'Cryolinx',
  'Manticore':          'Blazehowl',
  'Manticore_Dark':     'Blazehowl Noct',
  'FrogOx':             'Relaxaurus',
  'FrogOx_Electric':    'Relaxaurus Lux',
  'DinoPlant':          'Broncherry',
  'DinoPlant_Water':    'Broncherry Aqua',
  'FlowerDoll':         'Petallia',
  'Reptile':            'Reptyro',
  'Reptile_Ice':        'Reptyro Cryst',
  'KingAlpaca':         'Kingpaca',
  'KingAlpaca_Ice':     'Kingpaca Cryst',
  'GrassMammoth':       'Mammorest',
  'GrassMammoth_Ice':   'Mammorest Cryst',
  'YetiPal':            'Wumpo',
  'YetiPal_Grass':      'Wumpo Botan',
  'LargeAnt':           'Warsect',
  'LargeAnt_Ground':    'Warsect Terra',
  'Antelope':           'Fenglope',
  'Antelope_Electric':  'Fenglope Lux',
  'VampireBat':         'Felbat',
  'WhiteDragon':        'Quivern',
  'WhiteDragon_Ground': 'Quivern Botan',
  'LavaDragon':         'Blazamut',
  'LavaDragon_Ice':     'Blazamut Cryst',
  'HadesBird':          'Helzephyr',
  'HadesBird_Electric': 'Helzephyr Lux',
  'BlackDragon':        'Astegon',
  'Scorpion':           'Menasting',
  'Scorpion_Ground':    'Menasting Terra',
  'Anubis':             'Anubis',
  'WaterDragon':        'Jormuntide',
  'WaterDragon_Fire':   'Jormuntide Ignis',
  'FirePhoenix':        'Suzaku',
  'FirePhoenix_Water':  'Suzaku Aqua',
  'ElecPanda':          'Grizzbolt',
  'GrassDragon':        'Lyleen',
  'GrassDragon_Dark':   'Lyleen Noct',
  'FireFalcon':         'Faleris',
  'FireFalcon_Water':   'Faleris Aqua',
  'ThunderDragon':      'Orserk',
  'BlackGriffon':       'Shadowbeak',
  'HolyUnicorn':        'Paladius',
  'DarkHorse':          'Necromus',
  'IceHorse':           'Frostallion',
  'IceHorse_Dark':      'Frostallion Noct',
  'DragonRocket':       'Jetragon',
  // Boss de raid
  'SakuraSaurus':       'Bellanoir',
  // Feybreak (127–156)
  'XenoDragon':         'Xenolord',
  'XenoDragonGuard':    'Xenogard',
  'XenoDragonSoldier':  'Xenovader',
  'GhostDog':           'Nitemary',
  'StarRay':            'Starryon',
  'SilverKnight':       'Silvegis',
  'PandaFire':          'Smokie',
  'BlueEelDragon':      'Azurmane',
  'LavaGorilla':        'Bastigor',
  'DarkRabbit':         'Prunelia',
  'CatFish':            'Nyafia',
  'GoldenDeer':         'Gildane',
  'SlimePal':           'Gloopie',
  'CrabPal':            'Ghangler',
  'JellyPal':           'Jellroy',
  'JellyPal2':          'Jelliette',
  'FishPal':            'Finsider',
  'FishPal_Fire':       'Finsider Ignis',
  'IceBirdSmall':       'Frostplume',
  'LionFish':           'Celesdir',
  'IceBirdBig':         'Icelyn',
  'MushPal':            'Shroomer',
  'MushPal_Dark':       'Shroomer Noct',
  'MonkeyPal':          'Kikit',
  'SealPal':            'Lullu',
  'CatPal':             'Mimog',
  'CrocPal':            'Croajiro',
  'CrocPal_Dark':       'Croajiro Noct',
  'DogPal':             'Dogen',
  'EmuPal':             'Dazemu',
  'FairyPal':           'Selyne',
  'ShipPal':            'Knocklem',
  'SamuraiPal':         'Yakumo',
  'ScorpionPal':        'Prixter',
  'Tarantula':          'Tarantriss',
  'OmascuPal':          'Omascul',
  'SplatterPal':        'Splatterina',
  'HerbPal':            'Herbil',
  'HerbPal2':           'Munchill',
  'TurtlePal':          'Turtacle',
  'TurtlePal_Ground':   'Turtacle Terra',
  'PolarBearPal':       'Polapup',
  'StarlightPal':       'Sootseer',
  'IcePoopBird':        'Icelyn',
};

/* ── Buffer Reader ── */
class BinaryReader {
  constructor(buffer) {
    this.buf  = buffer instanceof ArrayBuffer ? new DataView(buffer) : new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    this.pos  = 0;
  }

  get remaining() { return this.buf.byteLength - this.pos; }
  get eof()       { return this.pos >= this.buf.byteLength; }

  u8()  { const v = this.buf.getUint8(this.pos);    this.pos += 1; return v; }
  u16() { const v = this.buf.getUint16(this.pos, true); this.pos += 2; return v; }
  u32() { const v = this.buf.getUint32(this.pos, true); this.pos += 4; return v; }
  i32() { const v = this.buf.getInt32(this.pos, true);  this.pos += 4; return v; }
  i64() { const lo = this.u32(); const hi = this.u32(); return lo + hi * 4294967296; }
  f32() { const v = this.buf.getFloat32(this.pos, true); this.pos += 4; return v; }
  f64() { const v = this.buf.getFloat64(this.pos, true); this.pos += 8; return v; }

  bytes(n) {
    const v = new Uint8Array(this.buf.buffer, this.buf.byteOffset + this.pos, n);
    this.pos += n;
    return v;
  }

  skip(n) { this.pos += n; }

  // UE4 FString : int32 length, then UTF-8 or UTF-16LE
  fstring() {
    const len = this.i32();
    if (len === 0) return '';
    if (len > 0) {
      // UTF-8 avec null terminal
      const b = this.bytes(len);
      return new TextDecoder('utf-8').decode(b.slice(0, len - 1));
    } else {
      // UTF-16LE avec null terminal double
      const chars = -len;
      const b = this.bytes(chars * 2);
      return new TextDecoder('utf-16le').decode(b.slice(0, (chars - 1) * 2));
    }
  }

  // GUID : 16 bytes
  guid() {
    return this.bytes(16);
  }

  // Peek without advancing
  peek32() { return this.buf.getInt32(this.pos, true); }
}

/* ── Décompression zlib (API native moderne) ── */
async function decompressZlib(compressed) {
  // Essaie d'abord avec 'deflate-raw', puis 'deflate'
  for (const format of ['deflate', 'deflate-raw']) {
    try {
      const ds = new DecompressionStream(format);
      const writer = ds.writable.getWriter();
      const reader = ds.readable.getReader();
      writer.write(compressed);
      writer.close();
      const chunks = [];
      let totalSize = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalSize += value.length;
      }
      const result = new Uint8Array(totalSize);
      let offset = 0;
      for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
      return result;
    } catch {}
  }
  throw new Error('Décompression zlib échouée');
}

/* ── Parser format Palworld .sav ── */
async function parsePalworldSav(rawBuffer) {
  const raw = new Uint8Array(rawBuffer);
  const r = new BinaryReader(raw);

  // Essai 1 : le fichier est-il directement du GVAS non compressé ?
  const magic4 = r.peek32();
  if (magic4 === 0x53415647) { // "GVAS"
    return parseGVAS(raw);
  }

  // Format Palworld : 12 bytes de header custom, puis zlib
  // Bytes 0-3 : magic Palworld (variable selon version)
  // Bytes 4-7 : taille des données non compressées (optionnel)
  // Bytes 8-11 : type de compression (2 = zlib)
  // Le vrai payload zlib commence à offset 12

  let offset = 12;

  // Certains fichiers ont un header plus long ou pas de header
  // On cherche le magic zlib (0x78 suivi de 0x9C, 0xDA, 0x01, etc.)
  let zlibStart = -1;
  for (let i = 0; i < Math.min(64, raw.length - 2); i++) {
    const b0 = raw[i], b1 = raw[i + 1];
    // zlib header : CMF=0x78, FLG tel que (CMF*256+FLG) % 31 === 0
    if (b0 === 0x78 && (b1 === 0x9C || b1 === 0xDA || b1 === 0x01 || b1 === 0x5E)) {
      zlibStart = i;
      break;
    }
  }

  // Fallback : certains .sav sont compressés différemment, avec des blocs UE4
  // Header UE4 compressé : "C\0\0\0" (magic 0x0000002B ou autres)
  if (zlibStart === -1) {
    // Tenter de parser comme blocs UE4 (Zlib par blocs de 128KB)
    const chunks = await decompressUE4Blocks(raw);
    if (chunks) return parseGVAS(chunks);
    throw new Error('Format de sauvegarde non reconnu. Essaie Level.sav ou ton fichier joueur .sav');
  }

  const compressed = raw.slice(zlibStart);
  const decompressed = await decompressZlib(compressed);
  return parseGVAS(decompressed);
}

/* ── Décompression UE4 par blocs (format serveur) ── */
async function decompressUE4Blocks(raw) {
  // UE4 pak compressed : 
  // Magic: 0x9E2A83C1 (little endian: C1 83 2A 9E)
  // Certaines versions : chaque chunk = [uncompressed_size: i32][compressed_size: i32][data]
  try {
    const r = new BinaryReader(raw);
    const magic = r.u32();
    if (magic !== 0xC1832A9E) return null; // pas ce format

    r.skip(8); // version + flags
    const blockSize = r.u32();
    const compressedSize = r.i64();
    const uncompressedSize = r.i64();
    const compressionMethod = r.u32();

    if (compressionMethod !== 2) return null; // pas zlib

    const chunks = [];
    const totalSize = uncompressedSize;
    let remaining = totalSize;

    while (remaining > 0 && !r.eof) {
      const chunkUncompressed = Math.min(blockSize, remaining);
      const chunkCompressedSize = r.i32();
      r.skip(4); // uncompressed size redondant
      const chunkData = r.bytes(chunkCompressedSize);
      const decompressed = await decompressZlib(chunkData);
      chunks.push(decompressed);
      remaining -= chunkUncompressed;
    }

    const result = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk.slice(0, Math.min(chunk.length, totalSize - offset)), offset);
      offset += chunk.length;
    }
    return result;
  } catch {
    return null;
  }
}

/* ── Parser GVAS principal ── */
function parseGVAS(data) {
  const r = new BinaryReader(data);
  const result = { pals: [], playerName: '', level: 0 };

  // Header GVAS
  const magic = r.u32();
  if (magic !== 0x53415647) { // "GVAS"
    throw new Error('Magic GVAS invalide — ce fichier n\'est pas une sauvegarde Palworld valide.');
  }

  const saveGameVersion = r.i32();
  const pkgVersionUE4  = r.i32();
  const pkgVersionUE5  = r.i32();
  // Engine version
  r.skip(2 + 2 + 2 + 4); // major, minor, patch, changelist
  r.fstring();             // engine_version_branch
  // Custom versions
  const cvFormat = r.i32();
  const cvCount  = r.i32();
  for (let i = 0; i < cvCount; i++) {
    r.guid();
    r.i32();
  }
  const saveGameClass = r.fstring();

  // Parser les propriétés UE4
  parseProperties(r, result, 0);

  return result;
}

/* ── Parser récursif de propriétés UE4 ── */
function parseProperties(r, result, depth) {
  if (depth > 20) { return; } // protection anti-récursion infinie

  const MAX_PROPS = 50000;
  let count = 0;

  while (!r.eof && count < MAX_PROPS) {
    count++;

    const propName = safeReadString(r);
    if (!propName || propName === 'None') break;

    const propType = safeReadString(r);
    if (!propType) break;

    const propSize = r.i64(); // size in bytes of value
    const propIdx  = r.i32();

    if (!propType) break;

    switch (propType) {
      case 'StrProperty':
      case 'NameProperty':
      case 'TextProperty':
        skipTextProperty(r, propType);
        break;

      case 'IntProperty':
        r.u8(); // has_custom_guid
        const intVal = r.i32();
        // ExpLevel du joueur
        if (propName === 'Level') result.level = intVal;
        break;

      case 'BoolProperty':
        r.u8(); // value
        r.u8(); // has_custom_guid
        break;

      case 'FloatProperty':
        r.u8();
        r.f32();
        break;

      case 'DoubleProperty':
        r.u8();
        r.f64();
        break;

      case 'Int64Property':
        r.u8();
        r.i64();
        break;

      case 'ObjectProperty':
        r.u8();
        r.fstring(); // asset path
        r.fstring(); // sub path
        break;

      case 'SoftObjectProperty':
        r.u8();
        r.fstring();
        r.fstring();
        break;

      case 'EnumProperty': {
        r.u8(); // has_custom_guid — actually enum type name follows
        const enumTypeName = r.fstring();
        r.u8();
        r.fstring(); // enum value
        break;
      }

      case 'StructProperty': {
        const structTypeName = safeReadString(r);
        r.guid(); // struct guid (16 bytes)
        r.u8();   // has_custom_guid
        parseStructValue(r, structTypeName, result, depth + 1);
        break;
      }

      case 'ArrayProperty': {
        const innerType = safeReadString(r);
        r.u8(); // has_custom_guid
        const count = r.i32();
        parseArrayProperty(r, innerType, count, propName, result, depth + 1);
        break;
      }

      case 'MapProperty': {
        const keyType   = safeReadString(r);
        const valueType = safeReadString(r);
        r.u8(); // has_custom_guid
        r.i32(); // zero
        const count = r.i32();
        parseMapProperty(r, keyType, valueType, count, propName, result, depth + 1);
        break;
      }

      case 'SetProperty': {
        const setInnerType = safeReadString(r);
        r.u8();
        r.i32(); // zero
        const setCount = r.i32();
        skipNBytes(r, propSize - 8); // skip set contents
        break;
      }

      default:
        // Type inconnu : skip selon la taille déclarée
        // On ne peut pas skip exactement car la taille n'inclut pas toujours le guid byte
        // On avance d'un byte pour le has_custom_guid puis skip le reste
        r.u8();
        skipNBytes(r, propSize - 1);
        break;
    }
  }
}

function safeReadString(r) {
  try {
    if (r.remaining < 4) return null;
    const len = r.peek32();
    // Sanity check : strings < 512 chars
    if (Math.abs(len) > 512) return null;
    return r.fstring();
  } catch {
    return null;
  }
}

function skipNBytes(r, n) {
  if (n > 0 && n <= r.remaining) r.skip(n);
}

function skipTextProperty(r, type) {
  try {
    if (type === 'TextProperty') {
      r.u8(); // has_custom_guid
      r.i32(); // flags
      const histType = r.u8();
      if (histType === 255) {
        r.i32(); // has culture invariant
        r.fstring();
      } else {
        r.fstring(); // namespace
        r.fstring(); // key
        r.fstring(); // string
      }
    } else {
      r.u8();
      r.fstring();
    }
  } catch {}
}

function parseStructValue(r, structType, result, depth) {
  switch (structType) {
    case 'Guid':
      r.guid();
      break;
    case 'Vector':
      r.f64(); r.f64(); r.f64();
      break;
    case 'Rotator':
      r.f64(); r.f64(); r.f64();
      break;
    case 'Quat':
      r.f64(); r.f64(); r.f64(); r.f64();
      break;
    case 'DateTime':
    case 'Timespan':
      r.i64();
      break;
    default:
      // Struct générique = liste de propriétés terminée par "None"
      parseProperties(r, result, depth);
      break;
  }
}

function parseArrayProperty(r, innerType, count, propName, result, depth) {
  // Les ArrayProperty de struct ont un inner struct type name supplémentaire
  if (innerType === 'StructProperty') {
    const innerStructName = r.fstring();    // property name des éléments
    const innerTypeName2  = r.fstring();    // "StructProperty"
    r.i64();                                // size
    r.i32();                                // index
    const structInnerType = r.fstring();    // le vrai type de struct
    r.guid();                               // struct guid
    r.u8();                                 // has_custom_guid
    for (let i = 0; i < count; i++) {
      const subResult = { pals: [], playerName: '', level: 0 };
      parseProperties(r, subResult, depth + 1);
      // Fusionner les Pals trouvés
      result.pals.push(...subResult.pals);
      if (subResult.playerName) result.playerName = subResult.playerName;
    }
  } else {
    // Array de primitives : skip selon le type
    for (let i = 0; i < count; i++) {
      switch (innerType) {
        case 'ByteProperty': r.u8(); break;
        case 'BoolProperty': r.u8(); break;
        case 'IntProperty':  r.i32(); break;
        case 'Int64Property': r.i64(); break;
        case 'FloatProperty': r.f32(); break;
        case 'DoubleProperty': r.f64(); break;
        case 'StrProperty':
        case 'NameProperty': r.fstring(); break;
        case 'ObjectProperty':
          r.fstring(); r.fstring();
          break;
        case 'SoftObjectProperty':
          r.fstring(); r.fstring();
          break;
        default:
          return; // type inconnu → abandon du array
      }
    }
  }
}

function parseMapProperty(r, keyType, valueType, count, propName, result, depth) {
  // CharacterSaveParameterMap est le contenu principal : les Pals du joueur
  const isCharMap = propName === 'CharacterSaveParameterMap' ||
                    propName === 'PalStorageContainerSaveData';

  for (let i = 0; i < count; i++) {
    try {
      // Lire la clé
      const keyResult = { pals: [], playerName: '', level: 0 };
      if (keyType === 'StructProperty') {
        parseProperties(r, keyResult, depth + 1);
      } else {
        skipMapKey(r, keyType);
      }

      // Lire la valeur
      const valResult = { pals: [], playerName: '', level: 0 };
      if (valueType === 'StructProperty') {
        parseProperties(r, valResult, depth + 1);
      } else {
        skipMapKey(r, valueType);
      }

      result.pals.push(...keyResult.pals);
      result.pals.push(...valResult.pals);
      if (valResult.playerName) result.playerName = valResult.playerName;
      if (valResult.level > 0)  result.level = valResult.level;

    } catch (e) {
      // Une entrée corrompue → on abandonne la map
      break;
    }
  }
}

function skipMapKey(r, type) {
  switch (type) {
    case 'ByteProperty':   r.u8(); break;
    case 'BoolProperty':   r.u8(); break;
    case 'IntProperty':    r.i32(); break;
    case 'Int64Property':  r.i64(); break;
    case 'FloatProperty':  r.f32(); break;
    case 'StrProperty':
    case 'NameProperty':   r.fstring(); break;
    case 'ObjectProperty':
    case 'SoftObjectProperty':
      r.fstring(); r.fstring(); break;
    default: break;
  }
}

/* ═══════════════════════════════════════════════════
   API publique : analyse d'un fichier .sav
   Retourne : { capturedNames: Set<string>, playerName, level, method }
   où capturedNames = ensemble de noms anglais officiels
═══════════════════════════════════════════════════ */
async function analyzeSaveFile(arrayBuffer) {
  const raw = new Uint8Array(arrayBuffer);

  // Méthode 1 : Parser GVAS structuré
  try {
    const parsed = await parsePalworldSav(arrayBuffer);
    if (parsed.pals.length > 0) {
      const capturedNames = new Set();
      for (const palId of parsed.pals) {
        // palId est un CharacterID interne
        const normalId = palId.replace(/^BP_|_C$/g, '').replace(/PalCharID_/, '');
        if (CHAR_ID_MAP[normalId]) {
          capturedNames.add(CHAR_ID_MAP[normalId]);
        } else {
          // Cherche en ignorant la casse
          const found = Object.entries(CHAR_ID_MAP).find(([k]) => 
            k.toLowerCase() === normalId.toLowerCase());
          if (found) capturedNames.add(found[1]);
        }
      }
      if (capturedNames.size > 0) {
        return { capturedNames, playerName: parsed.playerName, level: parsed.level, method: 'gvas' };
      }
    }
  } catch (e) {
    console.warn('Parser GVAS:', e.message);
  }

  // Méthode 2 : Scan textuel robuste (fallback)
  // Décompression tentée d'abord, puis scan brut
  let textToScan = '';
  try {
    // Trouver le début zlib
    let zlibStart = -1;
    for (let i = 0; i < Math.min(64, raw.length - 2); i++) {
      if (raw[i] === 0x78 && (raw[i+1] === 0x9C || raw[i+1] === 0xDA || raw[i+1] === 0x01 || raw[i+1] === 0x5E)) {
        zlibStart = i; break;
      }
    }
    if (zlibStart >= 0) {
      const decompressed = await decompressZlib(raw.slice(zlibStart));
      textToScan = new TextDecoder('utf-8', { fatal: false }).decode(decompressed)
                 + new TextDecoder('utf-16le', { fatal: false }).decode(decompressed);
    }
  } catch {}

  // Aussi scanner le fichier brut (certains noms sont en clair même compressés)
  textToScan += new TextDecoder('utf-8',    { fatal: false }).decode(raw)
              + new TextDecoder('utf-16le', { fatal: false }).decode(raw);

  const capturedNames = new Set();
  for (const [internalId, officialName] of Object.entries(CHAR_ID_MAP)) {
    if (textToScan.includes(internalId)) {
      capturedNames.add(officialName);
    }
  }

  // Aussi chercher les noms officiels directement
  const OFFICIAL_NAMES = new Set(Object.values(CHAR_ID_MAP));
  for (const name of OFFICIAL_NAMES) {
    if (textToScan.includes(name)) capturedNames.add(name);
  }

  return {
    capturedNames,
    playerName: '',
    level: 0,
    method: capturedNames.size > 0 ? 'scan' : 'none'
  };
}
