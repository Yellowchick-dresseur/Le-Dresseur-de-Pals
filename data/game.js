/* ══════════════════════════════════════════════════════════════
   LE DRESSEUR DE PALS — game.js
   Données complètes scrappées depuis palworld.gg/fr + paldb.cc
   Sources : items, structures, technology-tree, breeding-calculator, tier-list
   Mise à jour : 2026-04 (v0.7 Home Sweet Home)
══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────
   POWER RANKS DE BREEDING (depuis palworld.gg/fr/breeding-calculator)
   Algorithme : (rank_père + rank_mère) / 2 → Pal le plus proche
───────────────────────────────────────────────── */
const BREEDING_RANKS = {
  'Jetragon':1,'Paladius':10,'Necromus':20,'Suzaku Aqua':30,'Suzaku':50,
  'Frostallion':70,'Frostallion Noct':100,'Cryolinx':130,'Xenolord':80,
  'Blazamut':180,'Blazamut Ryu':170,'Helzephyr':210,'Helzephyr Lux':200,
  'Astegon':220,'Menasting':260,'Menasting Terra':270,'Faleris Aqua':300,
  'Jormuntide':310,'Jormuntide Ignis':315,'Pyrin Noct':240,'Orserk':250,
  'Blazehowl Noct':330,'Blazehowl':340,'Pyrin':360,'Lyleen Noct':350,
  'Lyleen':380,'Grizzbolt':200,'Shadowbeak':160,'Silvegis':160,'Bastigor':180,
  'Selyne':250,'Faleris':280,'Whalaska Ignis':280,'Whalaska':290,'Knocklem':300,
  'Quivern Botan':400,'Quivern':410,'Kingpaca Cryst':390,'Kingpaca':400,
  'Wumpo':400,'Wumpo Botan':390,'Mammorest Cryst':430,'Mammorest':440,
  'Reptyro Cryst':420,'Reptyro':430,'Warsect Terra':460,'Warsect':470,
  'Fenglope Lux':450,'Fenglope':460,'Broncherry Aqua':480,'Broncherry':490,
  'Relaxaurus Lux':480,'Relaxaurus':490,'Dinossom Lux':500,'Dinossom':510,
  'Elphidran Aqua':530,'Elphidran':540,'Surfent Terra':550,'Surfent':560,
  'Vaelet':590,'Incineram Noct':580,'Katress Ignis':570,'Anubis':570,
  'Incineram':590,'Sibelyx':600,'Verdash':500,'Kitsun':620,'Kitsun Noct':610,
  'Vanwyrm Cryst':610,'Vanwyrm':620,'Foxcicle':640,'Beakon':660,'Ragnahawk':650,
  'Bushi Noct':700,'Bushi':710,'Wixen Noct':720,'Wixen':730,'Sweepa':780,
  'Chillet Ignis':760,'Chillet':770,'Reindrix':800,'Rayhound':820,
  'Digtoise':850,'Tombat':870,'Lovander':860,'Maraith':880,'Flambelle':900,
  'Petallia':750,'Felbat':740,'Azurobe Cryst':500,'Azurobe':520,
  'Eikthyrdeer Terra':900,'Eikthyrdeer':920,'Melpaca':890,'Galeclaw Lux':990,
  'Galeclaw':1030,'Robinquill Terra':1010,'Robinquill':1020,'Gorirat Terra':1030,
  'Gorirat':1040,'Mossanda Lux':1040,'Mossanda':1050,'Mozzarina':1050,
  'Gumoss':1240,'Gumoss Fleur':1240,'Direhowl':1060,'Cawgnito':1080,
  'Gobfin':1090,'Gobfin Ignis':1100,'Lunaris':1110,'Rushoar':1130,
  'Arsox':1140,'Leezpunk':1070,'Leezpunk Ignis':1070,'Cinnamoth':1160,
  'Ribbuny':1170,'Woolipop':1190,'Hoocrates':1200,'Dazzi Noct':1200,
  'Dazzi':1210,'Depresso':1210,'Daedream':1220,'Fuddler':1280,'Nox':1260,
  'Celaray Lux':1290,'Celaray':1300,'Tocotoco':1340,'Jolthog Cryst':1360,
  'Jolthog':1370,'Pengullet Lux':1310,'Pengullet':1350,'Lifmunk':1430,
  'Foxparks':1400,'Sparkit':1410,'Tanzee':1450,'Cattiva':1460,'Vixy':1460,
  'Lamball':1470,'Mau Cryst':1440,'Mau':1480,'Teafant':1490,'Hangyu Cryst':1422,
  'Hangyu':1420,'Rooby':1440,'Loupmoon Cryst':940,'Loupmoon':950,
  'Grintale':960,'Elizabee':970,'Kelpsea Ignis':980,'Kelpsea':990,
  'Dumud Gild':1960,'Dumud':1965,'Eikthyrdeer Terra':900,'Univolt':680,
  'Swee':800,'Bristla':1320,'Caprity Noct':960,'Caprity':970,
  'Turtacle':1105,'Turtacle Terra':1065,'Nyafia':645,'Prunelia':755,
  'Gildane':505,'Nitemary':680,'Starryon':700,'Smokie':750,'Azurmane':680,
  'Celesdir':600,'Shroomer Noct':760,'Shroomer':770,'Kikit':800,'Lullu':820,
  'Mimog':840,'Croajiro Noct':860,'Croajiro':870,'Dogen':890,'Dazemu':900,
  'Yakumo':320,'Prixter':340,'Tarantriss':360,'Omascul':380,'Splatterina':400,
  'Herbil':420,'Munchill':440,'Polapup':1080,'Sootseer':600,
  'Finsider Ignis':780,'Finsider':790,'Gloopie':900,'Ghangler':800,
  'Jellroy':850,'Jelliette':870,'Bellanoir':15,'Bellanoir Libero':16,
  'Neptilius':5,'Xenogard':150,
};

