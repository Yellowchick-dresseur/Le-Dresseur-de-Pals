/* =============================================
   BREEDING DATA
============================================= */
const POWER_RANKS = {};
// Rempli automatiquement depuis PALS

const COMBOS = [
  {parents:['Caprity','Beegarde'],child:'Anubis',tags:['travail'],note:'Combo star. Anubis Travaux manuels Lv.4 + Extraction Lv.3. Indispensable.'},
  {parents:['Mossanda','Petallia'],child:'Lyleen',tags:['travail'],note:'Prindame Semence Lv.3 + Pharmacie Lv.3. La meilleure fermière-médecin.'},
  {parents:['Relaxaurus','Sparkit'],child:'Orserk',tags:['travail','combat'],note:'Horranos Génération d\'énergie Lv.4. Combo fixe unique. Meilleure source d\'énergie.'},
  {parents:['Penking','Bushi'],child:'Anubis',tags:['travail'],note:'Alternative pour Anubis sans avoir Bosquette ou Mousquebeille.'},
  {parents:['Vanwyrm','Anubis'],child:'Faleris',tags:['travail','monture'],note:'Phénystion Allumage+Transport Lv.3 + monture volante.'},
  {parents:['Jormuntide','Aridor'],child:'Jormagma',tags:['travail'],note:'Combo fixe. Allumage Lv.4 + variante Feu du Jormuncet.'},
  {parents:['Surfent','Surfent'],child:'Elphidran Aqua',tags:['travail','monture'],note:'Arrosage Lv.3 + monture volante. Combo fixe.'},
  {parents:['Direhowl','Foxcicle'],child:'Cryolinx',tags:['combat'],note:'Névéffroi Glace Lv.3, excellent combattant défensif.'},
  {parents:['Incineram','Maraith'],child:'Helzephyr',tags:['combat','monture'],note:'Busartar Transport Lv.4, monture volante des ténèbres.'},
  {parents:['Blazamut','Reptyro'],child:'Blazamut Ryu',tags:['combat'],note:'Blazamut Ryu Allumage Lv.4 + Extraction Lv.3. Version améliorée.'},
  {parents:['Grizzbolt','Relaxaurus'],child:'Orserk',tags:['combat','travail'],note:'Alternative pour Horranos via Grizzélek (boss Tour Rayne).'},
  {parents:['Lupouvante','Galeclaw'],child:'Nitewing',tags:['monture'],note:'Ombrapace 1ère monture volante viable.'},
  {parents:['Univolt','Foxcicle'],child:'Pyrin Noct',tags:['monture'],note:'Pyrin Noct Feu+Ténèbres, monture terrestre rapide.'},
  {parents:['Nutilope','Eikthyrdeer'],child:'Kingpaca',tags:['monture','travail'],note:'Roalpaga Transport Lv.4 + Collecte Lv.3.'},
  {parents:['Vanwyrm','Beakon'],child:'Helzephyr',tags:['monture'],note:'Busartar Transport Lv.4, monture volante pour le transport.'},
  {parents:['Kitsun','Univolt'],child:'Pyrin',tags:['monture'],note:'Pyrin monture rapide immunisée à la chaleur.'},
  {parents:['Necromus','Paladius'],child:'Frostallion Noct',tags:['legendaire'],note:'Combo fixe unique. Galobscur Glace+Ténèbres légendaire.'},
  {parents:['Jormuntide','Lyleen'],child:'Lyleen Noct',tags:['legendaire','travail'],note:'Nébulesse Herbe+Ténèbres, Semence Lv.3.'},
  {parents:['Blazamut','Vanwyrm'],child:'Faleris',tags:['legendaire','monture'],note:'Phénystion via puissance — monture volante endgame.'},
  {parents:['Mossanda','Katress'],child:'Wixen',tags:['travail'],note:'Lumiage artisan Lv.3 polyvalent, excellent pour les ateliers.'},
  {parents:['Foxcicle','Arsox'],child:'Blazehowl',tags:['travail'],note:'Mantilave Allumage Lv.3 + Abattage Lv.2.'},
  {parents:['Mammousset','Digtoise'],child:'Blazamut',tags:['travail'],note:'Route pour Belzérupt via les Pals de terrain.'},
];

