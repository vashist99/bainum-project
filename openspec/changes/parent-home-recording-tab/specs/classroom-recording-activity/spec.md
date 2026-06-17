## ADDED Requirements

### Requirement: Parent home activity catalog
The parent home-recording flow SHALL expose a grouped activity picker using the home-context predefined catalog below. Each category SHALL be a `<optgroup>` (or equivalent grouped UI). A global **Other (please specify)** option SHALL allow custom activities vetted by the existing AI mechanism. The school-context catalog for teachers/admins SHALL remain unchanged.

**Play time:** Puzzles; Blocks; Pretend play; Games; Baby dolls; Cars; Sensory toys; Playing (general); Sports (e.g., soccer, basketball); Screen time (e.g., movie/show, iPad/tablet/phone, video games).

**Personal care:** Waking up; Diapering; Potty time; Dressing; Nap time; Brushing teeth; Bath time; Bed time; Sleeping.

**Outdoor play:** Ride-ons; Playing ball; Swinging; Sliding; Water play.

**Eating & drinking:** Bottle time; Breakfast; Lunch; Dinner; Snacks; Water breaks.

**Outings:** Car rides; Bus rides; Walks; Visiting family and friends; Shopping; Getting the mail; Traveling to/from activity.

**Household chores:** Laundry; Wiping up tables; Throwing away trash; Picking up toys; Putting dishes in sink; Clean-up, set-up, transition.

**Books & literacy:** Reading together; Playing with cloth or board books; Talking about pictures; Reading or looking at books.

**Structured activities:** Circle time; Music time; Library story time; Story time; Art; Playdough; Coloring; Centers; Large group; Small group; Individual activity; Other; School work; Faith-based activities; Therapy.

#### Scenario: Parent sees grouped home activities
- **WHEN** a parent opens the activity picker on the Home recording page
- **THEN** activities are grouped under the eight categories above
- **AND** a custom activity option is available with AI vetting

#### Scenario: Custom home activity vetted
- **WHEN** a parent enters a custom activity on the Home recording page
- **THEN** it must pass the existing activity AI vetting (client-side before upload, re-validated server-side at accept)

#### Scenario: School catalog unchanged for teachers
- **WHEN** a teacher opens the classroom recording modal activity picker
- **THEN** only the school-context grouped catalog is shown (not the parent home list)