/* ─────────────────────────────────────────────────
   ARBRE TECHNOLOGIQUE COMPLET (niveaux 1-65)
   Source : palworld.gg/fr/technology-tree
───────────────────────────────────────────────── */
const TECH_TREE = [
  {lv:1,pts:1,items:["Établi de fortune","Hache en pierre","Pioche en pierre","Torche à porter","Batte en bois","Dispositif d'habillage Pals","Boîte à Pals globale"]},
  {lv:2,pts:1,items:["Boîte à Pal","Sphère de Pal","Feu de camp","Coffre en bois","Banc de réparation","Structures en bois"]},
  {lv:3,pts:1,items:["Vieil arc","Flèche","Lit de fortune","Lit pour Pal en paille","Kit de réparation","Tissu"]},
  {lv:4,pts:2,items:["Bouclier normal","Lance en pierre","Vêtement en tissu","Boîte à nourriture","Alarme","Piège suspendu"]},
  {lv:5,pts:2,items:["Plantation de baies","Ferme","Parachute normal","Arc de feu","Flèche enflammée"]},
  {lv:6,pts:2,items:["Établi équipement Pal","Statue de puissance","Torche à poser","Selle Rushoar","Harnais Foxparks"]},
  {lv:7,pts:2,items:["Scierie","Carrière","Pancarte","Batte","Selle Melpaca","Gants Celaray","Incubateur"]},
  {lv:8,pts:2,items:["Concasseur","Arc de poison","Flèche empoisonnée","Gants Jolthog","Collier Daedream"]},
  {lv:9,pts:3,items:["Habits des tropiques","Habits des montagnes","Source chaude","Sac de sable","Harnais Direhowl","Gants Killamari"]},
  {lv:10,pts:2,items:["Arc triple","Fournaise de fortune","Barrette à plumes","Échelle","Piège (petit)","Clou","Selle Surfent"]},
  {lv:11,pts:2,items:["Hache en métal","Pioche en métal","Établi de qualité","Module poids lourd","Portail en bois","Pistolet-mitrailleur Lifmunk","Gants Jolthog Cryst"]},
  {lv:12,pts:2,items:["Armure en fourrure","Couteau de boucher","Table pharmaceutique archaïque","Fusil Tanzee","Selle Eikthyrdeer","Selle Grintale","Pistolet-grappin"]},
  {lv:13,pts:2,items:["Arbalète","Lance en métal","Générateur manuel","Mannequin martyr","Glacière","Selle Chillet"]},
  {lv:14,pts:2,items:["Méga Sphère","Établi pour sphères","Plateforme de surveillance","Torche murale","Selle Sweepa","Selle Univolt","Capsule d'enrichissement"]},
  {lv:15,pts:2,items:["Ensemble de Pêche Basique","Arbalète enflammée","Lieu d'expédition Pals","Plantation de blé","Broyeur","Cage d'observation","Selle Nitewing"]},
  {lv:16,pts:2,items:["Méga bouclier","Armure réfrigérante fourrure","Coffre en métal","Rempart en bois","Selle Arsox","Outil de crochetage basique"]},
  {lv:17,pts:2,items:["Arbalète empoisonnée","Marmite","Chauffage à flammes","Lance-Roquettes Pengullet","Collier Flopie","Méga pistolet-grappin"]},
  {lv:18,pts:2,items:["Méga planeur","Armure chauffante fourrure","Structures en pierre","Climatiseur à glace","Gants Tocotoco","Anneau de manipulation"]},
  {lv:19,pts:2,items:["Ranch","Ciment","Selle Dinossom","Selle Broncherry","Bandeau Digtoise","Sac de nourriture"]},
  {lv:20,pts:3,items:["Giga Sphère","Établi pour armes","Centre de recherche Travail Pals","Grosse caisse à outils","Gants Hangyu","Selle Elphidran","Stockage Pals dimensionnel"]},
  {lv:21,pts:3,items:["Fusil à mousquet","Poudre à canon","Munitions bas de gamme","Plantation de tomates","Marmite","Selle Vanwyrm","Selle Kingpaca"]},
  {lv:22,pts:2,items:["Matraque électrique","Appât Haut de Gamme","Marché puces (Objets)","Marché puces (Pals)","Piège (grand)","Collier Dazzi","Selle Dazemu","Nuage d'orage"]},
  {lv:23,pts:2,items:["Armure en métal","Heaume en métal","Module courbe","Fontaine","Selle Maraith","Gants Galeclaw","Gants Killamari Primo"]},
  {lv:24,pts:3,items:["Pistolet rouillé","Lit pour Pal moelleux","Étagère à remèdes","Parterre","Harnais Foxparks Cryst","Lance-grenades Mossanda","Selle Azurobe","Carrière de cuivre"]},
  {lv:25,pts:2,items:["Pistolet Dopant","Grenade à fragmentation","Armure métal réfrigérante","Plantation de laitue","Silo","Selle Surfent Terra","Selle Eikthyrdeer Terra","Outil de crochetage avancé"]},
  {lv:26,pts:3,items:["Pistolet-mitrailleur usé","Générateur","Lampadaire","Arbalète montée","Selle Fenglope","Lance-grenades Mossanda Lux","Gants Celaray Lux","Lance-sphères à un coup"]},
  {lv:27,pts:3,items:["Téra Sphère","Chaîne de production de sphères","Grenades électriques","Armure métal chauffante","Selle Broncherry Aqua","Selle Rayhound","Harnais Herbil"]},
  {lv:28,pts:3,items:["Pistolet","Balles de pistolet","Giga bouclier","Chaîne de production","Souche et hache","Rempart en pierre","Selle Elphidran Aqua","Selle Tarantriss","Ceinture anti-gravité"]},
  {lv:29,pts:2,items:["Canne à Pêche Standard","Katana","Grenades gelantes","Plantation de patates","Lit de qualité","Selle Mammorest","Selle Reindrix","Selle Azurobe Cryst"]},
  {lv:30,pts:2,items:["Fusil à pompe usé","Mine","Structures en métal","Pioche et casque","Selle Kitsun","Selle Vanwyrm Cryst","Selle Dinossom Lux","Épée arc-en-ciel"]},
  {lv:31,pts:2,items:["Fusil d'assaut usé","Grenades incendiaires","Module sniper","Bassin de pêche","Source chaude réputée","Portail en pierre","Selle Pyrin","Gants Hangyu Cryst","Giga pistolet-grappin"]},
  {lv:32,pts:3,items:["Arc composite","Flèche renforcée","Grenade à Régénération de Pal","Chaîne de production d'armes","Plantation de carottes","Chaudron de sorcière","Terminal Gestion Boîte à Pals","Selle Reptyro","Autel d'appel"]},
  {lv:33,pts:3,items:["Vieux revolver","Grenade torrentielle","Polymère","Mine électrique","Selle Helzephyr","Selle Blazehowl"]},
  {lv:34,pts:4,items:["Fournaise améliorée","Hache métal raffiné","Pioche métal raffiné","Lance métal raffiné","Selle Beakon","Selle Pyrin Noct","Harnais Polapup","Bottes ruée aérienne"]},
  {lv:35,pts:4,items:["Ultra Sphère","Chaîne de production de sphères II","Grenade végétale","Circuit imprimé","Fibre de carbone","Selle Whalaska","Selle Blazehowl Noct"]},
  {lv:36,pts:3,items:["Fusil à un coup","Balles de fusil","Table d'opération de Pal","Plantation d'oignons","Tissu de qualité","Grand lit pour Pal","Selle Quivern","Incubateur électrique"]},
  {lv:37,pts:3,items:["Pistolet-mitrailleur","Armure métal raffiné","Heaume métal raffiné","Condensateur","Selle Ragnahawk","Selle Ghangler","Lance-sphères à diffusion"]},
  {lv:38,pts:3,items:["Lance-météorites","Grenade terrestre","Appât de Luxe","Réfrigérateur","Mine gelée","Selle Reptyro Cryst","Selle Faleris","Carrière de cuivre II"]},
  {lv:39,pts:3,items:["Fusil à double canon","Balles fusil à pompe","Module glisseur","Structures en verre","Coffre métal raffiné","Lance-fusées Pengullet Lux","Selle Jormuntide","Bottes de double saut"]},
  {lv:40,pts:2,items:["Grenade obscure","Armure métal raffiné réfrigérante","Giga planeur","Mitrailleuse montée","Selle Blazamut","Minigun Grizzbolt","Coffre de guilde"]},
  {lv:41,pts:3,items:["Fusil semi-automatique","Armure métal raffiné chauffante","Cuisine électrique","Dispositif de vague α","Chauffage électrique","Selle Suzaku","Mine de charbon"]},
  {lv:42,pts:2,items:["Grenade draconique","Chaîne de production II","Climatiseur électrique","Porte en métal","Selle Kingpaca Cryst"]},
  {lv:43,pts:4,items:["Fusil à pompe","Téra bouclier","Table pharmaceutique électrique","Rempart en métal","Selle Suzaku Aqua","Selle Jormuntide Ignis","Selle Yakumo","Lance de Lily"]},
  {lv:44,pts:5,items:["Sphère Légendaire","Fournaise électrique","Épée","Pioche en paluminium","Hache en paluminium","Lance-missiles Relaxaurus","Selle Wumpo"]},
  {lv:45,pts:4,items:["Fusil d'assaut","Balles de fusil d'assaut","Canne à Pêche Avancée","Table de dessin","Selle Wumpo Botan","Selle Mammorest Cryst","Selle Chillet Ignis","Mine de soufre"]},
  {lv:46,pts:4,items:["Armure en Paluminium","Heaume en Paluminium","Dispositif de vague β","Lance-missiles Relaxaurus Lux","Selle Shroomer","Selle Braloha"]},
  {lv:47,pts:4,items:["Fusil pompe semi-automatique","Chaîne de production d'armes II","Module sniper II","Selle Astegon","Selle Shadowbeak","Selle Shroomer Noct","Incubateur Géant"]},
  {lv:48,pts:5,items:["Armure Paluminium Réfrigérante","Plantation Fruits de Maîtrise","Usine pièces d'or","Selle Frostallion","Selle Frostallion Noct","Téra pistolet-grappin"]},
  {lv:49,pts:5,items:["Lance-fusées","Balles fusées","Extracteur d'objets","Grande cuisine","Selle Paladius","Selle Necromus","Selle Quivern Botan","Grand générateur"]},
  {lv:50,pts:5,items:["Armure Paluminium Chauffante","Lance-missiles monté","Plastacier","Pompe à pétrole brut","Structures style japonais","Lance-missiles Jetragon","Selle Xenogard","Carrière de quartz pur"]},
  {lv:51,pts:5,items:["Sphère ultime","Armure en plastacier","Casque en plastacier","Fusil laser","Cartouche d'énergie","Boîte nourriture réfrigérée","Collier Dazzi Noct","Outil de crochetage professionnel"]},
  {lv:52,pts:4,items:["Téra planeur","Lance-flammes","Appât Séduisant","Broyeur à glace","Selle Helzephyr Lux","Selle Fenglope Lux"]},
  {lv:53,pts:5,items:["Armure plastacier réfrigérante","Lance-grenades","Grenade fragmentation améliorée","Selle Selyne","Fusil pompe Nyafia","Selle Kitsun Noct"]},
  {lv:54,pts:5,items:["Armure plastacier chauffante","Pistolet gatling","Munitions de gatling","Destructeur de Pals","Bottes double ruée aérienne","Selle Gildane"]},
  {lv:55,pts:4,items:["Grand Bassin de pêche","Ultra bouclier","Armure plastacier allégée","Lance-missiles","Missile","Selle Blazamut Ryu","Selle Faleris Aqua","Lance-sphères tête chercheuse"]},
  {lv:56,pts:5,items:["Sphère exotique","Usine sphères civ. avancée","Hexolite","Fournaise géante","Détecteur de métaux","Selle Azurmane","Harnais Smokie"]},
  {lv:57,pts:3,items:["Arc avancé","Flèche avancée","Armure en Hexolite","Épée rayonnante","Module tête chercheuse","Capsule Pal civ. avancée","Selle Starryon"]},
  {lv:58,pts:4,items:["Coffre civ. avancée","Pistolet gatling laser","Cartouche gatling laser","Casque en Hexolite","Selle Silvegis","Selle Celesdir","Bottes triple saut"]},
  {lv:59,pts:2,items:["Potion suprême","Potion de résurrection","Table pharmaceutique civ. avancée","Armure Hexolite réfrigérante","Armure Hexolite chauffante","Marteau de Bastigor"]},
  {lv:60,pts:5,items:["Canon à plasma","Cartouche de plasma","Bouclier avancé","Armure Hexolite légère","Selle Xenolord","Grand incubateur électrique"]},
  {lv:61,pts:3,items:["Aimant de Pêche Puissant","Lingot de Korallium","Usine civ. avancée","Structures style futuriste","Selle Ghangler Ignis","Mine d'Hexoquartz"]},
  {lv:62,pts:5,items:["Fusil pompe Énergétique","Balles Fusil pompe Énergétique","Usine d'armes civ. avancée","Onsen","Selle Whalaska Ignis","Bottes triple ruée aérienne"]},
  {lv:63,pts:3,items:["Méga Pistolet Dopant","Drapeaux des Syndicats","Drapeaux LPP","Selle Neptilius","Ultra pistolet-grappin"]},
  {lv:64,pts:5,items:["Fusil à Surchauffe","Balles Fusil à Surchauffe","Drapeaux Confrérie","Drapeaux Milice"]},
  {lv:65,pts:0,items:[]},
];