const PASSIVES = [
  {name:'Legend',tier:'S',effect:'+20% ATQ, +20% DEF, +15% Vitesse',note:'La passive ultime. Uniquement sur les Pals légendaires naturellement.'},
  {name:'Musclehead',tier:'S',effect:'+30% ATQ',note:'Meilleur boost ATQ pur. Idéale pour Anubis, Grizzbolt, Jetragon.'},
  {name:'Ferocious',tier:'S',effect:'+20% ATQ',note:'Excellent boost d\'attaque plus accessible que Musclehead.'},
  {name:'Lucky',tier:'S',effect:'+15% ATQ, +15% Vitesse de travail',note:'Double boost rare. Uniquement sur les Lucky Pals (brillants).'},
  {name:'Artisan',tier:'S',effect:'+50% Vitesse de travail',note:'Indispensable pour tout Pal de base. À combiner avec Work Slave.'},
  {name:'Work Slave',tier:'A',effect:'-30% ATQ, +30% Vitesse de travail',note:'Parfait pour les Pals dédiés au travail. Jamais sur des combattants.'},
  {name:'Swift',tier:'A',effect:'+30% Vitesse de déplacement',note:'Excellent pour les montures. Combiné avec Legend = imbattable.'},
  {name:'Brave',tier:'A',effect:'+10% ATQ contre humains',note:'Utile pour les raids Oil Rig. Spécifique aux humains.'},
  {name:'Vanguard',tier:'A',effect:'+10% ATQ pour le joueur',note:'Passive de soutien qui booste le joueur. À combiner en équipe.'},
  {name:'Stronghold Strategist',tier:'A',effect:'+10% DEF pour tous les Pals en base',note:'Idéale pour les Pals de base face aux raids.'},
  {name:'Serious',tier:'B',effect:'+10% ATQ, +10% DEF, +10% HP',note:'Passive polyvalente. Bonne alternative en attendant Legend.'},
  {name:'Runner',tier:'B',effect:'+20% Vitesse de déplacement',note:'Alternative à Swift pour les montures.'},
  {name:'Damp Proof',tier:'B',effect:'-10% dégâts eau reçus',note:'Résistance eau utile en zones côtières.'},
  {name:'Flame Resistant',tier:'B',effect:'-10% dégâts feu reçus',note:'Résistance feu utile en zone volcanique.'},
  {name:'Nimble',tier:'B',effect:'+10% Vitesse de déplacement',note:'Petit bonus de mobilité. Utile sur les montures terrestres.'},
  {name:'Conceited',tier:'C',effect:'+10% ATQ, -10% DEF',note:'Échange défense contre attaque. Risqué.'},
  {name:'Coward',tier:'C',effect:'+10% DEF, -10% ATQ',note:'Échange attaque contre défense. À éviter sur les combattants.'},
];

