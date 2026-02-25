/**
 * DeutschTrainer — B1 Vocabulary Data
 * Format: { de, en, type, cat, ex }
 * Use {word} in examples to highlight the target word.
 * 
 * ADDING WORDS:
 * Just push new objects into VOCAB_DATA array.
 * Or use the in-app "Add Words" feature.
 */

const VOCAB_DATA = [
  // ─── Education ───────────────────────────────────
  { de: "die Realschule", en: "secondary school", type: "Noun (f)", cat: "Education", ex: "Ich habe die {Realschule} besucht." },
  { de: "bestehen", en: "to pass / to exist", type: "Verb", cat: "Education", ex: "Ich möchte die Prüfung {bestehen}." },
  { de: "der Anfänger", en: "beginner", type: "Noun (m)", cat: "Education", ex: "Dieser Kurs ist für {Anfänger} geeignet." },
  { de: "das Fachgebiet", en: "field / specialty", type: "Noun (n)", cat: "Education", ex: "Mein {Fachgebiet} ist Informatik." },
  { de: "die Schreibwerkstatt", en: "writing workshop", type: "Noun (f)", cat: "Education", ex: "Ich besuche eine {Schreibwerkstatt}." },
  { de: "die Fremdsprache", en: "foreign language", type: "Noun (f)", cat: "Education", ex: "Ich lerne drei {Fremdsprachen}." },
  { de: "der Wortschatz", en: "vocabulary", type: "Noun (m)", cat: "Education", ex: "Ich möchte meinen {Wortschatz} erweitern." },
  { de: "erweitern", en: "to expand / to extend", type: "Verb", cat: "Education", ex: "Ich {erweitere} mein Wissen jeden Tag." },
  { de: "abgeschlossen", en: "completed / finished", type: "Past participle", cat: "Education", ex: "Ich habe mein Studium {abgeschlossen}." },

  // ─── Work ────────────────────────────────────────
  { de: "der/die Angestellte", en: "employee", type: "Noun", cat: "Work", ex: "Sie ist {Angestellte} in einem Büro." },
  { de: "beschäftigt", en: "busy / employed", type: "Adjective", cat: "Work", ex: "Ich bin heute sehr {beschäftigt}." },
  { de: "gearbeitet", en: "worked", type: "Past participle", cat: "Work", ex: "Ich habe gestern bis spät {gearbeitet}." },
  { de: "dieselbe Abteilung", en: "the same department", type: "Phrase", cat: "Work", ex: "Wir arbeiten in {derselben Abteilung}." },
  { de: "benötigen", en: "to need / to require", type: "Verb", cat: "Work", ex: "Ich {benötige} mehr Informationen." },
  { de: "wechseln", en: "to change / to switch", type: "Verb", cat: "Work", ex: "Ich {wechsle} nächstes Jahr den Job." },
  { de: "die Berufspläne", en: "career plans", type: "Noun (pl)", cat: "Work", ex: "Meine {Berufspläne} haben sich geändert." },

  // ─── Social Life ─────────────────────────────────
  { de: "geschieden", en: "divorced", type: "Adjective", cat: "Social Life", ex: "Er ist seit zwei Jahren {geschieden}." },
  { de: "einsam", en: "lonely", type: "Adjective", cat: "Social Life", ex: "Sie fühlt sich manchmal {einsam}." },
  { de: "die Clique", en: "group of friends / clique", type: "Noun (f)", cat: "Social Life", ex: "Ich treffe mich oft mit meiner {Clique}." },
  { de: "das Treffen", en: "meeting", type: "Noun (n)", cat: "Social Life", ex: "Wir haben morgen ein wichtiges {Treffen}." },
  { de: "reden", en: "to talk / to speak", type: "Verb", cat: "Social Life", ex: "Wir müssen darüber {reden}." },
  { de: "gefallen", en: "to please / to like", type: "Verb", cat: "Social Life", ex: "Das Konzert hat mir sehr {gefallen}." },

  // ─── Communication ───────────────────────────────
  { de: "der Rundfunk", en: "radio / broadcasting", type: "Noun (m)", cat: "Communication", ex: "Ich höre Nachrichten im {Rundfunk}." },
  { de: "der Anrufbeantworter", en: "answering machine", type: "Noun (m)", cat: "Communication", ex: "Hinterlassen Sie eine Nachricht auf dem {Anrufbeantworter}." },
  { de: "erreichen", en: "to reach / to contact", type: "Verb", cat: "Communication", ex: "Sie können mich unter dieser Nummer {erreichen}." },
  { de: "sich beschweren", en: "to complain", type: "Verb (reflexive)", cat: "Communication", ex: "Ich möchte mich über den Service {beschweren}." },

  // ─── Living ──────────────────────────────────────
  { de: "außerhalb", en: "outside / beyond", type: "Preposition", cat: "Living", ex: "Ich wohne {außerhalb} der Stadt." },
  { de: "die Ausfahrt", en: "exit", type: "Noun (f)", cat: "Living", ex: "Nehmen Sie die nächste {Ausfahrt}." },
  { de: "verlassen", en: "to leave", type: "Verb", cat: "Living", ex: "Ich {verlasse} das Haus um 8 Uhr." },
  { de: "ausziehen", en: "to move out", type: "Verb (sep.)", cat: "Living", ex: "Ich möchte nächsten Monat {ausziehen}." },
  { de: "der Hundeschmutz", en: "dog dirt / mess", type: "Noun (m)", cat: "Living", ex: "Überall liegt {Hundeschmutz} im Park." },

  // ─── Events ──────────────────────────────────────
  { de: "das Theaterstück", en: "play (theatre)", type: "Noun (n)", cat: "Events", ex: "Wir sehen heute Abend ein {Theaterstück}." },
  { de: "die Veranstaltung", en: "event", type: "Noun (f)", cat: "Events", ex: "Die {Veranstaltung} findet im Stadthaus statt." },
  { de: "das Zauberkunststück", en: "magic trick", type: "Noun (n)", cat: "Events", ex: "Der Zauberer zeigte tolle {Zauberkunststücke}." },
  { de: "der Held", en: "hero", type: "Noun (m)", cat: "Events", ex: "Superman ist ein bekannter {Held}." },

  // ─── Sports ──────────────────────────────────────
  { de: "der Rennwagen", en: "racing car", type: "Noun (m)", cat: "Sports", ex: "Michael Schumacher fuhr einen roten {Rennwagen}." },
  { de: "die Rennbahn", en: "racing track", type: "Noun (f)", cat: "Sports", ex: "Die {Rennbahn} in Hockenheim ist sehr bekannt." },
  { de: "beliebt", en: "popular", type: "Adjective", cat: "Sports", ex: "Fußball ist sehr {beliebt} in Deutschland." },

  // ─── Time ────────────────────────────────────────
  { de: "bald", en: "soon", type: "Adverb", cat: "Time", ex: "Wir sehen uns {bald} wieder." },
  { de: "einst", en: "once / formerly", type: "Adverb", cat: "Time", ex: "Hier stand {einst} eine alte Kirche." },
  { de: "der Anfang", en: "beginning", type: "Noun (m)", cat: "Time", ex: "Am {Anfang} war es schwierig." },
  { de: "dauern", en: "to last / to take time", type: "Verb", cat: "Time", ex: "Die Prüfung {dauert} zwei Stunden." },
  { de: "verbringen", en: "to spend (time)", type: "Verb", cat: "Time", ex: "Ich {verbringe} viel Zeit mit meiner Familie." },

  // ─── Descriptive ─────────────────────────────────
  { de: "bestimmt", en: "certain / specific", type: "Adjective", cat: "Descriptive", ex: "Ich suche ein {bestimmtes} Buch." },
  { de: "verschieden", en: "different / various", type: "Adjective", cat: "Descriptive", ex: "Es gibt {verschiedene} Möglichkeiten." },
  { de: "dieselben", en: "the same (plural)", type: "Pronoun", cat: "Descriptive", ex: "Wir haben {dieselben} Interessen." },
  { de: "gemeinsam", en: "common / shared", type: "Adjective", cat: "Descriptive", ex: "Wir haben viele {gemeinsame} Interessen." },
  { de: "pauschal", en: "flat-rate / blanket", type: "Adjective", cat: "Descriptive", ex: "Die Reise kostet {pauschal} 500 Euro." },
  { de: "gestaltet", en: "designed / shaped", type: "Past participle", cat: "Descriptive", ex: "Der Garten ist schön {gestaltet}." },
  { de: "besonders", en: "especially / particularly", type: "Adverb", cat: "Descriptive", ex: "Ich mag {besonders} italienisches Essen." },
  { de: "leicht", en: "easy / light", type: "Adjective", cat: "Descriptive", ex: "Die Prüfung war nicht {leicht}." },

  // ─── Emotions ────────────────────────────────────
  { de: "fürchten", en: "to fear", type: "Verb", cat: "Emotions", ex: "Ich {fürchte}, dass es morgen regnet." },
  { de: "der Wunsch", en: "wish / desire", type: "Noun (m)", cat: "Emotions", ex: "Mein größter {Wunsch} ist es, die Welt zu bereisen." },

  // ─── Health ──────────────────────────────────────
  { de: "verletzt", en: "injured / hurt", type: "Adjective", cat: "Health", ex: "Der Spieler wurde {verletzt}." },

  // ─── Verbs ───────────────────────────────────────
  { de: "bieten", en: "to offer", type: "Verb", cat: "Verbs", ex: "Die Firma {bietet} gute Arbeitsbedingungen." },
  { de: "gestalten", en: "to design / to shape", type: "Verb", cat: "Verbs", ex: "Wir {gestalten} unsere Zukunft selbst." },
  { de: "leisten", en: "to afford / to accomplish", type: "Verb", cat: "Verbs", ex: "Ich kann mir das neue Auto nicht {leisten}." },
];

// User-added words are stored in localStorage and merged at runtime
// Format is the same as above