/* ─────────────────────────────────────────────────
   RECETTES PRINCIPALES (depuis palworld.gg/fr/items)
───────────────────────────────────────────────── */
const RECIPES = [
  {name:"Lingot de métal",        icon:"⚙️",via:"Fournaise de fortune",   ingredients:["2× Minerai de métal"]},
  {name:"Lingot de métal raffiné",icon:"🔩",via:"Fournaise améliorée",    ingredients:["2× Minerai de métal","2× Charbon"]},
  {name:"Lingot de Paluminium",   icon:"⭐",via:"Fournaise électrique",   ingredients:["2× Minerai de Paluminium","2× Charbon"]},
  {name:"Plastacier",             icon:"🔷",via:"Fournaise géante",        ingredients:["2× Lingot de Paluminium","2× Polymère"]},
  {name:"Hexolite",               icon:"💎",via:"Fournaise géante",        ingredients:["5× Quartz pur","1× Polymère"]},
  {name:"Lingot de Korallium",    icon:"🪸",via:"Fournaise électrique",   ingredients:["2× Minerai de Korallium"]},
  {name:"Ciment",                 icon:"🪨",via:"Concasseur",             ingredients:["50× Pierre","1× Noix de palmier","1× Fruit de Palpagos"]},
  {name:"Tissu",                  icon:"🧵",via:"Établi de qualité",       ingredients:["2× Laine"]},
  {name:"Tissu de qualité",       icon:"🎀",via:"Établi de qualité",       ingredients:["10× Laine"]},
  {name:"Polymère",               icon:"🧪",via:"Chaîne de production",    ingredients:["2× Huile de Pal de Qualité"]},
  {name:"Circuit imprimé",        icon:"💡",via:"Chaîne de production II", ingredients:["2× Cuivre","2× Quartz pur"]},
  {name:"Fibre de carbone",       icon:"⬛",via:"Chaîne de production II", ingredients:["2× Charbon"]},
  {name:"Poudre à canon",         icon:"💥",via:"Établi pour armes",       ingredients:["1× Charbon de bois","1× Soufre"]},
  {name:"Charbon de bois",        icon:"🪵",via:"Fournaise de fortune",    ingredients:["2× Bois de charpente"]},
  {name:"Gâteau",                 icon:"🎂",via:"Table de cuisson",        ingredients:["5× Farine de blé","8× Baies rouges","7× Lait","8× Œuf","2× Miel"],
   note:"Indispensable pour l'élevage au Ranch."},
  {name:"Fusil d'assaut",         icon:"🔫",via:"Établi pour armes",      ingredients:["40× Lingot raffiné","10× Polymère","30× Fibre de carbone"]},
  {name:"Lance-fusées",           icon:"🚀",via:"Chaîne de production d'armes II",ingredients:["100× Lingot Paluminium","50× Circuit imprimé","20× Polymère"]},
  {name:"Fusil laser",            icon:"⚡",via:"Chaîne de production d'armes II",ingredients:["50× Plastacier","20× Circuit imprimé","30× Hexolite"]},
  {name:"Canon à plasma",         icon:"💜",via:"Usine d'armes Civ. Avancée",ingredients:["100× Hexolite","50× Circuit imprimé","30× Plastacier"]},
  {name:"Lance-flammes",          icon:"🔥",via:"Chaîne de production d'armes II",ingredients:["50× Lingot Paluminium","20× Polymère"]},
  {name:"Armure en métal",        icon:"🛡️",via:"Établi équipement",  ingredients:["30× Lingot de métal","10× Cuir","5× Tissu"]},
  {name:"Armure métal raffiné",   icon:"🛡️",via:"Établi équipement", ingredients:["40× Lingot raffiné","15× Cuir","10× Tissu"]},
  {name:"Armure en Paluminium",   icon:"⭐",via:"Établi équipement",  ingredients:["50× Lingot Paluminium","20× Cuir","15× Tissu de qualité"]},
  {name:"Armure en plastacier",   icon:"🔷",via:"Établi équipement",  ingredients:["60× Plastacier","20× Polymère","10× Fibre de carbone"]},
  {name:"Armure en Hexolite",     icon:"💎",via:"Usine Civ. Avancée",      ingredients:["80× Hexolite","30× Polymère","20× Fibre de carbone"]},
  {name:"Fournaise de fortune",   icon:"🔥",via:"Établi de fortune",       ingredients:["20× Bois","50× Pierre","3× Organe d'allumage"]},
  {name:"Fournaise améliorée",    icon:"🔥",via:"Établi de qualité",       ingredients:["100× Pierre","30× Ciment","15× Organe d'allumage"]},
  {name:"Fournaise électrique",   icon:"⚡",via:"Chaîne de production",    ingredients:["50× Lingot raffiné","10× Circuit imprimé","20× Polymère","20× Fibre de carbone"]},
  {name:"Fournaise géante",       icon:"🏭",via:"Usine Civ. Avancée",      ingredients:["150× Plastacier","100× Polymère","200× Organe d'allumage","20× Pièces ancienne civ."]},
  {name:"Chaîne de production",   icon:"🏭",via:"Établi pour armes",       ingredients:["50× Lingot raffiné","50× Circuit imprimé"]},
  {name:"Ranch",                  icon:"🐄",via:"Établi de qualité",       ingredients:["100× Bois","20× Pierre","50× Textile"]},
  {name:"Autel d'appel",          icon:"🗿",via:"Établi de qualité",       ingredients:["100× Pierre","20× Éclat de paldium"]},
  {name:"Table d'opération de Pal",icon:"🔬",via:"Chaîne de production", ingredients:["50× Lingot raffiné","20× Circuit imprimé"]},
  {name:"Incubateur électrique",  icon:"🥚",via:"Chaîne de production",    ingredients:["50× Lingot raffiné","30× Circuit imprimé","20× Polymère"]},
  {name:"Sphère de Pal",          icon:"⚪",via:"Artisanat",              ingredients:["1× Bois","3× Pierre"]},
  {name:"Méga Sphère",            icon:"🔵",via:"Établi pour sphères",    ingredients:["1× Bois","3× Pierre","3× Éclat de paldium"]},
  {name:"Giga Sphère",            icon:"🟡",via:"Chaîne prod. sphères",   ingredients:["3× Bois","3× Pierre","5× Éclat de paldium"]},
  {name:"Téra Sphère",            icon:"🟠",via:"Chaîne prod. sphères",   ingredients:["5× Bois","5× Pierre","7× Éclat de paldium"]},
  {name:"Ultra Sphère",           icon:"🔴",via:"Chaîne prod. sphères II",ingredients:["5× Éclat de paldium","5× Lingot raffiné"]},
  {name:"Sphère Légendaire",      icon:"💜",via:"Chaîne prod. sphères II",ingredients:["7× Éclat de paldium","7× Lingot Paluminium"]},
  {name:"Sphère ultime",          icon:"⭐",via:"Usine de sphères avancée",ingredients:["10× Éclat de paldium","5× Hexolite"]},
];