/* =============================================
   TECH TREE DATA
============================================= */
const TECH_TREE = [
  {lvl:1,pts:1,items:[
    {name:'Pierre Pal',type:'outil',icon:'🪨',recipe:'1× Bois, 5× Pierre',desc:'Outil de base pour frapper les rochers.'},
    {name:'Hache en pierre',type:'outil',icon:'🪓',recipe:'5× Bois, 5× Pierre',desc:'Pour couper les premiers arbres.'},
    {name:'Feu de camp',type:'structure',icon:'🔥',recipe:'10× Bois',desc:'Source de chaleur et de cuisson basique.'},
    {name:'Sphère Pal',type:'outil',icon:'🟢',recipe:'3× Bois, 3× Pierre, 1× Paldium',desc:'Pour capturer tes premiers Pals.'},
  ]},
  {lvl:2,pts:1,items:[
    {name:'Palbox',type:'structure',icon:'📦',recipe:'8× Bois, 3× Paldium',desc:'Fondation de ta base, stocke tes Pals.'},
    {name:'Coffre en bois',type:'structure',icon:'📪',recipe:'15× Bois',desc:'Stockage de base.'},
    {name:'Piolet en pierre',type:'outil',icon:'⛏️',recipe:'5× Bois, 10× Pierre',desc:'Minage de pierres basique.'},
    {name:'Lit primitif',type:'structure',icon:'🛏️',recipe:'20× Bois, 10× Fibre',desc:'Passer la nuit.'},
  ]},
  {lvl:3,pts:2,items:[
    {name:'Site de coupe',type:'structure',icon:'🌲',recipe:'50× Bois',desc:'Poste de travail pour les Pals bûcherons.'},
    {name:'Plantation de baies',type:'structure',icon:'🫐',recipe:'20× Bois, 10× Pierre',desc:'Produit des baies automatiquement.'},
    {name:'Boîte à nourriture',type:'structure',icon:'🍱',recipe:'15× Bois',desc:'Distribue la nourriture à tes Pals.'},
    {name:'Arc en bois',type:'arme',icon:'🏹',recipe:'15× Bois, 10× Pierre, 5× Fibre',desc:'Première arme à distance.'},
  ]},
  {lvl:4,pts:2,items:[
    {name:'Atelier primitif',type:'structure',icon:'🔨',recipe:'50× Bois',desc:'Permet le craft d\'objets avancés.'},
    {name:'Site de pierre',type:'structure',icon:'⛏️',recipe:'30× Bois, 30× Pierre',desc:'Poste pour Pals mineurs.'},
    {name:'Sphère Méga',type:'outil',icon:'🔵',recipe:'5× Pierre, 5× Paldium, 1× Lingot',desc:'Sphère améliorée, meilleur taux de capture.'},
    {name:'Casque en pierre',type:'armure',icon:'⛑️',recipe:'10× Pierre, 5× Bois',desc:'Protection de base pour la tête.'},
  ]},
  {lvl:5,pts:2,items:[
    {name:'Fonderie primitive',type:'structure',icon:'⚗️',recipe:'20× Bois, 50× Pierre, 3× Flammorgan',desc:'Produit des lingots de métal.'},
    {name:'Armure en cuir',type:'armure',icon:'🧥',recipe:'10× Cuir, 5× Fibre',desc:'Armure basique en cuir.'},
    {name:'Épée en métal',type:'arme',icon:'⚔️',recipe:'10× Lingot, 5× Bois',desc:'Première arme de mêlée en métal.'},
    {name:'Piolet en métal',type:'outil',icon:'⛏️',recipe:'5× Lingot, 5× Bois',desc:'Minage amélioré.'},
  ]},
  {lvl:7,pts:1,items:[
    {name:'Incubateur à œufs',type:'ancien',icon:'🥚',recipe:'10× Paldium, 5× Tissu, 30× Pierre, 2× Pièces Anc.',desc:'PRIORITÉ. Permet d\'incuber les œufs de Pal.'},
  ]},
  {lvl:8,pts:2,items:[
    {name:'Coffre en métal',type:'structure',icon:'🗃️',recipe:'20× Lingot',desc:'Stockage amélioré.'},
    {name:'Forge primitive',type:'structure',icon:'⚒️',recipe:'20× Lingot, 50× Pierre, 5× Bois',desc:'Craft d\'équipements en métal.'},
    {name:'Marmite de cuisson',type:'structure',icon:'🍳',recipe:'20× Lingot, 15× Bois',desc:'Cuisine avancée, requis pour le Gâteau.'},
    {name:'Ferme de baies',type:'structure',icon:'🌾',recipe:'35× Bois, 35× Pierre',desc:'Ferme de production de baies.'},
  ]},
  {lvl:10,pts:2,items:[
    {name:'Petit sac d\'aliments',type:'ancien',icon:'🎒',recipe:'5× Bois, 10× Fibre, 3× Cuir',desc:'Augmente la capacité d\'aliments transportés.'},
    {name:'Ferme à blé',type:'structure',icon:'🌾',recipe:'35× Bois, 35× Pierre',desc:'Produit de la farine pour le Gâteau.'},
    {name:'Atelier de médecine',type:'structure',icon:'💊',recipe:'50× Bois, 30× Lingot, 30× Paldium',desc:'Produit des médicaments pour tes Pals.'},
  ]},
  {lvl:12,pts:2,items:[
    {name:'Grappin',type:'outil',icon:'🪝',recipe:'10× Paldium, 10× Lingot, 30× Fibre, 1× Pièce Anc.',desc:'Mobilité accrue, accrocher les murs.'},
    {name:'Pistolet à un coup',type:'arme',icon:'🔫',recipe:'50× Lingot, 10× Pierre, 5× Paldium',desc:'Première arme à feu.'},
    {name:'Armure en métal',type:'armure',icon:'🦺',recipe:'30× Lingot, 10× Cuir',desc:'Armure de métal robuste.'},
  ]},
  {lvl:14,pts:1,items:[
    {name:'Condenseur d\'essence Pal',type:'ancien',icon:'💧',recipe:'20× Paldium, 20× Lingot, 5× Pièces Anc.',desc:'PRIORITÉ. Améliore les stats de tes Pals (4 fusions = +20%).'},
  ]},
  {lvl:15,pts:2,items:[
    {name:'Site minier',type:'structure',icon:'⛏️',recipe:'50× Pierre, 25× Lingot, 20× Paldium',desc:'Extraction automatique de minerai.'},
    {name:'Selle Nitewing',type:'monture',icon:'🦅',recipe:'20× Cuir, 15× Fibre, 10× Paldium',desc:'Première monture volante.'},
    {name:'Selle Direhowl',type:'monture',icon:'🐺',recipe:'15× Cuir, 10× Fibre, 5× Paldium',desc:'Monture terrestre rapide.'},
    {name:'Ferme à laine',type:'structure',icon:'🐑',recipe:'50× Bois, 20× Pierre',desc:'Produit de la laine pour le tissu.'},
  ]},
  {lvl:17,pts:2,items:[
    {name:'Harnais de Foxparks',type:'monture',icon:'🦊',recipe:'10× Cuir, 5× Flammorgan, 5× Paldium',desc:'Équipe Foxparks comme lance-flammes.'},
    {name:'Ferme d\'élevage',type:'structure',icon:'🐄',recipe:'100× Bois, 20× Pierre, 50× Fibre',desc:'Produit du lait, miel, œufs et laine.'},
    {name:'Selle Eikthyrdeer',type:'monture',icon:'🦌',recipe:'20× Cuir, 20× Fibre, 10× Paldium',desc:'Monture terrestre solide.'},
  ]},
  {lvl:19,pts:3,items:[
    {name:'Ferme d\'élevage (Reproduction)',type:'structure',icon:'💞',recipe:'100× Bois, 20× Pierre, 50× Fibre',desc:'PRIORITÉ. Déblocage du breeding (nécessite Gâteau).'},
    {name:'Fusil semi-automatique',type:'arme',icon:'🔫',recipe:'80× Lingot, 10× Bois, 5× Paldium',desc:'Arme à feu puissante.'},
    {name:'Armure de combat',type:'armure',icon:'🛡️',recipe:'50× Lingot, 20× Cuir, 10× Fibre',desc:'Armure de combat intermédiaire.'},
  ]},
  {lvl:22,pts:3,items:[
    {name:'Fonderie avancée',type:'structure',icon:'🏭',recipe:'100× Lingot, 50× Pierre, 10× Engrenage',desc:'Produit des lingots raffinés.'},
    {name:'Selle Mossanda',type:'monture',icon:'🐼',recipe:'30× Cuir, 30× Fibre, 20× Paldium',desc:'Grand panda comme monture.'},
    {name:'Selle Univolt',type:'monture',icon:'⚡',recipe:'30× Cuir, 30× Lingot, 20× Paldium',desc:'Monture électrique rapide.'},
  ]},
  {lvl:25,pts:3,items:[
    {name:'Usine d\'assemblage',type:'structure',icon:'🏭',recipe:'50× Lingot Raffiné, 50× Lingot, 10× Engrenage',desc:'Fabrique d\'objets avancés automatisée.'},
    {name:'Selle Vanwyrm',type:'monture',icon:'🐉',recipe:'30× Cuir, 30× Lingot Raf., 20× Paldium, 20× Flammorgan',desc:'Monture volante de feu.'},
    {name:'Fusil automatique',type:'arme',icon:'🔫',recipe:'100× Lingot Raf., 20× Bois, 10× Paldium',desc:'Arme automatique puissante.'},
  ]},
  {lvl:30,pts:3,items:[
    {name:'Selle Beakon',type:'monture',icon:'⚡',recipe:'30× Cuir, 30× Lingot Raf., 30× Organe électrique, 20× Paldium',desc:'Monture volante électrique.'},
    {name:'Selle Kitsun',type:'monture',icon:'🦊',recipe:'30× Cuir, 30× Lingot Raf., 20× Paldium, 20× Flammorgan',desc:'Monture immunisée chaleur.'},
    {name:'Lance-roquettes',type:'arme',icon:'🚀',recipe:'100× Lingot Raf., 50× Paldium, 20× Fibre de carbone',desc:'Arme lourde explosive.'},
  ]},
  {lvl:35,pts:3,items:[
    {name:'Selle Ragnahawk',type:'monture',icon:'🦅',recipe:'50× Cuir, 60× Lingot Raf., 50× Flammorgan, 30× Paldium',desc:'Faucon de feu comme monture rapide.'},
    {name:'Selle Elphidran',type:'monture',icon:'🐲',recipe:'30× Cuir, 50× Lingot Raf., 20× Organe dragon, 30× Paldium',desc:'Dragon comme monture volante.'},
    {name:'Sniper',type:'arme',icon:'🎯',recipe:'100× Lingot Raf., 30× Bois, 10× Paldium',desc:'Longue portée, dégâts massifs.'},
    {name:'Armure de combat avancée',type:'armure',icon:'🛡️',recipe:'80× Lingot Raf., 30× Cuir, 20× Fibre',desc:'Protection intermédiaire-haute.'},
  ]},
  {lvl:40,pts:4,items:[
    {name:'Selle Suzaku',type:'monture',icon:'🔥',recipe:'50× Cuir, 80× Lingot Raf., 50× Flammorgan, 30× Paldium',desc:'Phénix comme monture ultra-rapide.'},
    {name:'Selle Quivern',type:'monture',icon:'🐉',recipe:'50× Cuir, 60× Lingot Raf., 30× Paldium, 30× Organe dragon',desc:'Dragon blanc agile.'},
    {name:'Selle Helzephyr',type:'monture',icon:'🌑',recipe:'30× Cuir, 10× Tissu, 30× Lingot Raf., 20× Organe électrique',desc:'Dragon de l\'ombre, Transport Lv.4.'},
  ]},
  {lvl:45,pts:5,items:[
    {name:'Selle Faleris',type:'monture',icon:'🔥',recipe:'30× Cuir, 10× Tissu, 30× Lingot Raf., 25× Flammorgan, 30× Paldium',desc:'Rapace de feu, double Lv.3.'},
    {name:'Selle Astegon',type:'monture',icon:'⭐',recipe:'80× Lingot Raf., 30× Paldium, 50× Organe sombre',desc:'Dragon cosmique, Extraction Lv.4.'},
    {name:'Armure des anciens Lv.1',type:'armure',icon:'🏺',recipe:'30× Lingot Raf., 20× Quartz pur, 10× Fibre de carbone',desc:'Armure de haute technologie.'},
  ]},
  {lvl:50,pts:5,items:[
    {name:'Selle Jetragon',type:'monture',icon:'🚀',recipe:'100× Lingot Raf., 50× Paldium, 50× Organe dragon',desc:'Monture la plus rapide du jeu.'},
    {name:'Lance-missiles Jetragon',type:'arme',icon:'🚀',recipe:'200× Lingot Raf., 50× Paldium, 30× Fibre de carbone',desc:'Arme endgame dévastatrice.'},
    {name:'Armure des anciens Lv.2',type:'armure',icon:'🏺',recipe:'50× Lingot Raf., 30× Quartz pur, 20× Fibre de carbone',desc:'Protection maximale du jeu.'},
  ]},
];

