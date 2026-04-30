import json
import os
import re
from collections import Counter
from pathlib import Path
from typing import Dict, List, Tuple

from flask import (
    Flask,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from werkzeug.utils import secure_filename


BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "professors.json"
UPLOAD_DIR = BASE_DIR / "uploads"

UPLOAD_DIR.mkdir(exist_ok=True)

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-me")
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024

STOP_WORDS = {
    "and", "the", "to", "for", "with", "in", "of", "a", "an", "on", "is", "are",
    "i", "my", "at", "as", "that", "this", "it", "be", "or", "from",
}


def load_professors() -> List[Dict]:
    with DATA_FILE.open("r", encoding="utf-8") as f:
        return json.load(f)


def tokenize(text: str) -> List[str]:
    cleaned = re.sub(r"[^a-zA-Z0-9\s]+", " ", text.lower())
    return [t for t in cleaned.split() if t and t not in STOP_WORDS]


def score_professor(description: str, professor: Dict) -> int:
    profile_tokens = tokenize(description)
    area_tokens = tokenize(" ".join(professor.get("research_areas", [])))
    profile_counts = Counter(profile_tokens)
    score = 0

    # Weighted overlap score.
    for token in area_tokens:
        score += profile_counts.get(token, 0) * 3

    # Phrase-level bonus.
    profile_lower = description.lower()
    for area in professor.get("research_areas", []):
        if area.lower() in profile_lower:
            score += 5

    return score


def select_professor(description: str, university: str, student_course: str) -> Tuple[Dict, int]:
    professors = [p for p in load_professors() if p["university"] == university]
    if not professors:
        return {}, 0

    scored = [(p, score_professor(description, p)) for p in professors]
    scored.sort(key=lambda item: item[1], reverse=True)
    best_professor, best_score = scored[0]

    # Fallback when there is no strong keyword signal.
    if best_score <= 0:
        course_lower = (student_course or "").lower()
        for professor in professors:
            dept_lower = professor.get("department", "").lower()
            if ("computer" in course_lower and "computer" in dept_lower) or (
                "electronics" in course_lower and "electronic" in dept_lower
            ):
                return professor, 0
        return professors[0], 0

    return best_professor, best_score


def generate_email_with_openai(context: Dict) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not configured")

    from openai import OpenAI

    client = OpenAI(api_key=api_key)
    prompt = f"""
You are writing a concise and professional internship request email to a professor.
Use this context:
- Student Name: {context['student_name']}
- University: {context['university']}
- Course/Major: {context['course']}
- Skills: {context['skills']}
- Languages: {context['languages']}
- Projects: {context['projects']}
- Certifications: {context['certifications']}
- Research Interests: {context['research_interests']}
- Career Goals: {context['career_goals']}
- Internship Motivation: {context['internship_reason']}
- Professor Name: {context['professor']['name']}
- Professor Department: {context['professor']['department']}
- Professor Research Areas: {", ".join(context['professor']['research_areas'])}

Output:
1) A subject line.
2) A complete email body with greeting, alignment paragraph, request, and polite closing.
Avoid exaggerated claims and keep it realistic for a student.
"""

    completion = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        temperature=0.5,
        messages=[
            {"role": "system", "content": "You write formal academic emails."},
            {"role": "user", "content": prompt},
        ],
    )
    return completion.choices[0].message.content.strip()


def generate_email_template(context: Dict) -> str:
    professor = context["professor"]
    top_area = professor["research_areas"][0]
    student_name = context["student_name"] or "Student"
    linkedin_line = f"LinkedIn: {context['linkedin']}\n" if context["linkedin"] else ""
    github_line = f"GitHub: {context['github']}\n" if context["github"] else ""

    return (
        "Subject: Internship Opportunity Inquiry\n\n"
        f"Dear Professor {professor['name'].split()[-1]},\n\n"
        f"My name is {student_name}, and I am currently pursuing {context['course']} at "
        f"{context['university']}. I am writing to express my strong interest in working under "
        f"your guidance in the field of {top_area}.\n\n"
        f"My background includes technical skills in {context['skills']} and programming experience in "
        f"{context['languages']}. I have worked on projects such as {context['projects']} and earned "
        f"certifications including {context['certifications']}. These experiences have strengthened my "
        f"interest in {context['research_interests']} and align with your work in "
        f"{', '.join(professor['research_areas'])}.\n\n"
        f"I am aiming to {context['career_goals']}, and I believe an internship under your mentorship "
        f"would be an invaluable learning opportunity. {context['internship_reason']}\n\n"
        "I would be grateful for the opportunity to discuss possible internship or research openings in your lab.\n\n"
        "Thank you for your time and consideration.\n\n"
        "Sincerely,\n"
        f"{student_name}\n"
        f"{linkedin_line}"
        f"{github_line}"
    ).strip()