/* ─────────────────────────────────────────────────
   POSTES DE TRAVAIL — Meilleurs Pals
───────────────────────────────────────────────── */
const POSTES = [
  {icon:"🔥",name:"Allumage de feu",desc:"Alimente fonderies, marmites et fourneaux.",
   pals:[{n:"Bushi",lvl:3,note:"Meilleur early→mid"},{n:"Blazehowl",lvl:3,note:"Lion de lave"},{n:"Ragnahawk",lvl:3,note:"Monture aussi"},{n:"Reptyro",lvl:3,note:"Double Lv.3"},{n:"Blazamut",lvl:4,note:"★ Late game Lv4"},{n:"Bastigor",lvl:2,note:"Feybreak"}]},
  {icon:"🌱",name:"Semence",desc:"Sème les graines. Vital pour la nourriture.",
   pals:[{n:"Lyleen",lvl:3,note:"Absolue meilleure"},{n:"Broncherry",lvl:3,note:"Aussi porteur"},{n:"Braloha",lvl:4,note:"★ Lv4 Herbe+Terre"},{n:"Mossanda",lvl:2,note:"Transport aussi"},{n:"Elizabee",lvl:2,note:"Reine des abeilles"},{n:"Caprity",lvl:2,note:"Produit des baies"},{n:"Robinquill",lvl:1,note:"Polyvalent"}]},
  {icon:"⚡",name:"Génération d'énergie",desc:"Alimente les machines électriques.",
   pals:[{n:"Orserk",lvl:4,note:"Meilleur absolu"},{n:"Grizzbolt",lvl:3,note:"Boss de tour"},{n:"Azurmane",lvl:4,note:"★ Feybreak Lv4"},{n:"Beakon",lvl:3,note:"Monture aussi"},{n:"Starryon",lvl:3,note:"Feybreak"},{n:"Dazzi",lvl:2,note:"Polyvalent"},{n:"Univolt",lvl:2,note:"Monture rapide"},{n:"Rayhound",lvl:2,note:"Monture sprint 1150"}]},
  {icon:"💧",name:"Arrosage",desc:"Arrose les plantations et alimente les roues à eau.",
   pals:[{n:"Neptilius",lvl:4,note:"★ Légendaire Eau Lv4"},{n:"Jormuntide",lvl:4,note:"Dragon eau Lv4"},{n:"Broncherry Aqua",lvl:3,note:"Aussi plantation"},{n:"Azurobe",lvl:3,note:"Dragon d'eau"},{n:"Whalaska",lvl:3,note:"Aussi Réfrigération Lv4"},{n:"Surfent",lvl:2,note:"Monture aqua"},{n:"Teafant",lvl:1,note:"Early game"}]},
  {icon:"❄️",name:"Réfrigération",desc:"Refroidit les réfrigérateurs et glacières.",
   pals:[{n:"Whalaska",lvl:4,note:"★ Meilleur Lv4 !"},{n:"Bastigor",lvl:4,note:"★ Feybreak Lv4"},{n:"Cryolinx",lvl:3,note:"Tigre glacé"},{n:"Reptyro Cryst",lvl:3,note:"Double Lv.3"},{n:"Sibelyx",lvl:2,note:"Produit Tissu qualité"},{n:"Sweepa",lvl:2,note:"Ours glacé"},{n:"Foxcicle",lvl:1,note:"Early game"}]},
  {icon:"🪓",name:"Abattage",desc:"Abat les arbres pour produire du bois.",
   pals:[{n:"Celesdir",lvl:4,note:"★ Feybreak Lv4"},{n:"Wumpo",lvl:3,note:"Le yéti géant"},{n:"Bushi",lvl:3,note:"Aussi allumeur"},{n:"Cryolinx",lvl:3,note:"Aussi refroidisseur"},{n:"Gorirat",lvl:2,note:"Fort porteur"},{n:"Eikthyrdeer",lvl:2,note:"1ère monture"},{n:"Verdash",lvl:2,note:"Multi-tâches"}]},
  {icon:"⛏️",name:"Minage",desc:"Mine les minerais. Indispensable pour le métal.",
   pals:[{n:"Astegon",lvl:4,note:"★ Meilleur mineur"},{n:"Blazamut",lvl:4,note:"★ Double Lv.4"},{n:"Digtoise",lvl:3,note:"Aucune distraction"},{n:"Anubis",lvl:3,note:"Aussi artisanat"},{n:"Reptyro",lvl:3,note:"Aussi allumeur"},{n:"Dumud",lvl:1,note:"Early game"}]},
  {icon:"🔨",name:"Travaux manuels",desc:"Construit les structures et crée des objets aux établis.",
   pals:[{n:"Anubis",lvl:4,note:"★ Meilleur absolu"},{n:"Lunaris",lvl:3,note:"Aussi porteur+poids joueur"},{n:"Verdash",lvl:3,note:"Multi-tâches Herbe"},{n:"Wixen",lvl:2,note:"Polyvalent"},{n:"Pengullet",lvl:1,note:"Early game"}]},
  {icon:"🌿",name:"Collecte",desc:"Ramasse les ressources naturelles.",
   pals:[{n:"Braloha",lvl:4,note:"★ Herbe+Terre Lv4"},{n:"Verdash",lvl:3,note:"Aussi abattage+artisanat"},{n:"Robinquill",lvl:3,note:"Généraliste"},{n:"Lifmunk",lvl:3,note:"Compact et efficace"},{n:"Tanzee",lvl:2,note:"Singe polyvalent"},{n:"Celesdir",lvl:1,note:"Aussi Abattage Lv4"}]},
  {icon:"🚚",name:"Transport",desc:"Transporte les objets entre les structures.",
   pals:[{n:"Gorirat",lvl:3,note:"Fort porteur"},{n:"Mossanda",lvl:2,note:"Grande capacité"},{n:"Verdash",lvl:2,note:"Rapide"},{n:"Lunaris",lvl:1,note:"Aussi artisan+poids"},{n:"Cattiva",lvl:1,note:"Disponible dès le début"}]},
  {icon:"💊",name:"Pharmacie",desc:"Produit des médicaments dans l'atelier médical.",
   pals:[{n:"Lyleen",lvl:3,note:"Absolue meilleure"},{n:"Vaelet",lvl:3,note:"★ Herbe Pharmacie Lv3"},{n:"Felbat",lvl:3,note:"Chauve-souris"},{n:"Lovander",lvl:3,note:"Lézard rose"},{n:"Petallia",lvl:3,note:"Fleur-sirène"},{n:"Sibelyx",lvl:2,note:"Aussi Réfrigération"},{n:"Bristla",lvl:2,note:"Plante-hérisson"}]},
  {icon:"🐄",name:"Élevage",desc:"Produit des œufs et matériaux dans la Ferme.",
   pals:[{n:"Sibelyx",lvl:1,note:"Aussi Réfrigération"},{n:"Mozzarina",lvl:1,note:"Produit du lait"},{n:"Beegarde",lvl:1,note:"Produit du miel"},{n:"Caprity",lvl:1,note:"Produit des baies"},{n:"Braloha",lvl:0,note:"Accélère les œufs au Ranch (Partner Skill)"}]},
];

