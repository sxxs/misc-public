const STAGES_PER_MISSION = 4;
const MISSIONS = [
  {title:'Ein kleiner Wortschatz',keys:'aeinst',newKeys:'A · E · I · N · S · T',description:'Sechs Tasten und vertraute Wörter.',instruction:'Lies erst das ganze Wort. Wiederkehrende Wörter dürfen sich wie ein vertrauter Weg anfühlen.',rounds:[
    ['eine tante isst eis','eine tante ist nett'],
    ['eine tante isst ananas','eine tante isst eis'],
    ['eine tasse ist nass','eine tante ist nett'],
    ['eine tante isst eis','eine tante isst ananas']
  ]},
  {title:'Tante, Eis und Idee',keys:'aeinstd',newKeys:'D',description:'Bekannte Wörter in neuen kleinen Sätzen.',instruction:'Achte auf die Wege für „die“, „das“ und „da“. Sie kommen mehrmals vor.',rounds:[
    ['die tante ist da','die tante isst eis'],
    ['das eis ist da','die tante isst das eis'],
    ['das ist eine idee','das ist deine idee'],
    ['die tante ist da','das eis ist da','die tante isst eis']
  ]},
  {title:'Malen und Lesen',keys:'aeinstdlmr',newKeys:'L · M · R',description:'Gleiche Satzmuster, neue Wörter.',instruction:'„Malt“ und „liest“ tauchen wieder auf. Finde für jedes Wort deinen Weg.',rounds:[
    ['die tante malt','der mann malt'],
    ['die tante liest','der mann liest'],
    ['meine tante malt ein tier','der mann liest'],
    ['der mann malt ein tier','die tante malt ein tier']
  ]},
  {title:'Rufen und Erzählen',keys:'aeinstdlmruf',newKeys:'U · F',description:'Wörter verändern sich, der Weg bleibt vertraut.',instruction:'Vergleiche „ruft“ und „rufst“. Der Anfang fühlt sich gleich an.',rounds:[
    ['die tante ruft','der mann ruft'],
    ['du rufst die tante','die tante ruft den mann'],
    ['du malst ein tier','die tante malt ein tier'],
    ['der mann ruft die tante','du rufst den mann']
  ]},
  {title:'Das Foto',keys:'aeinstdlmrufoj',newKeys:'O · J',description:'Eine kleine Geschichte rund um ein Foto.',instruction:'Das Wort „foto“ kommt oft zurück. Versuch, es als eine Bewegung zu tippen.',rounds:[
    ['ja das foto ist toll','das foto ist rot'],
    ['die tante findet ein foto','der mann findet das foto'],
    ['das rote foto ist toll','ja das foto ist toll'],
    ['der mann findet das foto','die tante findet das foto']
  ]},
  {title:'Kind und Hund',keys:'aeinstdlmrufojkhgc',newKeys:'K · H · G · C',description:'Kurze Szenen mit vertrauten Figuren.',instruction:'„Kind“ und „Hund“ kommen wieder. Bleib bei den ganzen Wörtern.',rounds:[
    ['der hund ist klein','das kind ist klein'],
    ['der hund rennt','das kind rennt'],
    ['ich gehe nach hause','das kind geht nach hause'],
    ['der hund rennt nach hause','das kind ruft den hund']
  ]},
  {title:'Ball und Zelt',keys:'aeinstdlmrufojkhgcbpwz',newKeys:'B · P · W · Z',description:'Wiederholte Wörter in kleinen Alltagsszenen.',instruction:'„Ball“ und „Zelt“ tauchen in mehreren Sätzen auf.',rounds:[
    ['der ball ist bunt','das zelt ist bunt'],
    ['papa wirft den ball','das kind wirft den ball'],
    ['der wind weht','das zelt wackelt'],
    ['papa baut ein zelt','das kind spielt im zelt']
  ]},
  {title:'Bär, Löwe, Mütze',keys:'aeinstdlmrufojkhgcbpwzäöüß',newKeys:'Ä · Ö · Ü · ß',description:'Umlaute und ß in echten Wörtern.',instruction:'Die neuen Zeichen gehören zu Wörtern, die du dir gut merken kannst.',rounds:[
    ['der bär ist müde','der bär schläft'],
    ['die mütze ist grün','die mütze liegt im zelt'],
    ['der löwe brüllt','der löwe ist groß'],
    ['der bär trägt eine mütze','der löwe brüllt laut']
  ]},
  {title:'Ein Vogel unterwegs',keys:'aeinstdlmrufojkhgcbpwzäöüßv',newKeys:'V',description:'Ein neues Wort in mehreren Szenen.',instruction:'„Vogel“ ist heute dein Ankerwort. Schau, wie schnell der Weg vertraut wird.',rounds:[
    ['der vogel fliegt','der vogel singt'],
    ['ein vogel sitzt im zelt','der vogel sitzt im baum'],
    ['der vogel fliegt zum haus','der vogel landet im baum'],
    ['der vogel singt','ein vogel fliegt über das zelt']
  ]},
  {title:'Die ganze Tastatur',keys:'abcdefghijklmnopqrstuvwxyzäöüß,.-',newKeys:'Q · X · Y',description:'Auch seltene Buchstaben finden ihren Platz.',instruction:'Für seltene Buchstaben übst du besonders einprägsame Wörter.',rounds:[
    ['das xylophon klingt','das kind spielt xylophon'],
    ['die quelle ist klar','ein vogel trinkt an der quelle'],
    ['yoga macht spaß','beim yoga atme ich ruhig'],
    ['an der quelle singt ein vogel','das xylophon klingt']
  ]}
];