const RECIPES = [
  {name:'Gâteau (Cake)',icon:'🎂',station:'Marmite de cuisson',ing:[{n:'Farine de blé',q:5},{n:'Baies rouges',q:8},{n:'Lait',q:7},{n:'Œuf',q:8},{n:'Miel',q:2}],note:'PRIORITÉ. Requis pour lancer le breeding.'},
  {name:'Lingot de métal',icon:'⚙️',station:'Fonderie primitive',ing:[{n:'Minerai de fer',q:2}],note:'Matériau de base pour tout le mid-game.'},
  {name:'Lingot raffiné',icon:'🔩',station:'Fonderie avancée',ing:[{n:'Lingot de métal',q:2}],note:'Matériau principal du late-game.'},
  {name:'Fibre de carbone',icon:'⬛',station:'Usine d\'assemblage',ing:[{n:'Charbon',q:2},{n:'Lingot raffiné',q:2}],note:'Requis pour l\'équipement endgame.'},
  {name:'Tissu (Cloth)',icon:'🧶',station:'Artisanat',ing:[{n:'Laine',q:2}],note:'Requis pour certaines selles et armures.'},
  {name:'Gunpowder',icon:'💣',station:'Usine de munitions',ing:[{n:'Charbon',q:1},{n:'Nitre',q:1}],note:'Pour les munitions et grenades.'},
  {name:'Sphère Méga Noire',icon:'🔵',station:'Usine de munitions',ing:[{n:'Lingot raffiné',q:3},{n:'Paldium',q:2},{n:'Fibre de carbone',q:1}],note:'Meilleure sphère de capture standard.'},
  {name:'Médicament de Pal',icon:'💊',station:'Atelier de médecine',ing:[{n:'Champignon rouge',q:5},{n:'Poudre d\'iceberg',q:5}],note:'Soigne les Pals malades ou blessés.'},
  {name:'Quartz pur',icon:'💎',station:'Fonderie (zone froide)',ing:[{n:'Minerai de quartz',q:2}],note:'Requis pour l\'armure des anciens Lv.1+.'},
  {name:'Engrenage primitif',icon:'⚙️',station:'Forge primitive',ing:[{n:'Lingot',q:5},{n:'Pierre',q:10}],note:'Requis pour les structures d\'usine.'},
  {name:'Organe électrique',icon:'⚡',station:'Drops de Pals',ing:[{n:'Sparkit, Univolt, Beakon, Grizzbolt',q:1}],note:'Pour selles et structures électriques.'},
  {name:'Flammorgan',icon:'🔥',station:'Drops de Pals',ing:[{n:'Foxparks, Arsox, Vanwyrm, Suzaku...',q:1}],note:'Pour selles et structures de feu.'},
];