/* ─────────────────────────────────────────────────
   COMBOS D'ÉLEVAGE IMPORTANTS
   Source : palworld.gg/fr/pal/{nom} — Combinaisons uniques
───────────────────────────────────────────────── */
const BREEDING_COMBOS = [
  {p1:"Frostallion",  p2:"Jormuntide",    child:"Frostallion Noct", note:"Cheval de glace ténébreux"},
  {p1:"Suzaku",       p2:"Jormuntide",    child:"Suzaku Aqua",      note:"Phénix aquatique"},
  {p1:"Lyleen",       p2:"Menasting",     child:"Lyleen Noct",      note:"Reine des ténèbres"},
  {p1:"Helzephyr",    p2:"Grizzbolt",     child:"Helzephyr Lux",    note:"Oiseau des enfers électrique"},
  {p1:"Faleris",      p2:"Jormuntide",    child:"Faleris Aqua",     note:"Faucon aquatique"},
  {p1:"Blazamut",     p2:"Quivern",       child:"Blazamut Ryu",     note:"Dragon de lave"},
  {p1:"Paladius",     p2:"Lunaris",       child:"Selyne",           note:"Reine de lune légendaire"},
  {p1:"Vanwyrm",      p2:"Anubis",        child:"Faleris",          note:"Combo tour PIDF"},
  {p1:"Mossanda",     p2:"Rayhound",      child:"Grizzbolt",        note:"Panda électrique boss"},
  {p1:"Penking",      p2:"Rayhound",      child:"Penking Lux",      note:"Pingouin électrique"},
  {p1:"Dinossom",     p2:"Rayhound",      child:"Dinossom Lux",     note:"Dino électrique"},
  {p1:"Elphidran",    p2:"Surfent",       child:"Elphidran Aqua",   note:"Dragon aquatique"},
  {p1:"Mammorest",    p2:"Wumpo",         child:"Mammorest Cryst",  note:"Mammouth glacé"},
  {p1:"Blazehowl",    p2:"Kitsun",        child:"Blazehowl Noct",   note:"Lion nocturne"},
  {p1:"Whalaska",     p2:"Chillet Ignis", child:"Whalaska Ignis",   note:"Narval ardent"},
  {p1:"Lyleen",       p2:"Warsect",       child:"Warsect Terra",    note:"Scarabée terrestre"},
  {p1:"Quivern",      p2:"Broncherry",    child:"Quivern Botan",    note:"Dragon végétal"},
  {p1:"Pyrin",        p2:"Kitsun",        child:"Pyrin Noct",       note:"Qilin nocturne"},
  {p1:"Eikthyrdeer",  p2:"Digtoise",      child:"Eikthyrdeer Terra", note:"Cerf terrestre"},
  {p1:"Surfent",      p2:"Digtoise",      child:"Surfent Terra",    note:"Serpent terrestre"},
  {p1:"Vanwyrm",      p2:"Cawgnito",      child:"Vanwyrm Cryst",    note:"Oiseau glacé"},
  {p1:"Broncherry",   p2:"Jormuntide",    child:"Broncherry Aqua",  note:"Sauropode aquatique"},
  {p1:"Robinquill",   p2:"Digtoise",      child:"Robinquill Terra", note:"Robin terrestre"},
  {p1:"Gorirat",      p2:"Digtoise",      child:"Gorirat Terra",    note:"Gorille terrestre"},
  {p1:"Relaxaurus",   p2:"Sparkit",       child:"Relaxaurus Lux",   note:"Dino électrique cool"},
  {p1:"Katress",      p2:"Flambelle",     child:"Katress Ignis",    note:"Sorcière de feu"},
  {p1:"Fenglope",     p2:"Univolt",       child:"Fenglope Lux",     note:"Antilope éclair"},
  {p1:"Wumpo",        p2:"Lyleen",        child:"Wumpo Botan",      note:"Yéti végétal"},
  {p1:"Incineram",    p2:"Kitsun",        child:"Incineram Noct",   note:"Démon nocturne"},
  {p1:"Foxparks",     p2:"Jolthog",       child:"Foxparks Cryst",   note:"Renard glacé"},
  {p1:"Azurobe",      p2:"Cryolinx",      child:"Azurobe Cryst",    note:"Dragon de glace"},
  {p1:"Caprity",      p2:"Wixen",         child:"Caprity Noct",     note:"Chèvre nocturne"},
];

