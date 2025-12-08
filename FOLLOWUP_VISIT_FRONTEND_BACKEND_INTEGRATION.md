# Follow-Up Visit Integration: Frontend & Backend Documentation

## Purpose
Enable users to record both first-time and follow-up visits. For follow-ups, users select a previous visit from their history, then fill in new details (outcome, people met, equipment, next plan). The new visit is saved as a standard visit, but references the previous visit for context and reporting.

---

## Frontend Flow

1. **Visit Type Selection**
   - At the top of the visit form, user selects:
     - "First Time" (default): proceeds to fill the form as usual.
     - "Follow Up": prompts user to select a previous visit from their history.

2. **Visit History Selection (Follow Up Only)**
   - When "Follow Up" is chosen:
     - Fetches user's previous visits via API (`GET /visits?userId=<currentUserId>` or similar).
     - Displays a searchable/selectable list (date, client, purpose, outcome).
     - User selects the relevant previous visit.

3. **Form Filling**
   - After selection, user fills in:
     - Outcome of the conversation
     - People met
     - Equipment discussed/serviced
     - Next plan/follow-up actions
   - All other standard fields remain available.

4. **Payload Structure (POST /visits)**
   - The new visit is saved as a standard visit, but includes a reference to the previous visit:
     ```json
     {
       "date": "2025-11-23T09:00:00Z",
       "client": { ... },
       "visitPurpose": "followup",
       "visitOutcome": "successful",
       "contacts": [ ... ],
       "equipment": [ ... ],
       "nextPlan": "...",
       "followUpOf": "<previousVisitId>", // <-- NEW FIELD
       ...other fields...
     }
     ```
   - If `followUpOf` is present, backend should link this visit to the referenced previous visit.

5. **Schema Extension (Backend)**
   - Extend the Visit schema/model to include:
     ```js
     followUpOf: { type: ObjectId, ref: 'Visit', required: false }
     ```
   - This allows chaining visits for reporting and context.

6. **API Requirements**
   - `GET /visits?userId=<currentUserId>`: returns user's previous visits for selection.
   - `POST /visits`: accepts the new field `followUpOf`.
   - Optionally, `GET /visits/<id>` can return a list of follow-up visits for a given visit.

7. **Reporting/Analytics**
   - Backend can aggregate follow-up chains, show visit history, and analyze outcomes over time.

---

## Example User Flow
1. User opens "Create Visit" form.
2. Selects "Follow Up" as visit type.
3. Picks a previous visit from history.
4. Fills in new details (outcome, people met, equipment, next plan).
5. Submits form; new visit is saved with reference to previous visit.

---

## Backend Implementation Checklist
- [ ] Add `followUpOf` field to Visit schema/model.
- [ ] Accept `followUpOf` in POST /visits payload.
- [ ] Update GET /visits to support filtering by user and/or follow-up chains.
- [ ] Optionally, expose follow-up chains in GET /visits/<id> response.

---

## Notes
- No breaking changes to existing visit schema; `followUpOf` is optional.
- Frontend will only send `followUpOf` for follow-up visits.
- This approach supports unlimited chaining of follow-ups for robust reporting.

---

## Contact
For questions or implementation support, contact frontend team.
