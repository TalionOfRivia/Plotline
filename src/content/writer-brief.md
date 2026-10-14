# Writer brief (shared by all event-pack agents)

Read `schema.md` first. Then this.

## Engine flags you can use in `conditions.flags` / `notFlags`
student, university, grad_school, has_degree, has_high_school, employed, unemployed, retired, high_performer, low_performer,
dating, married, single, has_kids, divorced, widowed, rich, has_house, in_prison, criminal_record, famous, celebrity, fame_career,
athlete, royal, monarch, heir, mafia, mafia_boss, business_owner, business_big, never_worked, pet_owner, has_license, boat_license,
pilot_license, addicted, std, depressed, ailment (any current illness), cheated, bankrupt, emigrated, plastic_surgery, lottery_winner,
scholarship, honors, prenup, has_social_media, best_friend (has a best friend), stressed (work stress high), popular_at_work, enemy (has an enemy)

## Effects.flags the engine reacts to (consumed, not stored)
performance:±n, fired:true, raise:0.1, promoted:true, stress:±n, coworker_popularity:±n,
grades_boost:1, grades_drop:1, suspended:true, honors:true, dropped_out:true, popularity:±n (school),
breakup:true, divorce:true, propose:true, affair:true, new_child:true, new_friend:true, lose_friend:true, new_partner:true, best_friend:true (the event's friend), enemy:true (the event's person becomes an enemy),
fame:±n, book_deal:true, scandal:true, followers:n (adds followers),
royal_popularity:±n, abdicate:true, execute_order:true, exiled:true,
mafia:true, mafia_respect:±n, mafia_promote:true, whacked:true, turn_informant:true,
business_value:±0.2, business_bankrupt:true, lawsuit:n,
injury:n, championship:true, doping_caught:true, mission_success:true, mission_failure:true, cover_blown:true, agent_promote:true,
parole:true, sentence_extra:n, escaped_prison:true,
addicted:true/false, std:true, ailment:"<name>" (gives an illness: ear_infection, flu, constipation, migraines, high_blood_pressure, back_pain, bronchitis, kidney_stones, anemia, insomnia), cured:true (clears the illness), depressed:true/false,
car_damage:n (0-100 condition loss), house_damage:n (value loss %), pet_sick:true, pet_dies:true (the event's pet),
child_grades:±n (the event's child), child_leaves:true (the event's child moves out)

## requiresPerson kinds
mother, father, sibling, friend, partner, spouse, ex, child, pet

## Tone
Adults-only private game: blunt, dark humour, mature themes fine (sex, drugs, violence consequences), never pornographic, nothing sexual involving minors. Second person present. 1–3 sentences. Choice labels ≤5 words. Use {{name}} for the event's person. Hebrew: natural Israeli Hebrew, gender-neutral forms where possible, דולר not שקל.

## Output
Three files per pack: `events/<pack>.json`, `text/en/<pack>.json`, `text/he/<pack>.json`. Identical key sets en/he. No id collisions (grep events/). ~35%+ of events with outcomes + showOdds. Weights 1–3 (0.5 rare).