/* ─────────────────────────────────────────────────
   TIER LIST (source : palworld.gg/fr/tier-list)
───────────────────────────────────────────────── */
const TIER_LIST = {
  S:["Frostallion","Frostallion Noct","Jetragon","Paladius","Necromus","Bellanoir","Bellanoir Libero","Neptilius"],
  A:["Gildane","Anubis","Grizzbolt","Jormuntide","Jormuntide Ignis","Suzaku","Suzaku Aqua","Elphidran Aqua","Azurobe Cryst","Relaxaurus","Relaxaurus Lux","Mammorest","Mammorest Cryst","Broncherry Aqua","Faleris","Blazamut","Blazamut Ryu","Shadowbeak","Wumpo Botan","Vaelet","Lyleen","Lyleen Noct","Elizabee","Astegon","Verdash","Blazehowl Noct","Kingpaca","Kingpaca Cryst","Warsect","Warsect Terra","Quivern Botan","Helzephyr Lux","Petallia","Menasting","Menasting Terra","Orserk","Selyne","Knocklem","Xenogard","Xenolord","Silvegis","Whalaska Ignis","Faleris Aqua","Bastigor"],
  B:["Prunelia","Incineram Noct","Eikthyrdeer Terra","Digtoise","Gorirat","Gorirat Terra","Univolt","Lunaris","Pyrin","Pyrin Noct","Elphidran","Cryolinx","Surfent Terra","Azurobe","Reptyro","Reptyro Cryst","Maraith","Robinquill","Robinquill Terra","Kitsun","Vanwyrm Cryst","Dinossom","Dinossom Lux","Felbat","Broncherry","Sibelyx","Wixen","Wixen Noct","Lovander","Wumpo","Tombat","Helzephyr","Beakon","Ragnahawk","Bushi","Blazehowl","Katress","Quivern","Vanwyrm","Penking","Mossanda Lux","Whalaska"],
  C:["Nitewing","Galeclaw","Cinnamoth","Incineram","Grintale","Sweepa","Kitsun Noct","Rayhound","Chillet","Foxcicle","Eikthyrdeer","Reindrix","Arsox","Beegarde","Celaray"],
};

