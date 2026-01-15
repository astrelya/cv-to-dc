# Create cv-template.docx Template

To use the "Generate Word Document" button, you need to create a Word template file.

## Quick Setup

1. **Create a new Word document**
2. **Copy and paste this content:**

```
{fullName}
{email} | {phone}
{address}
{linkedin} | {github}

PROFESSIONAL SUMMARY
{summary}

WORK EXPERIENCE
{#experience}
{title} | {company}
{location} | {start_date} - {end_date}

{description}

Key Technologies: {#technologies}{.}, {/technologies}

{/experience}

EDUCATION
{#education}
{degree} in {field}
{institution}
{start_date} - {end_date}

{/education}

TECHNICAL SKILLS
Cloud: {#skills.cloud}{.}, {/skills.cloud}
Programming: {#skills.scripting}{.}, {/skills.scripting}
Containers: {#skills.containers}{.}, {/skills.containers}
Databases: {#skills.databases_cache}{.}, {/skills.databases_cache}

PROJECTS
{#projects}
{name}
{description}
Technologies: {#tech_stack}{.}, {/tech_stack}

{/projects}

CERTIFICATIONS
{#certifications}
{name} - {issuer} ({date})
{/certifications}

Generated on {generatedDate}
```

3. **Apply formatting** (bold headers, proper spacing, professional fonts)
4. **Save as:** `cv-template.docx` in this folder

## Template Ready!

Once you have the template file, the "Generate Word Document" button will:

- Use your processed CV data
- Fill in the placeholders
- Generate a professional Word document
- Auto-download the file

## Data Sources

The template works with both:

- **PDF files** (detailed technical schema)
- **Image files** (general parsing schema)

Both will generate professional Word documents with your CV data!
