## ADDED Requirements

### Requirement: Parent Home navigation item
The parent-scoped sidebar SHALL include a **Home** item (distinct from **Dashboard**) linking to the parent home-recording page. **Dashboard** SHALL remain the entry for enrolled-classroom overview on `/home`. **Home** SHALL be active only on the home-recording route. **Dashboard** SHALL remain active on `/home`, `/`, and enrolled-classroom routes under `/classrooms` as today.

#### Scenario: Home and Dashboard are distinct
- **WHEN** a parent is on the home-recording page
- **THEN** **Home** is highlighted and **Dashboard** is not

#### Scenario: Dashboard active on classroom overview
- **WHEN** a parent is on `/home` viewing enrolled classrooms
- **THEN** **Dashboard** is highlighted and **Home** is not