/* ─────────────────────────────────────────────────
   PASSIVES S → C
───────────────────────────────────────────────── */
const PASSIVES = [
  {name:"Légende",          tier:"S", effect:"ATK+20%, DEF+20%, Vitesse travail+20%",  note:"Passive ultime"},
  {name:"Seigneur Âmes",    tier:"S", effect:"ATK+20%",                               note:"Meilleure passive d'attaque"},
  {name:"Bête Musclée",     tier:"S", effect:"ATK+20%",                               note:"Alternative Seigneur Âmes"},
  {name:"Sans Peur",        tier:"S", effect:"DEF+20%",                               note:"Meilleure passive défense"},
  {name:"Âme de Travailleur",tier:"S",effect:"Vitesse de travail+50%",               note:"Essentielle pour la base"},
  {name:"Diligent",         tier:"S", effect:"Vitesse de travail+20%",                note:"Bonne alternative"},
  {name:"Artisan Sérieux",  tier:"S", effect:"Vitesse travail+50% (artisanat seul)",  note:"Spécifique artisanat"},
  {name:"Vaillant",         tier:"A", effect:"ATK+10%",                               note:"Bon si pas mieux"},
  {name:"Colosse",          tier:"A", effect:"HP+20%",                                note:"Survie améliorée"},
  {name:"Fortune",          tier:"A", effect:"Drops de qualité x2 parfois",           note:"Pour la collecte"},
  {name:"Rapide",           tier:"B", effect:"Vitesse travail+10%",                   note:"Bonus modeste"},
  {name:"Robuste",          tier:"B", effect:"HP+10%",                                note:"Un peu de résistance"},
  {name:"Paresseux",        tier:"C", effect:"Vitesse travail -30%",                  note:"À éliminer par l'élevage"},
  {name:"Stupide",          tier:"C", effect:"ATK-10%",                               note:"Négatif, à éviter"},
];

