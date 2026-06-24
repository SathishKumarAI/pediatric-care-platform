# Original-Repo Parity — full feature & field inventory

Exhaustive inventory of the two source repos (**Pediatrics** Flutter app +
**Medical-Research** spec vault), with build status in this app. This is the
"do we have everything from the originals?" tracker. Status: ✅ built · 🟡 partial · ⬜ planned.

> Source: deep read of `~/coding/Pediatrics/lib/**` and `~/coding/Medical-Research/**` (2026-06-24).

## 1. Data model fields (parity)

### Patient
| Field | Origin | Status |
|---|---|---|
| name / first name | PED + MR (`s_name`) | ✅ |
| last_name | MR (`s_last_name`) | ✅ |
| birth_date | MR (`dt_birthdate`) | ✅ |
| sex / gender | MR (`s_gender`) | ✅ |
| age_months (computed) | new | ✅ |
| blood_type | new (clinical) | ✅ |
| guardian_name | new (pediatric) | ✅ |
| guardian_phone | new | ✅ |
| email | PED + MR (`s_email`) | ✅ |
| phone | PED + MR (`s_phone`) | ✅ |
| cellphone | MR (`s_cellphone`) | ⬜ (folded into phone) |
| allergies | new (clinical) | ✅ |
| photo / image | PED `photoUrl` / MR `b_image` | 🟡 field exists, no upload UI |
| notes | new | ✅ |

### Doctor
| Field | Origin | Status |
|---|---|---|
| name | PED + MR | ✅ |
| specialty / profession | PED `specialty`/`profession` | ✅ |
| available_days | new | ✅ |
| phone | PED + MR | ✅ |
| email | PED + MR | ✅ |
| photo / image | PED `image` / MR `b_image` | 🟡 field exists, no image |
| bio | new | ✅ |
| license_id | MR (`n_id`) | ✅ |
| rating | from AppReview concept | ✅ |
| years_experience | new | ✅ |
| birth_date, gender | MR (`dt_birthdate`,`s_gender`) | ⬜ planned |

### Appointment
| Field | Origin | Status |
|---|---|---|
| patient_id, doctor_id | PED + MR | ✅ |
| start (date+time) | MR (`dt_date`,`t_start_time`) | ✅ |
| reason / description | MR (`s_description`) | ✅ |
| status | PED (string) / MR (`b_completed`) | ✅ (booked/cancelled/fulfilled) |
| comments | MR (`appointment_data.s_comments`) | ⬜ planned |
| type | MR (`appointment_type`) | ⬜ planned |
| duration | new | ⬜ planned |

### Medical record
| Field | Origin | Status |
|---|---|---|
| subject (patient) | PED `patientId` | ✅ |
| recorded | new | ✅ |
| note | new | ✅ |
| doctor_id | PED `doctorId` | ✅ |
| diagnosis | PED `diagnosis` | ✅ |
| prescription | PED `prescription` | ✅ |
| attachments / images | MR `image` table | 🟡 refs only, no upload |

### User / account
| Field | Origin | Status |
|---|---|---|
| email, password (hashed), role | PED + MR | ✅ |
| username | PED `username` | ⬜ planned |
| phone | PED `phoneNumber` | ⬜ planned |
| photo | PED `photoUrl` | ⬜ planned |

## 2. Feature modules (parity)