const FOCUS = {
  a:{words:['apfel','ananas'],sentences:['der apfel ist rot','ein apfel liegt auf dem tisch','eine ananas ist süß']},
  b:{words:['ball','blume'],sentences:['der ball ist bunt','ein ball rollt durch den garten','die blume blüht']},
  c:{words:['clown','comic'],sentences:['der clown lacht','ein clown malt ein bild','der comic ist lustig']},
  d:{words:['drache','dose'],sentences:['der drache fliegt','ein drache landet im gras','die dose ist leer']},
  e:{words:['ente','eis'],sentences:['die ente schwimmt','eine ente watschelt zum teich','das eis schmilzt']},
  f:{words:['fisch','fahrrad'],sentences:['der fisch schwimmt','ein fisch ist ganz flink','das fahrrad ist rot']},
  g:{words:['gans','garten'],sentences:['die gans geht','eine gans läuft durch den garten','der garten ist grün']},
  h:{words:['hund','haus'],sentences:['der hund rennt','ein hund wartet vor dem haus','das haus ist gelb']},
  i:{words:['insel','igel'],sentences:['die insel ist klein','eine insel liegt im meer','der igel schläft']},
  j:{words:['jacke','junge'],sentences:['die jacke ist rot','eine jacke liegt auf dem stuhl','der junge lacht']},
  k:{words:['katze','kuchen'],sentences:['die katze rennt','eine katze sitzt auf dem sofa','der kuchen duftet']},
  l:{words:['lampe','löwe'],sentences:['die lampe leuchtet','eine lampe steht im zimmer','der löwe brüllt']},
  m:{words:['maus','mond'],sentences:['die maus ist klein','eine maus huscht durch das haus','der mond scheint']},
  n:{words:['nuss','nase'],sentences:['die nuss ist braun','eine nuss liegt auf dem tisch','die nase ist kalt']},
  o:{words:['ofen','orange'],sentences:['der ofen ist warm','ein ofen steht in der küche','die orange schmeckt süß']},
  p:{words:['puppe','pferd'],sentences:['die puppe liegt da','eine puppe sitzt auf dem bett','das pferd galoppiert']},
  q:{words:['quelle','quark'],sentences:['die quelle plätschert','eine quelle fließt durch den wald','der quark ist frisch']},
  r:{words:['roller','regen'],sentences:['der roller rollt','ein roller steht vor dem haus','der regen trommelt']},
  s:{words:['sonne','stern'],sentences:['die sonne scheint','die sonne wärmt mein gesicht','ein stern funkelt']},
  t:{words:['tisch','tasse'],sentences:['der tisch ist rund','ein tisch steht im raum','die tasse ist leer']},
  u:{words:['uhr','ufer'],sentences:['die uhr tickt','eine uhr hängt an der wand','am ufer sitzt ein vogel']},
  v:{words:['vogel','vase'],sentences:['der vogel fliegt','ein vogel singt im baum','die vase ist blau']},
  w:{words:['wind','wolke'],sentences:['der wind weht','der wind bewegt die blätter','eine wolke zieht vorbei']},
  x:{words:['xylophon','extra'],sentences:['das xylophon klingt','ein xylophon steht im zimmer','ich übe extra langsam']},
  y:{words:['yoga','xylophon'],sentences:['yoga macht spaß','beim yoga atme ich ruhig','das xylophon klingt']},
  z:{words:['ziege','zelt'],sentences:['die ziege springt','eine ziege frisst grünes gras','das zelt steht im garten']},
  ä:{words:['bär','käse'],sentences:['der bär schläft','ein bär sitzt im gras','der käse schmeckt gut']},
  ö:{words:['löwe','möwe'],sentences:['der löwe brüllt','ein löwe liegt im schatten','die möwe fliegt zum meer']},
  ü:{words:['mütze','tür'],sentences:['die mütze ist rot','eine mütze liegt auf dem bett','die tür ist offen']},
  ß:{words:['straße','fuß'],sentences:['die straße ist lang','eine straße führt zum haus','mein fuß ist nass']}
};
