NeuroStudy AI — minimal README

This repository processes NeuroSky EEG session data, extracts features,
trains a baseline activity classifier, and generates reports.

Quick run (after placing .xlsx session files in `data/raw/`):

```bash
cp config/activity_map.example.json config/activity_map.json
# Edit config/activity_map.json to map each input workbook filename (without .xlsx) to its activity.
python3 run_pipeline.py
```

The runner automatically uses the project's `.venv` when it exists, so you
do not need to activate it first.

`config/person_map.json` is optional and local; create it to map workbook
filenames to participant labels for person-independent evaluation. Data files,
generated reports, trained models, local virtual environments, and `.env` are
excluded from Git so participant data and credentials are not published.

Session coaching notes identify the participant using `config/person_map.json`
and name the recorded activity. Focus, distraction, fatigue, and next-session
recommendations are experimental heuristics, not validated EEG assessments.
To use Groq, copy `.env.example` to `.env` and replace the placeholder with your
`GROQ_API_KEY`. The coaching script loads `.env` from the project root; the
file is ignored by Git and should be copied securely (not committed) to each
machine where you run the project. Alternatively, set `GROQ_API_KEY` in the
environment. Without a key, the pipeline uses a local coaching template.
