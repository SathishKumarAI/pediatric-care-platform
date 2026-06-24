"""Generate the synthetic symptom->disease dataset that backs the knowledge
graph + predictor. Ports the Medical-Research `Dataset_creation.ipynb` logic
into a deterministic, dependency-light script (stdlib only).

Usage: python scripts/generate_data.py [rows_per_disease]
Output: data/symptom_disease.csv
"""
from __future__ import annotations

import csv
import random
import sys
from pathlib import Path

SEED = 42
SYMPTOMS = [
    "fever", "cough", "sore_throat", "ear_pain", "runny_nose", "stomach_pain",
    "vomiting", "diarrhea", "headache", "rash", "difficulty_breathing",
    "wheezing", "fatigue", "loss_of_appetite", "red_eyes",
]

# disease -> {symptom: probability of presence}
PROFILES: dict[str, dict[str, float]] = {
    "viral_fever":     {"fever": .95, "headache": .6, "fatigue": .7, "loss_of_appetite": .5, "cough": .3},
    "common_cold":     {"runny_nose": .9, "cough": .7, "sore_throat": .6, "fever": .3},
    "otitis_media":    {"ear_pain": .95, "fever": .6, "loss_of_appetite": .4, "runny_nose": .3},
    "pharyngitis":     {"sore_throat": .9, "fever": .5, "headache": .4, "cough": .3},
    "strep_throat":    {"sore_throat": .95, "fever": .8, "headache": .5, "stomach_pain": .3},
    "bronchiolitis":   {"cough": .9, "wheezing": .8, "difficulty_breathing": .7, "runny_nose": .6, "fever": .4},
    "gastroenteritis": {"vomiting": .85, "diarrhea": .9, "stomach_pain": .7, "fever": .4, "loss_of_appetite": .6},
    "pneumonia":       {"fever": .85, "cough": .9, "difficulty_breathing": .7, "fatigue": .6},
    "conjunctivitis":  {"red_eyes": .95, "runny_nose": .3, "fever": .2},
    "croup":           {"cough": .9, "difficulty_breathing": .6, "fever": .5, "runny_nose": .4},
}


def main() -> None:
    rows_per = int(sys.argv[1]) if len(sys.argv) > 1 else 80
    rng = random.Random(SEED)
    out = Path("data/symptom_disease.csv")
    out.parent.mkdir(exist_ok=True)

    with out.open("w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["disease", *SYMPTOMS])
        for disease, profile in PROFILES.items():
            for _ in range(rows_per):
                row = [1 if rng.random() < profile.get(s, 0.05) else 0 for s in SYMPTOMS]
                writer.writerow([disease, *row])
    print(f"Wrote {out} — {len(PROFILES) * rows_per} rows, {len(PROFILES)} diseases.")


if __name__ == "__main__":
    main()