| Feature | Origin | Status | Ticket |
|---|---|---|---|
| Splash / launch | PED `splash` | ⬜ | PCP-19 |
| Welcome / onboarding | PED `welcome` | ⬜ | PCP-20 |
| Auth: login/signup | PED `login` | ✅ | PCP-8 |
| Auth: Google OAuth | PED `google_sign_in` | ⬜ | PCP-21 |
| Auth: forgot/reset password | PED `ForgotPasswordScreen` | ⬜ | PCP-22 |
| Auth: change password | PED `change_password` | ⬜ | PCP-23 |
| Auth: email verification | PED `verify_email` | ⬜ | PCP-24 |
| Auth: delete account | PED `delete_account` | ⬜ | PCP-25 |
| Auth: remember me | PED login | ⬜ | PCP-26 |
| Roles (patient/guardian/doctor/admin/researcher) | PED + MR | ✅ | PCP-8/14a |
| Home dashboard | PED `home` | ✅ | redesign |
| Appointments: book + conflict | PED `appointment`/`home` | ✅ | PCP-9/10 |
| Appointments: cancel/reschedule | PED | ✅ | PCP-9 |
| Appointments: calendar view | PED `schedule` (table_calendar) | ⬜ | PCP-27 |
| Appointments: filter (age/gender/date) | MR website req | ⬜ | PCP-28 |
| Appointments: to-do list | MR website req | ⬜ | PCP-29 |
| Doctor directory + availability | PED `doctor` | ✅ | — |
| Doctor: filter by specialty | PED | ⬜ | PCP-30 |
| Doctor: favorites | PED `ToggleFavoriteUseCase` | ⬜ | PCP-31 |
| Doctor: ratings/reviews | PED `App_Review` | 🟡 rating field only | PCP-32 |
| Medical records: view/add | PED `medical_records` | ✅ | PCP-2 |
| e-Prescription | MR doctor module | 🟡 prescription field | PCP-33 |
| Symptom checker + knowledge graph | MR | ✅ | PCP-0 |
| AI: save result to record | new | ✅ | PCP-5 |
| Growth stages + milestones | PED `stages` + MR | ✅ | PCP-11 |
| Growth percentile charts | MR/PED | ⬜ | PCP-18 |
| Chat / messaging (doctor↔patient) | PED `chats` (dash_chat) / MR Firestore | ⬜ | PCP-34 |
| Notifications (push/in-app) | PED `notifications` (FCM) | ⬜ | PCP-35 |
| Payments / billing / invoices | PED `payment` / MR finance | ⬜ | PCP-36 |
| Profile screens + photo upload | PED `profile_screens` | ⬜ | PCP-37 |
| Help / FAQ / settings | PED `help_screen` | ⬜ | PCP-38 |
| Search (global) | MR website req | ⬜ | PCP-39 |
| Video consultation | MR doctor module | ⬜ | PCP-40 |
| Voice-based booking (NLP) | MR patient module | ⬜ | PCP-41 |
| Wearable device integration | MR | ⬜ | PCP-42 |
| Personalized recommendations (diet/exercise) | MR | ⬜ | PCP-43 |
| Habit / medication-adherence tracker | MR website req | ⬜ | PCP-44 |
| Admin dashboard (metrics, user mgmt) | PED + MR admin | ⬜ | PCP-45 |
| Research dashboard (anonymized data) | MR research module | ⬜ | PCP-46 |
| Inventory report (medication/supplies) | MR website req | ⬜ | PCP-47 |
| Theming: light/dark toggle | PED light+dark | 🟡 light only | PCP-48 |
| App review / feedback | PED `App_Review` | ⬜ | PCP-49 |
| Audit log + consent | MR legal | ✅ | PCP-14b |
| RBAC enforcement | MR legal | ✅ | PCP-14a |
| Observability/metrics | MR (Prometheus/Grafana) | 🟡 /metrics | PCP-15a |

## 3. Domain enums / reference data

- **Roles:** patient, guardian, doctor, admin, researcher ✅ · lawyer, marketing, sales, nurse, accountant, manager ⬜ (MR full list).
- **Appointment status:** booked, cancelled, fulfilled ✅ · pending, confirmed, in-progress ⬜.
- **Sex:** male, female, other, unknown ✅.
- **Specialties, blood types, allergy lists:** free text now; controlled vocab ⬜.
- **Symptoms:** 15 in the live graph ✅ · ~150 catalogued in MR (`Common_Diseases.md`) ⬜ expand dataset.
- **Diseases:** 10 live ✅ · 15+ catalogued in MR ⬜.

See [feature-backlog.md](feature-backlog.md) for prioritization and [data-model.md](data-model.md) for schemas.
