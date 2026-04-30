# AI Internship Email Generator

A modern Flask web app that helps students generate professional internship request emails by matching their profile with a suitable professor.

## Features

- 3-step workflow:
  - Step 1: University selection
  - Step 2: Student profile form
  - Step 3: Matched professor + generated email
- Professor matching using keyword-based relevance scoring
- AI email generation with OpenAI API when configured
- Automatic fallback to a structured template when AI is unavailable
- Copy email, download `.txt`, and regenerate email actions
- Optional resume upload
- Responsive, card-based modern UI with progress indicators and loading animation

## Project Structure

```text
project/
  app.py
  templates/
    index.html
    form.html
    result.html
  static/
    style.css
    script.js
  data/
    professors.json
  uploads/
```

## Setup and Run

1. Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate
```

2. Install dependencies:

```powershell
pip install flask openai
```

3. (Optional) Configure OpenAI API:

```powershell
$env:OPENAI_API_KEY="your_api_key_here"
# Optional model override:
$env:OPENAI_MODEL="gpt-4o-mini"
```

4. Run the app:

```powershell
python app.py
```

5. Open in browser:

- http://127.0.0.1:5000

## Notes

- If `OPENAI_API_KEY` is not set (or API call fails), the app uses a professional template generator.
- Uploaded resumes are stored in `uploads/`.
- You can customize professor records in `data/professors.json`.