def build_context(form_data: Dict, selected_professor: Dict) -> Dict:
    return {
        "student_name": form_data.get("student_name") or "Student",
        "university": form_data.get("university"),
        "course": form_data.get("course") or "Computer Science",
        "skills": form_data.get("skills") or "problem solving, collaboration",
        "languages": form_data.get("languages") or "Python, C++, Java",
        "projects": form_data.get("projects") or "academic software projects",
        "certifications": form_data.get("certifications") or "relevant online certifications",
        "research_interests": form_data.get("research_interests") or "applied research",
        "career_goals": form_data.get("career_goals") or "build a strong research-oriented career",
        "internship_reason": form_data.get("internship_reason")
        or "I am eager to gain hands-on research exposure and contribute meaningfully.",
        "linkedin": form_data.get("linkedin", "").strip(),
        "github": form_data.get("github", "").strip(),
        "professor": selected_professor,
    }


def combine_profile_text(form_data: Dict) -> str:
    fields = [
        "course", "skills", "languages", "projects", "certifications",
        "research_interests", "career_goals", "internship_reason",
    ]
    return " ".join(form_data.get(field, "") for field in fields)


def save_resume_if_present() -> str:
    file = request.files.get("resume")
    if not file or file.filename == "":
        return ""
    filename = secure_filename(file.filename)
    destination = UPLOAD_DIR / filename
    file.save(destination)
    return str(destination.name)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/select-university", methods=["POST"])
def select_university():
    university = request.form.get("university")
    if university not in {"Harvard University", "CMR Institute of Technology (CMRIT)"}:
        return redirect(url_for("index"))
    session["selected_university"] = university
    return redirect(url_for("form"))


@app.route("/form", methods=["GET"])
def form():
    university = session.get("selected_university")
    if not university:
        return redirect(url_for("index"))
    return render_template("form.html", university=university)


@app.route("/generate", methods=["POST"])
def generate():
    university = session.get("selected_university")
    if not university:
        return redirect(url_for("index"))

    form_data = {
        "university": university,
        "student_name": request.form.get("student_name", "").strip(),
        "course": request.form.get("course", "").strip(),
        "skills": request.form.get("skills", "").strip(),
        "languages": request.form.get("languages", "").strip(),
        "projects": request.form.get("projects", "").strip(),
        "certifications": request.form.get("certifications", "").strip(),
        "research_interests": request.form.get("research_interests", "").strip(),
        "career_goals": request.form.get("career_goals", "").strip(),
        "internship_reason": request.form.get("internship_reason", "").strip(),
        "linkedin": request.form.get("linkedin", "").strip(),
        "github": request.form.get("github", "").strip(),
    }

    resume_filename = save_resume_if_present()
    profile_text = combine_profile_text(form_data)
    professor, score = select_professor(profile_text, university, form_data.get("course", ""))
    context = build_context(form_data, professor)

    try:
        generated_email = generate_email_with_openai(context)
        generation_mode = "openai"
    except Exception:
        generated_email = generate_email_template(context)
        generation_mode = "template"

    session["last_form_data"] = form_data
    session["last_resume"] = resume_filename

    return render_template(
        "result.html",
        professor=professor,
        score=score,
        generated_email=generated_email,
        generation_mode=generation_mode,
        resume_filename=resume_filename,
    )


@app.route("/regenerate", methods=["POST"])
def regenerate():
    university = session.get("selected_university")
    form_data = session.get("last_form_data")
    if not university or not form_data:
        return redirect(url_for("index"))

    profile_text = combine_profile_text(form_data)
    professor, score = select_professor(profile_text, university, form_data.get("course", ""))
    context = build_context(form_data, professor)

    try:
        generated_email = generate_email_with_openai(context)
        generation_mode = "openai"
    except Exception:
        generated_email = generate_email_template(context)
        generation_mode = "template"

    return render_template(
        "result.html",
        professor=professor,
        score=score,
        generated_email=generated_email,
        generation_mode=generation_mode,
        resume_filename=session.get("last_resume", ""),
    )


if __name__ == "__main__":
    app.run(debug=True)