/* ─────────────────────────────────────────────────
   GUIDES DE PROGRESSION
───────────────────────────────────────────────── */
const GUIDES = [
  {phase:"🌱 Débutant (Niv 1-15)",title:"Premiers pas sur Palpagos",
   steps:["Capturer Lamball, Cattiva, Lifmunk","Construire Feu de camp, Boîte à Pal, Fournaise de fortune","Débloquer Scierie + Carrière au niveau 7","Statue de puissance (niv 6) pour augmenter la puissance de capture","Premiers donjons pour l'EXP","Battre Zoe & Grizzbolt (Tour Syndicat Rayne)"]},
  {phase:"⚔️ Intermédiaire (Niv 15-35)",title:"Construction de base et premières tours",
   steps:["Ranch (niv 19) — nécessite un Gâteau d'élevage","Fournaise améliorée (niv 34) pour le métal raffiné","Chaîne de production (niv 28)","Battre les 5 tours principales","Giga Sphère (niv 20) pour les captures difficiles","Élevage : viser Anubis et Lyleen"]},
  {phase:"🏆 Avancé (Niv 35-50)",title:"Optimisation et Pals endgame",
   steps:["Fournaise électrique (niv 44) et Lingots de Paluminium","Raids Bellanoir → Bellanoir Libero","Capturer les 4 Légendaires : Frostallion, Paladius, Necromus, Jetragon","Condensateur (niv 37) — fusionner 4× le même Pal","Viser passives S : Légende, Seigneur Âmes, Âme de Travailleur","Oil Rig (niv 55) pour les ressources endgame"]},
  {phase:"💎 Endgame (Niv 50-65)",title:"Feybreak, Terraria & Home Sweet Home",
   steps:["Explorer Feybreak Island — nouveaux Pals et boss Bjorn & Bastigor","Raid Xenolord (4× Fragments de Slab Xeno)","Tides of Terraria — Pêche, Arène, bases ennemies, Moon Lord","Home Sweet Home — Raid Hartalis, armures V1/V2, PvP","Neptilius — Arrosage Lv4, légendaire eau endgame","Niveau max 65, Hexolite (niv 56) — matériau ultime"]},
];

/* ─────────────────────────────────────────────────
   RAIDS & BOSS
───────────────────────────────────────────────── */
const RAIDS = [
  {name:"Bellanoir",        el:"dark",    lvl:30, req:"Slab de Bellanoir (4× Fragments)",       reward:"Œuf Sombre Immense"},
  {name:"Bellanoir Libero", el:"dark",    lvl:40, req:"Slab condensé de Bellanoir",             reward:"Œuf Sombre Immense (puissant)"},
  {name:"Blazamut Ryu",     el:"fire",    lvl:50, req:"Slab de Blazamut Ryu",                   reward:"Œuf Basaltique Immense"},
  {name:"Xenolord",         el:"dark",    lvl:60, req:"Slab Xeno (4× Fragments de donjon)",     reward:"Œuf Xeno Immense"},
  {name:"Moon Lord",        el:"water",   lvl:60, req:"Sceau Céleste (collab Terraria)",         reward:"Équipements Terraria endgame", note:"Tides of Terraria"},
  {name:"Hartalis",         el:"neutral", lvl:65, req:"Slab Hartalis (Fragments rares)",         reward:"Armure V1/V2 Légendaire", note:"Home Sweet Home"},
];

const TOURS = [
  {name:"Zoe & Grizzbolt",     lvl:15, el:"electric", tips:"Pals Terre. Derrière les piliers.", unlock:"Expédition Verdant Hollow"},
  {name:"Lily & Lyleen",       lvl:30, el:"grass",    tips:"Pals Feu. Périodes de rechargement.", unlock:"Expédition Moonlit Forest"},
  {name:"Axel & Orserk",       lvl:45, el:"electric", tips:"Pals Terre + Glace. Attention AoE.", unlock:"Expédition Volcanic Cavern"},
  {name:"Marcus & Faleris",    lvl:40, el:"fire",     tips:"Pals Eau. Gardez la distance.", unlock:"Expédition Desiccated Desert"},
  {name:"Victor & Shadowbeak", lvl:45, el:"dark",     tips:"Pals Dragon. Le plus dangereux.", unlock:"Expédition Ruined Fortress City"},
  {name:"Saya & Selyne",       lvl:50, el:"neutral",  tips:"Sakurajima — Pals Combat + Ténèbres.", unlock:"Expédition Sakurajima"},
  {name:"Bjorn & Bastigor",    lvl:60, el:"ice",      tips:"Feybreak — Pals Feu. Nécessite Bounty Tokens.", unlock:"Expédition Feybreak"},
];

const LEGENDAIRES = [
  {name:"Frostallion",  el:"ice",    loc:"Sommet des neiges éternelles",           note:"Meilleure monture volante"},
  {name:"Paladius",     el:"neutral",loc:"Plaines saintes (nord des Dunes)",        note:"Partage le spawn avec Necromus"},
  {name:"Necromus",     el:"dark",   loc:"Désert des âmes (nord des Dunes)",        note:"Partage le spawn avec Paladius"},
  {name:"Jetragon",     el:"dragon", loc:"Pic du Dragon (Île Volcanique)",          note:"Monture volante la plus rapide — sprint 3300"},
  {name:"Neptilius",    el:"water",  loc:"Eaux profondes (endgame)",                note:"★ NOUVEAU — Arrosage Lv4, monture nautique"},
];