const POSTES = [
  {icon:'🔥',name:'Allumage de feu',desc:'Alimente fonderies, marmites et fourneaux. Indispensable pour traiter les minerais et cuisiner.',pals:[{n:'Bushi',lvl:3,note:'Meilleur early→mid'},{n:'Blazehowl',lvl:3,note:'Lion de lave'},{n:'Ragnahawk',lvl:3,note:'Monture aussi'},{n:'Reptyro',lvl:3,note:'Double Lv.3'},{n:'Blazamut',lvl:3,note:'Late game'},{n:'Bastigor',lvl:2,note:'Feybreak'}]},
  {icon:'💧',name:'Arrosage',desc:'Arrose les cultures. Crucial pour les fermes avancées.',pals:[{n:'Jormuntide',lvl:4,note:'Absolu meilleur'},{n:'Surfent',lvl:2,note:'Bon mid-game'},{n:'Azurobe',lvl:2,note:'Eau+Dragon'},{n:'Teafant',lvl:1,note:'Early game'},{n:'Pengullet',lvl:1,note:'Polyvalent'},{n:'Fuack',lvl:1,note:'Débutant'}]},
  {icon:'🌱',name:'Semence',desc:'Sème les graines. Vital pour la nourriture.',pals:[{n:'Lyleen',lvl:3,note:'Absolue meilleure'},{n:'Broncherry',lvl:3,note:'Aussi porteur'},{n:'Mossanda',lvl:2,note:'Transport aussi'},{n:'Elizabee',lvl:2,note:'Reine des abeilles'},{n:'Caprity',lvl:2,note:'Produit des baies'},{n:'Robinquill',lvl:1,note:'Polyvalent'}]},
  {icon:'⚡',name:'Génération d'énergie',desc:'Alimente les machines électriques.',pals:[{n:'Orserk',lvl:4,note:'Meilleur absolu'},{n:'Grizzbolt',lvl:3,note:'Boss de tour'},{n:'Beakon',lvl:3,note:'Monture aussi'},{n:'Starryon',lvl:3,note:'Feybreak'},{n:'Dazzi',lvl:2,note:'Polyvalent'},{n:'Univolt',lvl:2,note:'Monture rapide'}]},
  {icon:'🔨',name:'Travaux manuels',desc:'Fabrique des objets dans tous les ateliers.',pals:[{n:'Anubis',lvl:4,note:'Meilleur absolu'},{n:'Penking',lvl:2,note:'Aussi mineur'},{n:'Elizabee',lvl:2,note:'Reine abeilles'},{n:'Katress',lvl:2,note:'Sorcière'},{n:'Mossanda',lvl:2,note:'Grand panda'},{n:'Tanzee',lvl:1,note:'Early game'}]},
  {icon:'⛏️',name:'Extraction',desc:'Extrait minerai, charbon, soufre et autres ressources.',pals:[{n:'Astegon',lvl:4,note:'Meilleur absolu'},{n:'Bastigor',lvl:4,note:'Rival Feybreak'},{n:'Anubis',lvl:3,note:'Aussi artisan'},{n:'Blazamut',lvl:3,note:'Aussi allumeur'},{n:'Reptyro',lvl:3,note:'Double Lv.3'},{n:'Digtoise',lvl:2,note:'La foreuse'}]},
  {icon:'🌲',name:'Abattage',desc:'Abat les arbres pour produire du bois.',pals:[{n:'Wumpo',lvl:3,note:'Le yéti géant'},{n:'Bushi',lvl:3,note:'Aussi allumeur'},{n:'Cryolinx',lvl:3,note:'Aussi refroidisseur'},{n:'Gorirat',lvl:2,note:'Fort porteur'},{n:'Eikthyrdeer',lvl:2,note:'1ère monture'},{n:'Mossanda',lvl:2,note:'Aussi planteur'}]},
  {icon:'❄️',name:'Réfrigération',desc:'Refroidit la nourriture après cuisson.',pals:[{n:'Frostallion',lvl:4,note:'Légendaire'},{n:'Wumpo',lvl:2,note:'Le yéti'},{n:'Cryolinx',lvl:3,note:'Expert froid'},{n:'Silvegis',lvl:3,note:'Feybreak'},{n:'Foxcicle',lvl:2,note:'Renard de glace'},{n:'Sweepa',lvl:2,note:'Ours polaire'}]},
  {icon:'🚚',name:'Transport',desc:'Déplace automatiquement les ressources entre structures.',pals:[{n:'Wumpo',lvl:4,note:'Transport absolu'},{n:'Kingpaca',lvl:4,note:'Roi des porteurs'},{n:'Helzephyr',lvl:4,note:'Meilleur volant'},{n:'Vanwyrm',lvl:3,note:'Dragon porteur'},{n:'Mossanda',lvl:3,note:'Gros panda'},{n:'Gorirat',lvl:3,note:'Gorille fort'}]},
  {icon:'🐄',name:'Élevage',desc:'Produit des ressources passives : laine, lait, œufs, miel, or…',pals:[{n:'Mozzarina',lvl:1,note:'Lait frais'},{n:'Beegarde',lvl:1,note:'Miel (attention!)'},{n:'Chikipi',lvl:1,note:'Œufs'},{n:'Melpaca',lvl:1,note:'Laine premium'},{n:'Lamball',lvl:1,note:'Laine basique'},{n:'Mau',lvl:1,note:'Pièces d\'or'}]},
  {icon:'💊',name:'Pharmacie',desc:'Produit des médicaments dans l\'atelier médical.',pals:[{n:'Lyleen',lvl:3,note:'Absolue meilleure'},{n:'Felbat',lvl:3,note:'Chauve-souris'},{n:'Lovander',lvl:3,note:'Lézard rose'},{n:'Petallia',lvl:3,note:'Fleur-sirène'},{n:'Bristla',lvl:2,note:'Plante-hérisson'},{n:'Robinquill',lvl:1,note:'Polyvalent'}]},
  {icon:'🌾',name:'Collecte',desc:'Collecte automatiquement les ressources sur le terrain.',pals:[{n:'Kingpaca',lvl:3,note:'Meilleur collecteur'},{n:'Grintale',lvl:2,note:'Grand félin'},{n:'Nitewing',lvl:2,note:'Grand oiseau'},{n:'Elizabee',lvl:2,note:'Reine abeilles'},{n:'Robinquill',lvl:2,note:'Robin des bois'},{n:'Galeclaw',lvl:2,note:'Oiseau de vent'}]},
];

/* =============================================
   GUIDES DATA
============================================= */
const TOURS = [
  {num:1,name:'Rayne Syndicate',boss:'Zoe & Grizzbolt',el:'Électrique',lvl:'~Niv.20',color:'#FFD000',loc:'Sud-ouest de la carte',desc:'Premier boss de tour. Grizzbolt est vulnérable au sol et au feu. Combat avec phases de tir en éventail dévastateur.',tips:['Pals Terre : Torforet, Pécarush, Anubis contre Grizzbolt','Évite les tirs en éventail du minigun électrique','Sphères Méga ou Méga noires pour tenter la capture','Niv. 20 recommandé, armure en métal minimum'],reward:'4 Points Tech Ancienne • Plans armes militaires • Chance de capturer Grizzbolt'},
  {num:2,name:'Free Pal Alliance',boss:'Lily & Lyleen',el:'Herbe',lvl:'~Niv.30',color:'#00E34A',loc:'Nord-ouest de la carte',desc:'Lyleen est puissante mais vulnérable au feu. Elle guérit en combat — sois agressif et interromps ses soins !',tips:['DPS feu pur : Kitsun (Aridor), Mantilave Allumage Lv.3','Détruis immédiatement les plantes invoquées (elles soignent)','Interromps ses animations de soin avec des attaques continues','Armure de combat + fusil recommandés'],reward:'4 Points Tech Ancienne • Plans armure de combat avancée'},
  {num:3,name:'Brothers of the Eternal Pyre',boss:'Victor & Shadowbeak',el:'Ombre',lvl:'~Niv.40',color:'#8B2FFF',loc:'Nord de la carte',desc:'Shadowbeak est l\'un des boss les plus dangereux. Très mobile et agressif. Vulnérable au dragon.',tips:['Pals Dragon : Draphin, Elphidran Aqua pour les dégâts','Ne reste jamais immobile — Shadowbeak cible les zones fixes','Fusil sniper ou arme de rang 4+ pour le joueur','Reste en mouvement constant et utilise les rochers comme couverture'],reward:'4 Points Tech Ancienne • Plans armes rares • Blueprints équipement'},
  {num:4,name:'PIDF',boss:'Marcus & Faleris',el:'Feu',lvl:'~Niv.45',color:'#FF5533',loc:'Est de la carte (île)',desc:'Faleris est très mobile et attaque en piqué avec des flammes dévastatrices. L\'eau est ta meilleure alliée.',tips:['Pals eau de haut niveau : Jormuncet Lv.4, Surfent, Azurobe','Tir depuis le sol — Faleris plonge à angles prévisibles','Attention aux zones de feu persistantes après les piqués','Armure de combat avancée + fusil automatique minimum'],reward:'4 Points Tech Ancienne • Plans équipement endgame'},
  {num:5,name:'PAL Moonflowers',boss:'Axel & Orserk',el:'Dragon + Électrique',lvl:'~Niv.50',color:'#00BBFF',loc:'Nord-est de la carte',desc:'Boss final des tours. Orserk cumule deux éléments redoutables. Vulnérable à la glace avant tout.',tips:['Laponir ou Névéffroi pour les dégâts glace','Orserk est très rapide — garde la distance maximale','Lance-missiles ou Sniper rang 4+ indispensables','Prépare des médicaments — le combat est long'],reward:'5 Points Tech Ancienne • Équipement légendaire • Meilleur drop du jeu'},
];

const RAIDS = [
  {name:'Bellanoir',diff:'normal',mat:'Fragments de Slab × 4',src:'Drops des boss de tours et donjons endgame',desc:'Premier raid de base. Bellanoir invoque des adds sombres. Priorité absolue : éliminer les adds avant de frapper le boss.',compo:[{pal:'Lyleen',role:'Heal'},{pal:'Grizzbolt',role:'DPS'},{pal:'Anubis',role:'Tank'},{pal:'Suzaku',role:'DPS feu'}],tips:['Construis l\'Autel de combat en base avant de commencer','Les Pals de ta base participent à la défense — mets tes meilleurs','Priorité aux adds sombres invoqués, ils peuvent déborder la base'],reward:'Armures rares • Sphères légendaires • Matériaux endgame'},
  {name:'Bellanoir Libero',diff:'hard',mat:'Fragments de Slab condensés × 4',src:'Donjons endgame (niv. 40+)',desc:'Version Libero : +50% PV, adds plus fréquents, dégâts doublés. Quasi impossible en solo. Coordination de groupe indispensable.',compo:[{pal:'Jetragon',role:'DPS principal'},{pal:'Lyleen',role:'Heal'},{pal:'Orserk',role:'DPS élec.'},{pal:'Wumpo',role:'Tank'}],tips:['Group de 3-4 joueurs fortement recommandé','Chaque joueur doit avoir des Pals avec Legend passive','Protège ta base — les adds peuvent détruire tes structures','Reconstitue tes provisions avant le raid'],reward:'Sphères légendaires • Équipement rang 5 • Fragments rares'},
  {name:'Xenolord',diff:'extreme',mat:'Cristaux Xeno × 5',src:'Zones Feybreak exclusivement',desc:'Boss de raid Feybreak. Le plus difficile du jeu. Dragon cosmique aux attaques omni-directionnelles. Groupe de 4 joueurs max level recommandé.',compo:[{pal:'Jetragon',role:'DPS principal'},{pal:'Frostallion',role:'DPS glace'},{pal:'Lyleen',role:'Heal'},{pal:'Necromus',role:'DPS ombre'}],tips:['Tous les participants doivent être niveau 58+','Passive Legend sur tous tes Pals de combat','Xenolord a des phases de vulnérabilité — concentrez les DPS','Stocke 20+ médicaments avant le raid'],reward:'Équipement Xeno exclusif • Cristaux rares • 5% chance α Xenolord'},
  {name:'Oil Rig — Sakurajima',diff:'hard',mat:'Aucun requis',src:'Zone PvE persistante, accessible en vol',desc:'Pas un raid classique : deux plateformes pétrolières gardées par des élites PIDF. Zone de farm continue avec les meilleures récompenses du jeu.',compo:[{pal:'Jetragon',role:'Monture + DPS'},{pal:'Suzaku',role:'DPS aérien'},{pal:'Grizzbolt',role:'DPS électrique'},{pal:'Faleris',role:'Mobilité'}],tips:['Arrive avec Jetragon ou autre monture volante rapide','Immunité chaleur requise : Kitsun ou médicaments','Les gardes PIDF drop de l\'équipement rang 5 aléatoire','Respawn des gardes toutes les 20-30 min'],reward:'Composants avancés • Armes rang 5 • Fibre de carbone • Quartz pur'},
];

const LEGENDAIRES = [
  {name:'Jetragon',el:['dragon'],elColor:['#9B5BE0'],hp:140,atk:140,def:110,spd:3300,loc:'Pic du Dragon — nord-est de la carte principale. Toujours présent, respawn ~72h réel.',zone:'nord-est',diff:'⭐⭐⭐⭐⭐',passives:['Legend'],tips:['Sphères légendaires ou Méga noires recommandées','Affaiblis avec Laponir ou Névéffroi (dégâts glace)','Très mobile en vol — sniper ou arc endgame indispensable','Utilise les rochers comme couverture contre ses missiles','Recommandé niv. 55+ avec armure des anciens Lv.1']},
  {name:'Frostallion',el:['ice'],elColor:['#88DDFF'],hp:140,atk:130,def:130,spd:1350,loc:'Sommet des neiges éternelles — nord-ouest, zone extrêmement froide. Respawn ~72h réel.',zone:'nord-ouest',diff:'⭐⭐⭐⭐',passives:['Legend'],tips:['Immunité froid OBLIGATOIRE (Kitsun, Pyrin, ou médicaments)','Faiblesse feu : Suzaku, Blazamut, Blazehowl pour affaiblir','Ses sabots gèlent le sol — reste en mouvement constant','Plus accessible que Jetragon grâce à sa lenteur au sol','Recommandé niv. 50+ avec bonne armure']},
  {name:'Frostallion Noct',el:['ice','dark'],elColor:['#88DDFF','#8B2FFF'],hp:140,atk:140,def:130,spd:1400,loc:'Uniquement par élevage : Frostallion × Necromus. Combo fixe unique.',zone:'breeding',diff:'⭐⭐⭐⭐⭐',passives:['Legend'],tips:['Capture et élève les deux parents séparément d\'abord','Dominant en PvP (v0.7) grâce à Legend + bonus ombre','Ne spawn jamais naturellement dans le monde','Passives héritées des deux parents légendaires']},
  {name:'Paladius',el:['neutral'],elColor:['#E8E8E8'],hp:140,atk:130,def:140,spd:1000,loc:'Plaines saintes — centre-est. Souvent accompagné de Necromus.',zone:'centre-est',diff:'⭐⭐⭐⭐',passives:['Legend'],tips:['Vulnérable au sombre : Katress, Vanwyrm, Helzephyr','DEF record — combat long, prévois beaucoup de munitions','Capture-les ensemble : Paladius + Necromus = Frostallion Noct','Accessible niv. 45+ avec une bonne monture volante']},
  {name:'Necromus',el:['dark'],elColor:['#8B2FFF'],hp:140,atk:140,def:130,spd:1200,loc:'Désert des âmes — sud-est. Spawn proche de Paladius.',zone:'sud-est',diff:'⭐⭐⭐⭐',passives:['Legend'],tips:['Faiblesse neutre et dragon : Jetragon ou Elphidran','ATQ la plus élevée des deux — garde tes distances','Priorité si tu vises Frostallion Noct via breeding','Lance-missiles rang 4+ ou Sniper endgame recommandés']},
  {name:'Blazamut Ryu',el:['fire','ground'],elColor:['#FF5533','#C49A6C'],hp:145,atk:145,def:125,spd:550,loc:'Profondeurs volcaniques de Sakurajima. Respawn ~72h réel.',zone:'sakurajima',diff:'⭐⭐⭐⭐⭐',passives:['Legend','Allumage Lv.4'],tips:['Allumage Lv.4 — priorité absolue pour ta base','Immunité chaleur OBLIGATOIRE (Kitsun, Pyrin ou médicaments)','Faiblesse eau : Jormuncet Lv.4 pour affaiblir efficacement','Sniper ou Fusil automatique rang 5 recommandés','Le plus difficile des légendaires à atteindre géographiquement']},
];
