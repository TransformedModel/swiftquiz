// =============================================================
//  songs.js  —  Complete Taylor Swift song catalogue
//  Works in both Node.js (require) and browser (<script> tag).
//  Covers all studio albums + Taylor's Version vault tracks.
// =============================================================

const SONGS = [

  // ── Taylor Swift (2006) ────────────────────────────────────
  { title: "Tim McGraw",                               album: "Taylor Swift",                      year: 2006 },
  { title: "Picture to Burn",                          album: "Taylor Swift",                      year: 2006 },
  { title: "Teardrops on My Guitar",                   album: "Taylor Swift",                      year: 2006 },
  { title: "A Place in This World",                    album: "Taylor Swift",                      year: 2006 },
  { title: "Cold As You",                              album: "Taylor Swift",                      year: 2006 },
  { title: "The Outside",                              album: "Taylor Swift",                      year: 2006 },
  { title: "Tied Together with a Smile",               album: "Taylor Swift",                      year: 2006 },
  { title: "Stay Beautiful",                           album: "Taylor Swift",                      year: 2006 },
  { title: "Should've Said No",                        album: "Taylor Swift",                      year: 2006 },
  { title: "Mary's Song (Oh My My My)",                album: "Taylor Swift",                      year: 2006 },
  { title: "Our Song",                                 album: "Taylor Swift",                      year: 2006 },
  { title: "I'm Only Me When I'm With You",            album: "Taylor Swift",                      year: 2006 },
  { title: "Invisible",                                album: "Taylor Swift",                      year: 2006 },
  { title: "The Best Day",                             album: "Taylor Swift",                      year: 2006 },
  { title: "Change",                                   album: "Taylor Swift",                      year: 2006 },
  { title: "Jump Then Fall",                           album: "Taylor Swift",                      year: 2006 },
  { title: "Untouchable",                              album: "Taylor Swift",                      year: 2006 },

  // ── Fearless (2008) ───────────────────────────────────────
  { title: "Fearless",                                 album: "Fearless",                          year: 2008 },
  { title: "Fifteen",                                  album: "Fearless",                          year: 2008 },
  { title: "Love Story",                               album: "Fearless",                          year: 2008 },
  { title: "Hey Stephen",                              album: "Fearless",                          year: 2008 },
  { title: "White Horse",                              album: "Fearless",                          year: 2008 },
  { title: "You Belong With Me",                       album: "Fearless",                          year: 2008 },
  { title: "Breathe",                                  album: "Fearless",                          year: 2008 },
  { title: "Tell Me Why",                              album: "Fearless",                          year: 2008 },
  { title: "You're Not Sorry",                         album: "Fearless",                          year: 2008 },
  { title: "The Way I Loved You",                      album: "Fearless",                          year: 2008 },
  { title: "Forever & Always",                         album: "Fearless",                          year: 2008 },
  { title: "Come In With the Rain",                    album: "Fearless",                          year: 2008 },
  { title: "Superstar",                                album: "Fearless",                          year: 2008 },
  { title: "The Other Side of the Door",               album: "Fearless",                          year: 2008 },
  // Fearless TV vault tracks
  { title: "Mr. Perfectly Fine",                       album: "Fearless",                          year: 2021 },
  { title: "You All Over Me",                          album: "Fearless",                          year: 2021 },
  { title: "We Were Happy",                            album: "Fearless",                          year: 2021 },
  { title: "That's When",                              album: "Fearless",                          year: 2021 },
  { title: "Don't You",                                album: "Fearless",                          year: 2021 },
  { title: "Bye Bye Baby",                             album: "Fearless",                          year: 2021 },

  // ── Speak Now (2010) ──────────────────────────────────────
  { title: "Mine",                                     album: "Speak Now",                         year: 2010 },
  { title: "Sparks Fly",                               album: "Speak Now",                         year: 2010 },
  { title: "Back to December",                         album: "Speak Now",                         year: 2010 },
  { title: "Speak Now",                                album: "Speak Now",                         year: 2010 },
  { title: "Dear John",                                album: "Speak Now",                         year: 2010 },
  { title: "Mean",                                     album: "Speak Now",                         year: 2010 },
  { title: "The Story of Us",                          album: "Speak Now",                         year: 2010 },
  { title: "Never Grow Up",                            album: "Speak Now",                         year: 2010 },
  { title: "Enchanted",                                album: "Speak Now",                         year: 2010 },
  { title: "Better Than Revenge",                      album: "Speak Now",                         year: 2010 },
  { title: "Innocent",                                 album: "Speak Now",                         year: 2010 },
  { title: "Haunted",                                  album: "Speak Now",                         year: 2010 },
  { title: "Last Kiss",                                album: "Speak Now",                         year: 2010 },
  { title: "Long Live",                                album: "Speak Now",                         year: 2010 },
  { title: "Ours",                                     album: "Speak Now",                         year: 2010 },
  { title: "Superman",                                 album: "Speak Now",                         year: 2010 },
  // Speak Now TV vault tracks
  { title: "Timeless",                                 album: "Speak Now",                         year: 2023 },
  { title: "Foolish One",                              album: "Speak Now",                         year: 2023 },
  { title: "Electric Touch",                           album: "Speak Now",                         year: 2023 },

  // ── Red (2012) ────────────────────────────────────────────
  { title: "State of Grace",                           album: "Red",                               year: 2012 },
  { title: "Red",                                      album: "Red",                               year: 2012 },
  { title: "Treacherous",                              album: "Red",                               year: 2012 },
  { title: "I Knew You Were Trouble",                  album: "Red",                               year: 2012 },
  { title: "All Too Well",                             album: "Red",                               year: 2012 },
  { title: "22",                                       album: "Red",                               year: 2012 },
  { title: "I Almost Do",                              album: "Red",                               year: 2012 },
  { title: "We Are Never Ever Getting Back Together",  album: "Red",                               year: 2012 },
  { title: "Stay Stay Stay",                           album: "Red",                               year: 2012 },
  { title: "The Last Time",                            album: "Red",                               year: 2012 },
  { title: "Holy Ground",                              album: "Red",                               year: 2012 },
  { title: "Sad Beautiful Tragic",                     album: "Red",                               year: 2012 },
  { title: "The Lucky One",                            album: "Red",                               year: 2012 },
  { title: "Everything Has Changed",                   album: "Red",                               year: 2012 },
  { title: "Starlight",                                album: "Red",                               year: 2012 },
  { title: "Begin Again",                              album: "Red",                               year: 2012 },
  { title: "Come Back...Be Here",                      album: "Red",                               year: 2012 },
  { title: "Girl at Home",                             album: "Red",                               year: 2012 },
  { title: "Ronan",                                    album: "Red",                               year: 2012 },
  // Red TV vault tracks
  { title: "All Too Well (Ten Minute Version)",        album: "Red",                               year: 2021 },
  { title: "Message in a Bottle",                      album: "Red",                               year: 2021 },
  { title: "I Bet You Think About Me",                 album: "Red",                               year: 2021 },
  { title: "Forever Winter",                           album: "Red",                               year: 2021 },
  { title: "Run",                                      album: "Red",                               year: 2021 },
  { title: "The Very First Night",                     album: "Red",                               year: 2021 },
  { title: "Better Man",                               album: "Red",                               year: 2021 },
  { title: "Nothing New",                              album: "Red",                               year: 2021 },
  { title: "Babe",                                     album: "Red",                               year: 2021 },

  // ── 1989 (2014) ───────────────────────────────────────────
  { title: "Welcome to New York",                      album: "1989",                              year: 2014 },
  { title: "Blank Space",                              album: "1989",                              year: 2014 },
  { title: "Style",                                    album: "1989",                              year: 2014 },
  { title: "Out of the Woods",                         album: "1989",                              year: 2014 },
  { title: "All You Had to Do Was Stay",               album: "1989",                              year: 2014 },
  { title: "Shake It Off",                             album: "1989",                              year: 2014 },
  { title: "I Wish You Would",                         album: "1989",                              year: 2014 },
  { title: "Bad Blood",                                album: "1989",                              year: 2014 },
  { title: "Wildest Dreams",                           album: "1989",                              year: 2014 },
  { title: "How You Get the Girl",                     album: "1989",                              year: 2014 },
  { title: "This Love",                                album: "1989",                              year: 2014 },
  { title: "Clean",                                    album: "1989",                              year: 2014 },
  { title: "New Romantics",                            album: "1989",                              year: 2014 },
  { title: "I Know Places",                            album: "1989",                              year: 2014 },
  { title: "Wonderland",                               album: "1989",                              year: 2014 },
  { title: "You Are in Love",                          album: "1989",                              year: 2014 },
  // 1989 TV vault tracks
  { title: "Slut!",                                    album: "1989",                              year: 2023 },
  { title: "Say Don't Go",                             album: "1989",                              year: 2023 },
  { title: "Now That We Don't Talk",                   album: "1989",                              year: 2023 },
  { title: "Suburban Legends",                         album: "1989",                              year: 2023 },
  { title: "Is It Over Now?",                          album: "1989",                              year: 2023 },

  // ── reputation (2017) ─────────────────────────────────────
  { title: "...Ready for It?",                         album: "reputation",                        year: 2017 },
  { title: "End Game",                                 album: "reputation",                        year: 2017 },
  { title: "I Did Something Bad",                      album: "reputation",                        year: 2017 },
  { title: "Don't Blame Me",                           album: "reputation",                        year: 2017 },
  { title: "Delicate",                                 album: "reputation",                        year: 2017 },
  { title: "Look What You Made Me Do",                 album: "reputation",                        year: 2017 },
  { title: "So It Goes...",                            album: "reputation",                        year: 2017 },
  { title: "Gorgeous",                                 album: "reputation",                        year: 2017 },
  { title: "Getaway Car",                              album: "reputation",                        year: 2017 },
  { title: "King of My Heart",                         album: "reputation",                        year: 2017 },
  { title: "Dancing with Our Hands Tied",              album: "reputation",                        year: 2017 },
  { title: "Dress",                                    album: "reputation",                        year: 2017 },
  { title: "This Is Why We Can't Have Nice Things",    album: "reputation",                        year: 2017 },
  { title: "Call It What You Want",                    album: "reputation",                        year: 2017 },
  { title: "New Year's Day",                           album: "reputation",                        year: 2017 },

  // ── Lover (2019) ──────────────────────────────────────────
  { title: "I Forgot That You Existed",                album: "Lover",                             year: 2019 },
  { title: "Cruel Summer",                             album: "Lover",                             year: 2019 },
  { title: "Lover",                                    album: "Lover",                             year: 2019 },
  { title: "The Man",                                  album: "Lover",                             year: 2019 },
  { title: "The Archer",                               album: "Lover",                             year: 2019 },
  { title: "I Think He Knows",                         album: "Lover",                             year: 2019 },
  { title: "Miss Americana & the Heartbreak Prince",   album: "Lover",                             year: 2019 },
  { title: "Paper Rings",                              album: "Lover",                             year: 2019 },
  { title: "Cornelia Street",                          album: "Lover",                             year: 2019 },
  { title: "Death by a Thousand Cuts",                 album: "Lover",                             year: 2019 },
  { title: "London Boy",                               album: "Lover",                             year: 2019 },
  { title: "Soon You'll Get Better",                   album: "Lover",                             year: 2019 },
  { title: "False God",                                album: "Lover",                             year: 2019 },
  { title: "You Need to Calm Down",                    album: "Lover",                             year: 2019 },
  { title: "Afterglow",                                album: "Lover",                             year: 2019 },
  { title: "ME!",                                      album: "Lover",                             year: 2019 },
  { title: "It's Nice to Have a Friend",               album: "Lover",                             year: 2019 },
  { title: "Daylight",                                 album: "Lover",                             year: 2019 },

  // ── folklore (2020) ───────────────────────────────────────
  { title: "the 1",                                    album: "folklore",                          year: 2020 },
  { title: "cardigan",                                 album: "folklore",                          year: 2020 },
  { title: "the last great american dynasty",          album: "folklore",                          year: 2020 },
  { title: "exile",                                    album: "folklore",                          year: 2020 },
  { title: "my tears ricochet",                        album: "folklore",                          year: 2020 },
  { title: "mirrorball",                               album: "folklore",                          year: 2020 },
  { title: "seven",                                    album: "folklore",                          year: 2020 },
  { title: "august",                                   album: "folklore",                          year: 2020 },
  { title: "this is me trying",                        album: "folklore",                          year: 2020 },
  { title: "illicit affairs",                          album: "folklore",                          year: 2020 },
  { title: "invisible string",                         album: "folklore",                          year: 2020 },
  { title: "mad woman",                                album: "folklore",                          year: 2020 },
  { title: "epiphany",                                 album: "folklore",                          year: 2020 },
  { title: "betty",                                    album: "folklore",                          year: 2020 },
  { title: "peace",                                    album: "folklore",                          year: 2020 },
  { title: "hoax",                                     album: "folklore",                          year: 2020 },
  { title: "the lakes",                                album: "folklore",                          year: 2020 },

  // ── evermore (2020) ───────────────────────────────────────
  { title: "willow",                                   album: "evermore",                          year: 2020 },
  { title: "champagne problems",                       album: "evermore",                          year: 2020 },
  { title: "gold rush",                                album: "evermore",                          year: 2020 },
  { title: "'tis the damn season",                     album: "evermore",                          year: 2020 },
  { title: "tolerate it",                              album: "evermore",                          year: 2020 },
  { title: "no body no crime",                         album: "evermore",                          year: 2020 },
  { title: "happiness",                                album: "evermore",                          year: 2020 },
  { title: "dorothea",                                 album: "evermore",                          year: 2020 },
  { title: "coney island",                             album: "evermore",                          year: 2020 },
  { title: "ivy",                                      album: "evermore",                          year: 2020 },
  { title: "cowboy like me",                           album: "evermore",                          year: 2020 },
  { title: "long story short",                         album: "evermore",                          year: 2020 },
  { title: "marjorie",                                 album: "evermore",                          year: 2020 },
  { title: "closure",                                  album: "evermore",                          year: 2020 },
  { title: "evermore",                                 album: "evermore",                          year: 2020 },
  { title: "right where you left me",                  album: "evermore",                          year: 2020 },
  { title: "it's time to go",                          album: "evermore",                          year: 2020 },

  // ── Midnights (2022) ──────────────────────────────────────
  { title: "Lavender Haze",                            album: "Midnights",                         year: 2022 },
  { title: "Maroon",                                   album: "Midnights",                         year: 2022 },
  { title: "Anti-Hero",                                album: "Midnights",                         year: 2022 },
  { title: "Snow on the Beach",                        album: "Midnights",                         year: 2022 },
  { title: "Midnight Rain",                            album: "Midnights",                         year: 2022 },
  { title: "Question...?",                             album: "Midnights",                         year: 2022 },
  { title: "Vigilante Shit",                           album: "Midnights",                         year: 2022 },
  { title: "Bejeweled",                                album: "Midnights",                         year: 2022 },
  { title: "Labyrinth",                                album: "Midnights",                         year: 2022 },
  { title: "Karma",                                    album: "Midnights",                         year: 2022 },
  { title: "Sweet Nothing",                            album: "Midnights",                         year: 2022 },
  { title: "Mastermind",                               album: "Midnights",                         year: 2022 },
  { title: "The Great War",                            album: "Midnights",                         year: 2022 },
  { title: "Bigger Than the Whole Sky",                album: "Midnights",                         year: 2022 },
  { title: "Paris",                                    album: "Midnights",                         year: 2022 },
  { title: "High Infidelity",                          album: "Midnights",                         year: 2022 },
  { title: "Glitch",                                   album: "Midnights",                         year: 2022 },
  { title: "Would've Could've Should've",              album: "Midnights",                         year: 2022 },
  { title: "Dear Reader",                              album: "Midnights",                         year: 2022 },
  { title: "You're Losing Me",                         album: "Midnights",                         year: 2022 },

  // ── The Tortured Poets Department (2024) ──────────────────
  { title: "Fortnight",                                album: "The Tortured Poets Department",     year: 2024 },
  { title: "The Tortured Poets Department",            album: "The Tortured Poets Department",     year: 2024 },
  { title: "My Boy Only Breaks His Favorite Toys",     album: "The Tortured Poets Department",     year: 2024 },
  { title: "Down Bad",                                 album: "The Tortured Poets Department",     year: 2024 },
  { title: "So Long, London",                          album: "The Tortured Poets Department",     year: 2024 },
  { title: "But Daddy I Love Him",                     album: "The Tortured Poets Department",     year: 2024 },
  { title: "Fresh Out the Slammer",                    album: "The Tortured Poets Department",     year: 2024 },
  { title: "Florida!!!",                               album: "The Tortured Poets Department",     year: 2024 },
  { title: "Guilty as Sin?",                           album: "The Tortured Poets Department",     year: 2024 },
  { title: "Who's Afraid of Little Old Me?",           album: "The Tortured Poets Department",     year: 2024 },
  { title: "I Can Fix Him (No Really I Can)",          album: "The Tortured Poets Department",     year: 2024 },
  { title: "loml",                                     album: "The Tortured Poets Department",     year: 2024 },
  { title: "I Can Do It With a Broken Heart",          album: "The Tortured Poets Department",     year: 2024 },
  { title: "The Smallest Man Who Ever Lived",          album: "The Tortured Poets Department",     year: 2024 },
  { title: "The Alchemy",                              album: "The Tortured Poets Department",     year: 2024 },
  { title: "Clara Bow",                                album: "The Tortured Poets Department",     year: 2024 },
  { title: "The Manuscript",                           album: "The Tortured Poets Department",     year: 2024 },
  { title: "The Black Dog",                            album: "The Tortured Poets Department",     year: 2024 },
  { title: "imgonnagetyouback",                        album: "The Tortured Poets Department",     year: 2024 },
  { title: "The Albatross",                            album: "The Tortured Poets Department",     year: 2024 },
  { title: "Chloe or Sam or Sophia or Marcus",         album: "The Tortured Poets Department",     year: 2024 },
  { title: "How Did It End?",                          album: "The Tortured Poets Department",     year: 2024 },
  { title: "So High School",                           album: "The Tortured Poets Department",     year: 2024 },
  { title: "I Hate It Here",                           album: "The Tortured Poets Department",     year: 2024 },
  { title: "thanK you aIMee",                          album: "The Tortured Poets Department",     year: 2024 },
  { title: "I Look in People's Windows",               album: "The Tortured Poets Department",     year: 2024 },
  { title: "The Prophecy",                             album: "The Tortured Poets Department",     year: 2024 },
  { title: "Cassandra",                                album: "The Tortured Poets Department",     year: 2024 },
  { title: "Peter",                                    album: "The Tortured Poets Department",     year: 2024 },
  { title: "The Bolter",                               album: "The Tortured Poets Department",     year: 2024 },
  { title: "Robin",                                    album: "The Tortured Poets Department",     year: 2024 },
];

// Helper: turn album name into a folder-safe slug
function albumSlug(album) {
  return album
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Helper: turn song title into a file-safe slug
function songSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SONGS, albumSlug, songSlug };
} else {
  window.SONGS      = SONGS;
  window.albumSlug  = albumSlug;
  window.songSlug   = songSlug;
}
